// Minimal Expo Push API client. Sends notifications to Expo push tokens.
// https://docs.expo.dev/push-notifications/sending-notifications/

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Send a batch of push messages. Best-effort: logs and swallows failures. */
export async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn('Expo push failed', res.status, await res.text());
    }
  } catch (e) {
    console.warn('Expo push error', e);
  }
}
