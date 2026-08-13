import { supabase } from './config.js';
import { log } from './log.js';
import { chunkTokens, buildMessages } from './push-utils.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

type ExpoPushTicket = { status: 'ok'; id: string } | { status: 'error'; message: string; details?: { error?: string } };

export async function sendPushNotifications(hindiTitle: string): Promise<void> {
  try {
    const { data: rows, error } = await supabase.from('device_tokens').select('expo_push_token');
    if (error) { log('push.fetch_tokens_failed', { error: error.message }); return; }
    if (!rows || rows.length === 0) { log('push.no_tokens'); return; }

    const tokens = rows.map((row) => row.expo_push_token as string);
    const batches = chunkTokens(tokens, BATCH_SIZE);
    log('push.sending', { token_count: tokens.length, batch_count: batches.length });

    for (const batch of batches) {
      const messages = buildMessages(batch, 'Lapaas Hindi News', hindiTitle);
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });
        if (!response.ok) { log('push.api_error', { status: response.status }); continue; }

        const result = await response.json() as { data: ExpoPushTicket[] };
        const invalidTokens: string[] = [];
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(batch[i]);
          }
        }
        if (invalidTokens.length > 0) {
          const { error: deleteError } = await supabase.from('device_tokens').delete().in('expo_push_token', invalidTokens);
          if (deleteError) log('push.cleanup_failed', { error: deleteError.message });
          else log('push.cleaned_invalid_tokens', { count: invalidTokens.length });
        }
      } catch (batchError) {
        log('push.batch_failed', { error: batchError instanceof Error ? batchError.message : String(batchError) });
      }
    }
    log('push.completed');
  } catch (outerError) {
    log('push.failed', { error: outerError instanceof Error ? outerError.message : String(outerError) });
  }
}
