import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { dbStore } from '../models/db';
import { getHaversineDistanceMeters } from '../services/geofenceService';

/**
 * GET /api/dashboard
 * Overview telemetry counts & summary
 */
export async function getDashboardOverview(req: AuthRequest, res: Response) {
  const activeJourneys = Array.from(dbStore.trips.values()).filter(t => t.status === 'active' || t.status === 'alert');
  const activeEmergencySessions = Array.from(dbStore.emergencySessions.values()).filter(s => s.emergencyStatus !== 'RESOLVED' && s.liveLocationEnabled);
  const activeSOS = Array.from(dbStore.sosEvents.values()).filter(s => s.status === 'ACTIVE');
  const anomalyEvents = Array.from(dbStore.anomalyEvents.values());
  const highRiskEvents = anomalyEvents.filter(a => a.riskScore >= 60);
  const resolvedIncidents = Array.from(dbStore.incidents.values()).filter(i => i.status === 'Resolved');

  const activeAlertsTotal = activeEmergencySessions.length || activeSOS.length;

  res.json({
    metrics: {
      activeJourneysCount: activeJourneys.length,
      activeAlertsCount: activeAlertsTotal,
      highRiskEventsCount: highRiskEvents.length,
      resolvedIncidentsCount: resolvedIncidents.length
    },
    activeEmergencies: activeEmergencySessions,
    activeJourneys
  });
}

/**
 * GET /api/dashboard/journeys
 * Returns all active journeys with passenger, vehicle, GPS, and ML telemetry
 */
export async function getDashboardJourneys(req: AuthRequest, res: Response) {
  const activeJourneys = Array.from(dbStore.trips.values())
    .filter((trip) => trip.status === 'active' || trip.status === 'alert')
    .map((trip) => {
      const user = dbStore.users.get(trip.userId);
      const latestLoc = dbStore.locationUpdates.slice().reverse().find((l) => l.tripId === trip._id);
      const latestAnomaly = Array.from(dbStore.anomalyEvents.values()).reverse().find((a) => a.tripId === trip._id);

      const currentPos = latestLoc ? { lat: latestLoc.latitude, lng: latestLoc.longitude } : (trip.expectedRoute[0] || { lat: 18.5284, lng: 73.8739 });

      const destPos = trip.destination || { lat: 18.5912, lng: 73.7389 };
      const distMeters = getHaversineDistanceMeters(currentPos, destPos);
      const remainingDistanceKm = Number((distMeters / 1000).toFixed(1));
      const etaMinutes = Math.max(1, Math.round((remainingDistanceKm / 35) * 60));

      return {
        _id: trip._id,
        journeyId: trip._id,
        userId: trip.userId,
        userName: user ? user.name : 'Ishwari Gade',
        userPhone: user ? user.phone : '+91 9876543210',
        vehicleId: trip._id === 'trip_demo_501' ? 'BUS-102' : 'VEHICLE-A101',
        transportType: trip.transportType || 'Bus',
        source: trip.source,
        destination: trip.destination,
        currentLocation: currentPos,
        speedKmh: latestLoc ? latestLoc.speed : 38.5,
        remainingDistanceKm,
        etaMinutes,
        distFromRouteMeters: latestAnomaly ? latestAnomaly.features.distance_from_route_m : 14,
        routeStatus: (latestAnomaly && latestAnomaly.features.distance_from_route_m > 500) ? 'OFF ROUTE' : 'ON ROUTE',
        safetyStatus: trip.currentRiskLevel || 'LOW',
        riskScore: trip.currentRiskScore || 12,
        lastUpdated: latestLoc ? latestLoc.timestamp : trip.createdAt,
        expectedRoute: trip.expectedRoute,
        mlFeatures: latestAnomaly ? latestAnomaly.features : {
          distance_from_route_m: 14,
          speed_kmh: 38.5,
          stop_duration_min: 0.0,
          direction_change_deg: 4.0,
          journey_delay_min: 0.5,
          distance_to_destination_km: remainingDistanceKm
        },
        isolationForestPrediction: latestAnomaly && latestAnomaly.anomaly ? 'ANOMALY' : 'NORMAL'
      };
    });

  res.json(activeJourneys);
}

/**
 * GET /api/dashboard/alerts
 * Returns active emergency alerts for dashboard feed
 */
export async function getDashboardAlerts(req: AuthRequest, res: Response) {
  const activeEmg = Array.from(dbStore.emergencySessions.values()).filter(s => s.emergencyStatus !== 'RESOLVED' && s.liveLocationEnabled);

  if (activeEmg.length > 0) {
    return res.json(activeEmg);
  }

  const sosEvents = Array.from(dbStore.sosEvents.values()).filter(s => s.status === 'ACTIVE');
  const formattedAlerts = sosEvents.map(s => {
    const user = dbStore.users.get(s.userId);
    const trip = s.tripId ? dbStore.trips.get(s.tripId) : undefined;
    return {
      emergencyId: s._id,
      userId: s.userId,
      userName: user ? user.name : 'Ishwari Gade',
      userPhone: user ? user.phone : '+91 9876543210',
      vehicleId: 'BUS-102',
      transportType: trip ? trip.transportType : 'Mobile SOS',
      currentLocation: { latitude: s.latitude, longitude: s.longitude, accuracy: 8 },
      riskScore: trip ? trip.currentRiskScore : 95,
      riskLevel: 'CRITICAL',
      triggerType: `Discreet SOS (${s.activationMethod})`,
      startedAt: s.createdAt,
      lastLocationUpdate: s.createdAt,
      emergencyStatus: s.status,
      safeLocation: {
        name: 'Shivajinagar Police Station & Women Desk',
        category: 'Police Station',
        latitude: s.latitude + 0.01,
        longitude: s.longitude + 0.01,
        address: 'JM Road, Shivajinagar, Pune'
      },
      routeDistanceKm: 1.8,
      estimatedDurationMinutes: 5,
      liveLocationEnabled: true
    };
  });

  res.json(formattedAlerts);
}

/**
 * GET /api/dashboard/incidents
 * Returns historical resolved incidents for audit records module
 */
export async function getDashboardIncidents(req: AuthRequest, res: Response) {
  const incidents = Array.from(dbStore.incidents.values()).map(inc => {
    return {
      ...inc,
      userName: inc.userName || 'Ishwari Gade',
      userPhone: inc.userPhone || '+91 9876543210',
      vehicleId: inc.vehicleId || 'BUS-102',
      status: inc.status || 'Resolved'
    };
  });

  res.json(incidents);
}
