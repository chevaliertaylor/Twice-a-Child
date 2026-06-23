# Twice a Child — Backend (Supabase)

The backend is **Supabase**: Postgres + Row Level Security for data, Supabase
Auth for the shared email/password login, and Edge Functions (Deno) that call
Claude with the API key held server-side.

```
supabase/
  config.toml              project + function config
  migrations/0001_init.sql schema, enums, RLS policies, signup trigger
  functions/
    _shared/claude.ts      Anthropic SDK helpers (companion / classify / summarize)
    _shared/http.ts        CORS + request-scoped, RLS-respecting Supabase client
    chat/index.ts          companion reply + urgent-concern classification
    summarize/index.ts     wellbeing summary for the child
```

## Data model (PRD §4)
One Supabase Auth user is the shared login for both the parent and child
devices. Every table is scoped by `account_id = auth.uid()`, so RLS is a simple
ownership check — only the account owner can read or write its rows. A signup
trigger seeds the `account` and `preferences` rows automatically.

## Models (PRD §8.1)
- Companion chat → **Claude Sonnet 4.6** (`claude-sonnet-4-6`)
- Summary + per-turn urgent classification → **Claude Haiku 4.5** (`claude-haiku-4-5`)

## Local development
```bash
npm install -g supabase            # or: brew install supabase/tap/supabase
supabase start                     # local Postgres + Auth + Edge runtime
supabase db reset                  # applies migrations/0001_init.sql
cp supabase/.env.example supabase/.env   # add your ANTHROPIC_API_KEY
supabase functions serve --env-file supabase/.env
```

## Deploy
```bash
supabase link --project-ref <your-project-ref>
supabase db push                                  # apply migrations
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... # store the key as a secret
supabase functions deploy chat summarize
```

## Endpoints
`chat` and `summarize` require a logged-in user's JWT in the
`Authorization: Bearer <token>` header.

- `POST /functions/v1/chat` — `{ conversationId?, message, modality? }` → `{ conversationId, reply, concern }`. Persists the turn, raises an `alert` row on a high-concern signal, and pushes an urgent notification to the child's device (if urgent alerts are on).
- `POST /functions/v1/summarize` — `{ conversationId }` → `{ id, createdAt, summary }`. Stores a `summary` row and pushes a "summary ready" notification to the child.
- `POST /functions/v1/checkin-cron` — **no user JWT**; guarded by the `x-cron-secret` header. Pushes naturally worded check-in prompts to parents who are due one per the child's preferences. Uses the service role to read across accounts.

## Notifications & scheduled check-ins
Devices register an Expo push token (`device` table). Urgent alerts and summary
notifications are sent from `chat` / `summarize`. Proactive parent check-ins are
sent by `checkin-cron`, which should run hourly.

Set the cron secret, then schedule the function (run from SQL or the dashboard):

```bash
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
```

```sql
-- Hourly, via pg_cron + pg_net (enable both extensions first).
select cron.schedule(
  'twice-a-child-checkin',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://<project-ref>.functions.supabase.co/checkin-cron',
    headers := jsonb_build_object('x-cron-secret', '<your CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);
```

Notes: check-in windows fire in the parent's local time — the parent device
reports its IANA timezone (`preferences.timezone`), and the cron resolves each
window hour in that zone. Remote push requires a development/production build —
Expo Go does not deliver remote notifications.

## Notes / next steps
- The app isn't wired to these yet — that needs `@supabase/supabase-js` + Auth in the React Native client and an `EXPO_PUBLIC_SUPABASE_URL` / anon key.
- Push delivery for urgent alerts and summaries (Expo push) is not implemented; alerts/summaries are persisted and can be subscribed to via Supabase Realtime.
- Scheduled check-ins/summaries (PRD §10) would run as Supabase cron jobs invoking these functions.
