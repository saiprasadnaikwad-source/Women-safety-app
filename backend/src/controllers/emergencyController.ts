import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  searchNearbySafeLocations,
  startEmergencySession,
  updateEmergencyLocation,
  resolveEmergencySession
} from '../services/emergencyService';
import { dbStore } from '../models/db';
import { sendEmergencyAlertToContacts, sendLiveLocationShareToContacts } from '../services/notificationService';

/**
 * GET /api/emergency/nearby-safe-locations
 * Searches nearby verified safe locations (Police Stations, Hospitals, Fire Stations)
 */
export async function getNearbySafeLocations(req: Request, res: Response) {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 18.5284;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 73.8739;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const category = req.query.category ? (req.query.category as string) : undefined;

    const locations = await searchNearbySafeLocations(lat, lng, radius, category);
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search nearby safe locations', details: error.message });
  }
}

/**
 * POST /api/emergency/start
 * Starts a new emergency session (EMG-2026-XXXX) and returns selected safe location & road route
 */
export async function handleStartEmergency(req: AuthRequest, res: Response) {
  try {
    const userId = req.user ? req.user.userId : req.body.userId || 'user_demo_101';
    const user = dbStore.users.get(userId);
    const userName = req.body.userName || user?.name || 'Passenger';
    const userPhone = req.body.userPhone || user?.phone || '';
    const triggerType = req.body.triggerType || 'MANUAL_SOS';
    const currentLocation = req.body.currentLocation || { latitude: 18.5284, longitude: 73.8739 };
    const preferredCategory = req.body.preferredCategory;

    const io = req.app.get('io');
    const session = await startEmergencySession(
      userId,
      userName,
      userPhone,
      triggerType,
      currentLocation,
      preferredCategory,
      io
    );

    // Get contacts & message for mobile to send via native SMS
    const notifyResult = await sendEmergencyAlertToContacts(userId, {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      activationMethod: triggerType,
      tripDestination: req.body.tripDestination,
      userName
    });

    res.status(201).json({ ...session, smsContacts: notifyResult.contacts, smsMessage: notifyResult.messageSent });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to start emergency session', details: error.message });
  }
}

/**
 * POST /api/emergency/location
 * Updates live location for an ongoing emergency session and recalculates road distance
 */
export async function handleUpdateEmergencyLocation(req: Request, res: Response) {
  try {
    const { emergencyId, latitude, longitude, accuracy, speed } = req.body;
    if (!emergencyId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'emergencyId, latitude, and longitude are required.' });
    }

    const io = req.app.get('io');
    const updatedSession = await updateEmergencyLocation(
      emergencyId,
      { latitude, longitude, accuracy, speed },
      io
    );

    if (!updatedSession) {
      return res.status(444).json({ error: 'Emergency session not found or resolved.' });
    }

    res.json(updatedSession);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update emergency location', details: error.message });
  }
}

/**
 * GET /api/emergency/:id
 * Fetches current state of an emergency session
 */
export async function getEmergencySession(req: Request, res: Response) {
  try {
    const emergencyId = req.params.id;
    const session = dbStore.emergencySessions.get(emergencyId);
    if (!session) {
      return res.status(404).json({ error: 'Emergency session not found' });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch emergency session', details: error.message });
  }
}

/**
 * GET /api/emergency/active/all
 * Returns all active emergency sessions for Authority Dashboard
 */
export async function getAllActiveEmergencies(req: Request, res: Response) {
  try {
    const activeSessions = Array.from(dbStore.emergencySessions.values()).filter(
      s => s.emergencyStatus !== 'RESOLVED' && s.liveLocationEnabled
    );
    res.json(activeSessions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active emergencies', details: error.message });
  }
}

/**
 * POST /api/emergency/share-location
 * Sends live location SMS to all trusted contacts when user taps "Share Location"
 */
export async function handleShareLocation(req: AuthRequest, res: Response) {
  try {
    const { emergencyId, latitude, longitude } = req.body;
    // Use userId from body first, then JWT, then fallback to demo user
    let userId = req.body.userId || req.user?.userId || 'user_demo_101';

    if (!emergencyId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'emergencyId, latitude and longitude are required.' });
    }

    // If no contacts found for given userId, fall back to demo user contacts
    const contactsForUser = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);
    if (contactsForUser.length === 0) {
      console.warn(`[SHARE] No contacts for userId: ${userId}, falling back to user_demo_101`);
      userId = 'user_demo_101';
    }

    console.log(`[SHARE] Sending location for userId: ${userId}, emergencyId: ${emergencyId}, lat: ${latitude}, lng: ${longitude}`);

    const result = await sendLiveLocationShareToContacts(userId, latitude, longitude, emergencyId);
    console.log(`[SHARE] Result:`, result);
    res.json({ ...result, success: true, smsContacts: result.contacts, smsMessage: result.message });
  } catch (error: any) {
    console.error('[SHARE ERROR]', error.message);
    res.status(500).json({ error: 'Failed to share location', details: error.message });
  }
}

export async function handleResolveEmergency(req: AuthRequest, res: Response) {
  try {
    const { emergencyId, resolvedBy } = req.body;
    if (!emergencyId) {
      return res.status(400).json({ error: 'emergencyId is required' });
    }

    const io = req.app.get('io');
    const session = await resolveEmergencySession(emergencyId, resolvedBy || 'User', io);

    if (!session) {
      return res.status(404).json({ error: 'Emergency session not found' });
    }

    res.json({ message: 'Emergency session resolved successfully', session });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve emergency session', details: error.message });
  }
}
