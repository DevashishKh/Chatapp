// context/ChatContext.js — Global chat state (messages, active user, online status)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null);  // The user we're chatting with
  const [messages, setMessages] = useState([]);          // Messages for active chat
  const [users, setUsers] = useState([]);                // All users
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});    // { userId: true/false }
  const [notifications, setNotifications] = useState([]); // Incoming msgs from non-active chats
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load all users
  const loadUsers = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/users');
      setUsers(data.users);
    } catch (err) {
      console.error('Load users error:', err);
    }
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load chat history when activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    const load = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/api/messages/${activeChat._id}`);
        setMessages(data.messages);
        // Mark as read
        const socket = getSocket();
        socket?.emit('mark_read', { senderId: activeChat._id });
      } catch (err) {
        console.error('Load messages error:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
  }, [activeChat]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Incoming message
    const handleNewMessage = (msg) => {
      const senderId = msg.sender._id || msg.sender;
      if (activeChat && senderId === activeChat._id) {
        // Add to active chat
        setMessages((prev) => [...prev, msg]);
        // Mark read immediately
        socket.emit('mark_read', { senderId });
      } else {
        // Notification for non-active chat
        setNotifications((prev) => [
          { ...msg, timestamp: new Date() },
          ...prev.slice(0, 19),
        ]);
      }
    };

    // My sent message confirmation
    const handleMessageSent = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleStatusChange = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
      // Update user list
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status } : u))
      );
    };

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_status_change', handleStatusChange);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_status_change', handleStatusChange);
      socket.off('user_typing', handleTyping);
    };
  }, [activeChat, user]);

  // Send a message
  const sendMessage = useCallback((content, type = 'text') => {
    if (!activeChat || !content.trim()) return;
    const socket = getSocket();
    socket?.emit('send_message', {
      receiverId: activeChat._id,
      content: content.trim(),
      type,
    });
  }, [activeChat]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!activeChat) return;
    const socket = getSocket();
    socket?.emit(isTyping ? 'typing_start' : 'typing_stop', {
      receiverId: activeChat._id,
    });
  }, [activeChat]);

  const clearNotifications = () => setNotifications([]);

  return (
    <ChatContext.Provider value={{
      activeChat, setActiveChat,
      messages, loadingMessages,
      users, loadUsers,
      onlineUsers,
      typingUsers,
      notifications, clearNotifications,
      sendMessage, sendTyping,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
