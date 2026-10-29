import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, ArrowLeft } from 'lucide-react';

interface PrivacyProps {
  onBack: () => void;
}

export const PrivacyScreen: React.FC<PrivacyProps> = ({ onBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button 
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Privacy & Data Protection</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Transparent summary of our strict security practices</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '10px' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Minimal Location Collection</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.4 }}>
              Your location is accessed solely during active journey monitoring to compute 0.5 km corridor geofence adherence and ML risk features. Tracking stops as soon as your journey completes.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.5rem', borderRadius: '10px' }}>
            <EyeOff size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Zero Continuous Audio Upload</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.4 }}>
              Audio is never uploaded or monitored in the background. Voice activation processes speech locally on your device only when voice trigger testing is engaged.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#fff7ed', color: '#ea580c', padding: '0.5rem', borderRadius: '10px' }}>
            <Lock size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>User-Controlled Evidence Capture</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.4 }}>
              Incident photos and audio snippets are captured strictly when you press the capture button. You retain full control to view or purge evidence at any time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f8fafc', color: '#475569', padding: '0.5rem', borderRadius: '10px' }}>
            <Server size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>End-to-End Encryption</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.4 }}>
              All telemetry, REST API requests, and Socket.IO real-time location streams are transmitted over secure HTTPS / WSS protocols with zero third-party data selling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
