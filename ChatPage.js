// pages/ChatPage.js — Main 3-column layout
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import RightPanel from '../components/RightPanel';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [showRight, setShowRight] = useState(true);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.className = next === 'light' ? 'light' : '';
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Left Sidebar — contacts */}
      <Sidebar onToggleTheme={toggleTheme} theme={theme} />

      {/* Center — active chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatWindow onToggleRight={() => setShowRight(v => !v)} />
      </div>

      {/* Right Panel — activity / notifications */}
      {showRight && <RightPanel />}
    </div>
  );
};

export default ChatPage;
