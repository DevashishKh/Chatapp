// components/Sidebar.js — Left panel: user list + search
import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Avatar = ({ user, size = 40, online }) => {
  const initials = user.username ? user.username[0].toUpperCase() : '?';
  const colors = ['#5b8af7','#3dd68c','#f5a623','#ef6c6c','#a78bfa','#38bdf8'];
  const color = colors[(user.username?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {user.avatar ? (
        <img src={user.avatar} alt={user.username}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: color + '22', border: `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: size * 0.38, color,
        }}>{initials}</div>
      )}
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: online ? 'var(--online)' : 'var(--offline)',
          border: '2px solid var(--bg-secondary)',
        }} />
      )}
    </div>
  );
};

const Sidebar = ({ onToggleTheme, theme }) => {
  const { user, logout } = useAuth();
  const { users, activeChat, setActiveChat, onlineUsers, notifications } = useChat();
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const unreadFrom = (userId) =>
    notifications.filter(n => (n.sender._id || n.sender) === userId).length;

  return (
    <div style={S.sidebar}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>◎</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>ChatApp</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onToggleTheme} style={S.iconBtn} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(v => !v)} style={S.iconBtn} title="Menu">⋮</button>
            {showMenu && (
              <div style={S.menu}>
                <button style={S.menuItem} onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My profile strip */}
      <div style={S.myProfile}>
        <Avatar user={user} size={36} online={true} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, truncate: true }}>{user.username}</div>
          <div style={{ fontSize: 12, color: 'var(--online)' }}>● Online</div>
        </div>
      </div>

      {/* Search */}
      <div style={S.searchWrap}>
        <span style={S.searchIcon}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts…" style={S.searchInput}
        />
      </div>

      {/* Users list */}
      <div style={S.list}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No contacts found
          </div>
        )}
        {filtered.map(u => {
          const isActive = activeChat?._id === u._id;
          const isOnline = onlineUsers.has(u._id);
          const unread = unreadFrom(u._id);
          return (
            <div
              key={u._id}
              onClick={() => { setActiveChat(u); }}
              style={{
                ...S.userRow,
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              }}
            >
              <Avatar user={u} size={42} online={isOnline} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{u.username}</span>
                  {unread > 0 && (
                    <span style={S.badge}>{unread}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const S = {
  sidebar: {
    width: 'var(--sidebar-w)', background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
  },
  header: {
    padding: '16px 16px 12px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
  },
  iconBtn: {
    background: 'var(--bg-tertiary)', border: 'none', borderRadius: 8,
    width: 32, height: 32, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)',
  },
  menu: {
    position: 'absolute', right: 0, top: '100%', marginTop: 4,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 6, zIndex: 100, minWidth: 140,
    boxShadow: 'var(--shadow-md)',
  },
  menuItem: {
    width: '100%', textAlign: 'left', background: 'none', border: 'none',
    color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 6,
    cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)',
  },
  myProfile: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
  },
  searchWrap: {
    position: 'relative', margin: '12px 12px 8px',
  },
  searchIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    fontSize: 13, pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '9px 12px 9px 34px', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
  },
  list: { flex: 1, overflowY: 'auto' },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  badge: {
    background: 'var(--accent)', color: '#fff', borderRadius: '50%',
    width: 18, height: 18, fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
};

export default Sidebar;
