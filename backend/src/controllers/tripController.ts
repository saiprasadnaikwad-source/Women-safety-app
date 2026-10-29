import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { dbStore, ITrip, ILocationUpdate, IAnomalyEvent } from '../models/db';
import { calculateDistanceFromRouteMeters, getHaversineDistanceMeters } from '../services/geofenceService';
import { predictJourneyAnomaly, MLPredictionRequest } from '../services/mlService';
import { evaluateJourneyRisk } from '../services/riskEngineService';
import { sendJourneyStartedSMS, sendJourneyEndedSMS } from '../services/notificationService';

export async function createTrip(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'user_demo_101';
    const { source, destination, transportType, expectedRoute, expectedDuration } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ message: 'Source and destination are required' });
    }

    const tripId = `trip_${Date.now()}`;
    const defaultRoute = expectedRoute && expectedRoute.length > 0 ? expectedRoute : [
      source.lat && source.lng ? { lat: source.lat, lng: source.lng } : { lat: 18.5284, lng: 73.8739 },
      { lat: (source.lat || 18.5284) + 0.02, lng: (source.lng || 73.8739) - 0.03 },
      destination.lat && destination.lng ? { lat: destination.lat, lng: destination.lng } : { lat: 18.5912, lng: 73.7389 }
    ];

    const durationMins = expectedDuration || 30;
    const newTrip: ITrip = {
      _id: tripId,
      userId,
      source: typeof source === 'string' ? { name: source, lat: 18.5284, lng: 73.8739 } : source,
      destination: typeof destination === 'string' ? { name: destination, lat: 18.5912, lng: 73.7389 } : destination,
      transportType: transportType || 'Bus',
      expectedRoute: defaultRoute,
      expectedDuration: durationMins,
      startTime: new Date(),
      estimatedArrival: new Date(Date.now() + durationMins * 60000),
      status: 'active',
      currentRiskScore: 10,
      currentRiskLevel: 'LOW',
      createdAt: new Date()
    };

    dbStore.trips.set(tripId, newTrip);

    const io = req.app.get('io');
    if (io) {
      io.to('authority_dashboard').emit('journey:started', newTrip);
    }

    // Send journey start SMS to all trusted contacts
    const user = dbStore.users.get(userId);
    if (user) {
      sendJourneyStartedSMS(
        userId,
        user.name,
        newTrip.source.name,
        newTrip.destination.name,
        newTrip.source.lat,
        newTrip.source.lng,
        durationMins,
        tripId
      ).catch(() => {});
    }

    res.status(201).json(newTrip);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getTrips(req: AuthRequest, res: Response) {
  const userId = req.user?.userId || 'user_demo_101';
  const trips = Array.from(dbStore.trips.values()).filter(t => t.userId === userId);
  res.json(trips);
}

export async function getTripById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const trip = dbStore.trips.get(id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json(trip);
}

export async function recordLocationUpdate(req: AuthRequest, res: Response) {
  try {
    const { id: tripId } = req.params;
    const userId = req.user?.userId || 'user_demo_101';
    const trip = dbStore.trips.get(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { latitude, longitude, speed, direction, stopDurationMin, journeyDelayMin } = req.body;

    const currentPos = { lat: latitude, lng: longitude };
    
    // 1. Calculate Distance from expected corridor in meters (0.5km geofence rule)
    const distFromRouteMeters = calculateDistanceFromRouteMeters(currentPos, trip.expectedRoute);

    // 2. Calculate Distance to final destination in km
    const distToDestMeters = getHaversineDistanceMeters(currentPos, trip.destination);
    const distToDestKm = Number((distToDestMeters / 1000).toFixed(2));

    // 3. Assemble the exact 6 features
    const mlFeatures: MLPredictionRequest = {
      distance_from_route_m: distFromRouteMeters,
      speed_kmh: speed ?? 25.0,
      stop_duration_min: stopDurationMin ?? 0.0,
      direction_change_deg: direction ?? 0.0,
      journey_delay_min: journeyDelayMin ?? 0.0,
      distance_to_destination_km: distToDestKm
    };

    // 4. Call ML Service (Isolation Forest)
    const mlPrediction = await predictJourneyAnomaly(mlFeatures);

    // 5. Evaluate Risk Engine (Staged response)
    const activeSOS = Array.from(dbStore.sosEvents.values()).some(s => s.userId === userId && s.status === 'ACTIVE');
    const riskResult = evaluateJourneyRisk(trip, mlPrediction, activeSOS);

    // Update trip risk status
    trip.currentRiskScore = riskResult.riskScore;
    trip.currentRiskLevel = riskResult.riskLevel;
    if (riskResult.riskScore > 75) trip.status = 'alert';
    dbStore.trips.set(tripId, trip);

    // Save location update
    const locUpdate: ILocationUpdate = {
      _id: `loc_${Date.now()}`,
      tripId,
      userId,
      latitude,
      longitude,
      speed: speed ?? 0,
      direction: direction ?? 0,
      timestamp: new Date()
    };
    dbStore.locationUpdates.push(locUpdate);

    // If anomalous or high risk, log anomaly event
    if (mlPrediction.anomaly || riskResult.actionRequired) {
      const anomalyEvent: IAnomalyEvent = {
        _id: `anom_${Date.now()}`,
        tripId,
        userId,
        riskScore: riskResult.riskScore,
        anomaly: mlPrediction.anomaly,
        reason: riskResult.userMessage,
        features: mlFeatures,
        latitude,
        longitude,
        timestamp: new Date(),
        status: riskResult.riskScore > 80 ? 'escalated' : 'user_notified'
      };
      dbStore.anomalyEvents.set(anomalyEvent._id, anomalyEvent);
    }

    // Emit Socket.IO real-time telemetry update to dashboard
    const io = req.app.get('io');
    if (io) {
      const updatePayload = {
        tripId,
        journeyId: tripId,
        userId,
        latitude,
        longitude,
        currentLocation: { lat: latitude, lng: longitude },
        speed: speed ?? 25.0,
        direction: direction ?? 0,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        distFromRouteMeters,
        distToDestKm,
        timestamp: new Date()
      };
      io.to(`trip_${tripId}`).emit('location_changed', updatePayload);
      io.to('authority_dashboard').emit('live_location_update', updatePayload);
      io.to('authority_dashboard').emit('location_update', updatePayload);
      io.to('authority_dashboard').emit('journey:location-update', updatePayload);
    }

    res.json({
      location: locUpdate,
      geofence: {
        distanceFromRouteMeters: distFromRouteMeters,
        corridorBreached: distFromRouteMeters > 500
      },
      mlPrediction,
      riskResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function endTrip(req: AuthRequest, res: Response) {
  const { id: tripId } = req.params;
  const trip = dbStore.trips.get(tripId);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  trip.status = 'completed';
  trip.currentRiskScore = 0;
  trip.currentRiskLevel = 'LOW';
  dbStore.trips.set(tripId, trip);

  const io = req.app.get('io');
  if (io) {
    io.to('authority_dashboard').emit('journey:ended', { tripId, journeyId: tripId });
  }

  // Send journey ended SMS to all trusted contacts
  const user = dbStore.users.get(trip.userId);
  if (user) {
    sendJourneyEndedSMS(
      trip.userId,
      user.name,
      trip.destination.name,
      trip.destination.lat,
      trip.destination.lng
    ).catch(() => {});
  }

  res.json({ message: 'Journey completed successfully', trip });
}
