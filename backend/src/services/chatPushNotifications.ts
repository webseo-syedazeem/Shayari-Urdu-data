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
const REALTIME_RECOVERY_GRACE_MS = 45_000;
const REALTIME_CLOSED_REBUILD_DELAY_MS = 1_000;
const MAX_PROCESSED_MESSAGE_IDS = 10_000;
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
let channelRebuildTimer: NodeJS.Timeout | null = null;
let channelOperation: Promise<void> | null = null;
let receiptTimer: NodeJS.Timeout | null = null;
let channelGeneration = 0;
let receiptCheckRunning = false;
let started = false;
let stopping = false;
const processedMessageIds = new Set<string>();

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

function tokenPreview(token: string): string {
  if (token.length <= 18) return token;
  return `${token.slice(0, 14)}...${token.slice(-6)}`;
}

function rememberMessageId(messageId: string): boolean {
  if (processedMessageIds.has(messageId)) return false;

  processedMessageIds.add(messageId);
  if (processedMessageIds.size > MAX_PROCESSED_MESSAGE_IDS) {
    const oldestMessageId = processedMessageIds.values().next().value;
    if (oldestMessageId) processedMessageIds.delete(oldestMessageId);
  }
  return true;
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

  const uniqueTokens = [...new Set(tokens)];
  const invalidTokens = uniqueTokens.filter((token) => !EXPO_TOKEN_PATTERN.test(token));
  if (invalidTokens.length > 0) {
    console.warn('[chat-push] Ignoring malformed Expo push tokens', {
      count: invalidTokens.length,
      tokens: invalidTokens.map(tokenPreview)
    });
  }

  const validTokens = uniqueTokens.filter((token) => EXPO_TOKEN_PATTERN.test(token));
  console.log('[chat-push] Recipient query complete', {
    sender,
    enabledUniqueTokens: uniqueTokens.length,
    validRecipientTokens: validTokens.length
  });
  return validTokens;
}

async function sendChatPushes(
  sender: string,
  message: string,
  messageId?: string
): Promise<{ recipients: number; sent: number; removed: number }> {
  const tokens = await loadRecipientTokens(sender);
  let sent = 0;
  let removed = 0;

  const tokenBatches = chunks(tokens, MAX_EXPO_BATCH_SIZE);
  for (const [batchIndex, tokenBatch] of tokenBatches.entries()) {
    try {
      const messages = tokenBatch.map((to) => ({
        to,
        title: sender,
        body: messagePreview(message),
        data: { url: '/chat', type: 'chat_message', messageId: messageId ?? null },
        sound: 'default',
        channelId: 'chat-messages',
        priority: 'high'
      }));
      console.log('[chat-push] Sending Expo push request', {
        messageId: messageId ?? null,
        batch: batchIndex + 1,
        batches: tokenBatches.length,
        payloadCount: messages.length
      });

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(EXPO_REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      });

      if (!response.ok) {
        console.error(
          `[chat-push] Expo send failed with ${response.status}: ${await response.text()}`
        );
        continue;
      }

      const result = await response.json() as { data?: ExpoTicket[] };
      console.log('[chat-push] Expo send response', JSON.stringify(result));
      const tickets = Array.isArray(result.data) ? result.data : [];
      if (tickets.length !== tokenBatch.length) {
        console.warn('[chat-push] Expo ticket count did not match request payload count', {
          requested: tokenBatch.length,
          received: tickets.length
        });
      }
      const successfulTickets: PushTicketRow[] = [];
      const unregisteredTokens: string[] = [];

      tickets.forEach((ticket, index) => {
        const token = tokenBatch[index];
        if (!token) return;

        if (ticket.status === 'ok' && ticket.id) {
          successfulTickets.push({ ticket_id: ticket.id, expo_push_token: token });
          sent += 1;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn('[chat-push] Expo reports an unregistered/expired device token', {
            token: tokenPreview(token),
            ticket
          });
          unregisteredTokens.push(token);
        } else {
          console.error('[chat-push] Expo ticket error', {
            token: tokenPreview(token),
            ticket
          });
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
  console.log('[chat-push] Expo receipts response', JSON.stringify(result));
  const tokenByTicket = new Map(
    pending.map((ticket) => [ticket.ticket_id, ticket.expo_push_token])
  );
  const completedTicketIds: string[] = [];
  const unregisteredTokens: string[] = [];

  for (const [ticketId, receipt] of Object.entries(result.data ?? {})) {
    completedTicketIds.push(ticketId);
    if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
      const token = tokenByTicket.get(ticketId);
      if (token) {
        console.warn('[chat-push] Expo receipt reports an unregistered/expired device token', {
          ticketId,
          token: tokenPreview(token),
          receipt
        });
        unregisteredTokens.push(token);
      }
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

  console.log('[chat-push] chat_messages INSERT received', {
    messageId: messageId ?? null,
    sender: sender || null,
    messageLength: message.length
  });

  if (!sender || !message) {
    console.warn('[chat-push] Ignoring chat INSERT without a sender or message body');
    return;
  }

  if (messageId && !rememberMessageId(messageId)) {
    console.warn('[chat-push] Duplicate chat INSERT ignored', { messageId });
    return;
  }

  try {
    const result = await sendChatPushes(sender, message, messageId);
    console.log(
      `[chat-push] Message ${messageId ?? 'unknown'}: recipients=${result.recipients} sent=${result.sent} removed=${result.removed}`
    );
  } catch (error) {
    // If processing failed before a definitive result, permit a later duplicate
    // event to retry instead of permanently losing the notification.
    if (messageId) processedMessageIds.delete(messageId);
    throw error;
  }
}

function clearChannelRebuildTimer(): void {
  if (!channelRebuildTimer) return;
  clearTimeout(channelRebuildTimer);
  channelRebuildTimer = null;
}

async function removeRealtimeChannel(
  targetChannel: RealtimeChannel,
  reason: string
): Promise<void> {
  if (channel === targetChannel) channel = null;

  let result = await supabase.removeChannel(targetChannel);
  if (result === 'error') {
    // removeChannel delegates to unsubscribe. If the server rejects the leave,
    // force local timer/binding teardown, then retry while disconnected so the
    // client also removes the channel from its internal channel collection.
    targetChannel.teardown();
    result = await supabase.removeChannel(targetChannel);
  }

  console.log('[chat-push] Realtime channel removed', {
    reason,
    result,
    activeChannels: supabase.getChannels().length
  });
}

function scheduleChannelRebuild(reason: string, delay: number): void {
  if (stopping) return;
  if (channelRebuildTimer) {
    console.log('[chat-push] Realtime channel rebuild already scheduled', { reason });
    return;
  }

  console.warn(`[chat-push] Realtime ${reason}; channel rebuild watchdog in ${delay}ms`);
  channelRebuildTimer = setTimeout(() => {
    channelRebuildTimer = null;
    void replaceRealtimeChannel(`watchdog after ${reason}`).catch((error) => {
      console.error('[chat-push] Realtime channel rebuild failed', error);
      scheduleChannelRebuild('rebuild failed', REALTIME_RECOVERY_GRACE_MS);
    });
  }, delay);
  channelRebuildTimer.unref();
}

async function replaceRealtimeChannel(reason: string): Promise<void> {
  if (stopping) return;
  if (channelOperation) {
    console.log('[chat-push] Realtime channel operation already in progress', { reason });
    await channelOperation;
    return;
  }

  const operation = (async () => {
    clearChannelRebuildTimer();

    const previousChannel = channel;
    if (previousChannel) {
      await removeRealtimeChannel(previousChannel, `replace: ${reason}`);
    }
    if (stopping) return;

    const generation = channelGeneration + 1;
    channelGeneration = generation;
    const nextChannel = supabase
      .channel('backend_chat_push')
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
    console.log('[chat-push] Realtime channel created', {
      generation,
      reason,
      activeChannels: supabase.getChannels().length
    });

    nextChannel.subscribe((status, error) => {
      if (
        stopping
        || channel !== nextChannel
        || channelGeneration !== generation
      ) {
        return;
      }

      console.log('[chat-push] Realtime subscription status', {
        generation,
        status,
        error: error ?? null
      });

      if (status === 'SUBSCRIBED') {
        clearChannelRebuildTimer();
        console.log('[chat-push] Listening for chat_messages INSERT events', {
          generation,
          activeChannels: supabase.getChannels().length
        });
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // RealtimeChannel already schedules a rejoin for these transient states.
        // Give that built-in recovery a chance instead of racing it by creating
        // a new channel. The watchdog replaces it only if it never resubscribes.
        scheduleChannelRebuild(status.toLowerCase(), REALTIME_RECOVERY_GRACE_MS);
      } else if (status === 'CLOSED') {
        scheduleChannelRebuild(status.toLowerCase(), REALTIME_CLOSED_REBUILD_DELAY_MS);
      }
    });
  })();

  channelOperation = operation;
  try {
    await operation;
  } finally {
    if (channelOperation === operation) channelOperation = null;
  }
}

async function stopChatPushNotifications(): Promise<void> {
  if (!started) return;
  stopping = true;
  started = false;
  clearChannelRebuildTimer();

  if (receiptTimer) {
    clearInterval(receiptTimer);
    receiptTimer = null;
  }

  if (channelOperation) {
    await channelOperation.catch((error) => {
      console.error('[chat-push] Realtime operation failed during shutdown', error);
    });
  }

  const activeChannel = channel;
  if (activeChannel) await removeRealtimeChannel(activeChannel, 'worker shutdown');
  processedMessageIds.clear();
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

  void replaceRealtimeChannel('worker start').catch((error) => {
    console.error('[chat-push] Initial Realtime connection failed', error);
    scheduleChannelRebuild('initial connect failed', REALTIME_RECOVERY_GRACE_MS);
  });

  void runReceiptCheck();
  receiptTimer = setInterval(() => void runReceiptCheck(), RECEIPT_CHECK_INTERVAL_MS);
  receiptTimer.unref();

  return stopChatPushNotifications;
}
