import React from 'react';
import { Cpu, CheckCircle } from 'lucide-react';

interface MLTelemetryProps {
  selectedIncident?: any;
}

export const MLTelemetryPanel: React.FC<MLTelemetryProps> = ({ selectedIncident }) => {
  const features = selectedIncident?.mlBreakdown?.features || {
    distance_from_route_m: 842,
    speed_kmh: 7.8,
    stop_duration_min: 13.0,
    direction_change_deg: 124,
    journey_delay_min: 19.0,
    distance_to_destination_km: 7.2
  };

  const riskScore = selectedIncident?.mlBreakdown?.riskScore || 82;
  const status = selectedIncident?.mlBreakdown?.anomalyStatus || 'ANOMALY';

  return (
    <div className="card">
      <div className="card-header">
        <h3><Cpu size={18} style={{ display: 'inline', marginRight: '6px', color: '#2563eb' }} /> ML Anomaly Telemetry</h3>
        <span className="badge badge-critical" style={{ fontSize: '0.8rem' }}>Isolation Forest Active</span>
      </div>

      <div style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Real-time 6-feature vector ingested into Python Scikit-Learn Isolation Forest model:
        </p>

        <div className="ml-box">
          <div>Distance from route: <strong>{features.distance_from_route_m} m</strong> {features.distance_from_route_m > 500 ? '(Breached 0.5km Corridor)' : ''}</div>
          <div>Speed: <strong>{features.speed_kmh} km/h</strong></div>
          <div>Stop duration: <strong>{features.stop_duration_min} min</strong></div>
          <div>Direction change: <strong>{features.direction_change_deg}°</strong></div>
          <div>Journey delay: <strong>{features.journey_delay_min} min</strong></div>
          <div>Distance to destination: <strong>{features.distance_to_destination_km} km</strong></div>
          <br />
          <div>Isolation Forest: <span style={{ color: status === 'ANOMALY' ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>{status}</span></div>
          <div>Calculated Risk Score: <strong style={{ color: '#f87171', fontSize: '1.1rem' }}>{riskScore} / 100</strong></div>
          <div>Risk Level: <strong style={{ color: '#f87171' }}>CRITICAL</strong></div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Staged Escalation Status:</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle size={16} /> Stage 3 — High-Risk Anomaly Escalated to Authority Desk
          </div>
        </div>
      </div>
    </div>
  );
};
