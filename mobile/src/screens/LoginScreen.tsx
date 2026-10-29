import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { loginUser } from '../services/userStore';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small timeout to show loading state
    setTimeout(() => {
      const user = loginUser(email.trim(), password);
      if (user) {
        onLoginSuccess(user, 'local-token');
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '2rem 1.75rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
          }}>
            <Shield size={38} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            JourneyGuard
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
            Real-Time Women Transport Safety System
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 0.85rem 0.8rem 2.6rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 0.85rem 0.8rem 2.6rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Demo hint */}
          <div
            onClick={() => { setEmail('demo@example.com'); setPassword('Demo@123'); }}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={15} />
            <span><strong>Demo:</strong> demo@example.com / Demo@123 — tap to fill</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.9rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
              marginTop: '0.25rem',
            }}
          >
            {loading ? 'Signing in…' : <><LogIn size={18} /> Sign In</>}
          </button>

          {/* Switch to register */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
