import React, { useState } from 'react';
import { ShieldAlert, MapPin, Phone, CheckCircle, Navigation, ExternalLink, Filter, Search, X, Radio, AlertTriangle } from 'lucide-react';
import { MapComponent } from '../components/MapComponent';

interface ActiveEmergenciesScreenProps {
  emergencySessions: any[];
  onResolveEmergency: (emergencyId: string) => void;
}

export const ActiveEmergenciesScreen: React.FC<ActiveEmergenciesScreenProps> = ({
  emergencySessions,
  onResolveEmergency
}) => {
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [triggerFilter, setTriggerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Filter Active Emergencies
  const activeEmergencies = emergencySessions.filter((s) => {
    if (s.emergencyStatus === 'RESOLVED' || s.liveLocationEnabled === false) return false;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.emergencyId && s.emergencyId.toLowerCase().includes(q)) ||
      (s.userName && s.userName.toLowerCase().includes(q)) ||
      (s.safeLocation?.name && s.safeLocation.name.toLowerCase().includes(q));

    const matchesSeverity =
      severityFilter === 'ALL' ||
      (s.riskLevel && s.riskLevel.toUpperCase() === severityFilter) ||
      (severityFilter === 'CRITICAL');

    const matchesTrigger =
      triggerFilter === 'ALL' ||
      (s.triggerType && s.triggerType.toLowerCase().includes(triggerFilter.toLowerCase()));

    return matchesSearch && matchesSeverity && matchesTrigger;
  });

  const handleMarkResponding = (emergencyId: string) => {
    setRespondingId(emergencyId);
    alert(`Authority Emergency Command unit dispatched for ${emergencyId}. Status updated to RESPONDING.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: activeEmergencies.length > 0 ? '#fef2f2' : '#ffffff', border: activeEmergencies.length > 0 ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: activeEmergencies.length > 0 ? '#991b1b' : '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <ShieldAlert size={26} color="#dc2626" style={{ animation: activeEmergencies.length > 0 ? 'pulse 1s infinite' : 'none' }} /> ACTIVE EMERGENCY ALERTS
            </h2>
            <p style={{ fontSize: '0.82rem', color: activeEmergencies.length > 0 ? '#7f1d1d' : '#64748b', margin: '0.25rem 0 0' }}>
              Real-time emergency escalation feed, nearest police station routing & live GPS tracking
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, backgroundColor: activeEmergencies.length > 0 ? '#dc2626' : '#16a34a', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '9999px' }}>
              Active Emergencies: {activeEmergencies.length}
            </span>
          </div>
        </div>

        {/* Search & Severity Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Emergency ID, Passenger, Police Station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  backgroundColor: severityFilter === sev ? '#dc2626' : '#f8fafc',
                  color: severityFilter === sev ? '#ffffff' : '#475569',
                  border: `1px solid ${severityFilter === sev ? '#dc2626' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Emergency Live Map & Active Emergency Feed */}
      <div className="dashboard-split">
        {/* Live Emergency Map */}
        <div className="card">
          <div className="card-header">
            <h3>Emergency GPS Live Map & Police Station Route</h3>
            <span className="badge badge-critical">Live WebSockets Syncing</span>
          </div>
          <div style={{ padding: '1rem' }}>
            <MapComponent emergencySessions={activeEmergencies} selectedIncident={selectedEmergency} />
          </div>
        </div>

        {/* Active Emergency Feed List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>Active Emergency Feed ({activeEmergencies.length})</h3>
            <span className="badge badge-critical">Real-Time</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {activeEmergencies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 800, color: '#16a34a', margin: 0, fontSize: '1rem' }}>No active emergency alerts.</p>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>All journeys are currently running smoothly under active protection.</span>
              </div>
            ) : (
              activeEmergencies.map((emg) => (
                <div
                  key={emg.emergencyId}
                  onClick={() => setSelectedEmergency(emg)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ef4444',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#dc2626' }}>
                      Emergency ID: {emg.emergencyId}
                    </strong>
                    <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                      {emg.triggerType || 'MANUAL_SOS'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    <div>👤 <strong>Passenger:</strong> {emg.userName || 'Passenger'} {emg.userPhone ? `(${emg.userPhone})` : ''}</div>
                    <div>📍 <strong>GPS Coordinates:</strong> {emg.currentLocation?.latitude?.toFixed(4)}, {emg.currentLocation?.longitude?.toFixed(4)} (Accuracy: {emg.currentLocation?.accuracy || 8}m)</div>
                    <div>🚔 <strong>Nearest Safe Location:</strong> <strong style={{ color: '#1e3a8a' }}>{emg.safeLocation?.name}</strong></div>
                    <div>🛣️ <strong>Road Distance:</strong> <strong style={{ color: '#2563eb' }}>{emg.routeDistanceKm} km</strong> • ⏱️ <strong>ETA:</strong> ~{emg.estimatedDurationMinutes} mins</div>
                    <div>📡 <strong>Live Sharing:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>ACTIVE</span></div>
                    {respondingId === emg.emergencyId && (
                      <div style={{ color: '#2563eb', fontWeight: 800, marginTop: '0.2rem' }}>
                        🛡️ Authority Status: RESPONDING
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => { e.stopPropagation(); setSelectedEmergency(emg); }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                    >
                      <MapPin size={12} /> View Details
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => { e.stopPropagation(); window.location.href = 'tel:112'; }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                    >
                      <Phone size={12} /> Call 112
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={(e) => { e.stopPropagation(); onResolveEmergency(emg.emergencyId); }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                    >
                      <CheckCircle size={12} /> Resolve Alert
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Emergencies Table */}
      <div className="card">
        <div className="card-header">
          <h3>Active Emergency Alerts Command Matrix</h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Emergency ID</th>
                <th>Passenger & Phone</th>
                <th>Trigger Reason</th>
                <th>Current GPS</th>
                <th>Nearest Safe Location</th>
                <th>Road Distance</th>
                <th>ETA</th>
                <th>Live Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No active emergency alerts.
                  </td>
                </tr>
              ) : (
                activeEmergencies.map((emg) => (
                  <tr key={emg.emergencyId} onClick={() => setSelectedEmergency(emg)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong style={{ color: '#dc2626' }}>{emg.emergencyId}</strong>
                    </td>
                    <td>
                      <strong>{emg.userName || 'Passenger'}</strong>
                      <br />
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{emg.userPhone || ''}</span>
                    </td>
                    <td>
                      <span className="badge badge-critical">{emg.triggerType}</span>
                    </td>
                    <td>
                      {emg.currentLocation?.latitude?.toFixed(4)}, {emg.currentLocation?.longitude?.toFixed(4)}
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a' }}>{emg.safeLocation?.name}</strong>
                      <br />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{emg.safeLocation?.address}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{emg.routeDistanceKm} km</strong>
                    </td>
                    <td>~{emg.estimatedDurationMinutes} mins</td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem' }}>
                        ● LIVE ACTIVE
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => { e.stopPropagation(); handleMarkResponding(emg.emergencyId); }}
                          title="Mark Responding"
                        >
                          <ShieldAlert size={14} /> Responding
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={(e) => { e.stopPropagation(); onResolveEmergency(emg.emergencyId); }}
                          title="Resolve Emergency"
                        >
                          <CheckCircle size={14} /> Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Detailed Modal */}
      {selectedEmergency && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '650px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #ef4444', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#dc2626', textTransform: 'uppercase' }}>
                  🚨 ACTIVE EMERGENCY CONTROL SHEET
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
                  Emergency ID: {selectedEmergency.emergencyId}
                </h3>
              </div>
              <button onClick={() => setSelectedEmergency(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '0.85rem', borderRadius: '12px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                <div>👤 <strong>Passenger:</strong> {selectedEmergency.userName || 'Passenger'}</div>
                <div>📞 <strong>Phone:</strong> {selectedEmergency.userPhone || 'N/A'}</div>
                <div>⚡ <strong>Trigger Type:</strong> <span className="badge badge-critical">{selectedEmergency.triggerType}</span></div>
                <div>📍 <strong>Current Coordinates:</strong> {selectedEmergency.currentLocation?.latitude?.toFixed(5)}, {selectedEmergency.currentLocation?.longitude?.toFixed(5)}</div>
                <div>🎯 <strong>Location Accuracy:</strong> {selectedEmergency.currentLocation?.accuracy || 8} meters</div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.85rem', borderRadius: '12px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                <div>🚔 <strong>Destination Safe Location:</strong> <strong style={{ color: '#1e3a8a' }}>{selectedEmergency.safeLocation?.name}</strong></div>
                <div>📍 <strong>Safe Location Address:</strong> {selectedEmergency.safeLocation?.address}</div>
                <div>🛣️ <strong>Road Distance:</strong> <strong style={{ color: '#2563eb' }}>{selectedEmergency.routeDistanceKm} km</strong></div>
                <div>⏱️ <strong>ETA:</strong> ~{selectedEmergency.estimatedDurationMinutes} mins</div>
                <div>📡 <strong>Live Location Stream:</strong> <span style={{ color: '#16a34a', fontWeight: 800 }}>ACTIVE</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-large btn-danger"
                onClick={() => window.location.href = 'tel:112'}
                style={{ flex: 1 }}
              >
                📞 Contact Emergency Services (112)
              </button>
              <button
                className="btn-large btn-primary"
                onClick={() => {
                  const id = selectedEmergency.emergencyId;
                  setSelectedEmergency(null);
                  onResolveEmergency(id);
                }}
                style={{ flex: 1 }}
              >
                <CheckCircle size={18} /> Resolve & Move to Audit Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
