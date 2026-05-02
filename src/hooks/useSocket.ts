import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export interface ChatMessage {
  id?: string;
  username: string;
  message: string;
  room?: string;
  created_at?: string;
  time?: string;
  /** true = loaded from 7-day history, false/undefined = live message */
  isHistory?: boolean;
}

export interface SendMessagePayload {
  username: string;
  message: string;
  time: string;
  room?: string;
}

/** Returns the canonical timestamp string for a message (prefer time, fallback created_at) */
function msgTime(m: ChatMessage): string {
  return m.time ?? m.created_at ?? '';
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  sendMessage: (username: string, message: string) => void;
}

export function useSocket(username?: string): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (username) {
        socket.emit('user_join', username);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Bulk history from server on first connect (last 7 days)
    socket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(
        history.map((m) => ({
          ...m,
          // normalise: always populate time so the rest of the app has one field to read
          time: m.time ?? m.created_at ?? new Date().toISOString(),
          isHistory: true,
        }))
      );
    });

    // Individual new messages broadcast by server — deduplicate against history
    socket.on('receive_message', (payload: ChatMessage) => {
      const incomingKey = `${payload.username}:${msgTime(payload)}`;
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) => m.isHistory && `${m.username}:${msgTime(m)}` === incomingKey
        );
        if (isDuplicate) return prev;
        return [...prev, { ...payload, isHistory: false }];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = (username: string, message: string) => {
    if (!socketRef.current?.connected) return;

    const payload: SendMessagePayload = {
      username,
      message,
      time: new Date().toISOString(),
    };

    socketRef.current.emit('send_message', payload);
  };

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    sendMessage,
  };
}
