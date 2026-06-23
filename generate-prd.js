const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, Header, Footer, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

const BRAND_BLUE = "2563EB";
const BRAND_LIGHT = "EFF6FF";
const BRAND_MID = "BFDBFE";
const GRAY = "6B7280";
const DARK = "111827";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F3F4F6";

const border = { style: BorderStyle.SINGLE, size: 1, color: "DBEAFE" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BLUE, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: BRAND_BLUE })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: DARK })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: "374151" })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: opts.color || "374151", bold: opts.bold || false })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "374151" })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function infoBox(label, value) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 2200, type: WidthType.DXA },
            shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: WHITE })] })]
          }),
          new TableCell({
            borders,
            width: { size: 7160, type: WidthType.DXA },
            shading: { fill: BRAND_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 20, color: DARK })] })]
          })
        ]
      })
    ]
  });
}

function twoColTable(rows, headers) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: i === 0 ? 3120 : 6240, type: WidthType.DXA },
      shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: ci === 0 ? 3120 : 6240, type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : BRAND_LIGHT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 20, color: DARK })] })]
    }))
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [headerRow, ...dataRows]
  });
}

function threeColTable(rows, headers, widths) {
  const w = widths || [2800, 3200, 3360];
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: w[i], type: WidthType.DXA },
      shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: w[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : BRAND_LIGHT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 20, color: DARK })] })]
    }))
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: w,
    rows: [headerRow, ...dataRows]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BRAND_BLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "374151" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BLUE, space: 4 } },
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({ text: "Twice a Child", font: "Arial", size: 20, bold: true, color: BRAND_BLUE }),
              new TextRun({ text: "   |   Product Requirements Document", font: "Arial", size: 20, color: GRAY }),
              new TextRun({ text: "   |   CONFIDENTIAL", font: "Arial", size: 20, color: GRAY, italics: true }),
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_MID, space: 4 } },
            spacing: { before: 120, after: 0 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: GRAY }),
              new TextRun({ text: " of ", font: "Arial", size: 18, color: GRAY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: GRAY }),
              new TextRun({ text: "   |   © 2025 Twice a Child. All rights reserved.", font: "Arial", size: 18, color: GRAY }),
            ]
          })
        ]
      })
    },
    children: [

      // ─── COVER ───────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 480, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Twice a Child", font: "Arial", size: 72, bold: true, color: BRAND_BLUE })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Connecting adult children with their aging parents — through the power of AI", font: "Arial", size: 28, italics: true, color: GRAY })]
      }),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [new TableRow({
          children: [
            ["Document Type", "Product Requirements Document"],
            ["Version", "1.0 — Initial Draft"],
            ["Platform", "iOS (Expo)"],
            ["Status", "In Review"],
          ].map(([label, val]) => new TableCell({
            borders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: BRAND_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 18, bold: true, color: BRAND_BLUE })] }),
              new Paragraph({ children: [new TextRun({ text: val, font: "Arial", size: 20, color: DARK })] })
            ]
          }))
        })]
      }),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 1. EXECUTIVE SUMMARY ─────────────────────────────────────────────
      h1("1. Executive Summary"),
      body("Twice a Child is a subscription-based iOS companion app built to help adult children stay informed and connected with their elderly parents — wherever they are in the world. By deploying an AI-powered avatar modelled on the adult child, the app provides daily, personalised check-ins on the parent’s behalf, collecting wellbeing data (mood, health indicators, mental state) and surfacing it back to the child as actionable summaries and trend dashboards."),
      spacer(),
      body("The app targets two interconnected user groups: elderly parents seeking meaningful companionship and a familiar, comforting digital presence; and adult children living abroad or with busy lifestyles who need peace of mind about their parents’ day-to-day wellbeing without the burden of scheduling daily calls."),
      spacer(),
      threeColTable([
        ["Business Model", "Subscription — $5.99 USD/month", "7-day free trial on sign-up"],
        ["Target Platform", "iOS (Expo React Native)", "App Store distribution"],
        ["Primary Personas", "Elderly parent (65+)", "Adult child (30–60)"],
        ["Core AI Features", "Companion chatbot avatar", "Wellbeing summarisation"],
        ["Monetisation", "Per-account subscription", "One account, two devices"],
      ], ["Dimension", "Detail", "Notes"], [2600, 3400, 3360]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 2. PRODUCT GOALS ─────────────────────────────────────────────────
      h1("2. Product Goals & Success Metrics"),
      h2("2.1 Goals"),
      bullet("Reduce the anxiety adult children feel about their parents’ daily wellbeing when they cannot check in personally."),
      bullet("Provide elderly parents with a warm, non-intrusive AI companion that feels familiar rather than clinical."),
      bullet("Deliver structured, consistent wellbeing data to adult children through dashboard summaries and trend visualisations."),
      bullet("Achieve App Store approval with full compliance to Apple’s guidelines for AI disclosure, data privacy, and medical disclaimer requirements."),
      bullet("Build a monetisable, scalable SaaS product with low churn by creating genuine daily-use value for both user segments."),
      spacer(),
      h2("2.2 Success Metrics (V1 Launch Targets)"),
      twoColTable([
        ["Free Trial Conversion Rate", "≥ 30% of trial users convert to paid subscription"],
        ["Monthly Active Users (MAU)", "≥ 70% of subscribers open the app at least 3x per week (parent-end)"],
        ["Check-in Completion Rate", "≥ 80% of AI-initiated check-ins receive a parent response"],
        ["Child Dashboard Engagement", "≥ 60% of child users view weekly summary within 24h of notification"],
        ["App Store Rating", "Maintain ≥ 4.5 stars within first 90 days"],
        ["Churn Rate", "Monthly churn below 8% after first 3 months"],
        ["Crash-Free Sessions", "≥ 99.5% crash-free sessions (both ends)"],
      ], ["Metric", "Target"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 3. USER PERSONAS ─────────────────────────────────────────────────
      h1("3. User Personas"),
      h2("3.1 The Parent — “Margaret, 74”"),
      twoColTable([
        ["Background", "Retired teacher living alone after spouse passed away. Limited smartphone confidence. Craves routine and familiar faces."],
        ["Pain Points", "Feels lonely between calls from her daughter abroad. Anxious about her health going unnoticed. Intimidated by complex apps."],
        ["Needs from App", "A simple, warm interface. A familiar face (her daughter’s avatar). Easy text or voice replies. No confusing menus."],
        ["Tech Comfort", "Low — uses phone mainly for calls, photos, and messaging."],
      ], ["Attribute", "Detail"]),
      spacer(),
      h2("3.2 The Adult Child — “Laura, 38”"),
      twoColTable([
        ["Background", "Marketing professional living in Canada while her mother is in the UK. Calls when time zones allow — roughly twice a week."],
        ["Pain Points", "Constant guilt about not calling enough. No structured way to track her mother’s health trends. Relies on inconsistent self-reporting."],
        ["Needs from App", "A reliable check-in automation she can customise. Clear wellbeing summaries. Trend data she can share with healthcare providers if needed."],
        ["Tech Comfort", "High — comfortable with apps, notifications, and dashboards."],
      ], ["Attribute", "Detail"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 4. TECHNICAL ARCHITECTURE ────────────────────────────────────────
      h1("4. Technical Architecture Overview"),
      h2("4.1 Tech Stack"),
      twoColTable([
        ["Framework", "Expo (React Native) — managed workflow"],
        ["Target Platform", "iOS 16+ (iPhone and iPad)"],
        ["State Management", "React Context + Zustand (or Redux Toolkit)"],
        ["Backend", "Node.js / Express or Serverless (e.g. AWS Lambda / Supabase Edge Functions)"],
        ["Database", "PostgreSQL via Supabase or AWS RDS"],
        ["Authentication", "Email + Password via Supabase Auth or Firebase Auth"],
        ["Payment Processing", "RevenueCat SDK (wraps App Store in-app subscriptions)"],
        ["AI Chatbot", "Anthropic Claude API (recommended) or OpenAI GPT-4o — TBD"],
        ["Push Notifications", "Expo Notifications + APNs (Apple Push Notification Service)"],
        ["Avatar Generation", "Third-party API: D-ID, HeyGen, or Replicate SDXL — TBD"],
        ["Media Storage", "AWS S3 or Supabase Storage (photos, voice recordings)"],
        ["Analytics", "Mixpanel or PostHog (privacy-first)"],
      ], ["Layer", "Technology"]),
      spacer(),
      h2("4.2 AI Model Recommendation"),
      body("The following AI providers are recommended for evaluation in V1. Final selection should be based on cost-per-token at expected message volume, latency, and safety filter configurability."),
      spacer(),
      threeColTable([
        ["Anthropic Claude (Sonnet/Haiku)", "Strong safety defaults, nuanced long-form conversation, excellent at adopting personas. HIPAA BAA available.", "Recommended starting point"],
        ["OpenAI GPT-4o", "Broad capability, multimodal (can accept voice/images natively). Widely documented.", "Strong alternative"],
        ["Google Gemini Pro", "Competitive pricing, Google Cloud integration.", "Evaluate if cost is primary driver"],
      ], ["Provider", "Notes", "Recommendation"], [2600, 4400, 2360]),
      spacer(),
      h2("4.3 Avatar Generation Recommendation"),
      body("For V1, a static illustrated avatar (generated once from a photo or chosen from a multicultural library) is recommended to reduce API cost and latency. Animated/talking avatars (D-ID, HeyGen) can be introduced in V2."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 5. ACCOUNT & ONBOARDING ──────────────────────────────────────────
      h1("5. Account Setup & Onboarding Flow"),
      h2("5.1 Account Creation (Shared — Both Ends)"),
      body("A single user account is used to log in on both the parent and child devices. The onboarding flow is as follows:"),
      spacer(),
      h3("Step 1 — Sign Up / Sign In"),
      bullet("New users register with email and password."),
      bullet("Existing users sign in with the same credentials on any device."),
      bullet("Password reset via email link."),
      bullet("App presents subscription options: 7-day free trial (no charge until trial ends) or immediate monthly subscription at $5.99 USD/month."),
      bullet("Payment processed via Apple in-app purchase (RevenueCat). Apple handles billing and trial management."),
      bullet("User must accept Terms & Conditions, Privacy Policy, and AI Disclaimer before proceeding."),
      spacer(),
      h3("Step 2 — Device Role Selection"),
      bullet("After account creation / sign-in, the app presents a full-screen selection: “I am the Parent” or “I am the Adult Child.”"),
      bullet("Selection persists on this device. The same account can have one device in each role."),
      bullet("Role can be changed in Settings."),
      spacer(),
      h3("Step 3 — Avatar Setup (Both Ends)"),
      bullet("Both the parent and child are prompted to upload a photo of themselves OR choose from a multicultural illustrated avatar library."),
      bullet("The child’s avatar is used as the AI companion on the parent’s device."),
      bullet("The parent’s avatar appears on the child’s dashboard to personalise summaries."),
      bullet("Avatar library must include diverse options representing multiple ethnicities, ages, and genders."),
      bullet("Photo upload: processed server-side to generate a stylised/illustrated avatar (third-party API — TBD). Original photo is not stored permanently unless user consents under Privacy Settings."),
      spacer(),
      h3("Step 4 — Child Preferences (Child Device Only)"),
      bullet("How frequently should the AI check in on your parent? (Options: 1x daily, 2x daily, 3x daily, custom times)"),
      bullet("What time(s) should check-ins be sent? (Time picker, with timezone auto-detected)"),
      bullet("How often do you want to receive wellbeing summary notifications? (Options: after every check-in, once daily, twice weekly, weekly)"),
      bullet("What time should summary notifications arrive? (Time picker)"),
      bullet("These preferences are stored and editable at any time in the child’s Settings."),
      bullet("After completing preferences, the child lands on the Child Dashboard (main experience)."),
      spacer(),
      h3("Step 5 — Parent Landing Page"),
      body("After avatar setup, the parent lands directly on the Parent Chat Screen — a simplified, minimal interface showing the child’s avatar and a warm introductory message."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 6. PARENT EXPERIENCE ─────────────────────────────────────────────
      h1("6. Parent-End Experience"),
      h2("6.1 Design Principles"),
      bullet("Simplicity above all: one primary screen, minimal navigation, large touch targets."),
      bullet("Warmth and familiarity: the interface should feel like a letter from a child, not a medical app."),
      bullet("Accessibility: large fonts (minimum 18pt), high contrast, voice input as a first-class option."),
      bullet("Non-intrusive: the app should never feel alarming or clinical."),
      spacer(),
      h2("6.2 Parent Landing Page — Chat Screen"),
      body("The parent’s primary screen is a chat-style interface. Key layout elements:"),
      spacer(),
      bullet("The child’s AI avatar is displayed prominently at the top — a warm illustrated version of the child, seated in a friendly pose."),
      bullet("A greeting message is shown from the avatar (e.g. “Good morning Mum! How are you feeling today?”)."),
      bullet("Below the avatar, a scrollable chat feed shows the conversation history."),
      bullet("At the bottom: a text input field with a large microphone button for voice input."),
      bullet("A camera/photo icon allows the parent to send a photo at any time."),
      bullet("Navigation is minimal: a single Settings icon in the top corner. No tab bars or complex menus."),
      spacer(),
      h2("6.3 AI Check-In Notifications"),
      bullet("The app sends push notifications at times set by the child, worded naturally as if from the child."),
      bullet("Example notification copy: “Morning Mum, just thinking of you — how did you sleep?” or “Hey Dad, how’s your afternoon going?”"),
      bullet("Notification copy should vary across sessions to feel organic, not repetitive."),
      bullet("Tapping the notification opens the app directly to the chat screen."),
      spacer(),
      h2("6.4 Companion Conversation Design"),
      body("The AI companion bot operates under a carefully crafted system prompt that instructs it to:"),
      bullet("Adopt the persona of the adult child — warm, caring, familiar in tone."),
      bullet("Open each check-in with a natural greeting referencing the time of day and, where available, recent context (e.g. “How did that doctor’s appointment go yesterday?”)."),
      bullet("Ask open-ended wellbeing questions spanning: physical health (sleep, pain, appetite, medication), emotional state (mood, loneliness, happiness), daily activity (went for a walk, watched something enjoyable), and social contact (spoke to a friend, went out)."),
      bullet("Engage in warm, pleasant conversation beyond just data collection — sharing anecdotes the child has pre-loaded, asking about the parent’s hobbies, or discussing the weather."),
      bullet("Never ask alarming, clinical, or leading questions. Never suggest diagnoses."),
      bullet("Adapt language complexity to the parent’s apparent communication style over time."),
      spacer(),
      h2("6.5 Voice & Photo Input"),
      bullet("Voice recordings: parent taps the microphone, records a message, and sends it. AI transcribes (Whisper API or equivalent) and responds in both text and, optionally, text-to-speech."),
      bullet("Photo sharing: parent can tap the camera icon to take or upload a photo. Photos are sent to the child’s account and visible on the child dashboard. Parent receives a warm acknowledgement response from the avatar (e.g. “Oh I love this! You look so well!”)."),
      spacer(),
      h2("6.6 Contextual Memory (Privacy-Dependent)"),
      body("Subject to the child’s privacy selections during setup, the AI may retain contextual information to personalise conversations:"),
      bullet("Parent’s name, preferred nickname."),
      bullet("Key dates (birthdays, anniversaries, medical appointments)."),
      bullet("Hobbies and interests."),
      bullet("Recent health events or concerns raised in conversation."),
      bullet("All retained context is stored encrypted server-side and governed by the Privacy Policy."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 7. CHILD EXPERIENCE ──────────────────────────────────────────────
      h1("7. Child-End Experience"),
      h2("7.1 Child Dashboard"),
      body("The child’s main screen is a data dashboard presenting wellbeing information received from the parent’s check-ins. It is designed to be scannable and reassuring at a glance."),
      spacer(),
      h3("Summary Cards (Top Section)"),
      bullet("Latest Check-In Summary: a short AI-generated paragraph summarising the most recent conversation (mood, health, notable mentions)."),
      bullet("Overall Wellbeing Indicator: a simple visual rating (e.g. colour-coded from green to amber to red) based on sentiment analysis of the last check-in."),
      bullet("Last Active: timestamp of the parent’s last response."),
      bullet("Photos Shared: thumbnail strip of any photos sent by the parent today."),
      spacer(),
      h3("Trend Charts (Middle Section)"),
      bullet("Mood Over Time: a line chart plotting AI-assessed mood score across the last 7, 14, or 30 days (toggle)."),
      bullet("Health Mentions: a bar chart showing frequency of health-related topics mentioned (sleep, pain, appetite, medication)."),
      bullet("Check-In Engagement: a chart showing how consistently the parent has responded to check-ins over time."),
      bullet("All charts are interactive (tap to see specific day detail)."),
      spacer(),
      h3("Recent Summaries Feed (Bottom Section)"),
      bullet("A scrollable list of past AI-generated summaries, newest first."),
      bullet("Each entry shows date, a one-line headline, and a colour indicator."),
      bullet("Tapping an entry expands the full summary."),
      spacer(),
      h2("7.2 Summary Notifications"),
      bullet("Push notification sent to child device when a new summary is available."),
      bullet("Notification copy example: “Mum just finished her morning check-in — here’s how she’s doing.”"),
      bullet("Frequency and timing fully customisable in Settings (set during onboarding, editable anytime)."),
      spacer(),
      h2("7.3 Conversation Visibility (Open Decision)"),
      body("Whether the child can view the full conversation transcript between the AI and the parent is a key product decision with significant privacy implications. Three options are presented for stakeholder resolution:"),
      twoColTable([
        ["Full Transcript Access", "Child can view the complete conversation history. Maximum transparency. Potential concern: parent may self-censor if they know messages are read verbatim."],
        ["Summaries Only", "Child receives only AI-generated summaries. Parent has full conversational privacy. Reduces information richness."],
        ["Summary + Key Quotes", "Child receives summaries with select notable quotes highlighted by AI. Balance of privacy and depth. Requires AI to identify and extract meaningful moments."],
      ], ["Option", "Implications"]),
      body("Recommendation: default to Summaries Only in V1, with an optional upgrade to Summary + Key Quotes the parent can consent to in their Settings."),
      spacer(),
      h2("7.4 Child Settings"),
      bullet("Check-in frequency and time(s)."),
      bullet("Summary notification frequency and time(s)."),
      bullet("Conversation visibility preference (subject to parent consent)."),
      bullet("Parent contextual memory toggles (what information the AI can retain)."),
      bullet("Avatar management."),
      bullet("Account and subscription management."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 8. AI SYSTEM DESIGN ──────────────────────────────────────────────
      h1("8. AI System Design"),
      h2("8.1 Companion Bot System Prompt Design"),
      body("The AI companion operates under a structured system prompt that must be crafted and iterated carefully. Core elements:"),
      spacer(),
      twoColTable([
        ["Persona Instruction", "You are [Child Name]’s AI companion, checking in on [Parent Name] on their behalf. You are warm, caring, and familiar. You speak naturally and conversationally."],
        ["Goal Instruction", "Your goal is to have a genuine, pleasant conversation while gently gathering information about [Parent Name]’s physical health, mood, and daily activities."],
        ["Boundaries Instruction", "You are not a medical professional. Never suggest diagnoses. Never ask alarming or leading health questions. Always remain warm and positive."],
        ["Memory Instruction", "Use the context below to personalise your conversation. Reference recent events, interests, and any follow-ups from previous check-ins."],
        ["Escalation Instruction", "If the parent expresses distress, confusion, or mentions a medical emergency, gently encourage them to contact a family member or emergency services, and flag this in the summary."],
      ], ["Component", "Content"]),
      spacer(),
      h2("8.2 Wellbeing Sentiment Analysis"),
      bullet("At the end of each conversation, the AI generates a structured JSON summary including: overall mood score (1–5), health flags (any mentions of pain, illness, medication issues), activity level, social engagement, and a freeform summary paragraph."),
      bullet("This structured output is stored in the database and used to populate the child dashboard charts and summary cards."),
      bullet("Sentiment analysis uses a combination of the LLM’s inherent understanding and a post-processing scoring rubric to ensure consistency."),
      spacer(),
      h2("8.3 Escalation & Safety Logic"),
      bullet("If the AI detects language suggesting significant distress, confusion, disorientation, or a medical emergency, it must: pause the regular conversation flow, gently reassure the parent, advise them to call emergency services or a family member, and flag the conversation with a high-priority alert to the child."),
      bullet("High-priority alerts trigger an immediate push notification to the child regardless of notification schedule."),
      bullet("The app does not provide medical advice and this is clearly stated in the safety disclaimer and in-app messaging."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 9. NOTIFICATIONS ─────────────────────────────────────────────────
      h1("9. Notification System"),
      twoColTable([
        ["Parent Check-In Prompt", "Scheduled by child. Sent to parent device. Wording varies to feel natural. Tapping opens chat."],
        ["Child Wellbeing Summary", "Sent after each completed check-in OR on a schedule set by child. Includes headline and wellbeing indicator."],
        ["High-Priority Escalation Alert", "Triggered immediately if AI detects distress. Sent to child regardless of schedule. Marked as urgent."],
        ["Photo Received", "Sent to child when parent shares a photo. Includes thumbnail preview."],
        ["Parent Inactive Alert", "Optional. Sent to child if parent has not responded to N consecutive check-ins (configurable threshold)."],
        ["Trial Expiry Reminder", "Sent 2 days before free trial ends. Links to subscription management."],
        ["Subscription Renewal", "Standard Apple billing notifications via App Store. No custom handling required."],
      ], ["Notification Type", "Trigger & Behaviour"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 10. SUBSCRIPTION & PRICING ───────────────────────────────────────
      h1("10. Subscription & Pricing"),
      twoColTable([
        ["Monthly Price", "$5.99 USD / month"],
        ["Free Trial", "7 days — no charge, full access, auto-converts to paid unless cancelled"],
        ["Trial Start", "Triggered at account creation, prior to role selection"],
        ["Payment Provider", "Apple in-app purchase (IAP) via RevenueCat SDK"],
        ["Access Scope", "One subscription covers both parent-end and child-end on the same account"],
        ["Cancellation", "User cancels via Apple Subscription Settings. App access continues until end of billing period."],
        ["Grace Period", "Apple handles billing failures. App should degrade gracefully (read-only access) during grace period."],
        ["Future Tiers", "Consider a Family Plan (V2) covering multiple parent accounts per child subscription."],
      ], ["Parameter", "Detail"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 11. SECURITY & DATA ──────────────────────────────────────────────
      h1("11. Security, Privacy & Data Requirements"),
      h2("11.1 Data Storage & Encryption"),
      bullet("All data in transit: TLS 1.3 minimum."),
      bullet("All data at rest: AES-256 encryption."),
      bullet("Conversation transcripts stored encrypted with per-user keys."),
      bullet("Voice recordings stored encrypted in S3-compatible storage, deleted after transcription unless user has opted to retain them."),
      bullet("Photos stored encrypted; retained only for the duration the user’s account is active plus 30-day deletion window post-cancellation."),
      spacer(),
      h2("11.2 Authentication & Access"),
      bullet("Email/password authentication with bcrypt hashing (min. 12 rounds) or managed auth provider (Supabase/Firebase)."),
      bullet("JWT access tokens (short-lived, 15 minutes) with refresh tokens (7 days)."),
      bullet("Rate limiting on authentication endpoints to prevent brute-force attacks."),
      bullet("No biometric authentication required for V1 (may be added as accessibility enhancement)."),
      spacer(),
      h2("11.3 Data Minimisation"),
      bullet("Only collect data necessary for the stated purpose."),
      bullet("Parent original photos not retained permanently unless explicit consent granted."),
      bullet("Contextual memory features are opt-in and clearly described to users."),
      bullet("Users may request full data deletion at any time (GDPR Article 17 / CCPA compliance)."),
      spacer(),
      h2("11.4 Compliance"),
      twoColTable([
        ["Apple App Store", "Full compliance with App Store Review Guidelines. AI disclosure, privacy nutrition labels, and data usage descriptions required."],
        ["GDPR (EU)", "Right to access, rectification, erasure, and portability. Lawful basis: legitimate interest + consent. DPA to be reviewed for EU launch."],
        ["CCPA (California)", "Right to know, delete, and opt-out of sale. Privacy Policy must include CCPA disclosures."],
        ["COPPA", "App is designed for users 18+. Age gate on sign-up required. No data collection from under-18s."],
        ["HIPAA (US)", "App does not store, process or transmit protected health information (PHI). Medical disclaimer clearly states the app is not a medical device or service. If AI provider requires HIPAA BAA, this must be evaluated."],
      ], ["Regulation", "Requirement"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 12. DISCLAIMERS & T&Cs ───────────────────────────────────────────
      h1("12. Disclaimers, Terms & Conditions"),
      h2("12.1 AI Disclaimer (App Store Requirement)"),
      body("The following disclosure must appear during onboarding (before first use), in the app’s App Store listing, and in the Terms & Conditions:"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            borders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: BRAND_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({ spacing: { before: 60, after: 80 }, children: [new TextRun({ text: "AI Disclosure", font: "Arial", size: 22, bold: true, color: BRAND_BLUE })] }),
              new Paragraph({ spacing: { before: 40, after: 60 }, children: [new TextRun({ text: "Twice a Child uses artificial intelligence (AI) to generate conversation responses. The AI companion is not a real person. Messages you receive are generated by an AI model and do not reflect the real-time thoughts, words, or actions of your family member. AI-generated content may occasionally be inaccurate or unexpected. By using this app, you acknowledge and accept that you are interacting with an AI system.", font: "Arial", size: 20, color: DARK })] })
            ]
          })]
        })]
      }),
      spacer(),
      h2("12.2 Medical & Safety Disclaimer"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({
          children: [new TableCell({
            borders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "FEF9C3", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({ spacing: { before: 60, after: 80 }, children: [new TextRun({ text: "Medical & Safety Disclaimer", font: "Arial", size: 22, bold: true, color: "92400E" })] }),
              new Paragraph({ spacing: { before: 40, after: 60 }, children: [new TextRun({ text: "Twice a Child is a communication and companionship tool only. It is not a medical device, does not provide medical advice, and is not a substitute for professional medical care. Information shared through the app should not be used to diagnose, treat, or manage any health condition. In the event of a medical emergency, contact emergency services immediately. The app and its creators accept no liability for any health outcomes arising from use of the app.", font: "Arial", size: 20, color: "78350F" })] })
            ]
          })]
        })]
      }),
      spacer(),
      h2("12.3 Terms & Conditions — Key Provisions"),
      body("The full Terms & Conditions document should be drafted by legal counsel. Key provisions to include:"),
      bullet("Subscription terms, auto-renewal, and cancellation policy."),
      bullet("AI disclaimer and limitations of AI-generated content."),
      bullet("Medical and safety disclaimer."),
      bullet("Data collection, storage, and deletion policy (linking to Privacy Policy)."),
      bullet("Acceptable use policy (no use by minors, no use for medical purposes)."),
      bullet("Limitation of liability and indemnification."),
      bullet("Governing law and dispute resolution."),
      bullet("Right to modify terms with notice."),
      spacer(),
      h2("12.4 Privacy Policy — Key Provisions"),
      bullet("What data is collected (account info, conversation content, photos, voice, usage analytics)."),
      bullet("How data is used (service delivery, AI processing, summary generation, analytics)."),
      bullet("Third-party data sharing (AI API provider, storage provider, analytics). Named providers must be listed."),
      bullet("User rights (access, correction, deletion, portability)."),
      bullet("Data retention periods."),
      bullet("Cookie and tracking policy."),
      bullet("Contact information for data requests."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 13. SCREEN INVENTORY ─────────────────────────────────────────────
      h1("13. Screen Inventory"),
      h2("13.1 Shared Screens"),
      twoColTable([
        ["Welcome / Sign In", "Email + password login, link to sign up"],
        ["Sign Up", "Email, password, confirm password, T&C acceptance, AI + Medical disclaimer acceptance"],
        ["Subscription / Trial Selection", "Free trial CTA vs. immediate subscribe. Apple IAP sheet triggered."],
        ["Device Role Selection", "Parent or Child selection. Full-screen, large buttons, minimal copy."],
        ["Avatar Setup", "Photo upload or avatar library picker. Preview of generated avatar."],
      ], ["Screen", "Purpose"]),
      spacer(),
      h2("13.2 Parent-End Screens"),
      twoColTable([
        ["Chat Screen (Landing)", "Main experience. Avatar display, chat feed, text/voice input, photo icon."],
        ["Parent Settings", "Avatar, notification preferences (view-only, set by child), account info, sign out."],
      ], ["Screen", "Purpose"]),
      spacer(),
      h2("13.3 Child-End Screens"),
      twoColTable([
        ["Child Dashboard (Landing)", "Summary cards, trend charts, recent summaries feed, photo strip."],
        ["Summary Detail", "Full AI-generated summary for a specific check-in date."],
        ["Child Settings", "Check-in frequency, summary notifications, conversation visibility, memory toggles, avatar, account, subscription."],
        ["Notification Preferences", "Granular time and frequency controls for all notification types."],
      ], ["Screen", "Purpose"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 14. OPEN DECISIONS ───────────────────────────────────────────────
      h1("14. Open Decisions & Future Considerations"),
      h2("14.1 Decisions Requiring Stakeholder Resolution"),
      twoColTable([
        ["AI Provider Selection", "Evaluate Claude (Anthropic) vs. GPT-4o (OpenAI) based on cost, latency, and safety controls. Recommend pilot test with both."],
        ["Avatar Generation Approach", "Static illustrated avatar (lower cost, V1 recommendation) vs. animated talking avatar (D-ID/HeyGen, V2)."],
        ["Conversation Visibility", "Full transcript, summaries only, or summary + key quotes. Privacy implications for each. Recommend summaries-only default."],
        ["Voice Response from Avatar", "Should the AI respond with text-to-speech in the child’s voice? Requires voice cloning (ElevenLabs or similar). High emotional impact but significant ethical and technical complexity. Recommend V2."],
        ["Multi-Parent Support", "Can one child account monitor multiple parents? (e.g. two parents living separately.) Consider for Family Plan in V2."],
        ["HIPAA Compliance", "Determine whether AI API usage requires a HIPAA Business Associate Agreement. Consult legal counsel before US launch."],
      ], ["Decision", "Context & Recommendation"]),
      spacer(),
      h2("14.2 V2 Feature Candidates"),
      bullet("Animated/talking avatar with voice cloning."),
      bullet("Family Plan: multiple parent accounts per child subscription."),
      bullet("Carer/healthcare provider read-only access tier."),
      bullet("Weekly wellbeing report PDF export for sharing with doctors."),
      bullet("Android platform support."),
      bullet("Multilingual support (Spanish, French, Mandarin, Hindi as priority languages)."),
      bullet("Emergency contact integration (auto-dial/text a secondary family member if escalation detected)."),
      bullet("Integration with wearable health data (Apple Health, with explicit user consent)."),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 15. LAUNCH CHECKLIST ─────────────────────────────────────────────
      h1("15. App Store Launch Checklist"),
      twoColTable([
        ["AI Disclosure", "AI disclaimer visible during onboarding and in App Store listing."],
        ["Privacy Nutrition Label", "Accurate App Store privacy nutrition label completed (data types, uses, linked/not linked to identity)."],
        ["Terms & Conditions", "Reviewed by legal counsel. Accessible in-app and on website."],
        ["Privacy Policy", "Published at a public URL. Linked in-app and in App Store listing."],
        ["Age Rating", "App rated 4+ with age gate at sign-up (18+)."],
        ["Medical Disclaimer", "Visible during onboarding and in Settings."],
        ["Subscription Disclosure", "Price, billing period, trial terms, and cancellation instructions disclosed before purchase."],
        ["IAP Implementation", "RevenueCat SDK integrated and tested in Sandbox environment."],
        ["Push Notification Permission", "Permission requested with clear explanation of what notifications will be sent."],
        ["Accessibility", "VoiceOver support tested. Minimum 44pt touch targets. Dynamic Type supported."],
        ["App Review Guidelines", "Full review against Apple App Store Review Guidelines 2.5 (Software Requirements), 3.1 (Payments), 5.1 (Privacy)."],
        ["TestFlight Beta", "Minimum 2-week TestFlight period with target users from both personas before submission."],
      ], ["Item", "Requirement"]),
      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 16. GLOSSARY ─────────────────────────────────────────────────────
      h1("16. Glossary"),
      twoColTable([
        ["AI Companion", "The AI-powered chatbot that interacts with the parent, styled as the adult child."],
        ["Avatar", "An illustrated or AI-generated visual representation of the parent or child, used within the app."],
        ["Check-In", "A scheduled AI-initiated conversation with the parent to gather wellbeing data."],
        ["Child-End", "The app experience on the adult child’s device."],
        ["Parent-End", "The app experience on the elderly parent’s device."],
        ["Summary", "An AI-generated structured report of a check-in, delivered to the child’s dashboard."],
        ["Sentiment Analysis", "AI-based assessment of the emotional tone and health indicators within a conversation."],
        ["RevenueCat", "Third-party SDK managing in-app subscription logic across Apple platforms."],
        ["Expo", "React Native framework used to build and deploy the iOS app."],
        ["APNs", "Apple Push Notification Service — the infrastructure used to deliver push notifications on iOS."],
      ], ["Term", "Definition"]),
      spacer(),
      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: "— End of Document —", font: "Arial", size: 20, italics: true, color: GRAY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "Twice a Child PRD v1.0  |  Confidential", font: "Arial", size: 18, color: GRAY })]
      }),
    ]
  }]
});

const outPath = process.env.PRD_OUTPUT || "Twice_a_Child_PRD.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("PRD written successfully to " + outPath);
});
