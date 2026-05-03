// pages/AuthPage.js — Login / Signup screen
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.username) return setError('Username is required');
        await signup(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Background decoration */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <span style={S.logoIcon}>◎</span>
          <span style={S.logoText}>ChatApp</span>
        </div>

        <h2 style={S.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p style={S.subtitle}>
          {mode === 'login' ? 'Sign in to continue' : 'Join the conversation'}
        </p>

        <form onSubmit={submit} style={S.form}>
          {mode === 'signup' && (
            <div style={S.field}>
              <label style={S.label}>Username</label>
              <input
                name="username" value={form.username} onChange={handle}
                placeholder="yourname" style={S.input} autoComplete="off"
              />
            </div>
          )}
          <div style={S.field}>
            <label style={S.label}>Email</label>
            <input
              name="email" type="email" value={form.email} onChange={handle}
              placeholder="you@example.com" style={S.input}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              name="password" type="password" value={form.password} onChange={handle}
              placeholder="••••••••" style={S.input}
            />
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={S.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={S.switchBtn}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg-primary)',
    padding: 24, position: 'relative', overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', width: 500, height: 500,
    borderRadius: '50%', top: -200, right: -150,
    background: 'radial-gradient(circle, rgba(91,138,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: '50%', bottom: -150, left: -100,
    background: 'radial-gradient(circle, rgba(61,214,140,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: var => 'var(--radius-xl)', padding: '48px 40px',
    width: '100%', maxWidth: 420, position: 'relative',
    boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.4s ease',
    borderRadius: 28,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIcon: { fontSize: 28, color: 'var(--accent)', lineHeight: 1 },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
  title: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)',
    fontSize: 15, outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-body)',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13,
  },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 10, padding: '14px 24px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4,
    transition: 'opacity 0.2s, transform 0.1s',
  },
  switch: { marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 },
  switchBtn: {
    background: 'none', border: 'none', color: 'var(--accent)',
    cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0,
  },
};

export default AuthPage;
