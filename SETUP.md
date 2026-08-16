# Setup Guide — Papa News (Lapaas Hindi News)

A linear, start-to-finish runbook. Follow every step in order.

---

## Prerequisites

- **Node.js 18+** and **npm** installed on your computer.
- A free **Supabase** account at [supabase.com](https://supabase.com).
- A free **Expo / EAS** account at [expo.dev](https://expo.dev).
- A **Gemini API key** (from Google AI Studio) for article translation.

---

## 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**.
2. Choose an organisation, set a project name (e.g. `papa-news`), generate a strong database password, and pick a region near India.
3. Wait for the project to finish provisioning.
4. Go to **Settings → API** and note down:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon public key** (starts with `eyJ…`)
   - **service_role key** (starts with `eyJ…`) — keep this secret, server-only.

## 2. Run the Database Schema

1. In the Supabase dashboard, go to **SQL Editor**.
2. Open `supabase/schema.sql` from this repository and paste the entire contents.
3. Click **Run**. This creates the `articles`, `system_config`, and `device_tokens` tables with row-level security.

## 3. Configure the Server

1. Open a terminal in the `server/` directory.
2. Run `npm ci` to install dependencies.
3. Copy the example environment file:
   ```
   cp .env.example .env
   ```
4. Edit `server/.env` and fill in your real values:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

> **⚠️ Never copy `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` into `app/`. These are server-only secrets.**

## 4. Seed the System Start Time

Run this command **exactly once**, before the worker's first start:

```bash
npm run seed:start-time
```

This records the current timestamp as the cutoff. Only articles published **after** this moment will be processed. The command is idempotent — if a start time already exists, it is preserved.

> **⚠️ Do NOT run this again after articles have been processed. It will not reset the timestamp, but running it before the first start is required.**

## 5. Deploy the Server

The recommended, free deployment method uses GitHub Actions.

1. Go to your GitHub repository on the web.
2. Navigate to **Settings → Secrets and variables → Actions**.
3. Add these three values as **New repository secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`

Once added, the GitHub Actions workflow (`.github/workflows/worker.yml`) runs automatically every 5 minutes to poll for new articles.


> **⚠️ Note on GitHub Actions:** GitHub disables scheduled workflows automatically if there has been no repository activity for 60 days. You may need to occasionally commit to the repository or manually re-enable the workflow if this happens.

*(For a traditional always-on process like Render or Railway, see the optional [`server/DEPLOY.md`](server/DEPLOY.md) instead.)*

## 6. Configure the App

1. Open a terminal in the `app/` directory.
2. Run `npm ci` to install dependencies.
3. Copy the example environment file:
   ```
   cp .env.example .env
   ```
4. Edit `app/.env` and fill in your values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   Use the **anon public key** from step 1 — not the service role key.

## 7. Set Up EAS (Expo Application Services)

Push notifications require an EAS project ID. Set it up once:

1. Install the EAS CLI globally (if not already):
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   npx eas-cli login
   ```
3. From the `app/` directory, initialise the EAS project:
   ```bash
   npx eas-cli init
   ```
   This will create an EAS project and update `app.json` with your real `projectId` under `extra.eas.projectId`.

## 8. Build the Android APK

From the `app/` directory, run:

```bash
npx eas-cli build -p android --profile production
```

This builds a production APK in the cloud. When it finishes:

1. Download the `.apk` file from the link provided in the terminal (or from [expo.dev](https://expo.dev) → your project → Builds).
2. Transfer the APK to the Android phone (via USB, email, Google Drive, WhatsApp, etc.).
3. Open the APK on the phone and install it. You may need to enable "Install from unknown sources" in Android settings.

> **First build takes 10–15 minutes.** Subsequent builds are faster.

## 9. Verify Everything Works

1. **Server**: Check logs — it should be polling Lapaas and translating new articles.
2. **App**: Open the app on the phone — latest Hindi articles should appear.
3. **Push notifications**: When a new article is translated, a push notification with the Hindi title should arrive on registered devices.
4. **Text-to-speech**: Open any article and tap "🔊 सुनें" — the Hindi content should be read aloud.

---

## Quick Reference

| Component | Command | Notes |
|-----------|---------|-------|
| Server install | `cd server && npm ci` | |
| Seed start time | `cd server && npm run seed:start-time` | Once only, before first start |
| Server start | `cd server && npm start` | Long-running process |
| Server dry run | `cd server && npm run dry-run` | Test without saving |
| Server tests | `cd server && npm test` | Runs all unit tests |
| App install | `cd app && npm ci` | |
| App dev | `cd app && npx expo start` | For development |
| Android build | `cd app && npx eas-cli build -p android --profile production` | Produces APK |
