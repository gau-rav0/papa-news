# Papa News worker

Node.js/TypeScript worker for Lapaas Voice ingestion and Hindi translation. It only accepts articles strictly newer than the persistent activation timestamp and saves source content as `pending` before any AI request.

## Setup

1. Run [`../supabase/schema.sql`](../supabase/schema.sql) in Supabase.
2. Copy `.env.example` to `.env`; server-only service-role and OpenAI API keys are required.
3. `npm install`
4. At the exact activation moment, run `npm run seed:start-time` once. It will preserve an existing timestamp.
5. Start the daemon with `npm start`. It polls using `system_config.poll_interval_seconds`, defaulting to five minutes.

`npm run dry-run` reads the persisted cutoff and live Lapaas posts but does not insert, claim, translate, or update anything.

Translation requests are server-side structured JSON with `hindi_title` and `hindi_content`. Invalid/empty/error responses and Hindi content under 60% of English word count fail visibly. An initial call plus three delayed retries (1, 5, and 30 minutes) is attempted before the record is marked `failed` with the error preserved.


