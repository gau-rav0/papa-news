# Deployment

> **Note:** The recommended deployment method is a free GitHub Actions scheduled workflow (see `SETUP.md`). This guide is an optional alternative for traditional always-on hosting.

Deploy this worker as an always-on Node.js service or scheduled worker on infrastructure independent of any local computer, such as Railway, Render, Cloud Run, or a VM. A laptop running the process is not a deployment.

1. Provision Supabase and run [`../supabase/schema.sql`](../supabase/schema.sql).
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `KIMCHI_API_KEY` as server-side deployment secrets. Do not expose them in `app/` or any mobile build.
3. Run `npm ci && npm run build` during build, then `npm start` as the long-running process.
4. Run `npm run seed:start-time` once at activation, before the first worker start. It is deliberately idempotent and never resets the cutoff.

The worker reloads `poll_interval_seconds` from `system_config` every cycle, so the default five-minute schedule can be changed without redeploying. It uses database row claiming to prevent simultaneous workers from translating the same article.


