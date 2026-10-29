export interface Point {
  lat: number;
  lng: number;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function getHaversineDistanceMeters(p1: Point, p2: Point): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Shortest distance from point P to line segment AB in meters.
 */
export function getDistanceToSegmentMeters(p: Point, a: Point, b: Point): number {
  const l2 = getHaversineDistanceMeters(a, b);
  if (l2 === 0) return getHaversineDistanceMeters(p, a);

  // Approximate planar projection for local distance segment t
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;

  if (dx === 0 && dy === 0) return getHaversineDistanceMeters(p, a);

  let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const projection: Point = {
    lat: a.lat + t * dy,
    lng: a.lng + t * dx
  };

  return getHaversineDistanceMeters(p, projection);
}

/**
 * Shortest distance from current position to expected route polyline in meters.
 */
export function calculateDistanceFromRouteMeters(
  currentPos: Point,
  routePolyline: Point[]
): number {
  if (!routePolyline || routePolyline.length === 0) return 0;
  if (routePolyline.length === 1) return getHaversineDistanceMeters(currentPos, routePolyline[0]);

  let minDistance = Infinity;
  for (let i = 0; i < routePolyline.length - 1; i++) {
    const dist = getDistanceToSegmentMeters(currentPos, routePolyline[i], routePolyline[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return Math.round(minDistance);
}

/**
 * Checks if current distance exceeds 0.5 km (500m) corridor geofence.
 */
export function isRouteDeviated(distanceFromRouteMeters: number): boolean {
  return distanceFromRouteMeters > 500;
}
