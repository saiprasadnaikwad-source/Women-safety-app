import { calculateHaversineKm, Point } from './routingService';

/**
 * Calculates Haversine distance in meters between two [lat, lng] points.
 */
export function getDistanceMeters(p1: [number, number], p2: [number, number]): number {
  const R = 6371000;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates shortest distance in meters from point P to line segment AB.
 */
export function getDistanceToSegmentMeters(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { distanceMeters: number; projection: [number, number] } {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];

  if (dx === 0 && dy === 0) {
    return { distanceMeters: getDistanceMeters(p, a), projection: a };
  }

  let t = ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const projection: [number, number] = [a[0] + t * dy, a[1] + t * dx];
  return {
    distanceMeters: getDistanceMeters(p, projection),
    projection
  };
}

/**
 * Calculates perpendicular distance from vehicle position to route polyline in meters (0.5km Corridor Rule).
 */
export function getCorridorOffsetMeters(
  currentPos: [number, number],
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return Math.round(getDistanceMeters(currentPos, polyline[0]));

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const res = getDistanceToSegmentMeters(currentPos, polyline[i], polyline[i + 1]);
    if (res.distanceMeters < minDistance) {
      minDistance = res.distanceMeters;
    }
  }

  return Math.round(minDistance);
}

/**
 * Calculates REMAINING ROAD DISTANCE IN KM along the route polyline geometry.
 * Sums remaining segment lengths from closest projected point to destination.
 */
export function calculateRemainingRoadDistanceKm(
  currentPos: [number, number],
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return Number((getDistanceMeters(currentPos, polyline[0]) / 1000).toFixed(2));

  let closestSegmentIdx = 0;
  let minSegDist = Infinity;
  let closestProjection: [number, number] = polyline[0];

  // Find closest segment along polyline
  for (let i = 0; i < polyline.length - 1; i++) {
    const res = getDistanceToSegmentMeters(currentPos, polyline[i], polyline[i + 1]);
    if (res.distanceMeters < minSegDist) {
      minSegDist = res.distanceMeters;
      closestSegmentIdx = i;
      closestProjection = res.projection;
    }
  }

  // 1. Distance from projection to end of current segment
  let remainingMeters = getDistanceMeters(closestProjection, polyline[closestSegmentIdx + 1]);

  // 2. Sum all remaining road segments to destination
  for (let j = closestSegmentIdx + 1; j < polyline.length - 1; j++) {
    remainingMeters += getDistanceMeters(polyline[j], polyline[j + 1]);
  }

  return Number((remainingMeters / 1000).toFixed(2));
}

/**
 * Calculates circular heading difference angle (0° to 180°).
 * Handles wrap-around e.g. 350° to 10° = 20°.
 */
export function calculateCircularHeadingDiff(heading1: number, heading2: number): number {
  let diff = Math.abs(heading1 - heading2) % 360;
  if (diff > 180) diff = 360 - diff;
  return Number(diff.toFixed(1));
}
