# Twice a Child

An Expo (React Native) app that pairs an isolated senior with an AI companion
styled after their adult child — providing daily companionship while surfacing
wellbeing summaries and urgent alerts to the child. See [`docs/PRD.md`](docs/PRD.md)
for the full product spec.

## Getting started

```bash
npm install
npm run ios      # iOS simulator (macOS) or Expo Go
npm run android  # Android emulator or Expo Go
npm run web      # browser preview
```

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

Early scaffold: account/role entry screen in place. Onboarding, chat, dashboard,
and backend are not yet implemented (see the PRD roadmap).
