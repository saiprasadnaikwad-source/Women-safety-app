import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:5000';

interface TrackingData {
  tripId: string;
  userName: string;
  userPhone: string;
  source: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  currentLocation: { lat: number; lng: number };
  speedKmh: number;
  riskScore: number;
  riskLevel: string;
  remainingDistanceKm: number;
  etaMinutes: number;
  status: string;
  lastUpdated: string;
}

export function LiveTrackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  // Fetch initial trip data
  useEffect(() => {
    if (!tripId) { setError('Invalid tracking link.'); return; }

    axios.get(`${BACKEND_URL}/api/trips/${tripId}`)
      .then(res => {
        const trip = res.data;
        setTracking({
          tripId: trip._id,
          userName: trip.userName || 'Traveller',
          userPhone: trip.userPhone || '',
          source: trip.source,
          destination: trip.destination,
          currentLocation: { lat: trip.source.lat, lng: trip.source.lng },
          speedKmh: 0,
          riskScore: trip.currentRiskScore || 0,
          riskLevel: trip.currentRiskLevel || 'LOW',
          remainingDistanceKm: 0,
          etaMinutes: trip.expectedDuration || 0,
          status: trip.status,
          lastUpdated: new Date().toISOString()
        });
      })
      .catch(() => setError('Trip not found or has ended.'));
  }, [tripId]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomControl: true }).setView([18.5284, 73.8739], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(leafletMap.current);
  }, []);

  // Update map when tracking data changes
  useEffect(() => {
    if (!leafletMap.current || !tracking) return;

    const map = leafletMap.current;
    const pos: [number, number] = [tracking.currentLocation.lat, tracking.currentLocation.lng];
    const destPos: [number, number] = [tracking.destination.lat, tracking.destination.lng];

    // Remove old marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    // Pulsing user marker
    const color = tracking.riskLevel === 'CRITICAL' ? '#dc2626' : tracking.riskLevel === 'HIGH' ? '#ea580c' : '#2563eb';
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:4px solid white;box-shadow:0 0 14px ${color}88"></div>`,
      iconSize: [22, 22]
    });

    markerRef.current = L.marker(pos, { icon }).addTo(map);
    markerRef.current.bindPopup(`
      <strong>${tracking.userName}</strong><br/>
      Speed: ${tracking.speedKmh} km/h<br/>
      Risk: ${tracking.riskLevel}<br/>
      ETA: ~${tracking.etaMinutes} min
    `);

    // Destination marker
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px #dc262688"></div>`,
      iconSize: [18, 18]
    });
    L.marker(destPos, { icon: destIcon }).bindPopup(`Destination: ${tracking.destination.name}`).addTo(map);

    map.setView(pos, 15);
  }, [tracking]);

  // Socket.IO live updates
  useEffect(() => {
    if (!tripId) return;

    const socket = io(BACKEND_URL, { reconnectionAttempts: 10 });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_trip', tripId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('location_changed', (data: any) => {
      const lat = data.latitude ?? data.currentLocation?.lat;
      const lng = data.longitude ?? data.currentLocation?.lng;
      if (!lat || !lng) return;

      setTracking(prev => prev ? {
        ...prev,
        currentLocation: { lat, lng },
        speedKmh: data.speed ?? prev.speedKmh,
        riskScore: data.riskScore ?? prev.riskScore,
        riskLevel: data.riskLevel ?? prev.riskLevel,
        remainingDistanceKm: data.distToDestKm ?? prev.remainingDistanceKm,
        etaMinutes: data.distToDestKm ? Math.max(1, Math.round((data.distToDestKm / 35) * 60)) : prev.etaMinutes,
        lastUpdated: new Date().toISOString()
      } : prev);
      setLastUpdate(new Date());
    });

    socket.on('journey:ended', () => {
      setTracking(prev => prev ? { ...prev, status: 'completed' } : prev);
    });

    return () => { socket.disconnect(); };
  }, [tripId]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: '#0f172a' }}>Tracking Unavailable</h2>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  const riskColor = tracking?.riskLevel === 'CRITICAL' ? '#dc2626' : tracking?.riskLevel === 'HIGH' ? '#ea580c' : '#16a34a';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>JourneyGuard Live Tracking</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
              {tracking ? `${tracking.userName} • ${tracking.source.name} → ${tracking.destination.name}` : 'Loading...'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: connected ? '#16a34a' : '#dc2626' }} />
          {connected ? 'LIVE' : 'Connecting...'}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, minHeight: '60vh' }} />

      {/* Bottom Info Panel */}
      {tracking && (
        <div style={{ backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>

          {tracking.status === 'completed' ? (
            <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '12px', color: '#16a34a', fontWeight: 800, fontSize: '1rem' }}>
              ✅ {tracking.userName} has reached {tracking.destination.name} safely.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{tracking.userName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    → {tracking.destination.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: riskColor }}>{tracking.riskLevel}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Risk Level</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[
                  { label: 'Speed', value: `${tracking.speedKmh} km/h` },
                  { label: 'Remaining', value: `${tracking.remainingDistanceKm} km` },
                  { label: 'ETA', value: `~${tracking.etaMinutes} min` }
                ].map(({ label, value }) => (
                  <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '0.6rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{label}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {lastUpdate && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
