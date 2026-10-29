import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { dbStore, ISOSEvent, IIncident } from '../models/db';
import { sendEmergencyAlertToContacts } from '../services/notificationService';

export async function triggerSOS(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'user_demo_101';
    const { tripId, latitude, longitude, activationMethod } = req.body;

    const sosId = `sos_${Date.now()}`;
    const newSOSEvent: ISOSEvent = {
      _id: sosId,
      userId,
      tripId: tripId || undefined,
      latitude: latitude || 18.5284,
      longitude: longitude || 73.8739,
      activationMethod: activationMethod || 'discreet_button',
      status: 'ACTIVE',
      createdAt: new Date()
    };

    dbStore.sosEvents.set(sosId, newSOSEvent);

    // If active trip exists, mark trip status as alert
    if (tripId && dbStore.trips.has(tripId)) {
      const trip = dbStore.trips.get(tripId)!;
      trip.status = 'alert';
      trip.currentRiskScore = 100;
      trip.currentRiskLevel = 'CRITICAL';
      dbStore.trips.set(tripId, trip);
    }

    // Auto-create incident record
    const incidentId = `inc_${Date.now()}`;
    const newIncident: IIncident = {
      _id: incidentId,
      userId,
      tripId,
      type: 'SOS Emergency Alert',
      description: `Discreet SOS triggered via ${activationMethod || 'discreet_button'}. Live location tracking initiated.`,
      location: { lat: latitude || 18.5284, lng: longitude || 73.8739 },
      status: 'Escalated',
      createdAt: new Date()
    };
    dbStore.incidents.set(incidentId, newIncident);

    // Trigger Notifications to Trusted Contacts
    const notifyResult = await sendEmergencyAlertToContacts(userId, {
      lat: latitude || 18.5284,
      lng: longitude || 73.8739,
      activationMethod: activationMethod || 'Discreet Button',
      tripDestination: tripId && dbStore.trips.has(tripId) ? dbStore.trips.get(tripId)!.destination.name : 'Unknown'
    });

    res.status(201).json({
      message: 'SOS Emergency Activated successfully',
      sosEvent: newSOSEvent,
      incident: newIncident,
      notification: notifyResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getSOSById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const sosEvent = dbStore.sosEvents.get(id);
  if (!sosEvent) return res.status(404).json({ message: 'SOS Event not found' });
  res.json(sosEvent);
}

export async function resolveSOS(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const sosEvent = dbStore.sosEvents.get(id);
  if (!sosEvent) return res.status(404).json({ message: 'SOS Event not found' });

  sosEvent.status = 'RESOLVED';
  sosEvent.resolvedAt = new Date();
  dbStore.sosEvents.set(id, sosEvent);

  if (sosEvent.tripId && dbStore.trips.has(sosEvent.tripId)) {
    const trip = dbStore.trips.get(sosEvent.tripId)!;
    trip.status = 'active';
    trip.currentRiskScore = 15;
    trip.currentRiskLevel = 'LOW';
    dbStore.trips.set(sosEvent.tripId, trip);
  }

  res.json({ message: 'SOS Emergency Resolved', sosEvent });
}
