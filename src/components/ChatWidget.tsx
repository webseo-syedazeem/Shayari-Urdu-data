import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Settings, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { useChat, ChatMessage } from '../hooks/useChat';
import { useNotifications, OPEN_CHAT_EVENT } from '../contexts/NotificationContext';

const STORAGE_KEY = 'chat_username';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [nameInput, setNameInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const { isConnected, messages, sendMessage, onlineCount } = useChat(username || undefined);
  const { soundEnabled, popupEnabled, setSoundEnabled, setPopupEnabled } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Let toast clicks (fired from anywhere on the site) open this widget.
  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > prevMsgCount.current) {
      setUnreadCount((c) => c + (messages.length - prevMsgCount.current));
    }
    prevMsgCount.current = messages.length;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);


  useEffect(() => {
    if (isOpen) {
      // Use instant scroll when first opening so the view starts at the bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSetUsername = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setUsername(trimmed);
    setNameInput('');
  };

  const handleSend = async () => {
    const trimmed = textInput.trim();
    if (!trimmed || !username || isSending) return;

    setIsSending(true);
    setSendError(false);

    try {
      await sendMessage(username, trimmed);
      setTextInput('');
    } catch {
      setSendError(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSetUsername();
  };

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '360px',
            height: '480px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#2B4C70',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>Poetry Chat</div>
              <div style={{ color: '#9BB8D3', fontSize: '11px', marginTop: '1px' }}>ShayariUrdu.com</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94B8D8' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }} />
                {onlineCount} online
              </span>
              <div style={{ position: 'relative' }} ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-label="Notification settings"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94B8D8', display: 'flex', alignItems: 'center', padding: '2px' }}
                >
                  <Settings size={17} />
                </button>
                {settingsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '220px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      padding: '10px',
                      zIndex: 10,
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 4px 8px' }}>
                      Notifications
                    </div>
                    <SettingRow
                      icon={soundEnabled ? <Volume2 size={15} color="#1E3A5F" /> : <VolumeX size={15} color="#9CA3AF" />}
                      label="Sound Notifications"
                      checked={soundEnabled}
                      onChange={setSoundEnabled}
                    />
                    <SettingRow
                      icon={popupEnabled ? <Bell size={15} color="#1E3A5F" /> : <BellOff size={15} color="#9CA3AF" />}
                      label="Popup Notifications"
                      checked={popupEnabled}
                      onChange={setPopupEnabled}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94B8D8', display: 'flex', alignItems: 'center', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Username Setup */}
          {!username ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={26} color="#1E3A5F" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', textAlign: 'center', margin: 0 }}>
                Enter your name to join the chat
              </p>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Your name..."
                maxLength={30}
                style={{
                  width: '100%',
                  borderRadius: '999px',
                  border: '1px solid #D1D5DB',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#1F2937',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                }}
              />
              <button
                onClick={handleSetUsername}
                disabled={!nameInput.trim()}
                style={{
                  width: '100%',
                  borderRadius: '999px',
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: nameInput.trim() ? '#1E3A5F' : '#9CA3AF',
                  border: 'none',
                  cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <MessageCircle size={36} color="#D1D5DB" />
                    <p style={{ fontSize: '13px', margin: 0, color: '#9CA3AF' }}>No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg: ChatMessage, i: number) => {
                    const isSelf = msg.username === username;
                    const time = msg.time ?? msg.created_at ?? '';
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start',
                          opacity: msg.isHistory ? 0.75 : 1,
                        }}
                      >
                        {!isSelf && (
                          <span style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px', paddingLeft: '4px', fontWeight: 500 }}>
                            {msg.username}
                          </span>
                        )}
                        <div
                          style={{
                            maxWidth: '78%',
                            padding: '9px 13px',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            backgroundColor: isSelf ? '#1E3A5F' : '#ffffff',
                            color: isSelf ? '#ffffff' : '#1F2937',
                            border: isSelf ? 'none' : '1px solid #E5E7EB',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.message}
                        </div>
                        {time && (
                          <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                            {formatTime(time)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                style={{
                  flexShrink: 0,
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #E5E7EB',
                  padding: '10px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Chatting as <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{username}</span>
                  </span>
                  <button
                    onClick={() => { localStorage.removeItem(STORAGE_KEY); setUsername(''); }}
                    style={{ fontSize: '11px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Change
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={textInput}
                    onChange={(e) => { setTextInput(e.target.value); setSendError(false); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                    maxLength={500}
                    style={{
                      flex: 1,
                      borderRadius: '999px',
                      border: sendError ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      backgroundColor: '#F9FAFB',
                      padding: '9px 16px',
                      fontSize: '13px',
                      color: '#1F2937',
                      outline: 'none',
                      opacity: isConnected ? 1 : 0.5,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!textInput.trim() || !isConnected || isSending}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: textInput.trim() && isConnected && !isSending ? '#1E3A5F' : '#D1D5DB',
                      border: 'none',
                      cursor: textInput.trim() && isConnected && !isSending ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={16} color="#ffffff" />
                  </button>
                </div>
                {sendError && (
                  <div style={{ fontSize: '11px', color: '#EF4444', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Message failed to send.</span>
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#EF4444',
                        textDecoration: 'underline',
                        cursor: isSending ? 'default' : 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <style>{`
        .shayari-chat-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 15px;
          border-radius: 999px;
          border: none;
          background-color: #2B4C70;
          color: rgba(255, 255, 255, 0.94);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(30, 58, 95, 0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .shayari-chat-fab:hover {
          transform: translateY(-1px);
          background-color: #315579;
          box-shadow: 0 4px 14px rgba(30, 58, 95, 0.26);
        }
        .shayari-chat-fab:active {
          transform: translateY(0);
        }
        .shayari-chat-fab__label {
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .shayari-chat-fab {
            padding: 9px 13px;
          }
          .shayari-chat-fab__label--full {
            display: none;
          }
          .shayari-chat-fab__label--short {
            display: inline;
          }
        }
        .shayari-chat-fab__label--short {
          display: none;
        }
      `}</style>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="shayari-chat-fab"
      >
        {isOpen ? <X size={15} strokeWidth={2} /> : <MessageCircle size={15} strokeWidth={2} />}
        <span className="shayari-chat-fab__label shayari-chat-fab__label--full">
          {isOpen ? 'Close Chat' : 'Shayari Chat Room'}
        </span>
        <span className="shayari-chat-fab__label shayari-chat-fab__label--short">
          {isOpen ? 'Close' : 'Chat'}
        </span>
        {!isOpen && unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #2B4C70',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '34px',
        height: '20px',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: checked ? '#1E3A5F' : '#D1D5DB',
        position: 'relative',
        flexShrink: 0,
        transition: 'background-color 0.15s ease',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '16px' : '2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transition: 'left 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function SettingRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '7px 4px',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>
        {icon}
        {label}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
