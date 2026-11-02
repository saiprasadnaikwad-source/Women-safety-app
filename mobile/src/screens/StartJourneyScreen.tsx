import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Bus, Train, Car, Shield, ArrowRight, RefreshCw, AlertCircle, Search, LocateFixed } from 'lucide-react';
import axios from 'axios';
import { searchPlaceSuggestions, GeocodedLocation } from '../services/geocodingService';
import { fetchDynamicRoute, RouteDetails } from '../services/routingService';
import { getApiBaseUrl } from '../services/apiConfig';

interface StartJourneyProps {
  user?: any;
  onStartMonitoring: (tripData: any) => void;
}

export const StartJourneyScreen: React.FC<StartJourneyProps> = ({ user, onStartMonitoring }) => {
  const [sourceQuery, setSourceQuery] = useState('Pune Central Railway Station');
  const [destQuery, setDestQuery] = useState('Hinjewadi IT Park Phase 1');
  const [transportType, setTransportType] = useState('Bus');

  const [sourceGeo, setSourceGeo] = useState<GeocodedLocation>({
    name: 'Pune Central Station',
    formattedAddress: 'Pune Railway Station, Agarkar Nagar, Pune',
    lat: 18.5284,
    lng: 73.8739
  });

  const [sourceSuggestions, setSourceSuggestions] = useState<GeocodedLocation[]>([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  const [selectedDestGeo, setSelectedDestGeo] = useState<GeocodedLocation | null>({
    name: 'Hinjewadi IT Park Phase 1',
    formattedAddress: 'Hinjewadi Phase 1, Pimpri-Chinchwad, Pune',
    lat: 18.5912,
    lng: 73.7389
  });

  const [destSuggestions, setDestSuggestions] = useState<GeocodedLocation[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchingGps, setFetchingGps] = useState(false);

  const transportOptions = [
    { label: 'Bus', icon: <Bus size={20} /> },
    { label: 'Metro', icon: <Train size={20} /> },
    { label: 'Train', icon: <Train size={20} /> },
    { label: 'Shared Vehicle', icon: <Car size={20} /> },
    { label: 'Auto', icon: <Car size={20} /> },
    { label: 'Other', icon: <Navigation size={20} /> }
  ];

  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingGps(true);
    setErrorMsg('');

    const applyPosition = (lat: number, lng: number, accuracy?: number, fallbackLabel?: string) => {
      if (accuracy) setGpsAccuracy(Math.round(accuracy));
      const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
      const initialName = fallbackLabel || `Live Location${accText}`;
      const initialAddress = `Live GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}${accText}`;

      // 1. Immediately apply coordinates so user gets real-time position
      const userPos: GeocodedLocation = { name: initialName, formattedAddress: initialAddress, lat, lng };
      setSourceGeo(userPos);
      setSourceQuery(initialName);
      setFetchingGps(false);
      setErrorMsg('');

      // 2. Asynchronously enrich with reverse geocoding in background
      axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
        { timeout: 4000 }
      ).then((res) => {
        if (res.data?.display_name) {
          const addr = res.data.address;
          const locality = addr?.suburb || addr?.neighbourhood || addr?.quarter || addr?.residential || addr?.city_district || addr?.road || addr?.town || addr?.city || res.data.display_name.split(',')[0];
          const enrichedAddress = res.data.display_name;
          setSourceGeo({ name: locality, formattedAddress: enrichedAddress, lat, lng });
          setSourceQuery(locality);
        }
      }).catch(() => {
        // Fallback remains the live coordinates
      });
    };

    // FORCE fresh live position (maximumAge: 0 forces browser/device to acquire a fresh fix instead of reading stored cache)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        if (err.code === 1) { // PERMISSION_DENIED
          setErrorMsg('Location permission denied. Please allow location access in your browser or tap a quick location below.');
          setFetchingGps(false);
          return;
        }

        // Try standard cellular / Wi-Fi if high accuracy satellite timed out
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          async () => {
            // Fallback: IP-based live geolocation
            try {
              const ipRes = await axios.get('https://ipapi.co/json/', { timeout: 4000 });
              if (ipRes.data && ipRes.data.latitude && ipRes.data.longitude) {
                const lat = Number(ipRes.data.latitude);
                const lng = Number(ipRes.data.longitude);
                const city = ipRes.data.city || ipRes.data.region || 'Current Location';
                applyPosition(lat, lng, undefined, city);
                return;
              }
            } catch (ipErr) {
              console.warn('[IP GEOLOCATION FAILED]', ipErr);
            }
            setErrorMsg('Could not get fresh GPS fix. Please tap a location pill below or search your place.');
            setFetchingGps(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Auto-detect current location on mount if user has already granted permission
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        if (status.state === 'granted') {
          handleUseCurrentLocation();
        }
      }).catch(() => {});
    }
  }, []);

  // Fetch suggestions for Starting Point search input
  useEffect(() => {
    if (!sourceQuery || sourceQuery.length < 2 || sourceQuery === sourceGeo.name) {
      setSourceSuggestions([]);
      setShowSourceDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const suggestions = await searchPlaceSuggestions(sourceQuery);
      setSourceSuggestions(suggestions);
      setShowSourceDropdown(suggestions.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [sourceQuery, sourceGeo.name]);

  // Fetch Place Autocomplete suggestions when destination search input changes
  useEffect(() => {
    if (!destQuery || destQuery.length < 2) {
      setDestSuggestions([]);
      setShowDestDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const suggestions = await searchPlaceSuggestions(destQuery);
      setDestSuggestions(suggestions);
      setShowDestDropdown(suggestions.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [destQuery]);

  // Recalculate Road Route whenever origin or selected destination changes
  useEffect(() => {
    if (!selectedDestGeo) return;

    const computeRoute = async () => {
      setLoadingRoute(true);
      setErrorMsg('');
      try {
        const route = await fetchDynamicRoute(
          { lat: sourceGeo.lat, lng: sourceGeo.lng },
          { lat: selectedDestGeo.lat, lng: selectedDestGeo.lng }
        );
        setRouteDetails(route);
        console.log(`[DESTINATION] Place result selected: ${selectedDestGeo.formattedAddress}`);
        console.log(`[ROUTE] Road distance: ${route.routeDistanceKm} km | Duration: ${route.durationMin} mins | Provider: ${route.provider}`);
      } catch (err: any) {
        setErrorMsg('Failed to calculate road route for selected destination.');
      } finally {
        setLoadingRoute(false);
      }
    };

    computeRoute();
  }, [sourceGeo, selectedDestGeo]);

  const handleSelectSourceSuggestion = (place: GeocodedLocation) => {
    setSourceQuery(place.name);
    setSourceGeo(place);
    setShowSourceDropdown(false);
  };

  const handleSelectSuggestion = (place: GeocodedLocation) => {
    setDestQuery(place.name);
    setSelectedDestGeo(place);
    setShowDestDropdown(false);
  };

  const handleStart = async () => {
    if (!routeDetails || !selectedDestGeo) return;

    const formattedRoute = routeDetails.polyline.map((p) => ({ lat: p[0], lng: p[1] }));

    const payload = {
      userId: user?._id || user?.id || `user_${Date.now()}`,
      userName: user?.name || 'Passenger',
      userPhone: user?.phone || '',
      source: { name: sourceGeo.name, lat: sourceGeo.lat, lng: sourceGeo.lng },
      destination: {
        name: selectedDestGeo.name,
        formattedAddress: selectedDestGeo.formattedAddress,
        lat: selectedDestGeo.lat,
        lng: selectedDestGeo.lng
      },
      transportType,
      expectedDuration: routeDetails.durationMin,
      expectedDistanceKm: routeDetails.routeDistanceKm,
      expectedRoute: formattedRoute,
      routingProvider: routeDetails.provider
    };

    let journeyId = `trip_${Date.now()}`;
    try {
      const baseUrl = getApiBaseUrl();
      const res = await axios.post(`${baseUrl}/api/trips`, payload);
      if (res.data && res.data._id) {
        journeyId = res.data._id;
      }
    } catch (e) {
      console.warn('[TRIP START] Backend journey registration fallback, using generated ID:', journeyId);
    }

    const tripData = {
      ...payload,
      _id: journeyId,
      journeyId
    };

    onStartMonitoring(tripData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <h3 className="card-title">Set Up Your Journey</h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
          Select your place destination from search suggestions for real road navigation.
        </p>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Source Input */}
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
            Starting Point (Use GPS or Search Place)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={18} color="#16a34a" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="text"
                value={sourceQuery}
                onChange={(e) => {
                  setSourceQuery(e.target.value);
                  if (sourceGeo && e.target.value !== sourceGeo.name) {
                    setShowSourceDropdown(true);
                  }
                }}
                onFocus={() => setShowSourceDropdown(true)}
                placeholder="Origin location or search..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={fetchingGps}
              title="Use my exact current live GPS location"
              style={{
                backgroundColor: fetchingGps ? '#e2e8f0' : '#eff6ff',
                color: fetchingGps ? '#94a3b8' : '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.75rem 0.65rem',
                cursor: fetchingGps ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {fetchingGps
                ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : <LocateFixed size={15} />}
              {fetchingGps ? 'Locating...' : 'Use GPS'}
            </button>
          </div>

          {/* Source Autocomplete Dropdown */}
          {showSourceDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '240px',
              overflowY: 'auto',
              marginTop: '4px'
            }}>
              {/* One-tap live GPS location option */}
              <div
                onClick={() => {
                  setShowSourceDropdown(false);
                  handleUseCurrentLocation();
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#16a34a',
                  fontWeight: 700
                }}
              >
                <LocateFixed size={16} />
                <div>
                  <div>Use Current Live Location</div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 500 }}>
                    {fetchingGps ? 'Locating device...' : 'Detect via GPS / Wi-Fi'}
                  </div>
                </div>
              </div>

              {sourceSuggestions.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSourceSuggestion(place)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx < sourceSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  className="suggestion-item"
                >
                  <strong style={{ color: '#0f172a', display: 'block' }}>{place.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{place.formattedAddress}</span>
                </div>
              ))}
            </div>
          )}

          {sourceGeo && (
            <p style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.3rem', fontWeight: 600 }}>
              📍 Starting from: {sourceGeo.formattedAddress || sourceGeo.name}
            </p>
          )}
        </div>

        {/* Destination Place Autocomplete Search Input */}
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
            Destination (Search & Select Place Suggestion)
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#dc2626" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            <input
              type="text"
              value={destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                if (selectedDestGeo && e.target.value !== selectedDestGeo.name) {
                  setSelectedDestGeo(null);
                  setRouteDetails(null);
                }
              }}
              onFocus={() => { if (destSuggestions.length > 0) setShowDestDropdown(true); }}
              placeholder="Type place: e.g. Shirdi, Pune, Mumbai, Nashik..."
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                borderRadius: '10px',
                border: selectedDestGeo ? '2px solid #16a34a' : '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
          </div>

          {/* Place Autocomplete Suggestions Dropdown */}
          {showDestDropdown && destSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '220px',
              overflowY: 'auto',
              marginTop: '4px'
            }}>
              {destSuggestions.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(place)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx < destSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  className="suggestion-item"
                >
                  <strong style={{ color: '#0f172a', display: 'block' }}>{place.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{place.formattedAddress}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Place Selection Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
            {[
              { name: 'Shirdi', formattedAddress: 'Shirdi, Ahmednagar, Maharashtra, India', lat: 19.7667, lng: 74.4764 },
              { name: 'Pune, Maharashtra', formattedAddress: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
              { name: 'Mumbai, Maharashtra', formattedAddress: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
              { name: 'Nashik, Maharashtra', formattedAddress: 'Nashik, Maharashtra, India', lat: 19.9975, lng: 73.7898 }
            ].map((chip) => (
              <button
                key={chip.name}
                type="button"
                onClick={() => handleSelectSuggestion(chip)}
                style={{
                  backgroundColor: selectedDestGeo?.name === chip.name ? '#eff6ff' : '#f1f5f9',
                  border: selectedDestGeo?.name === chip.name ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: selectedDestGeo?.name === chip.name ? '#2563eb' : '#334155'
                }}
              >
                {chip.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode of Transport */}
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
          Mode of Transport
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {transportOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setTransportType(opt.label)}
              style={{
                padding: '0.65rem 0.5rem',
                borderRadius: '10px',
                border: transportType === opt.label ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: transportType === opt.label ? '#eff6ff' : '#ffffff',
                color: transportType === opt.label ? '#2563eb' : '#475569',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Road Routing Telemetry Card */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
          {loadingRoute ? (
            <div style={{ textAlign: 'center', color: '#2563eb', padding: '0.5rem', fontSize: '0.85rem' }}>
              <RefreshCw size={18} style={{ animation: 'spin 1s infinite' }} /> Querying road routing engine...
            </div>
          ) : routeDetails && selectedDestGeo ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Selected Destination:</span>
                <strong style={{ color: '#0f172a' }}>{selectedDestGeo.name}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {selectedDestGeo.formattedAddress}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Actual Driving Road Distance:</span>
                <strong style={{ color: '#2563eb', fontSize: '0.98rem' }}>{routeDetails.routeDistanceKm} km</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Estimated Driving Time (ETA):</span>
                <strong style={{ color: '#0f172a' }}>{routeDetails.durationMin} mins</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#94a3b8' }}>Routing Provider:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{routeDetails.provider}</span>
              </div>
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', padding: '0.5rem' }}>
              Select a place suggestion above to calculate road distance & route.
            </div>
          )}
        </div>

        <button 
          className="btn-large btn-primary" 
          onClick={handleStart} 
          disabled={loadingRoute || !selectedDestGeo || !routeDetails}
        >
          <Shield size={18} /> Start Monitoring Journey <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
