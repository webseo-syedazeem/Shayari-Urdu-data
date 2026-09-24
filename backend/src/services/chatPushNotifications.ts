import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '../config/database';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const MAX_EXPO_BATCH_SIZE = 100;
const MAX_RECEIPTS_PER_REQUEST = 1_000;
const RECEIPT_CHECK_INTERVAL_MS = 15 * 60_000;
const RECEIPT_DELAY_MS = 15 * 60_000;
const MAX_RECEIPT_AGE_MS = 24 * 60 * 60_000;
const MESSAGE_PREVIEW_LENGTH = 120;
const MAX_RECONNECT_DELAY_MS = 60_000;
const EXPO_REQUEST_TIMEOUT_MS = 15_000;
const EXPO_TOKEN_PATTERN = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

type ChatMessageRecord = {
  id?: unknown;
  username?: unknown;
  message?: unknown;
  user_name?: unknown;
  message_text?: unknown;
};

type PushTokenRow = {
  expo_push_token: string;
};

type PushTicketRow = PushTokenRow & {
  ticket_id: string;
};

type ExpoTicket = {
  status?: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoReceipt = {
  status?: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

type StopChatPushNotifications = () => Promise<void>;

let channel: RealtimeChannel | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let receiptTimer: NodeJS.Timeout | null = null;
let reconnectAttempt = 0;
let receiptCheckRunning = false;
let started = false;
let stopping = false;

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function messagePreview(message: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MESSAGE_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, MESSAGE_PREVIEW_LENGTH - 1).trimEnd()}\u2026`;
}

async function removeTokens(tokens: string[]): Promise<number> {
  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length === 0) return 0;

  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .in('expo_push_token', uniqueTokens);

  if (error) throw error;
  return uniqueTokens.length;
}

async function loadRecipientTokens(sender: string): Promise<string[]> {
  const tokens: string[] = [];
  const pageSize = 1_000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('push_enabled', true)
      .neq('chat_username', sender)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as PushTokenRow[];
    tokens.push(...page.map((row) => row.expo_push_token));
    if (page.length < pageSize) break;
  }

  return [...new Set(tokens)].filter((token) => EXPO_TOKEN_PATTERN.test(token));
}

async function sendChatPushes(
  sender: string,
  message: string,
  messageId?: string
): Promise<{ recipients: number; sent: number; removed: number }> {
  const tokens = await loadRecipientTokens(sender);
  let sent = 0;
  let removed = 0;

  for (const tokenBatch of chunks(tokens, MAX_EXPO_BATCH_SIZE)) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(EXPO_REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenBatch.map((to) => ({
          to,
          title: sender,
          body: messagePreview(message),
          data: { url: '/chat', type: 'chat_message', messageId: messageId ?? null },
          sound: 'default',
          channelId: 'chat-messages',
          priority: 'high'
        })))
      });

      if (!response.ok) {
        console.error(
          `[chat-push] Expo send failed with ${response.status}: ${await response.text()}`
        );
        continue;
      }

      const result = await response.json() as { data?: ExpoTicket[] };
      const tickets = Array.isArray(result.data) ? result.data : [];
      const successfulTickets: PushTicketRow[] = [];
      const unregisteredTokens: string[] = [];

      tickets.forEach((ticket, index) => {
        const token = tokenBatch[index];
        if (!token) return;

        if (ticket.status === 'ok' && ticket.id) {
          successfulTickets.push({ ticket_id: ticket.id, expo_push_token: token });
          sent += 1;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          unregisteredTokens.push(token);
        } else {
          console.error('[chat-push] Expo ticket error', ticket);
        }
      });

      removed += await removeTokens(unregisteredTokens);
      if (successfulTickets.length > 0) {
        const { error } = await supabase
          .from('expo_push_tickets')
          .upsert(successfulTickets, { onConflict: 'ticket_id' });
        if (error) console.error('[chat-push] Could not store Expo ticket IDs', error);
      }
    } catch (error) {
      console.error('[chat-push] Expo batch failed; later batches will still run', error);
    }
  }

  return { recipients: tokens.length, sent, removed };
}

async function processPushReceipts(): Promise<{ checked: number; removed: number }> {
  const now = Date.now();
  const expiredCutoff = new Date(now - MAX_RECEIPT_AGE_MS).toISOString();
  const receiptCutoff = new Date(now - RECEIPT_DELAY_MS).toISOString();

  const { error: expiryError } = await supabase
    .from('expo_push_tickets')
    .delete()
    .lt('created_at', expiredCutoff);
  if (expiryError) throw expiryError;

  const { data, error } = await supabase
    .from('expo_push_tickets')
    .select('ticket_id, expo_push_token')
    .lte('created_at', receiptCutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_RECEIPTS_PER_REQUEST);

  if (error) throw error;
  const pending = (data ?? []) as PushTicketRow[];
  if (pending.length === 0) return { checked: 0, removed: 0 };

  const response = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(EXPO_REQUEST_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: pending.map((ticket) => ticket.ticket_id) })
  });

  if (!response.ok) {
    throw new Error(`Expo receipts failed with ${response.status}: ${await response.text()}`);
  }

  const result = await response.json() as { data?: Record<string, ExpoReceipt> };
  const tokenByTicket = new Map(
    pending.map((ticket) => [ticket.ticket_id, ticket.expo_push_token])
  );
  const completedTicketIds: string[] = [];
  const unregisteredTokens: string[] = [];

  for (const [ticketId, receipt] of Object.entries(result.data ?? {})) {
    completedTicketIds.push(ticketId);
    if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
      const token = tokenByTicket.get(ticketId);
      if (token) unregisteredTokens.push(token);
    } else if (receipt.status === 'error') {
      console.error('[chat-push] Expo receipt error', { ticketId, ...receipt });
    }
  }

  const removed = await removeTokens(unregisteredTokens);
  if (completedTicketIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('expo_push_tickets')
      .delete()
      .in('ticket_id', completedTicketIds);
    if (deleteError) throw deleteError;
  }

  return { checked: completedTicketIds.length, removed };
}

async function runReceiptCheck(): Promise<void> {
  if (receiptCheckRunning || stopping) return;
  receiptCheckRunning = true;
  try {
    const result = await processPushReceipts();
    if (result.checked > 0 || result.removed > 0) {
      console.log(
        `[chat-push] Receipt check complete: checked=${result.checked} removed=${result.removed}`
      );
    }
  } catch (error) {
    console.error('[chat-push] Receipt check failed; it will retry in 15 minutes', error);
  } finally {
    receiptCheckRunning = false;
  }
}

async function handleChatInsert(record: ChatMessageRecord): Promise<void> {
  const sender = String(record.username ?? record.user_name ?? '').trim();
  const message = String(record.message ?? record.message_text ?? '').trim();
  const messageId = typeof record.id === 'string' ? record.id : undefined;

  if (!sender || !message) {
    console.warn('[chat-push] Ignoring chat INSERT without a sender or message body');
    return;
  }

  const result = await sendChatPushes(sender, message, messageId);
  console.log(
    `[chat-push] Message ${messageId ?? 'unknown'}: recipients=${result.recipients} sent=${result.sent} removed=${result.removed}`
  );
}

function clearReconnectTimer(): void {
  if (!reconnectTimer) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function scheduleReconnect(reason: string, error?: Error): void {
  if (stopping || reconnectTimer) return;

  const delay = Math.min(1_000 * (2 ** reconnectAttempt), MAX_RECONNECT_DELAY_MS);
  reconnectAttempt += 1;
  console.warn(
    `[chat-push] Realtime ${reason}; reconnecting in ${delay}ms${error ? `: ${error.message}` : ''}`
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectRealtime().catch((connectError) => {
      console.error('[chat-push] Realtime reconnect failed', connectError);
      scheduleReconnect('connect failed');
    });
  }, delay);
  reconnectTimer.unref();
}

async function connectRealtime(): Promise<void> {
  if (stopping) return;

  const previousChannel = channel;
  channel = null;
  if (previousChannel) await supabase.removeChannel(previousChannel);
  if (stopping) return;

  const nextChannel = supabase
    .channel(`backend_chat_push_${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        void handleChatInsert(payload.new as ChatMessageRecord).catch((error) => {
          console.error('[chat-push] Failed to handle chat INSERT', error);
        });
      }
    );

  channel = nextChannel;
  nextChannel.subscribe((status, error) => {
    if (stopping || channel !== nextChannel) return;

    if (status === 'SUBSCRIBED') {
      clearReconnectTimer();
      reconnectAttempt = 0;
      console.log('[chat-push] Listening for chat_messages INSERT events');
      return;
    }

    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      scheduleReconnect(status.toLowerCase(), error);
    }
  });
}

async function stopChatPushNotifications(): Promise<void> {
  if (!started) return;
  stopping = true;
  started = false;
  clearReconnectTimer();

  if (receiptTimer) {
    clearInterval(receiptTimer);
    receiptTimer = null;
  }

  const activeChannel = channel;
  channel = null;
  if (activeChannel) await supabase.removeChannel(activeChannel);
  console.log('[chat-push] Worker stopped');
}

export function startChatPushNotifications(): StopChatPushNotifications {
  if (started) return stopChatPushNotifications;

  // PM2 sets NODE_APP_INSTANCE for cluster/fork workers. Only one process should
  // own this subscription, otherwise every worker would send duplicate pushes.
  const pm2Instance = process.env.NODE_APP_INSTANCE;
  if (pm2Instance && pm2Instance !== '0') {
    console.log(`[chat-push] Worker disabled in PM2 instance ${pm2Instance}`);
    return async () => undefined;
  }

  started = true;
  stopping = false;
  reconnectAttempt = 0;

  void connectRealtime().catch((error) => {
    console.error('[chat-push] Initial Realtime connection failed', error);
    scheduleReconnect('initial connect failed');
  });

  void runReceiptCheck();
  receiptTimer = setInterval(() => void runReceiptCheck(), RECEIPT_CHECK_INTERVAL_MS);
  receiptTimer.unref();

  return stopChatPushNotifications;
}
