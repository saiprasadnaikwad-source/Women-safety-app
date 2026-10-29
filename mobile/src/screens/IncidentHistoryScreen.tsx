import React, { useState } from 'react';
import { Activity, Camera, Mic, ShieldAlert, CheckCircle, Lock } from 'lucide-react';

export const IncidentHistoryScreen: React.FC = () => {
  const [incidents, setIncidents] = useState([
    {
      _id: 'inc_901',
      type: 'Route Corridor Deviation',
      description: 'Vehicle deviated 780m outside expected corridor near Aundh Flyover.',
      date: '10 Sep 2026, 8:34 PM',
      status: 'Resolved',
      hasEvidence: true
    },
    {
      _id: 'inc_902',
      type: 'Prolonged Unscheduled Stop',
      description: 'Stopped for 18 minutes on isolated bypass road.',
      date: '04 Sep 2026, 9:15 PM',
      status: 'Resolved',
      hasEvidence: false
    }
  ]);

  const [recordingAudio, setRecordingAudio] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(false);

  const handleCapturePhoto = () => {
    setCapturedPhoto(true);
    alert('Evidence photo snapshot captured and encrypted locally.');
  };

  const handleToggleAudio = () => {
    setRecordingAudio(!recordingAudio);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Incident History</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Audit trail of safety alerts & captured evidence</p>
      </div>

      {/* Emergency Evidence Capture Control */}
      <div className="card" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldAlert size={20} color="#ea580c" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9a3412' }}>Discreet Evidence Capture</h3>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#7c2d12', marginBottom: '0.85rem' }}>
          Capture incident photo or short audio snippet. Audio is recorded only when explicitly activated by you.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-large btn-secondary" 
            onClick={handleCapturePhoto}
            style={{ fontSize: '0.8rem', padding: '0.6rem' }}
          >
            <Camera size={16} color="#ea580c" /> {capturedPhoto ? 'Photo Captured ✓' : 'Take Photo'}
          </button>
          
          <button 
            className={`btn-large ${recordingAudio ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleToggleAudio}
            style={{ fontSize: '0.8rem', padding: '0.6rem' }}
          >
            <Mic size={16} /> {recordingAudio ? 'Recording Audio...' : 'Record Audio'}
          </button>
        </div>
      </div>

      {/* Incident List */}
      {incidents.map(inc => (
        <div key={inc._id} className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{inc.type}</h4>
            <span className="badge-pill badge-green" style={{ fontSize: '0.68rem' }}>
              <CheckCircle size={12} /> {inc.status}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.5rem', lineHeight: 1.4 }}>
            {inc.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>{inc.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a' }}>
              <Lock size={12} /> Encrypted Record
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
