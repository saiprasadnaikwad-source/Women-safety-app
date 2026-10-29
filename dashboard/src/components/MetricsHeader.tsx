import React from 'react';
import { Navigation, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MetricsProps {
  metrics: {
    activeJourneysCount: number;
    activeAlertsCount: number;
    highRiskEventsCount: number;
    resolvedIncidentsCount: number;
  };
}

export const MetricsHeader: React.FC<MetricsProps> = ({ metrics }) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-info">
          <h4>Active Journeys</h4>
          <div className="value">{metrics.activeJourneysCount}</div>
        </div>
        <div className="metric-icon blue">
          <Navigation size={24} />
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-info">
          <h4>Active SOS Alerts</h4>
          <div className="value" style={{ color: metrics.activeAlertsCount > 0 ? '#dc2626' : undefined }}>
            {metrics.activeAlertsCount}
          </div>
        </div>
        <div className="metric-icon red">
          <AlertTriangle size={24} />
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-info">
          <h4>High-Risk ML Events</h4>
          <div className="value">{metrics.highRiskEventsCount}</div>
        </div>
        <div className="metric-icon orange">
          <ShieldCheck size={24} />
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-info">
          <h4>Resolved Incidents</h4>
          <div className="value">{metrics.resolvedIncidentsCount}</div>
        </div>
        <div className="metric-icon green">
          <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
};
