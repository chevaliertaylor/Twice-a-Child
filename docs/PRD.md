# Twice a Child — Product Requirements Document (PRD)

**Status:** Draft v1
**Last updated:** 2026-06-23
**Owner:** chevaliertaylor@live.ca
**Platform:** Expo (React Native) — iOS first, Android in a later phase

---

## 1. Overview

### 1.1 Summary
Twice a Child is a subscription mobile app that helps adult children stay connected to and check in on their elderly parents — while giving isolated seniors a warm, companion-like presence to talk to every day. The parent interacts with an AI avatar styled after their own child; the AI both **provides companionship** and **gathers wellbeing signals** (mood, health, mental state) that are summarized and delivered to the adult child.

The product solves two problems at once:
- **For adult children** (often living abroad or time-constrained): automated, low-effort, meaningful visibility into a parent's day-to-day wellbeing.
- **For seniors**: consistent, friendly, personalized conversation that reduces isolation and feels like talking to family.

### 1.2 Goals
- Make daily check-ins feel personal and effortless for the senior.
- Give the adult child a trustworthy, glanceable picture of their parent's wellbeing.
- Surface urgent concerns quickly and safely, without overpromising medical capability.
- Be simple enough for a low-tech elderly user to operate with confidence.

### 1.3 Non-Goals (v1)
- Not a medical device, diagnostic tool, or emergency service.
- No clinical/EHR integrations, medication management, or telehealth.
- No multi-parent or multi-sibling support in v1 (see §13 Future).
- No Android launch in v1 (codebase will be Android-ready via Expo).

### 1.4 Success Metrics (initial targets)
- Trial → paid conversion ≥ 30%.
- Parent check-in response rate ≥ 60% of initiated check-ins.
- Child weekly active rate (opens dashboard) ≥ 70%.
- D30 subscription retention ≥ 75%.
- Median time from concerning signal → child alert delivered < 2 minutes.

---

## 2. Personas

**The Parent (primary user, senior).** Lower digital literacy, may have vision/motor/hearing considerations. Wants connection and ease. Talks to the app as if to their child.

**The Child (subscriber/admin).** Pays for and configures the service. Wants reassurance, summaries, and to be alerted if something is wrong. Configures cadence and privacy.

> In v1 the relationship is strictly **one parent ↔ one child**, sharing a single account (see §4).

---

## 3. Business Model

- **Price:** $5.99 USD / month, auto-renewing subscription.
- **Free trial:** 7 days, started at initial setup.
- **Billing:** Apple In-App Purchase (StoreKit 2) via **RevenueCat** for entitlement management, receipt validation, and cross-device entitlement sync. (Apple requires IAP for digital subscriptions; RevenueCat simplifies trials, restores, and future Android/Play billing.)
- **Entitlement model:** One subscription unlocks the paired parent + child experience under the same account.
- **Trial → paid:** Card/Apple ID captured at setup per Apple trial rules; converts automatically after 7 days unless cancelled.

---

## 4. Account & Identity Model

- **Single shared account** (email + password) used to sign in on **both** the parent device and the child device.
- A `role` is selected per device at first setup (parent-end or child-end); the role is stored per authenticated device/session, not per account.
- Auth: email + password (v1). Add "Sign in with Apple" as a fast-follow (required-adjacent for App Store goodwill and easier senior onboarding).
- Both devices read/write to the same account record (parent profile, child profile, preferences, conversation summaries).

> **Design note:** Sharing one login is intentional for simplicity in v1, but it means both parties can technically see all data. Privacy boundaries (what the parent knows is shared) are handled via explicit consent (§9), not via separate accounts. Multi-account/role separation is a v2 consideration.

---

## 5. Onboarding & Setup Flows

### 5.1 Common entry (both ends)
1. **Create account** — email + password.
2. **Choose plan** — start 7-day free trial or subscribe ($5.99/mo). Apple IAP sheet.
3. **Select role** — **Parent-end** or **Child-end**.

### 5.2 Avatar setup (both ends, page 2)
- Upload a photo of the person (parent uploads parent's photo; child uploads child's photo) → generate a stylized AI avatar.
- **Or** choose from a curated, **multicultural** library of pre-made avatars (varied ethnicity, age, gender presentation, attire).
- Avatar is stored against the relevant profile and used in the parent's chat UI (the child's avatar is what the parent sees "sitting and chatting").

> **Likeness & consent:** If a real photo is uploaded, capture explicit consent that an AI likeness will be generated and shown to the other party. Store the source photo encrypted; allow deletion.

### 5.3 Parent-end completion
- After avatar setup, the parent lands on the **Parent Landing Page** (§6). Minimal additional setup — keep friction near zero.
- Parent consent screen (§9) presented in large, plain language: what's shared with their child and what they can turn off.

### 5.4 Child-end completion (page 3 — preferences)
- **Summary notifications:** how often (e.g., daily / every few days / weekly) and at what time(s).
- **Check-in cadence:** how often the bot should proactively check in on the parent, and rough time windows (e.g., morning / midday / evening).
- **Urgent alerts:** confirm opt-in to immediate alerts for high-concern signals (default ON), with the safety disclaimer (§9).
- After this, the child reaches the full app and **Child Dashboard** (§7).

---

## 6. Parent Experience

### 6.1 Parent Landing Page (design principles)
- **Elderly-first UX:** large text, high contrast, big tap targets, minimal navigation, no clutter, forgiving interactions, optional larger font/scale.
- **Emotional framing:** the screen shows the **cute AI avatar of their child sitting and chatting** with them — feels personal, like a video call with family.
- One primary action: talk to the avatar (tap to type or tap-and-hold to record voice).

### 6.2 Conversation
- **Modalities:** typed text **and** voice recordings (speech-to-text in, optional text-to-speech out in the child's-avatar voice persona).
- **Proactive check-ins:** the app generates a notification that initiates a check-in, worded naturally as if from the child:
  - e.g., *"Morning, Mom — how are you feeling today?"*
- **Companion behavior:** the AI asks the kinds of questions an adult child would when checking in on wellbeing (sleep, meals, mood, pain/energy, plans, social contact), while keeping the conversation warm and pleasant — not an interrogation.
- **Personalization:** subject to privacy settings (§9), the bot uses gathered context (interests, recent events, names, routines) to tailor dialogue so it feels meaningful and remembered over time.
- **Photo sharing:** the parent can send photos throughout the day to "their child" (delivered to the child device/feed), when capable.

### 6.3 Parent notifications
- Check-in prompts arrive as friendly, natural push notifications at the cadence/time windows the child configured.
- Tapping a notification opens directly into the conversation with the avatar.

---

## 7. Child Experience

### 7.1 Child Dashboard
- Visualizes wellbeing summaries and trends as data arrives from the bot:
  - **Mood** (trend over time)
  - **Physical wellbeing signals** (self-reported energy, pain, sleep, appetite)
  - **Mental/cognitive signals** (engagement, coherence, notable changes)
  - **Engagement** (did the parent respond? conversation length/frequency)
  - **Recent highlights** (notable things the parent mentioned)
  - **Photos** the parent sent
- Each summary is timestamped and tied to a conversation period.

### 7.2 Summaries
- After each check-in (or per configured window), the backend generates a **short summary** with all pertinent wellbeing info and delivers it to the child device/account.
- The app generates a **notification when a new summary is available**.

### 7.3 Urgent alerts (real-time)
- Beyond scheduled summaries, when the AI detects **high-concern signals** (expressed distress, possible health crisis, mention of a fall, self-harm language, acute confusion), an **immediate push** (and optional SMS as a later add) is sent to the child.
- Alert includes a brief, non-diagnostic description and a clear non-medical disclaimer (§9).
- Severity thresholds defined in §8.3.

### 7.4 Settings (fully customizable)
- Child can change at any time: summary frequency & time(s), check-in frequency & windows, urgent-alert toggle/sensitivity, privacy/data toggles (§9), avatar, and account/billing.
- Changes apply to both ends immediately.

---

## 8. AI System Design

### 8.1 Recommended model stack (Claude)
- **Companion conversation:** **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — strong quality with good latency/cost for high-volume, multi-turn chat with an elderly audience. Pricing: $3 / $15 per 1M input/output tokens.
- **Wellbeing summarization & signal extraction:** **Claude Haiku 4.5** (`claude-haiku-4-5`) — fast and inexpensive ($1 / $5 per 1M) for structured summary generation from a conversation transcript.
- **Urgent-signal classification:** **Claude Haiku 4.5** run on each parent turn (low latency, low cost) using **structured outputs** to return a severity score + category; escalate per §8.3.
- **Premium/quality option:** **Claude Opus 4.8** (`claude-opus-4-8`) available behind a flag for the companion model if conversational quality testing warrants it (higher cost).

> Rationale: Sonnet 4.6 balances warmth/coherence against per-message cost at scale; Haiku 4.5 keeps the always-on summarization and safety-classification paths cheap and fast. All three use **adaptive thinking** (`thinking: {type: "adaptive"}`) where reasoning helps; companion chat can run with thinking off for snappy replies.

### 8.2 Conversation architecture
- **System prompt** encodes: persona (the parent's child, by name), warm tone, check-in question repertoire, safety guardrails, and "never claim to be a real person / never give medical advice."
- **Memory:** per-parent persistent profile (interests, routines, recent topics, family names) stored server-side and injected into context, gated by privacy settings (§9). Use prompt caching for the stable persona + profile prefix to reduce cost.
- **Multimodal in:** voice → speech-to-text before sending to the model; images the parent sends are described/summarized for the child (and optionally referenced by the companion).
- **Multimodal out:** text reply, optionally rendered to speech (TTS) in a consistent friendly voice.

### 8.3 Wellbeing extraction & escalation
- After each check-in conversation, a summarization call produces a structured record: `{ mood, energy, sleep, appetite, pain, social_contact, cognitive_flags[], highlights[], concern_level }`.
- **Per-turn safety classification** returns `concern_level ∈ {none, low, medium, high}` + `category`.
  - **high** → immediate child alert (§7.3) + flagged in next summary.
  - **medium** → prominently flagged in the next summary; no real-time push (configurable).
  - **low/none** → rolled into normal summary.
- Thresholds and categories are tunable in config; the classifier is conservative (errs toward surfacing) but every alert carries the non-medical disclaimer.

### 8.4 Voice / avatar technology (recommended)
- **STT:** streaming speech-to-text provider (e.g., a low-latency cloud STT) for parent voice input.
- **TTS:** natural neural TTS for the companion voice; allow a default friendly voice in v1.
- **Avatar generation:** v1 uses **stylized, friendly cartoon-style avatars** derived from the uploaded photo (lower cost, lower privacy/likeness risk, faster) plus the multicultural pre-made library. **Photorealistic likeness** avatars are deferred to a later phase (higher cost, additional consent/likeness handling).
- **Voice conversation** is treated as a **first-class v1 capability** given the elderly audience, alongside text.

> These specifics (STT/TTS vendor, avatar generation vendor) are recommendations to be finalized during technical design; the product requirements above are vendor-agnostic.

---

## 9. Privacy, Security, Consent & Disclaimers

### 9.1 AI disclosure (App Store requirement)
- Clear, persistent disclosure that the companion is an **AI**, not a real person, presented at onboarding and accessible in-app. The parent is told the avatar represents their child but is AI-driven.

### 9.2 Parent consent & transparency
- At parent onboarding, an explicit, plain-language consent screen explains:
  - what information is gathered,
  - that summaries are shared with their child,
  - which data categories they can disable.
- **Privacy toggles** (parent-controllable, with sensible defaults) govern how much personal context the bot may store/use and what is shared in summaries.

### 9.3 Safety disclaimer (no medical liability)
- Prominent disclaimer at onboarding and in alerts: the app is a **communication and companionship tool**, **not** a medical, diagnostic, monitoring, or emergency service. It makes no medical claims and assumes no medical responsibility or liability. In an emergency, contact local emergency services.

### 9.4 Data & security requirements
- Encryption in transit (TLS) and at rest for all PII, photos, transcripts, and summaries.
- Authentication with secure password storage (hashing + salting); secure session/token handling.
- Principle of least privilege; access scoped to the single shared account.
- Data retention is configurable; users can request deletion of photos, transcripts, and account data (support GDPR/CCPA-style deletion).
- Source photos used for avatar generation are deletable; deleting removes generated derivatives where feasible.
- No secrets/keys in the client; all model calls proxied through the backend.
- Clear Terms of Service and Privacy Policy linked at signup and in settings.

---

## 10. Notifications (cadence engine)
- All cadences are **child-configured** at setup and editable in settings:
  - **Check-in prompts** (parent) — frequency + time windows.
  - **Summary notifications** (child) — frequency + specific time(s).
  - **Urgent alerts** (child) — on/off + sensitivity.
- Push via Expo Notifications (APNs for iOS). Respect quiet hours and time zones for both parties.
- Natural-language phrasing for parent prompts (templated + lightly personalized).

---

## 11. High-Level Architecture
- **Client:** Expo / React Native app, single binary with role-based UI (parent vs child). Accessibility-first parent UI.
- **Backend (API):** auth, account/profile store, preferences, conversation orchestration, summary store, notification scheduler, alert dispatcher. Proxies all Claude calls (keys server-side).
- **AI services:** Claude (chat, summary, classification), STT, TTS, avatar generation.
- **Storage:** encrypted DB for profiles/preferences/summaries; encrypted object storage for photos/audio.
- **Billing:** RevenueCat + Apple IAP.
- **Push:** Expo push / APNs.

---

## 12. Scope Summary (v1)

| Area | In v1 | Deferred |
|---|---|---|
| Platforms | iOS | Android |
| Relationship | 1 parent ↔ 1 child | multi-parent, multi-sibling |
| Chat | Text + voice | — |
| Avatars | Stylized from photo + multicultural library | Photorealistic likeness |
| Wellbeing | Summaries + dashboard + real-time urgent alert to child | Emergency-contact/services escalation |
| Auth | Email + password | Sign in with Apple (fast-follow) |
| Alerts channel | Push | SMS |

---

## 13. Future Considerations (post-v1)
- Multiple parents per child; multiple siblings sharing a parent (roles/permissions, shared dashboards).
- Emergency-contact / emergency-services escalation tier.
- Photorealistic avatars and custom cloned voices.
- Android + Google Play (data-safety + AI disclosures).
- Localization / multilingual companion (the multicultural avatar set hints at international demand).
- Wearable / passive signals (with appropriate consent and disclaimers).

---

## 14. Open Questions
- Final STT/TTS and avatar-generation vendors and their cost ceilings at projected message volume.
- Exact summary cadence default and urgent-alert sensitivity default values.
- Whether the parent should be able to see their own shared summaries (transparency vs. simplicity).
- Localization timeline and initial language set.
- Data retention default window.
