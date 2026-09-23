import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../hooks/useChat';

const SOUND_KEY = 'soundNotificationsEnabled';
const POPUP_KEY = 'popupNotificationsEnabled';
const USERNAME_KEY = 'chat_username';
const SOUND_URL = '/sounds/notification.wav';
const SOUND_MIN_GAP_MS = 1000;
const TOAST_LIFETIME_MS = 5000;

export const OPEN_CHAT_EVENT = 'shayari:open-chat';

interface ToastItem {
  id: string;
  username: string;
  message: string;
}

interface NotificationContextValue {
  soundEnabled: boolean;
  popupEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  setPopupEnabled: (value: boolean) => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function readBooleanPref(key: string): boolean {
  const stored = localStorage.getItem(key);
  return stored === null ? true : stored === 'true';
}

function truncate(text: string, max = 56): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}...` : trimmed;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(() => readBooleanPref(SOUND_KEY));
  const [popupEnabled, setPopupEnabledState] = useState(() => readBooleanPref(POPUP_KEY));
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const lastSoundAtRef = useRef(0);

  const setSoundEnabled = useCallback((value: boolean) => {
    localStorage.setItem(SOUND_KEY, String(value));
    setSoundEnabledState(value);
  }, []);

  const setPopupEnabled = useCallback((value: boolean) => {
    localStorage.setItem(POPUP_KEY, String(value));
    setPopupEnabledState(value);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Unlock audio playback on first user interaction (autoplay restriction workaround)
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 0.5;

    const unlock = () => {
      if (audioUnlockedRef.current || !audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioUnlockedRef.current = true;
        })
        .catch(() => {
          // Will retry on the next interaction.
        });
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const playSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundAtRef.current < SOUND_MIN_GAP_MS) return;
    lastSoundAtRef.current = now;

    const audio = audioRef.current ?? new Audio(SOUND_URL);
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignored: playback may still be locked until a user gesture occurs.
    });
  }, []);

  const handleToastClick = useCallback(
    (id: string) => {
      dismissToast(id);
      window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
    },
    [dismissToast]
  );

  // Global realtime subscription for message notifications.
  // Uses its own channel name (distinct from the chat widget's "chat_messages"
  // channel in useChat.ts) so both can stay subscribed at the same time
  // without Supabase treating them as the same channel.
  useEffect(() => {
    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const myUsername = localStorage.getItem(USERNAME_KEY);

          if (myUsername && newMsg.username === myUsername) return;

          const wantsPopup = readBooleanPref(POPUP_KEY);
          const wantsSound = readBooleanPref(SOUND_KEY);

          if (wantsPopup) {
            const toast: ToastItem = {
              id: `${newMsg.id ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              username: newMsg.username,
              message: truncate(newMsg.message ?? ''),
            };
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => dismissToast(toast.id), TOAST_LIFETIME_MS);
          }

          if (wantsSound) {
            playSound();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [dismissToast, playSound]);

  return (
    <NotificationContext.Provider
      value={{ soundEnabled, popupEnabled, setSoundEnabled, setPopupEnabled, toasts, dismissToast }}
    >
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} onClick={handleToastClick} />
    </NotificationContext.Provider>
  );
}

function ToastStack({
  toasts,
  onDismiss,
  onClick,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onClick: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: 'min(320px, calc(100vw - 32px))',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{`
        @keyframes shayari-toast-in {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .shayari-toast {
          animation: shayari-toast-in 0.22s ease-out;
        }
      `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="shayari-toast"
          onClick={() => onClick(toast.id)}
          role="button"
          tabIndex={0}
          style={{
            backgroundColor: '#1E3A5F',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            aria-label="Dismiss notification"
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: '#94B8D8',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: '2px',
            }}
          >
            ×
          </button>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7FB2E5', marginBottom: '3px', paddingRight: '14px' }}>
            {toast.username}
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#F1F5F9', wordBreak: 'break-word' }}>
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
