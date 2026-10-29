import React, { useState } from 'react';
import { User, Shield, Lock, LogOut, ChevronRight, Sliders, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { updateUser } from '../services/userStore';

interface ProfileProps {
  user: any;
  onLogout: () => void;
  onOpenPrivacy: () => void;
  onOpenHandsFree: () => void;
  onUserUpdate: (user: any) => void;
}

export const ProfileSettingsScreen: React.FC<ProfileProps> = ({
  user,
  onLogout,
  onOpenPrivacy,
  onOpenHandsFree,
  onUserUpdate,
}) => {
  const [sosCountdownDuration, setSosCountdownDuration] = useState(5);
  const [corridorRadius, setCorridorRadius] = useState(0.5);

  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = () => {
    setProfileMsg(null);

    if (!editName.trim() || !editEmail.trim()) {
      setProfileMsg({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    const updates: Record<string, string> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    };

    // Handle password change
    if (currentPassword || newPassword || confirmNewPassword) {
      if (!currentPassword) {
        setProfileMsg({ type: 'error', text: 'Enter your current password to change it.' });
        return;
      }
      if (newPassword.length < 6) {
        setProfileMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
      updates.password = newPassword;
    }

    setSavingProfile(true);
    setTimeout(() => {
      const result = updateUser(user?.id, updates);
      if (result.success && result.user) {
        onUserUpdate(result.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: result.error || 'Failed to update profile.' });
      }
      setSavingProfile(false);
    }, 400);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.4rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* User Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          fontWeight: 800,
          flexShrink: 0,
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'I'}
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{user?.name || 'Ishwari Gade'}</h3>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{user?.email || 'demo@example.com'}</span>
          <br />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user?.phone || '+91 9876543210'}</span>
        </div>
      </div>

      {/* ── Edit Profile Card ── */}
      <div className="card">
        <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={16} color="#2563eb" /> Edit Profile
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Change Password section */}
          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '0.75rem',
            marginTop: '0.25rem',
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} color="#64748b" /> Change Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </p>
            {[
              { label: 'Current Password', val: currentPassword, setter: setCurrentPassword, placeholder: 'Enter current password' },
              { label: 'New Password', val: newPassword, setter: setNewPassword, placeholder: 'Min 6 characters' },
              { label: 'Confirm New Password', val: confirmNewPassword, setter: setConfirmNewPassword, placeholder: 'Repeat new password' },
            ].map(({ label, val, setter, placeholder }) => (
              <div key={label} style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#cbd5e1" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.65rem 0.75rem 0.65rem 2.2rem' }}
                    onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Status message */}
          {profileMsg && (
            <div style={{
              backgroundColor: profileMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: profileMsg.type === 'success' ? '#16a34a' : '#dc2626',
              border: `1px solid ${profileMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}>
              {profileMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {profileMsg.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{
              background: savingProfile ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.8rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: savingProfile ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 3px 10px rgba(59,130,246,0.3)',
            }}
          >
            {savingProfile ? 'Saving…' : <><CheckCircle size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Safety & Monitoring Settings */}
      <div className="card">
        <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} color="#2563eb" /> Safety & SOS Parameters
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
            <span>SOS Countdown Timer</span>
            <strong>{sosCountdownDuration} seconds</strong>
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={sosCountdownDuration}
            onChange={(e) => setSosCountdownDuration(parseInt(e.target.value))}
            style={{ width: '100%', marginTop: '0.35rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
            <span>Corridor Geofence Radius</span>
            <strong>{corridorRadius} km (500m)</strong>
          </label>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.1"
            value={corridorRadius}
            onChange={(e) => setCorridorRadius(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '0.35rem' }}
          />
        </div>
      </div>

      {/* Options Menu */}
      <div className="card" style={{ padding: '0.5rem' }}>
        <button
          onClick={onOpenHandsFree}
          style={{ width: '100%', padding: '0.85rem 1rem', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sliders size={18} color="#2563eb" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Hands-Free & Shake Settings</span>
          </div>
          <ChevronRight size={18} color="#94a3b8" />
        </button>

        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0 0.5rem' }} />

        <button
          onClick={onOpenPrivacy}
          style={{ width: '100%', padding: '0.85rem 1rem', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Lock size={18} color="#16a34a" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Privacy & Data Security Policy</span>
          </div>
          <ChevronRight size={18} color="#94a3b8" />
        </button>
      </div>

      <button className="btn-large btn-danger" onClick={onLogout}>
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
};
