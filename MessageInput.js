// components/MessageInput.js — Bottom input bar with emoji, file, schedule
import React, { useState, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../utils/api';

const EMOJIS = ['😀','😂','😍','🥺','😎','🤔','👍','❤️','🔥','✨','🎉','😅','🤣','😊','😭','😤'];

const MessageInput = () => {
  const { activeChat, sendMessage, sendTyping } = useChat();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() || !activeChat || sending) return;
    if (scheduleTime) {
      // Scheduled message via REST
      setSending(true);
      try {
        await api.post('/api/messages', {
          receiverId: activeChat._id,
          content: text.trim(),
          scheduledAt: scheduleTime,
        });
        setText('');
        setScheduleTime('');
        setShowSchedule(false);
      } catch (err) {
        console.error('Schedule error:', err);
      } finally {
        setSending(false);
      }
    } else {
      sendMessage(text.trim());
      setText('');
      sendTyping(false);
      clearTimeout(typingTimer.current);
    }
  }, [text, activeChat, sending, scheduleTime, sendMessage, sendTyping]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      sendMessage(`📎 ${file.name}`, 'file');
      return;
    }
    // Convert image to base64 and send
    const reader = new FileReader();
    reader.onload = () => sendMessage(reader.result, 'image');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!activeChat) return null;

  return (
    <div style={S.wrap}>
      {/* Emoji picker */}
      {showEmoji && (
        <div style={S.emojiPicker}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); }}
              style={S.emojiBtn}>{e}</button>
          ))}
        </div>
      )}

      {/* Schedule picker */}
      {showSchedule && (
        <div style={S.schedulePicker}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Send at:</span>
          <input
            type="datetime-local" value={scheduleTime}
            onChange={e => setScheduleTime(e.target.value)}
            style={{ ...S.input, flex: 1, padding: '6px 10px', fontSize: 13 }}
          />
          <button onClick={() => { setShowSchedule(false); setScheduleTime(''); }}
            style={{ ...S.actionBtn, fontSize: 12, padding: '6px 10px' }}>Cancel</button>
        </div>
      )}

      {/* Main input row */}
      <div style={S.row}>
        <button onClick={() => { setShowEmoji(v => !v); setShowSchedule(false); }} style={S.toolBtn} title="Emoji">😊</button>
        <button onClick={() => fileRef.current?.click()} style={S.toolBtn} title="Attach file">📎</button>
        <button onClick={() => { setShowSchedule(v => !v); setShowEmoji(false); }} style={S.toolBtn} title="Schedule">🕐</button>

        <input type="file" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} accept="image/*,*" />

        <input
          value={text} onChange={handleChange} onKeyDown={handleKey}
          placeholder={scheduleTime ? `Schedule: "${text || '...'}"` : 'Type a message…'}
          style={S.input}
          disabled={sending}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            ...S.sendBtn,
            opacity: text.trim() ? 1 : 0.4,
            transform: text.trim() ? 'scale(1)' : 'scale(0.95)',
          }}
          title={scheduleTime ? 'Schedule message' : 'Send'}
        >
          {scheduleTime ? '🕐' : '➤'}
        </button>
      </div>
    </div>
  );
};

const S = {
  wrap: {
    padding: '12px 16px', background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border)', position: 'relative', flexShrink: 0,
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 22, padding: '11px 18px', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)',
    resize: 'none',
  },
  toolBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 18, padding: 6, borderRadius: 8, lineHeight: 1,
    transition: 'transform 0.15s',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
    border: 'none', cursor: 'pointer', fontSize: 16, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s, transform 0.2s', flexShrink: 0,
  },
  actionBtn: {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
  },
  emojiPicker: {
    position: 'absolute', bottom: '100%', left: 16, marginBottom: 8,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 12, display: 'flex', flexWrap: 'wrap',
    gap: 4, maxWidth: 260, zIndex: 50, boxShadow: 'var(--shadow-md)',
  },
  emojiBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 22,
    padding: 4, borderRadius: 6, lineHeight: 1,
  },
  schedulePicker: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
    padding: '8px 12px', background: 'var(--bg-tertiary)',
    borderRadius: 10, border: '1px solid var(--border)',
  },
};

export default MessageInput;
