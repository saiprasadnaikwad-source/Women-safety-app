import React, { useState } from 'react';
import { Shield, Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import axios from 'axios';
import { registerUser } from '../services/userStore';
import { getApiBaseUrl } from '../services/apiConfig';

interface RegisterProps {
  onRegisterSuccess: (user: any, token: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanPhone = form.phone.trim();
    const cleanPassword = form.password;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await axios.post(`${baseUrl}/api/auth/register`, {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPassword
      });

      registerUser(cleanName, cleanEmail, cleanPhone, cleanPassword);
      onRegisterSuccess(res.data.user, res.data.token || 'auth-token');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg && serverMsg.includes('already exists')) {
        setError(serverMsg);
      } else {
        // Fallback to local user store
        const result = registerUser(cleanName, cleanEmail, cleanPhone, cleanPassword);
        if (result.success && result.user) {
          onRegisterSuccess({ ...result.user, _id: result.user.id }, 'local-token');
        } else {
          setError(result.error || serverMsg || 'Registration failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 0.85rem 0.8rem 2.6rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create Account</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>JourneyGuard Women Safety System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              border: '1px solid #fecaca',
            }}>
              ⚠️ {error}
            </div>
          )}

          {[
            { field: 'name', label: 'Full Name', icon: <User size={17} color="#94a3b8" />, type: 'text', placeholder: 'Your full name' },
            { field: 'email', label: 'Email Address', icon: <Mail size={17} color="#94a3b8" />, type: 'email', placeholder: 'you@example.com' },
            { field: 'phone', label: 'Phone Number', icon: <Phone size={17} color="#94a3b8" />, type: 'tel', placeholder: '+91 9876543210' },
            { field: 'password', label: 'Password', icon: <Lock size={17} color="#94a3b8" />, type: 'password', placeholder: 'Min 6 characters' },
            { field: 'confirmPassword', label: 'Confirm Password', icon: <Lock size={17} color="#94a3b8" />, type: 'password', placeholder: 'Repeat password' },
          ].map(({ field, label, icon, type, placeholder }) => (
            <div key={field}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}>{icon}</span>
                <input
                  type={type}
                  value={(form as any)[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={placeholder}
                  required={field !== 'phone'}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            </div>
          ))}

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
            {loading ? 'Creating Account…' : <><UserPlus size={18} /> Create Account</>}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
