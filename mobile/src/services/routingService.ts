import axios from 'axios';

export interface Point {
  lat: number;
  lng: number;
}

export interface RouteDetails {
  origin: Point;
  destination: Point;
  straightLineDistanceKm: number;
  routeDistanceKm: number;
  durationMin: number;
  polyline: [number, number][]; // Array of [lat, lng]
  provider: string;
}

/**
 * Calculates Haversine distance in km between two points.
 */
export function calculateHaversineKm(p1: Point, p2: Point): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Fetches dynamic road route from Express Backend API (`POST http://localhost:5000/api/routes`) or OSRM directly.
 */
export async function fetchDynamicRoute(origin: Point, destination: Point): Promise<RouteDetails> {
  const straightLineKm = calculateHaversineKm(origin, destination);

  // 1. Query Node Express Backend Routing API endpoint POST /api/routes
  try {
    const res = await axios.post('http://localhost:5000/api/routes', {
      origin: { latitude: origin.lat, longitude: origin.lng },
      destination: { latitude: destination.lat, longitude: destination.lng }
    }, { timeout: 4000 });

    if (res.data && res.data.routeCoordinates && res.data.routeCoordinates.length > 0) {
      const { routeCoordinates, distanceKm, durationMinutes, provider } = res.data;
      console.log(`[ROUTING SERVICE] Backend /api/routes returned: ${distanceKm} km | ${durationMinutes} min | Provider: ${provider}`);

      return {
        origin,
        destination,
        straightLineDistanceKm: straightLineKm,
        routeDistanceKm: distanceKm,
        durationMin: durationMinutes,
        polyline: routeCoordinates,
        provider: provider || 'Express Routing Engine'
      };
    }
  } catch (err) {
    console.warn('[ROUTING SERVICE] Backend route API unavailable. Querying direct OSRM road engine.');
  }

  // 2. Direct OSRM Road Engine Query
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(osrmUrl, { timeout: 4000 });

    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const route = res.data.routes[0];
      const routeDistanceKm = Number((route.distance / 1000).toFixed(2));
      const durationMin = Math.round(route.duration / 60);

      const polyline: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      );

      console.log(`[ROUTING SERVICE] OSRM Direct: Straight-line ${straightLineKm} km | Road ${routeDistanceKm} km | Duration ${durationMin} min`);

      return {
        origin,
        destination,
        straightLineDistanceKm: straightLineKm,
        routeDistanceKm,
        durationMin,
        polyline,
        provider: 'OSRM Road Engine'
      };
    }
  } catch (err) {
    console.warn('[ROUTING SERVICE] OSRM offline. Using multi-point waypoint route generator.');
  }

  // 3. Multi-point Waypoint Polyline Generator Fallback
  const stepsCount = 10;
  const polyline: [number, number][] = [];
  polyline.push([origin.lat, origin.lng]);

  for (let i = 1; i < stepsCount - 1; i++) {
    const ratio = i / (stepsCount - 1);
    const arc = Math.sin(ratio * Math.PI) * 0.015;
    const lat = origin.lat + ratio * (destination.lat - origin.lat) + arc;
    const lng = origin.lng + ratio * (destination.lng - origin.lng) - arc * 0.5;
    polyline.push([Number(lat.toFixed(4)), Number(lng.toFixed(4))]);
  }

  polyline.push([destination.lat, destination.lng]);
  const routeDistanceKm = Number((straightLineKm * 1.25).toFixed(2));
  const durationMin = Math.max(5, Math.round((routeDistanceKm / 30) * 60));

  return {
    origin,
    destination,
    straightLineDistanceKm: straightLineKm,
    routeDistanceKm,
    durationMin,
    polyline,
    provider: 'Road Polyline Interpolator'
  };
}
