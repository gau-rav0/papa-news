# Product Requirements Document (PRD)

## 1. Product Name

**Lapaas Hindi News**

Internal/project name can be changed later.

---

# 2. Product Overview

We are building a mobile application for a user's father.

The application will continuously monitor the website:

**https://lapaasvoice.com/**

Whenever **a NEW article is published from the moment the system is activated**, the system must:

1. Detect the new article.
2. Retrieve the article's title, article body, publication time, category, image, and original URL.
3. Convert the article from English into **natural, easy-to-read Hindi** using an LLM.
4. **Do NOT summarize or shorten the article.**
5. Preserve the important information and overall content of the original article.
6. Store the processed article in the application's database.
7. Display it in the mobile application.
8. Show the newest articles first.
9. Never import or display articles that were published before the system's official start time.

The application is initially intended for private/personal use by the user's father.

The first version should be simple, reliable, fast, and easy for an older/non-technical user to use.

---

# 3. Core Product Requirement

The single most important business rule is:

> **Only process articles published after the system activation/start timestamp.**

The system must NOT perform an initial historical import.

For example:

```text
System activation:
12 August 2026, 7:00 PM IST
```

If Lapaas contains:

```text
Article A — 12 Aug 2026, 5:00 PM
Article B — 12 Aug 2026, 6:30 PM
Article C — 12 Aug 2026, 7:05 PM
Article D — 12 Aug 2026, 7:12 PM
```

The application must:

```text
A → IGNORE
B → IGNORE
C → PROCESS
D → PROCESS
```

This rule must be enforced by the backend/database and must not depend only on the frontend.

---

# 4. Product Goals

## Primary Goals

### Goal 1 — Automatic New Article Detection

The system should automatically detect newly published Lapaas Voice articles without requiring manual intervention.

### Goal 2 — English-to-Hindi Conversion

Every eligible article should be converted from English into natural Hindi.

The output should feel like a Hindi news article rather than literal word-for-word machine translation.

### Goal 3 — Preserve Article Content

The system should NOT shorten the article.

It should preserve:

* Facts
* Numbers
* Dates
* Names
* Company names
* Financial figures
* Percentages
* Technical details
* Important quotations
* Important context

The Hindi version may be naturally rephrased, but should not deliberately remove meaningful information.

### Goal 4 — No Historical News

No article published before the system start timestamp should be imported.

### Goal 5 — Simple Father-Friendly App

The mobile application should be extremely easy to navigate.

Prioritize:

* Large readable text
* Simple navigation
* Clear Hindi
* Minimal UI complexity
* Latest news first
* Easy article reading

### Goal 6 — Reliable Automated System

The system should recover gracefully from:

* Temporary website failures
* AI API failures
* Duplicate article detection
* Network failures
* Invalid article pages
* Missing images
* Malformed HTML

---

# 5. Non-Goals for Version 1

Do NOT build these unless explicitly requested later:

* User comments
* Likes/reactions
* Social network
* User-generated posts
* Multiple user accounts
* Complex recommendation engine
* Advertising system
* Paid subscriptions
* Full text search across thousands of historical articles
* News summarization
* AI-generated opinions
* AI-generated facts
* Stock recommendations
* Political opinion generation
* Automatic rewriting beyond translation/naturalization
* Historical article import

Version 1 is a focused product:

> **Automatically collect new Lapaas Voice articles, convert them into natural Hindi, and display them in a simple mobile app.**

---

# 6. Target User

## Primary User

The user's father.

The application should assume:

* The user may not be technically sophisticated.
* The user prefers reading news in Hindi.
* The user should not need to understand how the backend works.
* The interface should be simple.
* Reading comfort is more important than visual complexity.

---

# 7. User Experience

## 7.1 Home Screen

The home screen should show:

```text
Latest News

[Newest article]

[Next article]

[Next article]

[Next article]
```

Newest article should appear first.

Each card should contain approximately:

* Hindi headline
* Publication time/date
* Category
* Optional thumbnail
* Reading/open button

Example:

```text
------------------------------------

Business

BSNL और Vodafone Idea नेटवर्क
शेयरिंग बढ़ाने पर बातचीत कर रहे हैं

12 Aug 2026 • 7:15 PM

Read Article →

------------------------------------
```

---

# 8. Article Detail Screen

When a user opens an article, display:

1. Hindi headline
2. Publication date/time
3. Category
4. Featured image if available
5. Full Hindi article
6. Source attribution
7. Link to original article

Example:

```text
BSNL और Vodafone Idea नेटवर्क
शेयरिंग बढ़ाने पर बातचीत कर रहे हैं

12 August 2026
Business

[IMAGE]

Hindi article content...

Source: Lapaas Voice

Read Original Article →
```

---

# 9. Translation Requirements

The LLM must be instructed to convert the article into natural Hindi.

## Important

This is NOT a summarization system.

This is NOT a shortening system.

This is NOT a "make this article shorter" system.

The goal is:

> **Translate and naturally rewrite the original article into readable Hindi while preserving its informational content.**

### Translation principles

The model should:

* Use natural Indian Hindi.
* Preserve the original meaning.
* Preserve factual information.
* Preserve figures and units.
* Preserve names.
* Preserve dates.
* Preserve company names.
* Preserve financial information.
* Preserve technical information.
* Use commonly understandable Hindi.
* Keep English technical/business terms where translating them would make the sentence less clear.

Examples of terms that can remain in English where appropriate:

* IPO
* EBITDA
* AI
* cloud
* data centre
* startup
* funding
* CEO
* revenue

The goal is readability, not forced Hindi vocabulary.

---

# 10. Translation Prompt Requirements

The AI processing prompt should follow these principles:

```text
Convert the following English news article into natural, easy-to-read Hindi.

Do NOT summarize the article.

Do NOT intentionally shorten the article.

Preserve all meaningful information from the source.

Preserve:
- names
- companies
- numbers
- dates
- percentages
- financial figures
- locations
- technical details
- important context
- important statements/quotes

Do not add facts that are not present in the source.

Do not speculate.

Do not introduce opinions.

Write natural Hindi suitable for an Indian reader.

Use commonly understood business and technology terminology.

If a technical/business term is clearer in English, it may remain in English.

Return:
1. A natural Hindi headline.
2. The full Hindi version of the article.
```

The exact prompt may be refined during implementation.

---

# 11. Content Integrity Rules

The AI must NOT:

* Invent facts.
* Add conclusions not present in the article.
* Change numerical values.
* Change dates.
* Change currencies.
* Change percentages.
* Change company names.
* Change people's names.
* Remove important factual information merely to make the text shorter.
* Turn the article into an opinion piece.

The application is a translation/rewrite reader, not an independent news publisher.

---

# 12. Source Detection

The backend should determine how to obtain Lapaas articles.

Preferred order:

```text
1. WordPress REST API
2. RSS feed
3. Sitemap/article discovery
4. HTML scraping
```

Prefer the most stable official machine-readable source available.

HTML scraping should be a fallback rather than the first choice.

---

# 13. News Collection Worker

Create a backend job commonly called:

**News Worker**

Its responsibility:

1. Connect to Lapaas Voice.
2. Retrieve recent articles.
3. Identify publication time.
4. Compare publication time to `SYSTEM_START_TIME`.
5. Ignore older articles.
6. Check database for duplicates.
7. Process only new eligible articles.
8. Save raw source information.
9. Send content for Hindi conversion.
10. Save translated content.
11. Mark processing status.

---

# 14. Recommended Polling

Initially use a polling architecture.

Example:

```text
Every 5 minutes
      ↓
Fetch recent Lapaas articles
      ↓
Check start time
      ↓
Check duplicates
      ↓
Process new articles
```

Five minutes is a starting value, not a hard requirement.

It can later be changed to:

* 1 minute
* 5 minutes
* 10 minutes
* 15 minutes

depending on reliability, API limits, hosting cost, and desired freshness.

---

# 15. Duplicate Prevention

Duplicate detection is mandatory.

The same article may be discovered multiple times by:

* API
* RSS
* repeated polling
* pagination
* retries
* system restarts

The database should therefore have a unique identifier.

Preferred uniqueness:

1. Source article ID, if available.
2. Otherwise canonical source URL.

Example:

```text
source_article_id = 12345
```

or:

```text
source_url = https://lapaasvoice.com/example-article/
```

A unique database constraint must prevent duplicate insertion.

---

# 16. Historical News Protection

This is a critical feature.

Store:

```text
system_start_time
```

in a persistent configuration record.

Do NOT calculate it every time the application restarts.

Example:

```text
system_start_time:
2026-08-12T19:00:00+05:30
```

Every article is checked against this.

Pseudocode:

```text
if article.published_at <= system_start_time:
    IGNORE

else if article already exists:
    IGNORE

else:
    PROCESS
```

This rule should exist in the backend.

The mobile app should never be responsible for deciding which articles are historically valid.

---

# 17. Database Design

Recommended database: **PostgreSQL via Supabase**

## Table: articles

Suggested fields:

```text
id
source_article_id
source_url
canonical_url

original_title
original_content

hindi_title
hindi_content

category

image_url

published_at
processed_at
created_at
updated_at

processing_status
processing_error
```

### processing_status

Allowed values:

```text
pending
processing
completed
failed
ignored
```

Possible additional status:

```text
duplicate
```

but duplicate articles do not necessarily need to be inserted at all.

---

# 18. System Configuration Table

Create a configuration/settings record containing:

```text
system_start_time
```

Optionally:

```text
poll_interval
translation_model
translation_prompt_version
```

Example:

```text
system_start_time = 2026-08-12T19:00:00+05:30
poll_interval = 5 minutes
```

---

# 19. Processing Pipeline

The complete backend flow:

```text
START
  ↓
Fetch recent Lapaas articles
  ↓
For each article
  ↓
Does publication time exist?
  ↓
NO → handle safely / log failure
  ↓
YES
  ↓
Is article older than system_start_time?
  ↓
YES → IGNORE
  ↓
NO
  ↓
Does article already exist?
  ↓
YES → IGNORE
  ↓
NO
  ↓
Extract clean article content
  ↓
Save pending article
  ↓
Send to AI
  ↓
Receive Hindi translation
  ↓
Validate AI response
  ↓
Save Hindi content
  ↓
Mark completed
  ↓
Available in mobile app
```

---

# 20. Important Reliability Requirement

Do not wait until after AI processing to save the source article.

Recommended flow:

```text
New article detected
       ↓
Save source article as PENDING
       ↓
AI processing
       ↓
COMPLETED
```

If AI fails:

```text
PENDING → PROCESSING → FAILED
```

The system can later retry the article.

This prevents losing newly detected articles.

---

# 21. Retry Logic

AI/network failures should be retryable.

Example:

```text
Attempt 1 → failed
Attempt 2 → failed
Attempt 3 → successful
```

After a reasonable number of failures, keep the article as:

```text
failed
```

and record:

```text
processing_error
```

Do not silently discard it.

---

# 22. Concurrency

Do not allow the same article to be processed by two workers simultaneously.

Use either:

* Database locking
* Processing status
* Job queue
* Unique constraints

Example:

```text
pending
   ↓
processing

Only one worker may claim it.
```

---

# 23. App Architecture

Recommended:

**React Native + Expo**

The mobile app should NOT scrape Lapaas directly.

The mobile app communicates only with our backend/database.

Architecture:

```text
Lapaas
   ↓
Backend Worker
   ↓
Supabase
   ↓
Mobile App
```

This separation is important.

---

# 24. Mobile App Navigation

Version 1:

```text
Home
Latest
Categories
Saved
Settings
```

The first implementation can even start with:

```text
Home
Latest
Settings
```

and add the others later.

---

# 25. Category Support

The source category should be stored with the article.

Potential categories include categories already used by Lapaas, such as:

* Business
* AI & Technology
* Markets & IPOs
* Economy & Policy
* Startups/Funding

Do not hard-code category names unnecessarily.

The backend should store the source category so categories can evolve.

---

# 26. Sorting

Articles should be sorted by:

```text
published_at DESC
```

Newest first.

The application should show the latest article at the top.

---

# 27. App Refresh Behavior

When the user opens the application:

```text
Fetch latest articles from database
```

No scraping should occur from the mobile application.

Optionally, implement pull-to-refresh.

---

# 28. Original Source

Every article must retain:

```text
source_url
```

The article detail page should provide:

```text
Read Original Article →
```

which opens the Lapaas Voice source.

Also display source attribution such as:

```text
Source: Lapaas Voice
```

---

# 29. Images

If the source provides a featured image:

* Store its URL.
* Display it in the app.

If no image exists:

* Do not fail article processing.
* Display a simple placeholder or omit the image.

Images are optional.

The article itself must remain readable even if the image fails to load.

---

# 30. Timezone

The user is in India.

The product should use:

**Asia/Kolkata / IST**

for displayed times.

Backend timestamps should ideally be stored in UTC, while the application converts them to Indian local time.

Example:

```text
Database:
2026-08-12T13:45:00Z

App:
12 August 2026, 7:15 PM IST
```

---

# 31. Security

Do NOT place API keys inside the mobile application.

Private credentials such as:

* AI API key
* Supabase service role key
* backend secrets

must exist only on the server/backend.

The mobile application should use public/client-safe credentials only.

---

# 32. AI Cost Control

Only send genuinely new articles to the AI.

Never retranslate the same article unless explicitly requested.

Duplicate prevention is therefore also a cost-control mechanism.

Old articles must never be processed.

---

# 33. AI Output Validation

After receiving the AI response, validate:

* Hindi title exists.
* Hindi content exists.
* Response is valid JSON if JSON format is used.
* Output is not empty.
* Output is not clearly an error message.

Potential future validation:

* Original and Hindi content have reasonable lengths.
* Required article names/numbers remain present.
* No suspicious hallucinated content.

Do not automatically reject articles simply because Hindi is shorter than English; translation naturally changes length.

---

# 34. Error Handling

The following situations must not crash the entire worker:

### Website unavailable

Log error and retry during next cycle.

### API returns malformed data

Skip affected article and log.

### Article has no content

Mark failed/invalid.

### AI API unavailable

Retry later.

### Database unavailable

Retry safely.

### Image unavailable

Still publish article without image.

### Duplicate article

Skip.

---

# 35. Logging

Backend logs should make debugging easy.

Example:

```text
[19:00:01] Worker started
[19:00:02] Fetched 10 articles
[19:00:02] Ignored 8 historical articles
[19:00:02] Found 1 duplicate
[19:00:03] Found 1 new article
[19:00:03] Saved article as pending
[19:00:05] AI translation completed
[19:00:05] Article marked completed
```

Errors should clearly identify the article.

---

# 36. Admin/Developer Visibility

Version 1 does not need a full admin dashboard.

However, developers should be able to inspect:

* Number of processed articles
* Failed articles
* Last successful fetch
* Last fetch error
* Current `system_start_time`

Supabase's dashboard can initially serve this purpose.

---

# 37. Deployment Architecture

Recommended:

```text
                 Lapaas Voice
                      ↓
               Scheduled Worker
                      ↓
                 PostgreSQL
                  Supabase
                      ↓
               React Native App
```

The scheduled backend job must run independently of the user's computer.

The system must continue working even when the user's PC is turned off.

---

# 38. Suggested Technology Stack

## Mobile

```text
React Native
Expo
TypeScript
```

## Backend

```text
Node.js
TypeScript
```

## Database

```text
Supabase
PostgreSQL
```

## Article parsing

If necessary:

```text
Cheerio
```

or another robust HTML parser.

## AI

Use an LLM API capable of reliable structured output.

## Scheduling

Use a reliable server-side scheduler/cron mechanism.

## Hosting

A serverless/backend hosting provider such as:

* Vercel
* Cloudflare
* Render
* Railway
* or another suitable provider

The exact choice can be made during implementation based on the chosen worker architecture and pricing.

---

# 39. Phase 1 MVP

The first milestone is NOT the mobile app.

Build this first:

```text
Lapaas
   ↓
Fetch recent articles
   ↓
Filter by system_start_time
   ↓
Detect duplicates
   ↓
Extract content
   ↓
AI → Hindi
   ↓
Supabase
```

Success criteria:

* New article is detected automatically.
* Old articles are ignored.
* Duplicate articles are not processed twice.
* Hindi output is readable.
* Article is stored correctly.
* Failed AI calls can be retried.

---

# 40. Phase 2 MVP

Connect the mobile application:

```text
Supabase
   ↓
React Native app
```

Success criteria:

* App loads.
* Latest articles appear.
* Newest article is first.
* User can open full Hindi article.
* Images work when available.
* Source link works.

---

# 41. Phase 3

Add:

* Push notifications
* Pull-to-refresh
* Category filtering
* Saved/bookmarked articles
* Better typography
* Larger font setting
* Dark mode

---

# 42. Phase 4

Add:

## Hindi Text-to-Speech

Article page:

```text
🔊 सुनें
```

The app can read the Hindi article aloud.

This is not required for the first MVP but is a high-value future feature for the target user.

---

# 43. Future Architecture

The backend should be designed so that Lapaas is not permanently hard-coded as the only news source.

Future architecture:

```text
Source Adapter 1
Lapaas Voice
       \
        \
Source Adapter 2 ----> Unified Article Pipeline
        /                       ↓
Source Adapter 3           AI Translation
                                  ↓
                              Database
                                  ↓
                              Mobile App
```

But Version 1 should support only Lapaas Voice.

Do not prematurely build a multi-source platform.

---

# 44. Future Multi-Language Support

The same backend architecture could later support:

```text
English → Hindi
English → Marathi
English → Gujarati
English → Bengali
```

However, this is NOT a Version 1 requirement.

The initial target language is:

**Hindi**

---

# 45. Copyright / Content Policy Consideration

The app is currently intended for personal/private use.

The application should:

* Attribute Lapaas Voice as the source.
* Store the source URL.
* Provide a link to the original article.
* Avoid presenting the application as the original publisher.
* Avoid unnecessary republication of copyrighted material if the app is later made public/commercial.

Before public distribution or monetization, verify Lapaas Voice's terms and content-reuse/licensing requirements.

This is a product/legal consideration and not a technical limitation.

---

# 46. Acceptance Criteria

The system is considered successful when all of the following are true.

## Article Collection

* [ ] System can retrieve recent Lapaas articles.
* [ ] System can determine publication time.
* [ ] System can identify article URL.
* [ ] System can identify title.
* [ ] System can extract article body.
* [ ] System can identify category when available.
* [ ] System can identify image when available.

## Historical Filtering

* [ ] System has a persistent `system_start_time`.
* [ ] Articles before `system_start_time` are ignored.
* [ ] System never performs historical migration/import by default.
* [ ] Restarting backend does not reset `system_start_time`.

## Duplicate Protection

* [ ] Same article cannot be inserted twice.
* [ ] Same article cannot be translated twice under normal operation.
* [ ] Retries do not create duplicates.

## Translation

* [ ] Articles are translated into natural Hindi.
* [ ] Articles are not intentionally shortened.
* [ ] Names remain correct.
* [ ] Numbers remain correct.
* [ ] Dates remain correct.
* [ ] Financial values remain correct.
* [ ] No unsupported facts are introduced.

## Database

* [ ] Raw source data is stored.
* [ ] Hindi content is stored.
* [ ] Processing status is stored.
* [ ] Processing errors are stored.
* [ ] Publication timestamps are stored.

## Mobile App

* [ ] Latest articles load.
* [ ] Newest article appears first.
* [ ] User can open full article.
* [ ] Hindi article is readable.
* [ ] Source link works.
* [ ] Missing image does not break article display.

## Reliability

* [ ] AI failure does not lose the article.
* [ ] Website failure does not crash the worker.
* [ ] Temporary network failure can recover.
* [ ] Failed articles can be retried.
* [ ] App works even when the news worker is temporarily unavailable.

---

# 47. Example End-to-End Scenario

Assume:

```text
SYSTEM_START_TIME
= 12 August 2026, 7:00 PM IST
```

Lapaas currently has 5,000 historical articles.

The backend starts.

It discovers:

```text
5,000 total historical articles
```

Result:

```text
0 imported
0 translated
5,000 ignored
```

Then at:

```text
7:14 PM
```

Lapaas publishes a new article.

The worker checks at:

```text
7:15 PM
```

Result:

```text
New article detected
↓
Publication time = 7:14 PM
↓
7:14 PM > 7:00 PM
↓
Not already in DB
↓
Save pending
↓
Send to AI
↓
Hindi conversion
↓
Save Hindi article
↓
Mark completed
```

At:

```text
7:16 PM
```

The same article is fetched again.

Result:

```text
Already exists
↓
Ignore
```

This is the intended system behavior.

---

# 48. What the Developer/LLM Should Build First

Do NOT immediately build all components.

Implement in this order:

## Step A

Investigate how Lapaas exposes articles:

```text
REST API?
RSS?
Sitemap?
HTML?
```

## Step B

Build article fetcher.

## Step C

Build `system_start_time` filtering.

## Step D

Build duplicate detection.

## Step E

Build article extraction/cleaning.

## Step F

Build AI Hindi conversion.

## Step G

Save results to Supabase.

## Step H

Test the complete backend end-to-end.

## Step I

Only after backend is reliable, build React Native app.

---

# 49. Developer Instructions

The implementing LLM/agent should follow these principles:

### Do not over-engineer.

Build the smallest reliable system first.

### Do not import historical data.

This is a hard requirement.

### Do not summarize.

This is a hard requirement.

### Do not duplicate articles.

This is a hard requirement.

### Do not put secrets in the mobile app.

This is a hard requirement.

### Do not scrape from the mobile application.

The backend owns ingestion.

### Do not silently lose failed articles.

Failures must be recorded and retryable.

### Do not alter source facts during translation.

Translation should preserve meaning and factual details.

### Prefer official machine-readable sources over scraping.

Use scraping only when necessary.

---

# 50. Definition of Done

Version 1 is complete when:

```text
Lapaas Voice publishes a new article
              ↓
Backend detects it automatically
              ↓
Article is confirmed to be newer than
SYSTEM_START_TIME
              ↓
Duplicate check
              ↓
Article is extracted
              ↓
AI converts English article to natural Hindi
              ↓
Hindi article is stored
              ↓
Article becomes visible in mobile app
              ↓
Father can open and read it
```

And:

```text
Any article published before
SYSTEM_START_TIME
              ↓
NEVER appears in the app
```

That historical cutoff is one of the most important product rules.

---

# 51. Final Product Definition

The product can be summarized in one sentence:

> **A private, Hindi-first mobile news reader that automatically detects new Lapaas Voice articles from the moment the system is activated, converts them from English into natural Hindi without shortening them, and presents the newest articles in a simple interface for the user's father.**

The architecture should be simple enough for one developer/LLM to build, but modular enough to later add notifications, text-to-speech, bookmarks, additional languages, and additional news sources.
