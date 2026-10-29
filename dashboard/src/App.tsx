import React, { useEffect, useState } from 'react';
import { Shield, Navigation, AlertTriangle, FileText, Activity, RefreshCw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { MetricsHeader } from './components/MetricsHeader';
import { MapComponent } from './components/MapComponent';
import { AlertsTable } from './components/AlertsTable';
import { MLTelemetryPanel } from './components/MLTelemetryPanel';
import { LiveJourneysScreen } from './screens/LiveJourneysScreen';
import { ActiveEmergenciesScreen } from './screens/ActiveEmergenciesScreen';
import { IncidentAuditsScreen } from './screens/IncidentAuditsScreen';

const BACKEND_URL = 'http://localhost:5000';

export function App() {
  const [activeModule, setActiveModule] = useState<'overview' | 'journeys' | 'emergencies' | 'incidents'>('overview');

  const [metrics, setMetrics] = useState({
    activeJourneysCount: 0,
    activeAlertsCount: 0,
    highRiskEventsCount: 0,
    resolvedIncidentsCount: 0
  });

  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [emergencySessions, setEmergencySessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Sync client-side URL path on mount & tab click
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/live-journeys')) setActiveModule('journeys');
    else if (path.includes('/emergency-alerts')) setActiveModule('emergencies');
    else if (path.includes('/incident-audits')) setActiveModule('incidents');
    else setActiveModule('overview');
  }, []);

  const navigateToModule = (module: 'overview' | 'journeys' | 'emergencies' | 'incidents') => {
    setActiveModule(module);
    const pathMap = {
      overview: '/dashboard',
      journeys: '/live-journeys',
      emergencies: '/emergency-alerts',
      incidents: '/incident-audits'
    };
    window.history.pushState({}, '', pathMap[module]);
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const overviewRes = await axios.get(`${BACKEND_URL}/api/dashboard`);
      const journeysRes = await axios.get(`${BACKEND_URL}/api/dashboard/journeys`);
      setActiveJourneys(journeysRes.data || overviewRes.data.activeJourneys || []);

      const emgRes = await axios.get(`${BACKEND_URL}/api/emergency/active/all`);
      const activeEmgs = (emgRes.data && Array.isArray(emgRes.data))
        ? emgRes.data.filter((s: any) => s.emergencyStatus !== 'RESOLVED' && s.liveLocationEnabled)
        : [];
      setEmergencySessions(activeEmgs);

      const alertsRes = await axios.get(`${BACKEND_URL}/api/dashboard/alerts`);
      setAlerts(alertsRes.data || []);

      const incRes = await axios.get(`${BACKEND_URL}/api/dashboard/incidents`);
      setIncidents(incRes.data || []);

      setMetrics({
        activeJourneysCount: (journeysRes.data || overviewRes.data.activeJourneys || []).length,
        activeAlertsCount: activeEmgs.length || (alertsRes.data || []).length,
        highRiskEventsCount: activeEmgs.filter((s: any) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length || 1,
        resolvedIncidentsCount: (incRes.data || []).length
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.warn('[DASHBOARD API] Backend offline.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-poll every 5 seconds silently (no loading spinner)
    const pollInterval = setInterval(() => fetchDashboardData(true), 5000);

    // Setup Socket.IO real-time connection
    const socket: Socket = io(BACKEND_URL, { reconnectionAttempts: 10, timeout: 5000 });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_dashboard');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-Time Event: Emergency Session Started (EMG-2026-XXXX)
    socket.on('emergency_session_started', (session: any) => {
      console.log('[SOCKET] Emergency Session Started:', session.emergencyId);
      setEmergencySessions((prev) => [session, ...prev.filter((s) => s.emergencyId !== session.emergencyId)]);
      setMetrics((m) => ({ ...m, activeAlertsCount: m.activeAlertsCount + 1 }));
    });

    // Real-Time Event: Emergency Live Location Update (Moving Marker)
    socket.on('emergency_location_update', (updateData: any) => {
      console.log('[SOCKET] Emergency Live Location Update:', updateData.emergencyId, updateData.currentLocation);
      setEmergencySessions((prev) =>
        prev.map((s) => {
          if (s.emergencyId === updateData.emergencyId) {
            return {
              ...s,
              currentLocation: updateData.currentLocation,
              routeDistanceKm: updateData.routeDistanceKm,
              estimatedDurationMinutes: updateData.estimatedDurationMinutes,
              lastLocationUpdate: updateData.lastLocationUpdate
            };
          }
          return s;
        })
      );
    });

    // Real-Time Event: Emergency Resolved
    socket.on('emergency_resolved', (data: any) => {
      console.log('[SOCKET] Emergency Resolved:', data.emergencyId);
      setEmergencySessions((prev) => prev.filter((s) => s.emergencyId !== data.emergencyId));
      setMetrics((m) => ({
        ...m,
        activeAlertsCount: Math.max(0, m.activeAlertsCount - 1),
        resolvedIncidentsCount: m.resolvedIncidentsCount + 1
      }));
      // Refresh incidents to show newly resolved incident audit record
      axios.get(`${BACKEND_URL}/api/dashboard/incidents`).then((res) => setIncidents(res.data || []));
    });

    // Real-Time Event: New Journey Started
    socket.on('journey:started', (newTrip: any) => {
      console.log('[SOCKET] New Journey Started:', newTrip._id);
      setActiveJourneys((prev) => {
        if (prev.some((j) => j._id === newTrip._id || j.journeyId === newTrip._id)) return prev;
        const formatted = {
          _id: newTrip._id,
          journeyId: newTrip._id,
          userId: newTrip.userId,
          userName: 'Ishwari Gade',
          userPhone: '+91 9876543210',
          vehicleId: 'VEHICLE-A101',
          transportType: newTrip.transportType || 'Bus',
          source: newTrip.source,
          destination: newTrip.destination,
          currentLocation: newTrip.source ? { lat: newTrip.source.lat, lng: newTrip.source.lng } : { lat: 18.5284, lng: 73.8739 },
          speedKmh: 35,
          remainingDistanceKm: newTrip.expectedDistanceKm || 15,
          etaMinutes: newTrip.expectedDuration || 30,
          distFromRouteMeters: 10,
          routeStatus: 'ON ROUTE',
          safetyStatus: 'LOW',
          riskScore: 10,
          lastUpdated: new Date(),
          expectedRoute: newTrip.expectedRoute
        };
        return [formatted, ...prev];
      });
      setMetrics((m) => ({ ...m, activeJourneysCount: m.activeJourneysCount + 1 }));
    });

    // Helper: Update Active Journey Location
    const handleJourneyLocation = (data: any) => {
      const tripId = data.tripId || data.journeyId;
      const lat = data.latitude ?? data.currentLocation?.lat;
      const lng = data.longitude ?? data.currentLocation?.lng;
      if (lat === undefined || lng === undefined) return;

      console.log('[SOCKET] Vehicle Location Update:', tripId, lat, lng);
      setActiveJourneys((prev) =>
        prev.map((j) => {
          if (j._id === tripId || j.journeyId === tripId) {
            return {
              ...j,
              currentLocation: { lat, lng },
              speedKmh: data.speed ?? j.speedKmh ?? 30,
              safetyStatus: data.riskLevel ?? j.safetyStatus ?? 'LOW',
              riskScore: data.riskScore ?? j.riskScore ?? 10,
              remainingDistanceKm: data.distToDestKm ?? data.distanceRemainingKm ?? j.remainingDistanceKm,
              etaMinutes: data.distToDestKm ? Math.max(1, Math.round((data.distToDestKm / 35) * 60)) : j.etaMinutes,
              lastUpdated: new Date()
            };
          }
          return j;
        })
      );
    };

    // Real-Time Events: Live Location Update
    socket.on('live_location_update', handleJourneyLocation);
    socket.on('location_update', handleJourneyLocation);
    socket.on('journey:location-update', handleJourneyLocation);

    // Real-Time Event: Journey Ended
    socket.on('journey:ended', (data: any) => {
      const tripId = data.tripId || data.journeyId;
      console.log('[SOCKET] Journey Ended:', tripId);
      setActiveJourneys((prev) => prev.filter((j) => j._id !== tripId && j.journeyId !== tripId));
      setMetrics((m) => ({ ...m, activeJourneysCount: Math.max(0, m.activeJourneysCount - 1) }));
    });

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, []);

  const handleResolveEmergency = async (emergencyId: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/emergency/resolve`, { emergencyId, resolvedBy: 'Authority Admin' });
    } catch (e) {
      console.warn('[DASHBOARD] Resolve emergency fallback.');
    }
    setEmergencySessions((prev) => prev.filter((s) => s.emergencyId !== emergencyId));
    setMetrics((m) => ({
      ...m,
      activeAlertsCount: Math.max(0, m.activeAlertsCount - 1),
      resolvedIncidentsCount: m.resolvedIncidentsCount + 1
    }));
    // Re-fetch historical incidents to display new audit record
    setTimeout(() => {
      axios.get(`${BACKEND_URL}/api/dashboard/incidents`).then((res) => setIncidents(res.data || []));
    }, 500);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield size={26} color="#2563eb" />
          <span>Transport Safety Authority</span>
        </div>

        <ul className="sidebar-menu">
          <li
            className={`sidebar-item ${activeModule === 'overview' ? 'active' : ''}`}
            onClick={() => navigateToModule('overview')}
            style={{ cursor: 'pointer' }}
          >
            <Activity size={20} /> Dashboard Overview
          </li>
          <li
            className={`sidebar-item ${activeModule === 'journeys' ? 'active' : ''}`}
            onClick={() => navigateToModule('journeys')}
            style={{ cursor: 'pointer' }}
          >
            <Navigation size={20} /> Live Journey Tracking
          </li>
          <li
            className={`sidebar-item ${activeModule === 'emergencies' ? 'active' : ''}`}
            onClick={() => navigateToModule('emergencies')}
            style={{ cursor: 'pointer' }}
          >
            <AlertTriangle size={20} /> Active Emergency Alerts
          </li>
          <li
            className={`sidebar-item ${activeModule === 'incidents' ? 'active' : ''}`}
            onClick={() => navigateToModule('incidents')}
            style={{ cursor: 'pointer' }}
          >
            <FileText size={20} /> Incident Audits
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <h1>Women Transport Safety Control Center</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => fetchDashboardData()} title="Refresh Telemetry">
              <RefreshCw size={14} /> Refresh
            </button>
            {lastRefresh && (
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <div className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
              <div className="pulse-dot"></div>
              {isConnected ? '🟢 LIVE DATA (WebSockets Connected)' : '🔴 RECONNECTING (WebSockets Offline)'}
            </div>
          </div>
        </header>

        <div className="content-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 0.75rem', color: '#2563eb' }} />
              <p style={{ fontWeight: 800, fontSize: '1rem' }}>
                {activeModule === 'overview'
                  ? 'Loading safety control overview...'
                  : activeModule === 'journeys'
                  ? 'Loading live journeys telemetry...'
                  : activeModule === 'emergencies'
                  ? 'Loading emergency alerts feed...'
                  : 'Loading historical incident audits...'}
              </p>
            </div>
          ) : (
            <>
              {/* Module 1: Dashboard Overview */}
              {activeModule === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <MetricsHeader metrics={metrics} />

                  <div className="dashboard-split">
                    <div className="card">
                      <div className="card-header">
                        <h3>City Public Transport Live Monitoring Map</h3>
                        <span className="badge badge-low">Geofence Corridor Active (0.5 km)</span>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <MapComponent
                          activeJourneys={activeJourneys}
                          activeAlerts={alerts}
                          emergencySessions={emergencySessions}
                          selectedIncident={selectedIncident}
                        />
                      </div>
                    </div>

                    <MLTelemetryPanel selectedIncident={selectedIncident} />
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3>Active Emergency Alerts & Telemetry Feed</h3>
                      <span className="badge badge-critical">Real-Time Escalation Feed</span>
                    </div>
                    <AlertsTable
                      alerts={emergencySessions.length > 0 ? emergencySessions : alerts}
                      onSelectAlert={(alert) => setSelectedIncident(alert)}
                      onResolveAlert={(id) => handleResolveEmergency(id)}
                    />
                  </div>
                </div>
              )}

              {/* Module 2: Live Journey Tracking */}
              {activeModule === 'journeys' && (
                <LiveJourneysScreen journeys={activeJourneys} />
              )}

              {/* Module 3: Active Emergency Alerts */}
              {activeModule === 'emergencies' && (
                <ActiveEmergenciesScreen
                  emergencySessions={emergencySessions}
                  onResolveEmergency={handleResolveEmergency}
                />
              )}

              {/* Module 4: Incident Audits */}
              {activeModule === 'incidents' && (
                <IncidentAuditsScreen incidents={incidents} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
