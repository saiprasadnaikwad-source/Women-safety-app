import React from 'react';
import { Phone, ShieldAlert, Check } from 'lucide-react';

interface AlertsTableProps {
  alerts?: any[];
  onSelectAlert?: (alert: any) => void;
  onResolveAlert?: (sosId: string) => void;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts = [], onSelectAlert, onResolveAlert }) => {
  const alertList = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Transport / Destination</th>
            <th>Trigger Reason</th>
            <th>Risk Score</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alertList.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No active emergency alerts detected. All journeys running smoothly.
              </td>
            </tr>
          ) : (
            alertList.map((alertItem, idx) => {
              if (!alertItem || typeof alertItem !== 'object') return null;

              // Defensive Property Normalization
              const alertId = alertItem.emergencyId || alertItem.id || alertItem._id || `emg_${idx}`;
              const userName = alertItem.userName || 'Passenger';
              const userPhone = alertItem.userPhone || 'Not available';
              const transportType = alertItem.transportType || (alertItem.safeLocation?.name ? `Safe Route to ${alertItem.safeLocation.name}` : 'Emergency Transport');
              const triggerReason = alertItem.triggerType || alertItem.triggerReason || alertItem.activationMethod || 'Emergency SOS';
              
              const rawRiskLevel = typeof alertItem.riskLevel === 'string' ? alertItem.riskLevel : undefined;
              const riskScore = typeof alertItem.riskScore === 'number' ? alertItem.riskScore : 95;
              const riskLevel = (rawRiskLevel || (riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'CRITICAL')).toUpperCase();
              const riskLevelClass = riskLevel.toLowerCase();

              const rawStatus = typeof alertItem.emergencyStatus === 'string' ? alertItem.emergencyStatus : typeof alertItem.status === 'string' ? alertItem.status : 'ACTIVE';
              const status = rawStatus.toUpperCase();

              let formattedTime = 'Just now';
              try {
                const rawTime = alertItem.lastLocationUpdate || alertItem.startedAt || alertItem.timestamp || Date.now();
                formattedTime = new Date(rawTime).toLocaleTimeString();
              } catch (e) {
                formattedTime = 'Just now';
              }

              const lat = alertItem.currentLocation?.latitude ?? alertItem.latitude ?? 18.5284;
              const lng = alertItem.currentLocation?.longitude ?? alertItem.longitude ?? 73.8739;

              return (
                <tr 
                  key={alertId} 
                  onClick={() => onSelectAlert && onSelectAlert(alertItem)} 
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <strong>{userName}</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{userPhone}</span>
                  </td>
                  <td>{transportType}</td>
                  <td>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{triggerReason}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${riskLevelClass}`}>
                      {riskScore} / 100 ({riskLevel})
                    </span>
                  </td>
                  <td>{formattedTime}</td>
                  <td>
                    <span className={`badge ${status === 'ACTIVE' || status === 'LIVE_LOCATION_ACTIVE' ? 'badge-critical' : 'badge-low'}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-danger" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          window.alert(`Dispatching Emergency Police to GPS (${lat}, ${lng})`); 
                        }}
                        title="Dispatch Emergency"
                      >
                        <ShieldAlert size={14} /> Dispatch
                      </button>

                      <button 
                        className="btn btn-secondary" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (userPhone && userPhone !== 'Not available') {
                            window.location.href = `tel:${userPhone}`;
                          } else {
                            window.location.href = 'tel:112';
                          }
                        }}
                        title="Call User"
                      >
                        <Phone size={14} /> Call
                      </button>

                      {(status === 'ACTIVE' || status === 'LIVE_LOCATION_ACTIVE') && onResolveAlert && (
                        <button 
                          className="btn btn-primary"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onResolveAlert(alertId); 
                          }}
                          title="Resolve Emergency"
                        >
                          <Check size={14} /> Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
