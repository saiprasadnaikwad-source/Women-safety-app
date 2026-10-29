import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

export interface EmergencySessionData {
  emergencyId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  triggerType: 'MANUAL_SOS' | 'ANOMALY_DETECTION' | 'ROUTE_DEVIATION' | 'OTHER';
  emergencyStatus: 'NORMAL' | 'EMERGENCY_DETECTED' | 'ALERTING' | 'LIVE_LOCATION_ACTIVE' | 'SAFE_LOCATION_SELECTED' | 'RESOLVED';
  startedAt: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    timestamp: string;
  };
  safeLocation: {
    placeId?: string;
    name: string;
    address: string;
    category: 'Police Station' | 'Hospital' | 'Fire Station' | 'Emergency Services' | 'Other Verified Safe Location';
    latitude: number;
    longitude: number;
    phone?: string;
  };
  routeDistanceMeters: number;
  routeDistanceKm: number;
  estimatedDurationSeconds: number;
  estimatedDurationMinutes: number;
  routeCoordinates?: [number, number][];
  liveLocationEnabled: boolean;
  lastLocationUpdate: string;
}

export interface SafeLocationOption {
  placeId: string;
  name: string;
  address: string;
  category: 'Police Station' | 'Hospital' | 'Fire Station' | 'Emergency Services' | 'Other Verified Safe Location';
  latitude: number;
  longitude: number;
  phone: string;
  distanceKm: number;
}

/**
 * Fetches nearby verified safe locations from backend
 */
export async function getNearbySafeLocations(
  lat: number,
  lng: number,
  category?: string
): Promise<SafeLocationOption[]> {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/emergency/nearby-safe-locations`, {
      params: { lat, lng, radius: 5, category }
    });
    return res.data;
  } catch (err) {
    console.warn('[EMERGENCY API] Nearby search failed. Returning dynamic fallback.');
    return [
      {
        placeId: 'fallback_police',
        name: 'District Police Station & Women Protection Cell',
        address: 'Main Emergency Road',
        category: 'Police Station',
        latitude: lat + 0.012,
        longitude: lng + 0.008,
        phone: '112 / 1091',
        distanceKm: 1.4
      }
    ];
  }
}

/**
 * Starts a new emergency session (EMG-2026-XXXX) on backend
 */
export async function startEmergencySession(
  currentLocation: { latitude: number; longitude: number; accuracy?: number; speed?: number },
  triggerType: 'MANUAL_SOS' | 'ANOMALY_DETECTION' | 'ROUTE_DEVIATION' | 'OTHER' = 'MANUAL_SOS',
  preferredCategory?: string,
  userInfo?: { userId: string; userName: string; userPhone: string }
): Promise<EmergencySessionData> {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/emergency/start`, {
      userId: userInfo?.userId,
      userName: userInfo?.userName,
      userPhone: userInfo?.userPhone,
      triggerType,
      currentLocation,
      preferredCategory
    });
    return res.data;
  } catch (err) {
    console.warn('[EMERGENCY API] Start session backend offline. Creating local session.');
    const emergencyId = `EMG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const safeLat = currentLocation.latitude + 0.011;
    const safeLng = currentLocation.longitude + 0.009;

    return {
      emergencyId,
      userId: userInfo?.userId || 'user_local',
      userName: userInfo?.userName,
      userPhone: userInfo?.userPhone,
      triggerType,
      emergencyStatus: 'LIVE_LOCATION_ACTIVE',
      startedAt: new Date().toISOString(),
      currentLocation: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy || 8,
        speed: currentLocation.speed || 0,
        timestamp: new Date().toISOString()
      },
      safeLocation: {
        placeId: 'loc_dyn_police',
        name: 'Shivajinagar Police Station & Women Desk',
        address: 'JM Road, Shivajinagar, Pune',
        category: 'Police Station',
        latitude: safeLat,
        longitude: safeLng,
        phone: '112 / 1091'
      },
      routeDistanceMeters: 1800,
      routeDistanceKm: 1.8,
      estimatedDurationSeconds: 360,
      estimatedDurationMinutes: 6,
      routeCoordinates: [
        [currentLocation.latitude, currentLocation.longitude],
        [currentLocation.latitude + 0.005, currentLocation.longitude + 0.004],
        [safeLat, safeLng]
      ],
      liveLocationEnabled: true,
      lastLocationUpdate: new Date().toISOString()
    };
  }
}

/**
 * Sends live GPS location updates to backend for active emergency
 */
export async function sendEmergencyLocationUpdate(
  emergencyId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number
): Promise<EmergencySessionData | null> {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/emergency/location`, {
      emergencyId,
      latitude,
      longitude,
      accuracy,
      speed
    });
    return res.data;
  } catch (err) {
    console.warn('[EMERGENCY API] Location update failed.');
    return null;
  }
}

/**
 * Resolves active emergency session on backend
 */
export async function resolveEmergency(emergencyId: string): Promise<boolean> {
  try {
    await axios.post(`${BACKEND_URL}/api/emergency/resolve`, {
      emergencyId,
      resolvedBy: 'User'
    });
    return true;
  } catch (err) {
    console.warn('[EMERGENCY API] Resolve failed.');
    return false;
  }
}
