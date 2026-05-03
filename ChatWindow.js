// components/ChatWindow.js — Center chat panel
import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import MessageInput from './MessageInput';

const fmt = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StatusIcon = ({ status }) => {
  if (status === 'read') return <span style={{ color: '#5b8af7' }}>✓✓</span>;
  if (status === 'delivered') return <span style={{ color: 'var(--text-muted)' }}>✓✓</span>;
  return <span style={{ color: 'var(--text-muted)' }}>✓</span>;
};

const ChatWindow = ({ onToggleRight }) => {
  const { user } = useAuth();
  const { activeChat, messages, loadingMessages, typingUsers, onlineUsers } = useChat();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const isTyping = activeChat && typingUsers[activeChat._id];
  const isOnline = activeChat && onlineUsers.has(activeChat._id);

  if (!activeChat) {
    return (
      <div style={S.empty}>
        <div style={S.emptyInner}>
          <div style={S.emptyIcon}>◎</div>
          <h3 style={S.emptyTitle}>Select a conversation</h3>
          <p style={S.emptySubtitle}>Choose a contact from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.window}>
      {/* Chat header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.avatarWrap}>
            <div style={S.avatarInner}>
              {activeChat.username[0].toUpperCase()}
            </div>
            <span style={{ ...S.dot, background: isOnline ? 'var(--online)' : 'var(--offline)' }} />
          </div>
          <div>
            <div style={S.headerName}>{activeChat.username}</div>
            <div style={{ fontSize: 12, color: isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
              {isTyping ? '✍️ typing…' : isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <button onClick={onToggleRight} style={S.iconBtn} title="Toggle activity panel">⊞</button>
      </div>

      {/* Messages area */}
      <div style={S.messages}>
        {loadingMessages && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            Loading messages…
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = (msg.sender._id || msg.sender) === user._id;
          const showDate = i === 0 || (
            new Date(msg.createdAt).toDateString() !==
            new Date(messages[i - 1]?.createdAt).toDateString()
          );
          return (
            <React.Fragment key={msg._id}>
              {showDate && (
                <div style={S.dateDivider}>
                  <span style={S.dateLabel}>
                    {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div style={{ ...S.msgRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
                className="fade-in">
                <div style={{
                  ...S.bubble,
                  background: isMine ? 'var(--msg-out-bg)' : 'var(--msg-in-bg)',
                  borderBottomRightRadius: isMine ? 4 : 18,
                  borderBottomLeftRadius: isMine ? 18 : 4,
                  color: isMine ? '#fff' : 'var(--text-primary)',
                }}>
                  {msg.type === 'image' ? (
                    <img src={msg.content} alt="shared" style={{ maxWidth: 240, borderRadius: 8 }} />
                  ) : (
                    <span style={{ wordBreak: 'break-word' }}>{msg.content}</span>
                  )}
                  <div style={S.meta}>
                    <span style={{ color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', fontSize: 11 }}>
                      {fmt(msg.createdAt)}
                    </span>
                    {isMine && <StatusIcon status={msg.status} />}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ ...S.msgRow, justifyContent: 'flex-start' }}>
            <div style={{ ...S.bubble, background: 'var(--msg-in-bg)', padding: '12px 16px' }}>
              <div style={S.typingDots}>
                <span style={{ ...S.dot2, animationDelay: '0ms' }} />
                <span style={{ ...S.dot2, animationDelay: '200ms' }} />
                <span style={{ ...S.dot2, animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput />

      <style>{`
        .fade-in { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes typing { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
};

const S = {
  window: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  empty: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)',
  },
  emptyInner: { textAlign: 'center', padding: 24 },
  emptyIcon: { fontSize: 56, color: 'var(--accent)', marginBottom: 16, lineHeight: 1 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 },
  emptySubtitle: { color: 'var(--text-secondary)', fontSize: 14 },
  header: {
    padding: '12px 20px', background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative' },
  avatarInner: {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)',
    border: '2px solid var(--border-accent)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: 16,
  },
  dot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid var(--bg-secondary)',
  },
  headerName: { fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' },
  iconBtn: {
    background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8,
    width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)',
  },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 },
  dateDivider: { display: 'flex', alignItems: 'center', margin: '12px 0' },
  dateLabel: {
    margin: '0 auto', fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 20,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  msgRow: { display: 'flex', marginBottom: 2 },
  bubble: { maxWidth: '68%', padding: '10px 14px', borderRadius: 18, lineHeight: 1.5, fontSize: 14 },
  meta: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  typingDots: { display: 'flex', gap: 4, alignItems: 'center' },
  dot2: {
    width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)',
    display: 'inline-block', animation: 'typing 1.2s infinite',
  },
};

export default ChatWindow;
