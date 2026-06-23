// Pin to a specific version once verified locally with `supabase functions serve`.
import Anthropic from 'npm:@anthropic-ai/sdk';

// Model choices per PRD §8.1.
const COMPANION_MODEL = 'claude-sonnet-4-6'; // warm, multi-turn companion chat
const ANALYSIS_MODEL = 'claude-haiku-4-5'; // fast, cheap summary + classification

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });

export type Sender = 'parent' | 'companion';
export interface ChatTurn {
  sender: Sender;
  content: string;
}

export interface CompanionContext {
  /** The child's display name, used to ground the companion persona. */
  childName?: string;
  /** The parent's display name. */
  parentName?: string;
  /** Privacy-gated personalization notes (interests, routines). */
  personalNotes?: string;
}

function companionSystemPrompt(ctx: CompanionContext): string {
  const child = ctx.childName ?? 'your child';
  const parent = ctx.parentName ? `, ${ctx.parentName}` : '';
  return [
    `You are a warm, caring AI companion in the "Twice a Child" app, speaking on behalf of ${child} to their parent${parent}.`,
    'Talk the way a loving adult child checks in on a parent: friendly, unhurried, genuinely interested.',
    'Naturally weave in gentle wellbeing questions (sleep, meals, energy, mood, pain, plans, who they have seen) without making it feel like an interview.',
    'Keep replies short and easy to read aloud — one or two sentences is usually enough.',
    'Never give medical, legal, or financial advice. If something sounds urgent or like an emergency, kindly encourage them to contact family or local emergency services.',
    'Do not invent facts about the family. If you are unsure, ask.',
    ctx.personalNotes ? `Helpful context about them: ${ctx.personalNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Generate the companion's next reply. Thinking off for low latency. */
export async function companionReply(
  history: ChatTurn[],
  ctx: CompanionContext,
): Promise<string> {
  const messages = history.map((t) => ({
    role: t.sender === 'parent' ? ('user' as const) : ('assistant' as const),
    content: t.content,
  }));

  const res = await client.messages.create({
    model: COMPANION_MODEL,
    max_tokens: 400,
    thinking: { type: 'disabled' },
    system: companionSystemPrompt(ctx),
    messages,
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

export interface ConcernResult {
  concern_level: 'none' | 'low' | 'medium' | 'high';
  category: 'none' | 'distress' | 'health' | 'fall' | 'self_harm' | 'confusion' | 'other';
  rationale: string;
}

const CONCERN_SCHEMA = {
  type: 'object',
  properties: {
    concern_level: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
    category: {
      type: 'string',
      enum: ['none', 'distress', 'health', 'fall', 'self_harm', 'confusion', 'other'],
    },
    rationale: { type: 'string' },
  },
  required: ['concern_level', 'category', 'rationale'],
  additionalProperties: false,
} as const;

/** Classify a single parent message for urgent-concern signals (PRD §8.3). */
export async function classifyConcern(parentMessage: string): Promise<ConcernResult> {
  const res = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 300,
    system:
      'You triage a single message from an elderly person for wellbeing concern. ' +
      'Be conservative — err toward surfacing. "high" means a possible crisis (a fall, ' +
      'acute distress, self-harm language, sudden confusion, or an apparent medical emergency). ' +
      'This is not a medical diagnosis.',
    output_config: { format: { type: 'json_schema', schema: CONCERN_SCHEMA } },
    messages: [{ role: 'user', content: parentMessage }],
  });

  return parseJson<ConcernResult>(res);
}

export interface WellbeingSummary {
  summary_text: string;
  mood: string;
  energy: string;
  sleep: string;
  appetite: string;
  pain: string;
  social_contact: string;
  cognitive_flags: string[];
  highlights: string[];
  concern_level: 'none' | 'low' | 'medium' | 'high';
}

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    summary_text: { type: 'string' },
    mood: { type: 'string' },
    energy: { type: 'string' },
    sleep: { type: 'string' },
    appetite: { type: 'string' },
    pain: { type: 'string' },
    social_contact: { type: 'string' },
    cognitive_flags: { type: 'array', items: { type: 'string' } },
    highlights: { type: 'array', items: { type: 'string' } },
    concern_level: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
  },
  required: [
    'summary_text',
    'mood',
    'energy',
    'sleep',
    'appetite',
    'pain',
    'social_contact',
    'cognitive_flags',
    'highlights',
    'concern_level',
  ],
  additionalProperties: false,
} as const;

/** Produce a short wellbeing summary for the child from a conversation (PRD §8.3). */
export async function summarizeConversation(history: ChatTurn[]): Promise<WellbeingSummary> {
  const transcript = history
    .map((t) => `${t.sender === 'parent' ? 'Parent' : 'Companion'}: ${t.content}`)
    .join('\n');

  const res = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 800,
    system:
      'Summarize this check-in conversation for the adult child. Capture mood, energy, sleep, ' +
      'appetite, pain, social contact, anything notable they mentioned (highlights), and any ' +
      'cognitive concerns. Use short phrases; write "unknown" if not discussed. ' +
      'summary_text is 1–3 warm, factual sentences. This is not a medical assessment.',
    output_config: { format: { type: 'json_schema', schema: SUMMARY_SCHEMA } },
    messages: [{ role: 'user', content: transcript }],
  });

  return parseJson<WellbeingSummary>(res);
}

function parseJson<T>(res: Anthropic.Message): T {
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return JSON.parse(text) as T;
}
