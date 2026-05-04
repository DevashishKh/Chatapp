// components/RightPanel.js — Activity feed, notifications, contact info
import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const RightPanel = () => {
  const { user, updateUser } = useAuth();
  const { activeChat, notifications, clearNotifications, onlineUsers } = useChat();
  const [tab, setTab] = useState('info'); // 'info' | 'notifs' | 'settings'
  const [autoReply, setAutoReply] = useState(user.autoReply || { enabled: false, message: '' });
  const [saving, setSaving] = useState(false);

  const saveAutoReply = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/api/auth/profile', { autoReply });
      updateUser(data.user);
    } catch (err) {
      console.error('Save auto-reply error:', err);
    } finally {
      setSaving(false);
    }
  };

  const onlineCount = onlineUsers.size;

  return (
    <div style={S.panel}>
      {/* Tab bar */}
      <div style={S.tabs}>
        {['info', 'notifs', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...S.tab, color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            {t === 'info' ? '👤' : t === 'notifs' ? `🔔${notifications.length > 0 ? ` ${notifications.length}` : ''}` : '⚙️'}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {/* INFO TAB */}
        {tab === 'info' && (
          <div>
            {activeChat ? (
              <>
                <div style={S.contactCard}>
                  <div style={S.bigAvatar}>{activeChat.username[0].toUpperCase()}</div>
                  <div style={S.contactName}>{activeChat.username}</div>
                  <div style={S.contactEmail}>{activeChat.email}</div>
                  <div style={{
                    ...S.statusBadge,
                    background: onlineUsers.has(activeChat._id) ? 'rgba(61,214,140,0.15)' : 'rgba(85,88,112,0.2)',
                    color: onlineUsers.has(activeChat._id) ? 'var(--online)' : 'var(--text-muted)',
                  }}>
                    ● {onlineUsers.has(activeChat._id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </>
            ) : (
              <div style={S.placeholder}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a chat to see contact info</div>
              </div>
            )}

            {/* Online users summary */}
            <div style={S.section}>
              <div style={S.sectionTitle}>Active Now</div>
              <div style={S.statRow}>
                <span style={{ fontSize: 20 }}>🟢</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{onlineCount}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>user{onlineCount !== 1 ? 's' : ''} online</span>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={S.sectionTitle}>Recent</span>
              {notifications.length > 0 && (
                <button onClick={clearNotifications} style={S.clearBtn}>Clear all</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={S.placeholder}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No new notifications</div>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} style={S.notifItem}>
                  <div style={S.notifAvatar}>{(n.sender?.username || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{n.sender?.username}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div>
            <div style={S.sectionTitle}>Auto-Reply</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Auto-reply when you're offline
            </p>

            <label style={S.toggleRow}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Enable auto-reply</span>
              <div
                onClick={() => setAutoReply(r => ({ ...r, enabled: !r.enabled }))}
                style={{
                  ...S.toggle,
                  background: autoReply.enabled ? 'var(--accent)' : 'var(--surface-3)',
                }}
              >
                <div style={{
                  ...S.toggleThumb,
                  transform: autoReply.enabled ? 'translateX(20px)' : 'translateX(2px)',
                }} />
              </div>
            </label>

            {autoReply.enabled && (
              <textarea
                value={autoReply.message}
                onChange={e => setAutoReply(r => ({ ...r, message: e.target.value }))}
                placeholder="I'm away right now, I'll reply soon!"
                style={{ ...S.textarea }}
                rows={3}
              />
            )}

            <button onClick={saveAutoReply} disabled={saving} style={S.saveBtn}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const S = {
  panel: {
    width: 'var(--right-w)', background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)' },
  tab: {
    flex: 1, background: 'none', border: 'none', padding: '14px 8px',
    cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
    transition: 'color 0.15s',
  },
  content: { flex: 1, overflowY: 'auto', padding: 16 },
  contactCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px 0', marginBottom: 16,
  },
  bigAvatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'var(--accent-dim)', border: '2px solid var(--border-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--accent)',
    marginBottom: 10,
  },
  contactName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 },
  contactEmail: { color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 },
  statusBadge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  section: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' },
  sectionTitle: { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 },
  statRow: { display: 'flex', alignItems: 'center', gap: 8 },
  placeholder: { textAlign: 'center', padding: '32px 16px' },
  notifItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '1px solid var(--border)',
  },
  notifAvatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--accent)',
    flexShrink: 0,
  },
  clearBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer' },
  toggle: { width: 42, height: 24, borderRadius: 12, position: 'relative', transition: 'background 0.2s', cursor: 'pointer' },
  toggleThumb: {
    position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
    background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  textarea: {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)',
    marginBottom: 12,
  },
  saveBtn: {
    width: '100%', background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
};

export default RightPanel;
