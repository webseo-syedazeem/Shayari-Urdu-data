import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id?: string;
  username: string;
  message: string;
  room?: string;
  created_at?: string;
  time?: string;
  isHistory?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (username: string, message: string) => Promise<void>;
  onlineCount: number;
  isConnected: boolean;
}

export function useChat(username?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);

  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch history + subscribe to realtime inserts
  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, username, message, room, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!cancelled && data) {
        const history: ChatMessage[] = data.reverse().map((row) => ({ ...row, isHistory: true }));
        setMessages(history);
      }
    }

    fetchHistory();

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (newMsg.id && prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, isHistory: false }];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsConnected(false);
      });

    realtimeChannelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
      realtimeChannelRef.current = null;
    };
  }, []);

  // Presence: track online users
  useEffect(() => {
    const presenceChannel = supabase.channel('online_users');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(presenceChannel.presenceState()).length;
        setOnlineCount(count || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            username: username || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      presenceChannel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, []);

  // Re-track presence when username changes
  useEffect(() => {
    if (username && presenceChannelRef.current) {
      presenceChannelRef.current.track({
        username,
        online_at: new Date().toISOString(),
      });
    }
  }, [username]);

  const sendMessage = async (msgUsername: string, message: string) => {
    await supabase
      .from('chat_messages')
      .insert({ username: msgUsername, message, room: 'general' });
  };

  return { messages, sendMessage, onlineCount, isConnected };
}
