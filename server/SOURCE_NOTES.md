# Lapaas Voice source investigation

Checked 12 August 2026 in the required preference order:

1. **WordPress REST API â€” selected.** `https://lapaasvoice.com/wp-json/wp/v2/posts?per_page=1` returned HTTP 200, with post `id`, canonical `link`, rendered title/content, and `date_gmt`. The worker exclusively uses `date_gmt`, interpreted as UTC; it never uses WordPress's local `date` field. `_embed=wp:term,wp:featuredmedia` supplies category and featured-image metadata.
2. **RSS â€” available.** `https://lapaasvoice.com/feed/` returned HTTP 200 RSS 2.0, but has less structured metadata than the REST API.
3. **Sitemap â€” available.** `https://lapaasvoice.com/sitemap_index.xml` and `https://lapaasvoice.com/wp-sitemap.xml` returned sitemap indexes. `robots.txt` advertises the sitemap index and news sitemap.
4. **HTML scraping â€” not used.** The official REST API is available. Cheerio only sanitizes returned WordPress HTML locally; it does not scrape article pages.


