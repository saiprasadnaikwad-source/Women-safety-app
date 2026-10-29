import React from 'react';
import { ShieldCheck, Navigation, Users, AlertTriangle, ChevronRight, Activity, Zap } from 'lucide-react';

interface HomeProps {
  user: any;
  contactsCount: number;
  onStartJourneyClick: () => void;
  onViewContactsClick: () => void;
  onViewIncidentsClick: () => void;
  onOpenDemoMode: () => void;
}

export const HomeScreen: React.FC<HomeProps> = ({
  user,
  contactsCount,
  onStartJourneyClick,
  onViewContactsClick,
  onViewIncidentsClick,
  onOpenDemoMode
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Good evening, {user?.name ? user.name.split(' ')[0] : 'Ishwari'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>You're safe</span>
          </div>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={onOpenDemoMode}
          style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '9999px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
        >
          <Zap size={14} /> Demo Simulation
        </button>
      </div>

      {/* Hero Action Card: Start Journey */}
      <div 
        className="card" 
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '12px' }}>
            <Navigation size={24} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Start a Safe Journey</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Bus • Metro • Local Train • Auto • Shared</p>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', opacity: 0.95, lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Monitor your route in real time with AI anomaly detection and 0.5 km corridor geofencing.
        </p>

        <button 
          className="btn-large" 
          style={{ backgroundColor: '#ffffff', color: '#1e40af', fontWeight: 800 }}
          onClick={onStartJourneyClick}
        >
          Start Journey <ChevronRight size={18} />
        </button>
      </div>

      {/* Status Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.6rem', borderRadius: '12px' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Journey Protection</h4>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Active • Location Monitoring ON</span>
          </div>
        </div>
        <span className="badge-pill badge-green">ACTIVE</span>
      </div>

      {/* Emergency Contacts Card */}
      <div className="card" onClick={onViewContactsClick} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#2563eb" />
            <h4 className="card-title" style={{ marginBottom: 0 }}>Trusted Contacts</h4>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700 }}>{contactsCount} Added</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Primary contact: Radhika Gade (Mother). Auto-notified on route anomaly or SOS.
        </p>
      </div>

      {/* Recent Incident Card */}
      <div className="card" onClick={onViewIncidentsClick} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#ea580c" />
            <h4 className="card-title" style={{ marginBottom: 0 }}>Recent Incident Record</h4>
          </div>
          <span className="badge-pill badge-green">RESOLVED</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
          Route Deviation near Aundh Bypass
        </p>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>10 Sep 2026, 8:34 PM</span>
      </div>
    </div>
  );
};
