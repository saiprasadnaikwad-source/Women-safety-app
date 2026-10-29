import React, { useState } from 'react';
import { Navigation, Search, Filter, Bug, ShieldAlert, CheckCircle, Clock, MapPin, Eye, X, Activity } from 'lucide-react';
import { MapComponent } from '../components/MapComponent';

interface LiveJourneysScreenProps {
  journeys: any[];
  onSelectJourney?: (journey: any) => void;
}

export const LiveJourneysScreen: React.FC<LiveJourneysScreenProps> = ({
  journeys,
  onSelectJourney
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [inspectJourney, setInspectJourney] = useState<any | null>(null);

  // Filter Journeys
  const filteredJourneys = journeys.filter((j) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (j._id && j._id.toLowerCase().includes(q)) ||
      (j.vehicleId && j.vehicleId.toLowerCase().includes(q)) ||
      (j.userName && j.userName.toLowerCase().includes(q)) ||
      (j.destination?.name && j.destination.name.toLowerCase().includes(q));

    const matchesRisk =
      selectedRiskFilter === 'ALL' ||
      (j.safetyStatus && j.safetyStatus.toUpperCase() === selectedRiskFilter);

    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Navigation size={24} color="#2563eb" /> LIVE JOURNEY TRACKING
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Real-time corridor telemetry & Isolation Forest anomaly monitoring for active public transit
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.4rem 0.85rem', borderRadius: '9999px', border: '1px solid #bfdbfe' }}>
              Active Journeys: {journeys.length}
            </span>
          </div>
        </div>

        {/* Search & Risk Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Journey ID, Vehicle, Passenger, Destination..."
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
            {['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedRiskFilter(level)}
                style={{
                  backgroundColor: selectedRiskFilter === level ? '#2563eb' : '#f8fafc',
                  color: selectedRiskFilter === level ? '#ffffff' : '#475569',
                  border: `1px solid ${selectedRiskFilter === level ? '#2563eb' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Live Interactive Map & Journeys Table */}
      <div className="dashboard-split">
        {/* Live Map Panel */}
        <div className="card">
          <div className="card-header">
            <h3>Live Vehicle Movement & Corridor Map</h3>
            <span className="badge badge-low">Geofence Envelope: 0.5 km (500m)</span>
          </div>
          <div style={{ padding: '1rem' }}>
            <MapComponent activeJourneys={filteredJourneys} selectedIncident={inspectJourney} />
          </div>
        </div>

        {/* Active Journeys Summary List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>Active Vehicle Telemetry ({filteredJourneys.length})</h3>
            <span className="badge badge-low">WebSockets Active</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredJourneys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Navigation size={36} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 700, margin: 0 }}>No active journeys currently.</p>
                <span style={{ fontSize: '0.78rem' }}>Vehicles will appear live when journeys start.</span>
              </div>
            ) : (
              filteredJourneys.map((j) => (
                <div
                  key={j._id}
                  onClick={() => setInspectJourney(j)}
                  style={{
                    backgroundColor: inspectJourney?._id === j._id ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${inspectJourney?._id === j._id ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{j.vehicleId || 'BUS-102'}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>({j.userName})</span>
                    </div>

                    <span className={`badge badge-${(j.safetyStatus || 'LOW').toLowerCase()}`}>
                      {j.safetyStatus || 'LOW'} ({j.riskScore || 12}/100)
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                    <div>🎯 <strong>Destination:</strong> {j.destination?.name || 'Destination'}</div>
                    <div>🛣️ <strong>Remaining Distance:</strong> {j.remainingDistanceKm || 14.8} km • ⏱️ <strong>ETA:</strong> ~{j.etaMinutes || 25} min</div>
                    <div>🚗 <strong>Speed:</strong> {j.speedKmh || 38} km/h • 📐 <strong>Route Offset:</strong> {j.distFromRouteMeters || 12} m</div>
                    <div>🔄 <strong>Corridor Status:</strong> <span style={{ color: j.distFromRouteMeters > 500 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{j.distFromRouteMeters > 500 ? 'OFF ROUTE' : 'ON ROUTE'}</span></div>
                  </div>

                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                    <span>Updated: {new Date(j.lastUpdated || Date.now()).toLocaleTimeString()}</span>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => { e.stopPropagation(); setInspectJourney(j); }}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      <Eye size={12} /> Inspect ML Telemetry
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Journeys Full Data Table */}
      <div className="card">
        <div className="card-header">
          <h3>Active Journeys Control Matrix</h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Journey ID</th>
                <th>Vehicle & Passenger</th>
                <th>Destination</th>
                <th>Current Speed</th>
                <th>Remaining Road</th>
                <th>ETA</th>
                <th>Corridor Offset</th>
                <th>Route Status</th>
                <th>Safety Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJourneys.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No active journeys currently matching search filters.
                  </td>
                </tr>
              ) : (
                filteredJourneys.map((j) => (
                  <tr key={j._id} onClick={() => setInspectJourney(j)} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong>{j._id}</strong>
                    </td>
                    <td>
                      <strong>{j.vehicleId || 'BUS-102'}</strong>
                      <br />
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{j.userName} ({j.userPhone})</span>
                    </td>
                    <td>{j.destination?.name || 'Destination'}</td>
                    <td>{j.speedKmh || 38.5} km/h</td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{j.remainingDistanceKm} km</strong>
                    </td>
                    <td>~{j.etaMinutes} mins</td>
                    <td>
                      <span style={{ color: j.distFromRouteMeters > 500 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {j.distFromRouteMeters} m
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${j.distFromRouteMeters > 500 ? 'badge-critical' : 'badge-low'}`}>
                        {j.distFromRouteMeters > 500 ? 'OFF ROUTE' : 'ON ROUTE'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${(j.safetyStatus || 'LOW').toLowerCase()}`}>
                        {j.safetyStatus || 'LOW'} ({j.riskScore}/100)
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => { e.stopPropagation(); setInspectJourney(j); }}
                      >
                        <Eye size={14} /> Telemetry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect ML Telemetry Modal */}
      {inspectJourney && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '650px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                  Journey Telemetry & Isolation Forest Audit
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {inspectJourney.vehicleId || 'BUS-102'} — {inspectJourney._id}
                </h3>
              </div>
              <button onClick={() => setInspectJourney(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <div>👤 <strong>Passenger:</strong> {inspectJourney.userName} ({inspectJourney.userPhone})</div>
                <div>🎯 <strong>Destination:</strong> {inspectJourney.destination?.name}</div>
                <div>🛣️ <strong>Remaining Distance:</strong> {inspectJourney.remainingDistanceKm} km</div>
                <div>⏱️ <strong>ETA:</strong> {inspectJourney.etaMinutes} mins</div>
                <div>🏎️ <strong>Speed:</strong> {inspectJourney.speedKmh} km/h</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <div>📐 <strong>Corridor Offset:</strong> {inspectJourney.distFromRouteMeters} m</div>
                <div>🔄 <strong>Route Status:</strong> <strong style={{ color: inspectJourney.distFromRouteMeters > 500 ? '#dc2626' : '#16a34a' }}>{inspectJourney.distFromRouteMeters > 500 ? 'OFF ROUTE (>500m)' : 'ON ROUTE'}</strong></div>
                <div>🛡️ <strong>Risk Score:</strong> {inspectJourney.riskScore}/100 ({inspectJourney.safetyStatus})</div>
                <div>🕒 <strong>Last GPS Update:</strong> {new Date(inspectJourney.lastUpdated || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* SIX ML FEATURES BREAKDOWN */}
            <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                  🧠 ISOLATION FOREST 6-FEATURE VECTOR BREAKDOWN
                </span>
                <span className={`badge ${inspectJourney.isolationForestPrediction === 'ANOMALY' ? 'badge-critical' : 'badge-low'}`}>
                  Prediction: {inspectJourney.isolationForestPrediction || 'NORMAL'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                <div>1. distance_from_route_m: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.distance_from_route_m || 14} m</span></div>
                <div>2. speed_kmh: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.speed_kmh || 38.5} km/h</span></div>
                <div>3. stop_duration_min: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.stop_duration_min || 0.0} min</span></div>
                <div>4. direction_change_deg: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.direction_change_deg || 4.0}°</span></div>
                <div>5. journey_delay_min: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.journey_delay_min || 0.5} min</span></div>
                <div>6. distance_to_destination_km: <span style={{ color: '#4ade80' }}>{inspectJourney.mlFeatures?.distance_to_destination_km || 14.8} km</span></div>
              </div>
            </div>

            <button className="btn-large btn-primary" onClick={() => setInspectJourney(null)}>
              Close Telemetry Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
