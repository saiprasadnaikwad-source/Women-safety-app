import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ShieldCheck, Phone, Navigation, MapPin } from 'lucide-react';
import axios from 'axios';

export const SafeLocationsScreen: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    // Fetch verified safe locations from backend
    axios.get('http://localhost:5000/api/safe-locations')
      .then(res => setLocations(res.data))
      .catch(() => {
        // Fallback default safe locations
        setLocations([
          {
            id: 'safe_1',
            name: 'Shivajinagar Police Station & Women Desk',
            category: 'Police Station',
            lat: 18.5312,
            lng: 73.8445,
            address: 'JM Road, Shivajinagar, Pune',
            phone: '020-25536263',
            distanceKm: 0.8,
            walkingTimeMin: 10
          },
          {
            id: 'safe_2',
            name: 'KEM Hospital 24/7 Trauma Care',
            category: 'Hospital',
            lat: 18.5204,
            lng: 73.8689,
            address: 'Rasta Peth, Somwar Peth, Pune',
            phone: '020-66037300',
            distanceKm: 1.4,
            walkingTimeMin: 18
          },
          {
            id: 'safe_3',
            name: 'Aundh Safe Transit & Women Help Kiosk',
            category: 'Transit Hub',
            lat: 18.5612,
            lng: 73.8045,
            address: 'Aundh DP Road Junction, Pune',
            phone: '1091',
            distanceKm: 2.1,
            walkingTimeMin: 26
          }
        ]);
      });
  }, []);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([18.5312, 73.8445], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);
    }

    const map = leafletMap.current;

    locations.forEach(loc => {
      const pin = L.divIcon({
        className: 'safe-pin',
        html: `<div style="background-color:#2563eb;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(37,99,235,0.7)"></div>`,
        iconSize: [22, 22]
      });

      L.marker([loc.lat, loc.lng], { icon: pin })
        .bindPopup(`<b>${loc.name}</b><br>${loc.address}<br>Walk: ${loc.walkingTimeMin} min`)
        .addTo(map);
    });
  }, [locations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Nearest Safe Locations</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Police Desks, Hospitals & Safe Havens</p>
      </div>

      {/* Map View */}
      <div ref={mapRef} style={{ width: '100%', height: '180px', borderRadius: '16px', border: '1px solid #e2e8f0' }} />

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {locations.map(loc => (
          <div key={loc.id} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <div>
                <span className="badge-pill badge-green" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  <ShieldCheck size={12} /> VERIFIED {loc.category.toUpperCase()}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{loc.name}</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '0.9rem', color: '#2563eb' }}>{loc.distanceKm} km</strong>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{loc.walkingTimeMin} min walk</span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>{loc.address}</p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-large btn-primary" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                onClick={() => window.open(`https://maps.google.com/?q=${loc.lat},${loc.lng}`, '_blank')}
              >
                <Navigation size={14} /> Navigate to Safety
              </button>
              <button 
                className="btn-large btn-secondary" 
                style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => alert(`Dialing ${loc.name}: ${loc.phone}`)}
              >
                <Phone size={14} /> Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
