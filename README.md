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

Working slice end-to-end: Supabase email/password auth, the full onboarding flow
(plan → role → avatar → child preferences) persisted to Postgres, a parent chat
screen wired to the Claude-backed `chat` Edge Function, a child dashboard reading
wellbeing summaries and urgent alerts, a Settings screen, Expo push registration,
push notifications for urgent alerts + summaries, and an hourly check-in cron that
prompts parents per the child's cadence.

Not yet built (PRD roadmap): voice chat, photo sharing, per-timezone check-in
scheduling, and IAP billing.
