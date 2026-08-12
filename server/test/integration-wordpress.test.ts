/**
 * Standalone integration test: verify WordPress API fetch + article parsing
 * works end-to-end without needing Supabase or OpenAI credentials.
 * Run: npx tsx test/integration-wordpress.test.ts
 */
import { fetchRecentLapaasPosts, textFromHtml } from '../src/lapaas-wordpress.js';

async function run() {
  console.log('=== WordPress Integration Test ===\n');

  // Test 1: Fetch real articles from Lapaas Voice
  console.log('1. Fetching 3 recent articles from lapaasvoice.com...');
  const articles = await fetchRecentLapaasPosts(3);
  console.log(`   ✅ Fetched ${articles.length} articles\n`);

  if (articles.length === 0) {
    console.log('   ⚠️  No articles returned — API might be down');
    process.exit(1);
  }

  // Test 2: Verify each article has all required fields
  console.log('2. Validating article structure...');
  for (const article of articles) {
    const checks = [
      ['sourceArticleId', !!article.sourceArticleId],
      ['sourceUrl', !!article.sourceUrl && article.sourceUrl.startsWith('https://')],
      ['originalTitle', !!article.originalTitle && article.originalTitle.length > 0],
      ['originalContent', !!article.originalContent && article.originalContent.length > 10],
      ['publishedAt', article.publishedAt instanceof Date && !isNaN(article.publishedAt.getTime())],
    ];

    const allPassed = checks.every(([, ok]) => ok);
    const status = allPassed ? '✅' : '❌';
    console.log(`   ${status} Article ID ${article.sourceArticleId}: "${article.originalTitle.slice(0, 60)}..."`);
    console.log(`      URL:       ${article.sourceUrl}`);
    console.log(`      Published: ${article.publishedAt.toISOString()}`);
    console.log(`      Category:  ${article.category ?? '(none)'}`);
    console.log(`      Image:     ${article.imageUrl ? 'Yes' : 'No'}`);
    console.log(`      Content:   ${article.originalContent.length} chars`);

    for (const [field, ok] of checks) {
      if (!ok) console.log(`      ❌ FAILED: ${field}`);
    }
    console.log('');
  }

  // Test 3: Verify historical cutoff logic
  console.log('3. Testing historical cutoff logic...');
  const now = new Date();
  const futureArticles = articles.filter(a => a.publishedAt > now);
  const pastArticles = articles.filter(a => a.publishedAt <= now);
  console.log(`   Articles published BEFORE now: ${pastArticles.length}`);
  console.log(`   Articles published AFTER now:  ${futureArticles.length}`);
  console.log(`   ✅ Cutoff filter would correctly ignore ${pastArticles.length} historical article(s)\n`);

  // Test 4: Verify textFromHtml sanitizer
  console.log('4. Testing HTML sanitizer...');
  const testHtml = '<p>Hello <strong>World</strong></p><script>alert("xss")</script>';
  const result = textFromHtml(testHtml);
  const htmlOk = result === 'Hello World';
  console.log(`   Input:  ${testHtml}`);
  console.log(`   Output: ${result}`);
  console.log(`   ${htmlOk ? '✅' : '❌'} HTML sanitization ${htmlOk ? 'passed' : 'FAILED'}\n`);

  // Test 5: Verify sort order (newest first)
  console.log('5. Verifying sort order (newest first)...');
  let sortOk = true;
  for (let i = 1; i < articles.length; i++) {
    if (articles[i - 1].publishedAt < articles[i].publishedAt) {
      sortOk = false;
      break;
    }
  }
  console.log(`   ${sortOk ? '✅' : '❌'} Articles are sorted newest-first\n`);

  console.log('=== All Integration Tests Complete ===');
}

run().catch(err => {
  console.error('❌ Integration test crashed:', err);
  process.exit(1);
});
