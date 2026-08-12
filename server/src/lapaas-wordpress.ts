import { load } from 'cheerio';
import { SourceArticle } from './types.js';

const POSTS_URL = 'https://lapaasvoice.com/wp-json/wp/v2/posts';
type WordPressPost = {
  id: number; link: string; date_gmt: string | null;
  title: { rendered: string }; content: { rendered: string };
  _embedded?: { ['wp:term']?: Array<Array<{ taxonomy?: string; name?: string }>>; ['wp:featuredmedia']?: Array<{ source_url?: string }> };
};

export function textFromHtml(html: string): string {
  const $ = load(html);
  $('script,style,noscript,iframe').remove();
  return $.text().replace(/\s+/g, ' ').trim();
}

function publishedAt(dateGmt: string | null, id: number): Date {
  if (!dateGmt) throw new Error(`WordPress post ${id} has no date_gmt`);
  const date = new Date(`${dateGmt}Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`WordPress post ${id} has invalid date_gmt`);
  return date;
}

export async function fetchRecentLapaasPosts(limit: number): Promise<SourceArticle[]> {
  const url = new URL(POSTS_URL);
  url.search = new URLSearchParams({ per_page: String(limit), orderby: 'date', order: 'desc', _embed: 'wp:term,wp:featuredmedia' }).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Lapaas WordPress API returned ${response.status}`);
  const posts = await response.json() as WordPressPost[];
  return posts.map((post) => {
    const category = post._embedded?.['wp:term']?.flat().find((term) => term.taxonomy === 'category')?.name;
    return {
      sourceArticleId: String(post.id), sourceUrl: post.link, canonicalUrl: post.link,
      originalTitle: textFromHtml(post.title.rendered), originalContent: textFromHtml(post.content.rendered),
      category: category ? textFromHtml(category) : null,
      imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
      publishedAt: publishedAt(post.date_gmt, post.id),
    };
  });
}


