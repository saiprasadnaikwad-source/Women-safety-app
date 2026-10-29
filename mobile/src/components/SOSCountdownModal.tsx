import React, { useEffect, useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface SOSCountdownProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const SOSCountdownModal: React.FC<SOSCountdownProps> = ({ onConfirm, onCancel }) => {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) {
      onConfirm();
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onConfirm]);

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ border: '2px solid #dc2626' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          animation: 'pulse 1s infinite'
        }}>
          <AlertOctagon size={40} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', marginBottom: '0.25rem' }}>
          Activating Emergency SOS
        </h3>
        
        <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0' }}>
          {seconds}
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Broadcasting live location to trusted contacts and authority dashboard...
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn-large btn-danger" onClick={onConfirm}>
            Send SOS Immediately
          </button>
          <button className="btn-large btn-secondary" onClick={onCancel}>
            <X size={18} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
