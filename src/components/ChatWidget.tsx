import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useChat, ChatMessage } from '../hooks/useChat';

const STORAGE_KEY = 'chat_username';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [nameInput, setNameInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, messages, sendMessage, onlineCount } = useChat(username || undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

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
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSetUsername = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setUsername(trimmed);
    setNameInput('');
  };

  const handleSend = () => {
    const trimmed = textInput.trim();
    if (!trimmed || !username) return;
    sendMessage(username, trimmed);
    setTextInput('');
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
              backgroundColor: '#1E3A5F',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>Poetry Chat</div>
              <div style={{ color: '#94B8D8', fontSize: '11px', marginTop: '1px' }}>ShayariUrdu.com</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94B8D8' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }} />
                {onlineCount} online
              </span>
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
                    <p style={{ fontSize: '13px', margin: 0, color: '#9CA3AF' }}>No messages yet. Say Salam! 👋</p>
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
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                    maxLength={500}
                    style={{
                      flex: 1,
                      borderRadius: '999px',
                      border: '1px solid #D1D5DB',
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
                    disabled={!textInput.trim() || !isConnected}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: textInput.trim() && isConnected ? '#1E3A5F' : '#D1D5DB',
                      border: 'none',
                      cursor: textInput.trim() && isConnected ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={16} color="#ffffff" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#1E3A5F',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(30,58,95,0.35)',
        }}
      >
        {isOpen ? <X size={22} color="#ffffff" /> : <MessageCircle size={22} color="#ffffff" />}
        {!isOpen && unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}