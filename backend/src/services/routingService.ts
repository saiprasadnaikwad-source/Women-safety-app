import axios from 'axios';
import { config } from '../config';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  routeCoordinates: [number, number][]; // Array of [lat, lng]
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  provider: string;
}

/**
 * Calculates Haversine distance in meters between two points.
 */
function haversineMeters(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchRoadRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResponse> {
  // 1. If Google Maps API Key is configured in environment, attempt Google Maps Directions API
  if (config.mapApiKey && config.mapApiKey !== 'demo_map_key_789' && config.mapApiKey.startsWith('AIza')) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${config.mapApiKey}`;
      const res = await axios.get(gUrl, { timeout: 4000 });
      if (res.data && res.data.routes && res.data.routes.length > 0) {
        const leg = res.data.routes[0].legs[0];
        const distMeters = leg.distance.value;
        const durSec = leg.duration.value;

        // Simple decode or step extraction
        const coords: [number, number][] = leg.steps.map((s: any) => [s.end_location.lat, s.end_location.lng] as [number, number]);
        coords.unshift([origin.latitude, origin.longitude]);

        console.log(`[ROUTING API] Google Maps Directions route fetched: ${distMeters} m (${(distMeters / 1000).toFixed(2)} km)`);

        return {
          routeCoordinates: coords,
          distanceMeters: distMeters,
          distanceKm: Number((distMeters / 1000).toFixed(2)),
          durationSeconds: durSec,
          durationMinutes: Math.round(durSec / 60),
          provider: 'Google Maps Directions API'
        };
      }
    } catch (err) {
      console.warn('[ROUTING API] Google Maps API error. Falling back to OSRM road network engine.');
    }
  }

  // 2. Query OSRM Road Network Engine API
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    const res = await axios.get(osrmUrl, { timeout: 4000 });

    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const route = res.data.routes[0];
      const distMeters = Math.round(route.distance);
      const durSec = Math.round(route.duration);

      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      );

      console.log(`[ROUTING API] OSRM Road Route fetched: ${distMeters} m (${(distMeters / 1000).toFixed(2)} km)`);

      return {
        routeCoordinates: coords,
        distanceMeters: distMeters,
        distanceKm: Number((distMeters / 1000).toFixed(2)),
        durationSeconds: durSec,
        durationMinutes: Math.round(durSec / 60),
        provider: 'OSRM Road Network API'
      };
    }
  } catch (err) {
    console.warn('[ROUTING API] OSRM service offline. Generating multi-point road polyline fallback.');
  }

  // 3. Fallback Multi-Point Road Polyline Interpolator (12 waypoints with road arc curve)
  const straightMeters = haversineMeters(origin, destination);
  const roadDistMeters = Math.round(straightMeters * 1.25);
  const durSec = Math.max(300, Math.round((roadDistMeters / 1000 / 35) * 3600));

  const stepsCount = 12;
  const coords: [number, number][] = [];
  coords.push([origin.latitude, origin.longitude]);

  for (let i = 1; i < stepsCount - 1; i++) {
    const ratio = i / (stepsCount - 1);
    const arc = Math.sin(ratio * Math.PI) * 0.012;
    const lat = origin.latitude + ratio * (destination.latitude - origin.latitude) + arc;
    const lng = origin.longitude + ratio * (destination.longitude - origin.longitude) - arc * 0.5;
    coords.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }

  coords.push([destination.latitude, destination.longitude]);

  console.log(`[ROUTING API] Waypoint Interpolation fallback route created: ${roadDistMeters} m (${(roadDistMeters / 1000).toFixed(2)} km)`);

  return {
    routeCoordinates: coords,
    distanceMeters: roadDistMeters,
    distanceKm: Number((roadDistMeters / 1000).toFixed(2)),
    durationSeconds: durSec,
    durationMinutes: Math.round(durSec / 60),
    provider: 'Road Polyline Interpolator'
  };
}
