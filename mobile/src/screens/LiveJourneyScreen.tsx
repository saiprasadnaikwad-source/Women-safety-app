import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ShieldCheck, AlertTriangle, Navigation, Phone, CheckCircle, Zap, X, Bug, ShieldAlert, Mic } from 'lucide-react';
import axios from 'axios';
import { calculateHaversineKm, fetchDynamicRoute } from '../services/routingService';
import { calculateRemainingRoadDistanceKm, getCorridorOffsetMeters, calculateCircularHeadingDiff } from '../services/roadProgressService';
import { EmergencyOverlay } from '../components/EmergencyOverlay';
import { getApiBaseUrl } from '../services/apiConfig';
import {
  EmergencySessionData,
  startEmergencySession,
  sendEmergencyLocationUpdate,
  resolveEmergency
} from '../services/emergencyService';

interface LiveJourneyProps {
  tripData: any;
  user: any;
  onTriggerSOS: () => void;
  onShareLocation?: () => void;
  onEndJourney: () => void;
}

export const LiveJourneyScreen: React.FC<LiveJourneyProps> = ({
  tripData,
  user,
  onTriggerSOS,
  onShareLocation,
  onEndJourney
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  const originPos: [number, number] = tripData?.source?.lat && tripData?.source?.lng
    ? [tripData.source.lat, tripData.source.lng]
    : [18.5284, 73.8739];

  const destinationPos: [number, number] = tripData?.destination?.lat && tripData?.destination?.lng
    ? [tripData.destination.lat, tripData.destination.lng]
    : [19.9975, 73.7898];

  const destinationName = tripData?.destination?.name || 'Destination';

  // Dynamic journey route polyline state
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>(
    tripData?.expectedRoute && tripData.expectedRoute.length > 0
      ? tripData.expectedRoute.map((p: any) => [p.lat, p.lng] as [number, number])
      : [originPos, destinationPos]
  );

  const [currentPos, setCurrentPos] = useState<[number, number]>(originPos);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number>(8.0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(32.5);
  const [currentHeading, setCurrentHeading] = useState<number>(145.0);
  const [prevHeading, setPrevHeading] = useState<number>(140.0);
  const [stopDurationMin, setStopDurationMin] = useState<number>(0.0);
  const stopStartTimeRef = useRef<number | null>(null);
  const journeyStartTimeRef = useRef<number>(Date.now());

  const [riskScore, setRiskScore] = useState(10);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('LOW');
  const [distFromRoute, setDistFromRoute] = useState(12);

  // Emergency Session State (EMG-2026-XXXX)
  const [emergencySession, setEmergencySession] = useState<EmergencySessionData | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);

  // Road Progress Remaining Distance & ETA Calculation
  const totalRouteDistanceKm = tripData?.expectedDistanceKm || calculateRemainingRoadDistanceKm(originPos, routePolyline);
  const [remainingRoadDistanceKm, setRemainingRoadDistanceKm] = useState<number>(totalRouteDistanceKm);
  const [estimatedEtaMins, setEstimatedEtaMins] = useState<number>(tripData?.expectedDuration || Math.round((totalRouteDistanceKm / 35) * 60));

  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);

  // Background Hands-Free Voice SOS Listener
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceHeardPhrase, setVoiceHeardPhrase] = useState('');
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningActiveRef = useRef<boolean>(true);

  // Helper: Start/Trigger Emergency Response Mode
  const triggerEmergencyMode = async (
    triggerType: 'MANUAL_SOS' | 'ANOMALY_DETECTION' | 'ROUTE_DEVIATION' | 'OTHER' = 'MANUAL_SOS',
    category?: string
  ) => {
    try {
      const session = await startEmergencySession(
        { latitude: currentPos[0], longitude: currentPos[1], accuracy: gpsAccuracyMeters, speed: currentSpeedKmh },
        triggerType,
        category,
        user ? { userId: user._id, userName: user.name, userPhone: user.phone } : undefined
      );
      setEmergencySession(session);
      setIsEmergencyActive(true);
      onTriggerSOS();
      console.log(`[EMERGENCY ACTIVATED] Session ID: ${session.emergencyId} Nearest Police Station: ${session.safeLocation.name}`);
    } catch (e) {
      console.error('[EMERGENCY ACTIVATION ERROR]', e);
    }
  };

  // Helper: Resolve Emergency
  const handleResolveEmergencySession = async () => {
    if (emergencySession) {
      await resolveEmergency(emergencySession.emergencyId);
    }
    setEmergencySession(null);
    setIsEmergencyActive(false);
    setVoiceNotification(null);
  };

  // Automatic Background Hands-Free Voice SOS: runs automatically as soon as journey starts
  useEffect(() => {
    // If emergency is already active, stop listening to avoid repeat triggers
    if (isEmergencyActive) {
      isListeningActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VOICE SOS] Web Speech API not supported in this browser.');
      return;
    }

    let isSubscribed = true;
    isListeningActiveRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (isSubscribed) {
          setIsVoiceListening(true);
          console.log('[VOICE SOS] Background voice detection active during journey.');
        }
      };

      recognition.onresult = (event: any) => {
        if (!isListeningActiveRef.current || isEmergencyActive) return;

        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcript = transcript.trim().toLowerCase();

        if (transcript) {
          setVoiceHeardPhrase(transcript);
        }

        const keywords = ['help me', 'help', 'emergency', 'save me', 'bachao', 'please help', 'police'];
        const matched = keywords.some(kw => transcript.includes(kw));

        if (matched) {
          console.log(`[VOICE SOS TRIGGERED] Emergency keyword matched: "${transcript}"`);
          isListeningActiveRef.current = false;
          setVoiceNotification(`🚨 Emergency phrase detected: "${transcript}". Triggering SOS...`);
          try {
            recognition.stop();
          } catch (e) {}
          setIsVoiceListening(false);

          triggerEmergencyMode('MANUAL_SOS');
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[VOICE SOS] Speech recognition event error:', event.error);
        }
      };

      recognition.onend = () => {
        if (isSubscribed && isListeningActiveRef.current && !isEmergencyActive) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          if (isSubscribed) setIsVoiceListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[VOICE SOS] Error initializing background speech recognition:', err);
    }

    return () => {
      isSubscribed = false;
      isListeningActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsVoiceListening(false);
    };
  }, [isEmergencyActive]);

  // Helper: Change Safe Location Category Priority (Police, Hospital, Fire Station)
  const handleChangeSafeCategory = async (category: string) => {
    await triggerEmergencyMode('MANUAL_SOS', category);
  };

  // 1. Live GPS Location Watcher with Accuracy Filter (<= 50m)
  useEffect(() => {
    let watchId: number | null = null;

    if ('geolocation' in navigator) {
      // Immediate initial position fetch
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLat = pos.coords.latitude;
          const liveLng = pos.coords.longitude;
          setCurrentPos([liveLat, liveLng]);
          setGpsAccuracyMeters(pos.coords.accuracy || 10);
          setIsLiveGpsActive(true);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const accuracy = pos.coords.accuracy || 10;
          setGpsAccuracyMeters(accuracy);

          // Allow realistic browser positioning (filter only anomalies > 3000m)
          if (accuracy > 3000) {
            console.warn(`[GPS FILTER] Poor GPS accuracy (${accuracy}m > 3000m). Skipping telemetry update.`);
            return;
          }

          const liveLat = pos.coords.latitude;
          const liveLng = pos.coords.longitude;
          const newPos: [number, number] = [liveLat, liveLng];
          setCurrentPos(newPos);
          setIsLiveGpsActive(true);

          if (pos.coords.speed !== null && pos.coords.speed >= 0) {
            const speedKmh = Number((pos.coords.speed * 3.6).toFixed(1));
            setCurrentSpeedKmh(speedKmh);

            // Stop duration tracking: start timer when speed < 5 km/h
            if (speedKmh < 5) {
              if (stopStartTimeRef.current === null) stopStartTimeRef.current = Date.now();
              const stopMins = Number(((Date.now() - stopStartTimeRef.current) / 60000).toFixed(2));
              setStopDurationMin(stopMins);
            } else {
              stopStartTimeRef.current = null;
              setStopDurationMin(0);
            }
          }

          if (pos.coords.heading !== null && pos.coords.heading >= 0) {
            setPrevHeading(currentHeading);
            setCurrentHeading(Number(pos.coords.heading.toFixed(1)));
          }

          // Update remaining road distance along polyline (DECREASES as vehicle advances!)
          const remainingKm = calculateRemainingRoadDistanceKm(newPos, routePolyline);
          setRemainingRoadDistanceKm(remainingKm);
          setEstimatedEtaMins(Math.max(1, Math.round((remainingKm / 35) * 60)));

          // Calculate corridor offset in meters
          const offsetMeters = getCorridorOffsetMeters(newPos, routePolyline);
          setDistFromRoute(offsetMeters);

          // Calculate real journey delay: elapsed time vs expected duration
          const elapsedMin = (Date.now() - journeyStartTimeRef.current) / 60000;
          const expectedMin = tripData?.expectedDuration || 35;
          const realDelayMin = Number(Math.max(0, elapsedMin - expectedMin * 0.5).toFixed(2));

          // Send live location update to backend for active trip
          const activeTripId = tripData?._id || tripData?.journeyId || 'trip_demo_501';
          try {
            const baseUrl = getApiBaseUrl();
            await axios.post(`${baseUrl}/api/trips/${activeTripId}/location`, {
              latitude: liveLat,
              longitude: liveLng,
              speed: currentSpeedKmh,
              direction: currentHeading,
              stopDurationMin: stopDurationMin,
              journeyDelayMin: realDelayMin
            });
          } catch (e) {
            console.log('[LOCATION STREAM] Telemetry updated locally.');
          }

          // If emergency active, stream live location update to backend & recalculate distance to safe location
          if (isEmergencyActive && emergencySession) {
            const updated = await sendEmergencyLocationUpdate(
              emergencySession.emergencyId,
              liveLat,
              liveLng,
              accuracy,
              currentSpeedKmh
            );
            if (updated) setEmergencySession(updated);
          }
        },
        (err) => console.log('[LOCATION] Browser GPS watch skipped. Operating in interactive simulation mode.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [routePolyline, currentHeading, isEmergencyActive, emergencySession]);

  // 2. Leaflet Map Initialization & Rendering
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView(currentPos, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(leafletMap.current);
    }

    const map = leafletMap.current;

    // Clear non-tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    if (isEmergencyActive && emergencySession) {
      // -------------------------------------------------------------
      // EMERGENCY MODE MAP RENDER
      // -------------------------------------------------------------
      const safeLoc = emergencySession.safeLocation;
      const safePos: [number, number] = [safeLoc.latitude, safeLoc.longitude];

      const emgRouteCoords: [number, number][] = emergencySession.routeCoordinates && emergencySession.routeCoordinates.length > 0
        ? emergencySession.routeCoordinates
        : [currentPos, safePos];

      // Draw Emergency Road Route (Red)
      L.polyline(emgRouteCoords, { color: '#dc2626', weight: 6, opacity: 0.9, dashArray: '8, 8' }).addTo(map);

      // Safe Location Destination Marker (Police/Hospital Pin)
      const safePinHtml = safeLoc.category === 'Police Station'
        ? `<div style="background-color:#1e3a8a;color:white;width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px rgba(30,58,138,0.7)">🚔</div>`
        : `<div style="background-color:#dc2626;color:white;width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px rgba(220,38,38,0.7)">🏥</div>`;

      const safePin = L.divIcon({
        className: 'safe-loc-marker',
        html: safePinHtml,
        iconSize: [34, 34]
      });
      L.marker(safePos, { icon: safePin }).bindPopup(`Safe Location: ${safeLoc.name}<br/>Road Dist: ${emergencySession.routeDistanceKm} km`).addTo(map);

      // User Marker (Emergency Red Pulsing Pin)
      const userPin = L.divIcon({
        className: 'user-marker',
        html: `<div style="background-color:#dc2626;width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 0 18px rgba(220,38,38,0.8);animation:pulse 1s infinite"></div>`,
        iconSize: [26, 26]
      });
      L.marker(currentPos, { icon: userPin }).addTo(map);

      const bounds = L.latLngBounds([currentPos, safePos, ...emgRouteCoords]);
      map.fitBounds(bounds, { padding: [45, 45] });

    } else {
      // -------------------------------------------------------------
      // NORMAL JOURNEY MAP RENDER
      // -------------------------------------------------------------
      // Draw dynamic road polyline (Blue)
      L.polyline(routePolyline, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(map);

      // Draw 0.5 km corridor envelope (Light Blue shadow)
      L.polyline(routePolyline, { color: '#3b82f6', weight: 24, opacity: 0.18 }).addTo(map);

      // Origin Marker (Green)
      const originPin = L.divIcon({
        className: 'origin-marker',
        html: `<div style="background-color:#16a34a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [18, 18]
      });
      L.marker(originPos, { icon: originPin }).bindPopup(`Origin: ${tripData?.source?.name || 'Origin'}`).addTo(map);

      // Destination Marker (Red Flag)
      const destPin = L.divIcon({
        className: 'dest-marker',
        html: `<div style="background-color:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(220,38,38,0.7)"></div>`,
        iconSize: [20, 20]
      });
      L.marker(destinationPos, { icon: destPin }).bindPopup(`Destination: ${destinationName}`).addTo(map);

      // Vehicle Marker (Pulsing Indicator)
      const userPin = L.divIcon({
        className: 'user-marker',
        html: `<div style="background-color:${riskLevel === 'CRITICAL' ? '#dc2626' : riskLevel === 'HIGH' ? '#ea580c' : '#2563eb'};width:22px;height:22px;border-radius:50%;border:4px solid white;box-shadow:0 0 14px rgba(0,0,0,0.4)"></div>`,
        iconSize: [24, 24]
      });
      L.marker(currentPos, { icon: userPin }).addTo(map);

      const bounds = L.latLngBounds([currentPos, destinationPos, ...routePolyline]);
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [currentPos, destinationName, riskLevel, routePolyline, isEmergencyActive, emergencySession]);

  // Helper: Move vehicle to exact GPS coordinates
  const moveToExactGps = async (lat: number, lng: number) => {
    const newPos: [number, number] = [lat, lng];
    setCurrentPos(newPos);

    // Dynamic Road Remaining Distance calculation
    const remainingKm = calculateRemainingRoadDistanceKm(newPos, routePolyline);
    setRemainingRoadDistanceKm(remainingKm);
    setEstimatedEtaMins(Math.max(1, Math.round((remainingKm / 35) * 60)));

    const offsetMeters = getCorridorOffsetMeters(newPos, routePolyline);
    setDistFromRoute(offsetMeters);

    console.log(`[EXACT GPS UPDATE] Woman Moved -> Lat: ${lat}, Lng: ${lng}`);

    // If emergency active during movement, send live update to backend!
    if (isEmergencyActive && emergencySession) {
      const updated = await sendEmergencyLocationUpdate(
        emergencySession.emergencyId,
        lat,
        lng,
        gpsAccuracyMeters,
        35.0
      );
      if (updated) setEmergencySession(updated);
    }

    try {
      const activeTripId = tripData?._id || tripData?.journeyId || 'trip_demo_501';
      const baseUrl = getApiBaseUrl();
      await axios.post(`${baseUrl}/api/trips/${activeTripId}/location`, {
        latitude: lat,
        longitude: lng,
        speed: 35.0,
        direction: 12.0,
        stopDurationMin: 0.0,
        journeyDelayMin: 0.0
      });
    } catch (e) {
      console.warn('[LOCATION UPDATE] Backend update emitted.');
    }
  };

  // 3. Dynamic Movement Simulator (Advances vehicle along the route)
  const runVehicleMovementStep = async (stepPercent: number, forceDeviationMeters = 0) => {
    const totalSegments = routePolyline.length - 1;
    const targetIdx = Math.min(totalSegments, Math.floor((stepPercent / 100) * totalSegments));
    const targetPoint = routePolyline[targetIdx] || destinationPos;

    let lat = targetPoint[0];
    let lng = targetPoint[1];
    let speed = 38.0;
    let stopMins = stopDurationMin;
    let dirDiff = calculateCircularHeadingDiff(prevHeading, currentHeading);
    const elapsedMin = (Date.now() - journeyStartTimeRef.current) / 60000;
    const expectedMin = tripData?.expectedDuration || 35;
    let delayMins = Number(Math.max(0, elapsedMin - expectedMin * 0.5).toFixed(2));

    if (forceDeviationMeters > 0) {
      const offsetDeg = forceDeviationMeters / 111000;
      lat += offsetDeg;
      lng += offsetDeg * 0.8;
      speed = 14.0;
      delayMins = 12.0;
      dirDiff = 45.0;
    }

    const newPos: [number, number] = [lat, lng];
    setCurrentPos(newPos);
    setCurrentSpeedKmh(speed);

    // Dynamic Road Remaining Distance calculation
    const remainingKm = calculateRemainingRoadDistanceKm(newPos, routePolyline);
    setRemainingRoadDistanceKm(remainingKm);
    setEstimatedEtaMins(Math.max(1, Math.round((remainingKm / 35) * 60)));

    const offsetMeters = getCorridorOffsetMeters(newPos, routePolyline);
    setDistFromRoute(offsetMeters);

    // If emergency active during movement, send live update to backend!
    if (isEmergencyActive && emergencySession) {
      const updated = await sendEmergencyLocationUpdate(
        emergencySession.emergencyId,
        lat,
        lng,
        gpsAccuracyMeters,
        speed
      );
      if (updated) setEmergencySession(updated);
    }

    // Check if auto-rerouting is required (>500m off corridor)
    if (offsetMeters > 500 && !isEmergencyActive) {
      console.warn(`[REROUTING] Vehicle strayed ${offsetMeters}m off route (>500m corridor threshold). Triggering auto-reroute.`);
      try {
        const newRoute = await fetchDynamicRoute(
          { lat: newPos[0], lng: newPos[1] },
          { lat: destinationPos[0], lng: destinationPos[1] }
        );
        const newPolyline = newRoute.polyline;
        setRoutePolyline(newPolyline);
      } catch (err) {
        console.warn('[REROUTING] Rerouting request failed.');
      }
    }

    // Assemble exact 6 ML features
    const mlPayload = {
      distance_from_route_m: offsetMeters,
      speed_kmh: speed,
      stop_duration_min: stopMins,
      direction_change_deg: dirDiff,
      journey_delay_min: delayMins,
      distance_to_destination_km: remainingKm
    };

    console.log('[ML FEATURES SENT TO ISOLATION FOREST]', mlPayload);

    // Call Express backend & Python ML service on port 8000
    try {
      const res = await axios.post('http://localhost:5000/api/trips/trip_demo_501/location', {
        latitude: lat,
        longitude: lng,
        speed,
        direction: dirDiff,
        stopDurationMin: stopMins,
        journeyDelayMin: delayMins
      });

      const { mlPrediction, riskResult } = res.data;
      setRiskScore(riskResult.riskScore);
      setRiskLevel(riskResult.riskLevel);
      console.log('[ML RESULT]', { prediction: mlPrediction.prediction, anomaly: mlPrediction.anomaly, riskScore: riskResult.riskScore });

      if (riskResult.actionRequired && riskResult.riskScore >= 45 && !isEmergencyActive) {
        setShowSafetyPrompt(true);
      }

      // Automatically trigger emergency overlay on HIGH or CRITICAL ML anomaly score
      if (riskResult.riskScore >= 70 && !isEmergencyActive) {
        triggerEmergencyMode('ANOMALY_DETECTION');
      }
    } catch (e) {
      if (offsetMeters > 500 && !isEmergencyActive) {
        setRiskScore(75);
        setRiskLevel('HIGH');
        setShowSafetyPrompt(true);
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Active Emergency Overlay Panel — renders above map in flex flow */}
      {isEmergencyActive && (
        <EmergencyOverlay
          session={emergencySession}
          onResolve={handleResolveEmergencySession}
          onChangeCategory={handleChangeSafeCategory}
          tripDestination={tripData?.destination ? { name: tripData.destination.name, lat: tripData.destination.lat, lng: tripData.destination.lng } : undefined}
          vehiclePlate={tripData?.plateNumber}
          onShareLocation={onShareLocation}
        />
      )}

      {/* Background Voice Trigger Alert Banner */}
      {voiceNotification && (
        <div style={{
          backgroundColor: '#b91c1c',
          color: '#ffffff',
          padding: '0.55rem 1rem',
          fontWeight: 700,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 9999,
          animation: 'pulse 1.5s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic size={18} />
            <span>{voiceNotification}</span>
          </div>
          <button
            onClick={() => setVoiceNotification(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Background Voice SOS Status Bar */}
      {!isEmergencyActive && (
        <div style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.73rem',
          zIndex: 10,
          borderBottom: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isVoiceListening ? '#22c55e' : '#f59e0b',
              boxShadow: isVoiceListening ? '0 0 8px #22c55e' : 'none',
              animation: isVoiceListening ? 'pulse 1.5s infinite' : 'none'
            }} />
            <span style={{ fontWeight: 600 }}>
              {isVoiceListening ? (
                <>🎙️ Hands-Free Voice SOS: <span style={{ color: '#86efac' }}>Listening</span> (Say <strong style={{ color: '#fef08a' }}>"Help me"</strong>)</>
              ) : (
                <>🎙️ Hands-Free Voice SOS: <span style={{ color: '#fbbf24' }}>Initializing...</span></>
              )}
            </span>
          </div>
          {voiceHeardPhrase && (
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{voiceHeardPhrase}"
            </span>
          )}
        </div>
      )}

      {/* Top Protection Banner (Normal Mode) */}
      {!isEmergencyActive && (
        <div 
          style={{
            backgroundColor: riskLevel === 'CRITICAL' ? '#fef2f2' : riskLevel === 'HIGH' ? '#fff7ed' : '#f0fdf4',
            border: `1px solid ${riskLevel === 'CRITICAL' ? '#fca5a5' : riskLevel === 'HIGH' ? '#fdba74' : '#bbf7d0'}`,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: riskLevel === 'CRITICAL' ? '#dc2626' : riskLevel === 'HIGH' ? '#ea580c' : '#16a34a'
            }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                {riskLevel === 'CRITICAL' ? 'Unusual Journey Pattern' : riskLevel === 'HIGH' ? 'Route Corridor Breach' : "On Expected Route"}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Corridor offset: {distFromRoute} m • ML Risk: {riskScore}/100
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{
                backgroundColor: showDebugPanel ? '#0f172a' : '#ffffff',
                color: showDebugPanel ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.35rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer'
              }}
              title="Toggle Development Telemetry Panel"
            >
              <Bug size={14} /> Debug
            </button>

            <button 
              onClick={() => setShowDemoSelector(true)}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <Zap size={14} /> Test Movement
            </button>
          </div>
        </div>
      )}

      {/* Development Debug Panel Overlay */}
      {showDebugPanel && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(416px, calc(100vw - 24px))',
          zIndex: 9998,
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          lineHeight: 1.5,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: '1px solid #334155'
        }}>
          <div style={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>🛠 DEVELOPMENT TELEMETRY DEBUG PANEL</span>
            <button onClick={() => setShowDebugPanel(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div>Current GPS: {currentPos[0].toFixed(4)}, {currentPos[1].toFixed(4)} (Accuracy: {gpsAccuracyMeters}m)</div>
          <div>Emergency Mode: <strong style={{ color: isEmergencyActive ? '#f87171' : '#4ade80' }}>{isEmergencyActive ? 'ACTIVE' : 'INACTIVE'}</strong></div>
          {emergencySession && (
            <div>Emergency ID: <span style={{ color: '#fbbf24' }}>{emergencySession.emergencyId}</span> | Destination: {emergencySession.safeLocation.name}</div>
          )}
          <div>Road Distance Remaining: <strong style={{ color: '#4ade80' }}>{isEmergencyActive && emergencySession ? emergencySession.routeDistanceKm : remainingRoadDistanceKm} km</strong></div>
          <div>Corridor Offset: <strong style={{ color: distFromRoute > 500 ? '#f87171' : '#4ade80' }}>{distFromRoute} m</strong></div>
          <div>Isolation Forest Prediction: <span style={{ color: riskScore >= 60 ? '#f87171' : '#4ade80' }}>{riskLevel} (Score: {riskScore}/100)</span></div>
        </div>
      )}

      {/* Leaflet Map */}
      <div ref={mapRef} style={{ flex: 1, width: '100%', minHeight: '200px' }} />

      {/* Bottom Sheet Details */}
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '1.25rem',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.1)',
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
              {isEmergencyActive && emergencySession ? emergencySession.safeLocation.name : destinationName}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {isEmergencyActive ? '🚨 Emergency Safe Route' : (tripData?.transportType || 'Bus')} • ETA {isEmergencyActive && emergencySession ? emergencySession.estimatedDurationMinutes : estimatedEtaMins} min
              {tripData?.plateNumber ? ` • 🚗 ${tripData.plateNumber}` : ''}
            </span>
          </div>

          <button 
            className="btn-danger" 
            onClick={() => triggerEmergencyMode('MANUAL_SOS')}
            style={{ padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800 }}
          >
            SOS
          </button>
        </div>

        {/* Dynamic Telemetry Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Remaining Road</span>
            <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>
              {isEmergencyActive && emergencySession ? emergencySession.routeDistanceKm : remainingRoadDistanceKm} km
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Emergency Mode</span>
            <strong style={{ fontSize: '0.95rem', color: isEmergencyActive ? '#dc2626' : '#16a34a' }}>
              {isEmergencyActive ? 'ACTIVE' : 'NORMAL'}
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>ML Risk Score</span>
            <strong style={{ fontSize: '0.95rem', color: riskLevel === 'LOW' ? '#16a34a' : '#dc2626' }}>
              {riskScore}/100
            </strong>
          </div>
        </div>

        <button className="btn-large btn-secondary" onClick={async () => {
          try {
            const baseUrl = getApiBaseUrl();
            const activeTripId = tripData?._id || tripData?.journeyId;
            if (activeTripId) {
              await axios.post(`${baseUrl}/api/trips/${activeTripId}/end`);
            }
          } catch (e) {
            console.warn('[END TRIP] Backend call failed.');
          }
          onEndJourney();
        }}>
          End Journey
        </button>
      </div>

      {/* Stage 1 Safety Verification Prompt */}
      {showSafetyPrompt && !isEmergencyActive && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Are you still safe?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Vehicle is <strong>{distFromRoute} metres</strong> outside the intended route corridor to <strong>{destinationName}</strong>. Please verify your safety status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn-large btn-primary" 
                style={{ backgroundColor: '#16a34a' }}
                onClick={() => setShowSafetyPrompt(false)}
              >
                <CheckCircle size={18} /> I'm Safe
              </button>
              <button 
                className="btn-large btn-danger"
                onClick={() => { setShowSafetyPrompt(false); triggerEmergencyMode('ROUTE_DEVIATION'); }}
              >
                Need Help — Trigger Emergency SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Simulation Controls Sheet */}
      {showDemoSelector && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Vehicle Movement Simulator</h3>
              <button onClick={() => setShowDemoSelector(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Advance vehicle position along the road route and test dynamic emergency updates:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>
                📍 EXACT GPS MOVEMENT SEQUENCE TEST:
              </div>

              <button 
                className="btn-large btn-primary" 
                onClick={() => { moveToExactGps(19.9975, 73.7898); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                📍 Step 1: Start at GPS (19.9975, 73.7898)
              </button>

              <button 
                className="btn-large btn-primary" 
                onClick={() => { moveToExactGps(19.9990, 73.7920); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                📍 Step 2: Move to GPS (19.9990, 73.7920)
              </button>

              <button 
                className="btn-large btn-primary" 
                onClick={() => { moveToExactGps(20.0012, 73.7955); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                📍 Step 3: Move to GPS (20.0012, 73.7955)
              </button>

              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', margin: '0.5rem 0 0.1rem' }}>
                ⚙️ ROUTE SIMULATOR SCENARIOS:
              </div>

              <button 
                className="btn-large btn-secondary" 
                onClick={() => { runVehicleMovementStep(25, 0); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                🟢 1. Advance to 25% Route Progress
              </button>

              <button 
                className="btn-large btn-secondary" 
                onClick={() => { runVehicleMovementStep(60, 0); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                🟢 2. Advance to 60% Route Progress
              </button>

              <button 
                className="btn-large btn-secondary" 
                onClick={() => { runVehicleMovementStep(40, 780); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                🟠 3. Stray 780m Outside Corridor
              </button>

              <button 
                className="btn-large btn-danger" 
                onClick={() => { triggerEmergencyMode('MANUAL_SOS'); setShowDemoSelector(false); }}
                style={{ justifyContent: 'flex-start', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}
              >
                🚨 4. Trigger Emergency Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
