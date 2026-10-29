import React, { useState } from 'react';
import { FileText, Search, Filter, Calendar, CheckCircle, Clock, MapPin, Eye, X, ShieldAlert, Cpu } from 'lucide-react';
import { MapComponent } from '../components/MapComponent';

interface IncidentAuditsScreenProps {
  incidents: any[];
}

export const IncidentAuditsScreen: React.FC<IncidentAuditsScreenProps> = ({ incidents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [selectedTriggerFilter, setSelectedTriggerFilter] = useState('ALL');
  const [inspectIncident, setInspectIncident] = useState<any | null>(null);

  // Filter Incidents
  const filteredIncidents = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (inc._id && inc._id.toLowerCase().includes(q)) ||
      (inc.emergencyId && inc.emergencyId.toLowerCase().includes(q)) ||
      (inc.userName && inc.userName.toLowerCase().includes(q)) ||
      (inc.vehicleId && inc.vehicleId.toLowerCase().includes(q)) ||
      (inc.type && inc.type.toLowerCase().includes(q));

    const matchesRisk =
      selectedRiskFilter === 'ALL' ||
      (inc.riskLevel && inc.riskLevel.toUpperCase() === selectedRiskFilter);

    const matchesTrigger =
      selectedTriggerFilter === 'ALL' ||
      (inc.type && inc.type.toLowerCase().includes(selectedTriggerFilter.toLowerCase()));

    return matchesSearch && matchesRisk && matchesTrigger;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FileText size={24} color="#2563eb" /> INCIDENT AUDITS & SAFETY ARCHIVE
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Historical incident records, safety timelines, and Isolation Forest ML feature archives
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.4rem 0.85rem', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
              Resolved Incidents: {incidents.length}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Incident ID, Emergency ID, Vehicle, User..."
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

          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRiskFilter(risk)}
                style={{
                  backgroundColor: selectedRiskFilter === risk ? '#0f172a' : '#f8fafc',
                  color: selectedRiskFilter === risk ? '#ffffff' : '#475569',
                  border: `1px solid ${selectedRiskFilter === risk ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <h3>Historical Incident Audits Log</h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Emergency / Journey</th>
                <th>Passenger & Vehicle</th>
                <th>Trigger Event</th>
                <th>Risk Level</th>
                <th>Location & Safe Destination</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
                    <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: 700, margin: 0 }}>No incident records found.</p>
                    <span style={{ fontSize: '0.78rem' }}>Historical incidents will appear here when emergencies are resolved.</span>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc._id} onClick={() => setInspectIncident(inc)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong>{inc._id}</strong>
                      <br />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(inc.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>{inc.emergencyId || 'N/A'}</span>
                      <br />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Trip: {inc.tripId || 'trip_demo_501'}</span>
                    </td>
                    <td>
                      <strong>{inc.userName || 'Ishwari Gade'}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{inc.vehicleId || 'BUS-102'} ({inc.userPhone || '+91 9876543210'})</span>
                    </td>
                    <td>{inc.type}</td>
                    <td>
                      <span className={`badge badge-${(inc.riskLevel || 'HIGH').toLowerCase()}`}>
                        {inc.riskLevel || 'HIGH'} ({inc.riskScore || 78}/100)
                      </span>
                    </td>
                    <td>
                      <MapPin size={12} color="#64748b" style={{ display: 'inline', marginRight: '3px' }} />
                      <strong>{inc.safeLocation?.name || inc.location?.address || 'Police Station'}</strong>
                    </td>
                    <td>{inc.durationMinutes || 15} mins</td>
                    <td>
                      <span className="badge badge-low">
                        <CheckCircle size={10} style={{ marginRight: '3px' }} /> {inc.status || 'Resolved'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => { e.stopPropagation(); setInspectIncident(inc); }}
                      >
                        <Eye size={14} /> Audit Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Incident Audit Modal */}
      {inspectIncident && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '750px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                  ✓ RESOLVED INCIDENT AUDIT REPORT
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Incident ID: {inspectIncident._id}
                </h3>
              </div>
              <button onClick={() => setInspectIncident(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Audit Top Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '12px', fontSize: '0.82rem', lineHeight: 1.6, border: '1px solid #cbd5e1' }}>
                <div>🆔 <strong>Emergency Session ID:</strong> {inspectIncident.emergencyId || 'EMG-2026-1014'}</div>
                <div>👤 <strong>Passenger:</strong> {inspectIncident.userName} ({inspectIncident.userPhone})</div>
                <div>🚌 <strong>Vehicle:</strong> {inspectIncident.vehicleId || 'BUS-102'}</div>
                <div>⚡ <strong>Trigger Event:</strong> {inspectIncident.type}</div>
                <div>🛡️ <strong>Risk Severity:</strong> <span className={`badge badge-${(inspectIncident.riskLevel || 'HIGH').toLowerCase()}`}>{inspectIncident.riskLevel} ({inspectIncident.riskScore}/100)</span></div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '12px', fontSize: '0.82rem', lineHeight: 1.6, border: '1px solid #cbd5e1' }}>
                <div>🚔 <strong>Assigned Safe Location:</strong> <strong style={{ color: '#1e3a8a' }}>{inspectIncident.safeLocation?.name || 'Shivajinagar Police Station'}</strong></div>
                <div>📍 <strong>Incident Location:</strong> {inspectIncident.location?.address || 'Aundh Bypass Road, Pune'}</div>
                <div>🕒 <strong>Started At:</strong> {new Date(inspectIncident.createdAt).toLocaleString()}</div>
                <div>✅ <strong>Resolved At:</strong> {new Date(inspectIncident.resolvedAt || Date.now()).toLocaleString()}</div>
                <div>⏱️ <strong>Total Incident Duration:</strong> {inspectIncident.durationMinutes || 15} minutes</div>
              </div>
            </div>

            {/* SAFETY EVENTS TIMELINE */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} color="#2563eb" /> SAFETY EVENTS TIMELINE
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                {(inspectIncident.safetyEvents || [
                  { time: '12:01:00 AM', event: 'Journey started from Pune Central Station' },
                  { time: '12:12:30 AM', event: 'Vehicle deviated 780m outside 0.5km route corridor' },
                  { time: '12:13:00 AM', event: 'Isolation Forest ML model flagged ANOMALY (Risk Score: 78)' },
                  { time: '12:13:15 AM', event: 'Emergency Session activated' },
                  { time: '12:13:30 AM', event: 'Nearest safe police station identified' },
                  { time: '12:14:00 AM', event: 'Live GPS location shared with Authority Dashboard' },
                  { time: '12:16:00 AM', event: 'Emergency resolved safely by user confirmation' }
                ]).map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b', minWidth: '85px' }}>{item.time}</span>
                    <span style={{ color: '#334155' }}>• {item.event}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SIX ML FEATURES BREAKDOWN AT INCIDENT TIME */}
            <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Cpu size={16} /> ISOLATION FOREST 6-FEATURE METRICS AT DETECTION TIME
                </span>
                <span className={`badge ${inspectIncident.isolationForestStatus === 'ANOMALY' ? 'badge-critical' : 'badge-low'}`}>
                  Isolation Forest: {inspectIncident.isolationForestStatus || 'ANOMALY'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                <div>1. distance_from_route_m: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.distance_from_route_m || 780} m</span></div>
                <div>2. speed_kmh: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.speed_kmh || 12.4} km/h</span></div>
                <div>3. stop_duration_min: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.stop_duration_min || 6.5} min</span></div>
                <div>4. direction_change_deg: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.direction_change_deg || 45.0}°</span></div>
                <div>5. journey_delay_min: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.journey_delay_min || 12.0} min</span></div>
                <div>6. distance_to_destination_km: <span style={{ color: '#4ade80' }}>{inspectIncident.mlFeatures?.distance_to_destination_km || 8.4} km</span></div>
              </div>
            </div>

            <button className="btn-large btn-primary" onClick={() => setInspectIncident(null)}>
              Close Incident Audit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
