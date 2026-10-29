import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  activeJourneys?: any[];
  activeAlerts?: any[];
  emergencySessions?: any[];
  selectedIncident?: any;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = [18.5284, 73.8739],
  zoom = 12,
  activeJourneys = [],
  activeAlerts = [],
  emergencySessions = [],
  selectedIncident
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
    }

    const map = leafletMap.current;

    // Clear existing markers/layers except tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const boundsPoints: [number, number][] = [];

    // Custom Marker Icons
    const greenIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color:#16a34a;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(22,163,74,0.6)"></div>`,
      iconSize: [20, 20]
    });

    const redIcon = L.divIcon({
      className: 'custom-pin-red',
      html: `<div style="background-color:#dc2626;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(220,38,38,0.9);animation:pulse 1s infinite"></div>`,
      iconSize: [24, 24]
    });

    const policeIcon = L.divIcon({
      className: 'police-pin',
      html: `<div style="background-color:#1e3a8a;color:white;width:30px;height:30px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 14px rgba(30,58,138,0.8)">🚔</div>`,
      iconSize: [32, 32]
    });

    // 1. Render Live Emergency Sessions (EMG-2026-XXXX) with LIVE MOVING MARKER & ROAD ROUTE
    emergencySessions.forEach((session) => {
      if (session.currentLocation && session.safeLocation) {
        const userPos: [number, number] = [session.currentLocation.latitude, session.currentLocation.longitude];
        const safePos: [number, number] = [session.safeLocation.latitude, session.safeLocation.longitude];

        boundsPoints.push(userPos, safePos);

        const routeCoords: [number, number][] = session.routeCoordinates && session.routeCoordinates.length > 0
          ? session.routeCoordinates
          : [userPos, safePos];

        // Draw Emergency Route Line (Red Dashed)
        L.polyline(routeCoords, {
          color: '#dc2626',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8'
        }).addTo(map);

        // Safe Location Marker (Police Station)
        L.marker(safePos, { icon: policeIcon })
          .bindPopup(`<b>${session.safeLocation.category}: ${session.safeLocation.name}</b><br>${session.safeLocation.address}<br>Phone: ${session.safeLocation.phone || '112'}`)
          .addTo(map);

        // User Live Moving Marker (Red Pulsing Pin)
        L.marker(userPos, { icon: redIcon })
          .bindPopup(`<b>🚨 LIVE EMERGENCY: ${session.emergencyId}</b><br>User: ${session.userName || 'User'}<br>Accuracy: ${session.currentLocation.accuracy || 8}m<br>Remaining Road: ${session.routeDistanceKm} km (${session.estimatedDurationMinutes} min ETA)<br>Last Updated: ${new Date(session.lastLocationUpdate || Date.now()).toLocaleTimeString()}`)
          .addTo(map)
          .openPopup();
      }
    });

    // 2. Draw Active Journeys & Route Corridors
    activeJourneys.forEach((journey) => {
      if (journey.expectedRoute && journey.expectedRoute.length > 0) {
        const polylinePoints = journey.expectedRoute.map((p: any) => [p.lat, p.lng] as [number, number]);
        boundsPoints.push(...polylinePoints);

        // Expected route line
        L.polyline(polylinePoints, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.75,
          dashArray: '8, 8'
        }).addTo(map);

        // 0.5 km Corridor outline
        L.polyline(polylinePoints, {
          color: '#3b82f6',
          weight: 20,
          opacity: 0.15
        }).addTo(map);

        // Determine live current position from woman's mobile GPS telemetry
        const currentLat = journey.currentLocation?.lat ?? journey.currentLocation?.latitude ?? journey.source?.lat ?? polylinePoints[0]?.[0];
        const currentLng = journey.currentLocation?.lng ?? journey.currentLocation?.longitude ?? journey.source?.lng ?? polylinePoints[0]?.[1];
        const currentPos: [number, number] = [currentLat, currentLng];
        boundsPoints.push(currentPos);

        // Destination Marker
        if (journey.destination?.lat && journey.destination?.lng) {
          const destPos: [number, number] = [journey.destination.lat, journey.destination.lng];
          boundsPoints.push(destPos);
          L.marker(destPos, {
            icon: L.divIcon({
              className: 'dest-pin',
              html: `<div style="background-color:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(220,38,38,0.7)"></div>`,
              iconSize: [20, 20]
            })
          }).bindPopup(`<b>Destination: ${journey.destination.name || 'Destination'}</b>`).addTo(map);
        }

        // Live Moving Vehicle Marker (Pulsing bus icon at woman's actual GPS)
        const isAlert = journey.status === 'alert' || journey.safetyStatus === 'HIGH' || journey.safetyStatus === 'CRITICAL';
        const busIconHtml = `<div style="background-color:${isAlert ? '#dc2626' : '#2563eb'};color:white;width:30px;height:30px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 12px ${isAlert ? 'rgba(220,38,38,0.8)' : 'rgba(37,99,235,0.7)'}">🚌</div>`;
        const vehicleMarkerIcon = L.divIcon({
          className: 'vehicle-live-pin',
          html: busIconHtml,
          iconSize: [32, 32]
        });

        L.marker(currentPos, { icon: vehicleMarkerIcon })
          .bindPopup(`<b>${journey.transportType || 'Bus'} (${journey.vehicleId || 'VEHICLE-A101'})</b><br>Passenger: ${journey.userName || 'Passenger'}<br>Live GPS: (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})<br>Destination: ${journey.destination?.name || 'In Transit'}<br>Remaining Distance: ${journey.remainingDistanceKm || 'N/A'} km<br>Safety Status: ${journey.safetyStatus || 'LOW'}`)
          .addTo(map);
      }
    });

    // 3. Draw Standard Emergency SOS Alerts (if not already rendered via sessions)
    activeAlerts.forEach((alert) => {
      if (alert.latitude && alert.longitude && !emergencySessions.some(s => s.emergencyId === alert.sosId || s.emergencyId === alert.id)) {
        const alertPos: [number, number] = [alert.latitude, alert.longitude];
        boundsPoints.push(alertPos);
        L.marker(alertPos, { icon: redIcon })
          .bindPopup(`<b>CRITICAL SOS ALERT</b><br>User: ${alert.userName}<br>Trigger: ${alert.triggerReason || alert.activationMethod}`)
          .addTo(map);
      }
    });

    // Highlight Bounds
    if (selectedIncident && selectedIncident.location) {
      const pos: [number, number] = [selectedIncident.location.lat, selectedIncident.location.lng];
      map.setView(pos, 13);
    } else if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [35, 35] });
    }
  }, [activeJourneys, activeAlerts, emergencySessions, selectedIncident]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '420px', borderRadius: '8px', zIndex: 1 }} 
    />
  );
};
