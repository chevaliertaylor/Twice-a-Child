# Twice a Child

An Expo (React Native) app that pairs an isolated senior with an AI companion
styled after their adult child — providing daily companionship while surfacing
wellbeing summaries and urgent alerts to the child. See [`docs/PRD.md`](docs/PRD.md)
for the full product spec.

## Getting started

```bash
npm install
cp .env.example .env   # add your EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
npm run ios      # iOS simulator (macOS) or Expo Go
npm run android  # Android emulator or Expo Go
npm run web      # browser preview
```

The app boots without Supabase env set (for UI review), but auth and data calls
need a Supabase project — see [`supabase/README.md`](supabase/README.md) to stand
up the backend.

## Deploying to the App Store (EAS)

This is a mobile app — it ships to the App Store via Expo Application Services,
not a web host.

```bash
npm install -g eas-cli
eas login                 # requires a free Expo account
eas init                  # creates the EAS project, fills extra.eas.projectId
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Prerequisites: an [Expo account](https://expo.dev) and an
[Apple Developer account](https://developer.apple.com) ($99/yr). After submit,
the build appears in App Store Connect → TestFlight → App Store review.

## Project status

The full PRD roadmap is implemented end-to-end:

- Supabase email/password auth (shared account) + per-device role
- Onboarding (plan → role → avatar → child preferences) persisted to Postgres
- Parent companion chat — text **and** voice (record → Whisper transcription →
  Claude reply, read aloud) wired to the `chat` Edge Function
- Photo sharing (parent → child) via a private Storage bucket
- Child dashboard: wellbeing summaries, urgent alerts, recent photos
- Settings screen (edit cadence/alerts, sign out)
- Push notifications for urgent alerts + summaries; hourly check-in cron that
  prompts parents in their **local timezone**
- RevenueCat subscription paywall ($5.99/mo, 7-day trial); disabled when no key

Everything type-checks (`npx tsc --noEmit`). It has **not** been run against a
live backend/device — see the caveats below before shipping.

## Validate it live (not yet done)

1. Create a Supabase project; set `EXPO_PUBLIC_SUPABASE_*` in `.env`; apply
   `supabase/migrations/*` and deploy the functions (see `supabase/README.md`).
2. Set `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (STT), and `CRON_SECRET` as Supabase
   secrets; schedule `checkin-cron`.
3. Configure RevenueCat (entitlement + product) and set the `EXPO_PUBLIC_REVENUECAT_*` keys.
4. Run `npx expo install --check` to align native module versions, then build a
   dev client (`eas build --profile development`) — voice, push, and billing do
   not work in Expo Go.
