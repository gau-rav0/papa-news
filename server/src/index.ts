import { fetchLimit, supabase, translationBatchSize } from './config.js';
import { fetchRecentLapaasPosts } from './lapaas-wordpress.js';
import { log } from './log.js';
import { translateToHindi } from './translation.js';
import { SourceArticle, StoredArticle } from './types.js';

const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => arg !== '--dry-run' && arg !== '--once')) throw new Error('Usage: npm start -- [--dry-run] [--once]');
const dryRun = args.has('--dry-run');
const once = args.has('--once');
const retryDelaysMs = [60_000, 5 * 60_000, 30 * 60_000];

type Config = { system_start_time: string; poll_interval_seconds: number };

async function config(): Promise<Config> {
  const { data, error } = await supabase.from('system_config').select('system_start_time,poll_interval_seconds').eq('key', 'system_start_time').maybeSingle();
  if (error) throw new Error(`Could not load configuration: ${error.message}`);
  if (!data) throw new Error('system_start_time is missing. Run npm run seed:start-time exactly once before starting the worker.');
  if (Number.isNaN(new Date(data.system_start_time).getTime())) throw new Error('system_start_time is invalid');
  return data;
}

async function savePending(article: SourceArticle): Promise<string | null> {
  const { data, error } = await supabase.rpc('insert_article_if_new', {
    p_source_article_id: article.sourceArticleId, p_source_url: article.sourceUrl, p_canonical_url: article.canonicalUrl,
    p_original_title: article.originalTitle, p_original_content: article.originalContent, p_category: article.category,
    p_image_url: article.imageUrl, p_published_at: article.publishedAt.toISOString(),
  });
  if (error) throw new Error(`Could not save ${article.sourceUrl}: ${error.message}`);
  return data as string | null;
}

async function claimArticles(): Promise<StoredArticle[]> {
  const { data, error } = await supabase.rpc('claim_articles_for_translation', { p_limit: translationBatchSize });
  if (error) throw new Error(`Could not claim pending articles: ${error.message}`);
  return (data ?? []) as StoredArticle[];
}

async function complete(article: StoredArticle, hindiTitle: string, hindiContent: string): Promise<void> {
  const { error } = await supabase.from('articles').update({
    hindi_title: hindiTitle, hindi_content: hindiContent, processing_status: 'completed', processed_at: new Date().toISOString(),
    processing_error: null, updated_at: new Date().toISOString(),
  }).eq('id', article.id).eq('processing_status', 'processing');
  if (error) throw new Error(`Could not complete ${article.id}: ${error.message}`);
}

async function fail(article: StoredArticle, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const { error: updateError } = await supabase.from('articles').update({
    processing_status: 'failed', processing_error: message.slice(0, 2_000), updated_at: new Date().toISOString(),
  }).eq('id', article.id).eq('processing_status', 'processing');
  if (updateError) throw new Error(`Could not mark ${article.id} failed: ${updateError.message}`);
  log('article.failed', { article_id: article.id, source_url: article.source_url, processing_error: message });
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function processArticle(article: StoredArticle): Promise<void> {
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      log('article.translation_started', { article_id: article.id, source_url: article.source_url, attempt: attempt + 1 });
      const result = await translateToHindi(article.original_title, article.original_content);
      await complete(article, result.hindi_title, result.hindi_content);
      log('article.completed', { article_id: article.id, source_url: article.source_url, attempt: attempt + 1 });
      return;
    } catch (error) {
      if (attempt === retryDelaysMs.length) return fail(article, error);
      const delay = retryDelaysMs[attempt];
      log('article.translation_retry_scheduled', {
        article_id: article.id, source_url: article.source_url, attempt: attempt + 1, retry_in_seconds: delay / 1_000,
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(delay);
    }
  }
}

async function runCycle(): Promise<number> {
  const settings = await config();
  const cutoff = new Date(settings.system_start_time);
  log('worker.cycle_started', { dry_run: dryRun, system_start_time: cutoff.toISOString(), poll_interval_seconds: settings.poll_interval_seconds });
  const sourceArticles = await fetchRecentLapaasPosts(fetchLimit);
  let historical = 0; let inserted = 0; let duplicates = 0;
  for (const article of sourceArticles) {
    if (article.publishedAt <= cutoff) { historical += 1; log('article.ignored_historical', { source_url: article.sourceUrl, published_at: article.publishedAt.toISOString() }); continue; }
    if (dryRun) { log('article.would_save_pending', { source_url: article.sourceUrl, published_at: article.publishedAt.toISOString() }); continue; }
    const id = await savePending(article);
    if (id) { inserted += 1; log('article.saved_pending', { article_id: id, source_url: article.sourceUrl }); }
    else { duplicates += 1; log('article.ignored_duplicate', { source_url: article.sourceUrl }); }
  }
  if (!dryRun) for (const article of await claimArticles()) await processArticle(article);
  log('worker.cycle_finished', { fetched: sourceArticles.length, historical, pending_saved: inserted, duplicates, dry_run: dryRun });
  return settings.poll_interval_seconds;
}

async function start(): Promise<void> {
  do {
    let intervalSeconds = 300;
    try { intervalSeconds = await runCycle(); }
    catch (error) { log('worker.cycle_failed', { error: error instanceof Error ? error.message : String(error) }); if (once) process.exitCode = 1; }
    if (!once) { log('worker.next_cycle_scheduled', { poll_interval_seconds: intervalSeconds }); await sleep(intervalSeconds * 1_000); }
  } while (!once);
}

await start();


