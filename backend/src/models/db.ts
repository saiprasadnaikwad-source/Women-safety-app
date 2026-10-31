import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITrustedContact {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface ITrip {
  _id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  source: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  transportType: string;
  expectedRoute: Array<{ lat: number; lng: number }>;
  expectedDuration: number; // in mins
  startTime: Date;
  estimatedArrival: Date;
  status: 'active' | 'completed' | 'alert' | 'cancelled';
  currentRiskScore: number;
  currentRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
}

export interface ILocationUpdate {
  _id: string;
  tripId: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  timestamp: Date;
}

export interface IAnomalyEvent {
  _id: string;
  tripId: string;
  userId: string;
  riskScore: number;
  anomaly: boolean;
  reason: string;
  features: {
    distance_from_route_m: number;
    speed_kmh: number;
    stop_duration_min: number;
    direction_change_deg: number;
    journey_delay_min: number;
    distance_to_destination_km: number;
  };
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: 'new' | 'user_notified' | 'escalated' | 'dismissed';
}

export interface ISOSEvent {
  _id: string;
  userId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  activationMethod: 'discreet_button' | 'shake' | 'voice' | 'geofence_auto';
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface IIncident {
  _id: string;
  emergencyId?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  vehicleId?: string;
  tripId?: string;
  type: string;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore?: number;
  description: string;
  location: { lat: number; lng: number; address?: string };
  initialLocation?: { lat: number; lng: number };
  safeLocation?: { name: string; category: string; lat: number; lng: number; address: string };
  evidence?: { photoUrl?: string; audioUrl?: string };
  status: 'Detected' | 'Confirmation Requested' | 'Escalated' | 'Assistance Sent' | 'Resolved';
  createdAt: Date;
  resolvedAt?: Date;
  durationMinutes?: number;
  safetyEvents?: Array<{ time: string; event: string }>;
  mlFeatures?: {
    distance_from_route_m: number;
    speed_kmh: number;
    stop_duration_min: number;
    direction_change_deg: number;
    journey_delay_min: number;
    distance_to_destination_km: number;
  };
  isolationForestStatus?: 'NORMAL' | 'ANOMALY';
}

export interface IEmergencySession {
  emergencyId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  triggerType: 'MANUAL_SOS' | 'ANOMALY_DETECTION' | 'ROUTE_DEVIATION' | 'OTHER';
  emergencyStatus: 'NORMAL' | 'EMERGENCY_DETECTED' | 'ALERTING' | 'LIVE_LOCATION_ACTIVE' | 'SAFE_LOCATION_SELECTED' | 'RESOLVED';
  startedAt: Date;
  resolvedAt?: Date;

  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    timestamp: Date;
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
  lastLocationUpdate: Date;
}

// Load real contacts from JSON file
import realContactsData from '../data/contacts.json';

// In-Memory Database Store as reliable fallback
class MemoryDatabase {
  users: Map<string, IUser> = new Map();
  contacts: Map<string, ITrustedContact> = new Map();
  trips: Map<string, ITrip> = new Map();
  locationUpdates: ILocationUpdate[] = [];
  anomalyEvents: Map<string, IAnomalyEvent> = new Map();
  sosEvents: Map<string, ISOSEvent> = new Map();
  incidents: Map<string, IIncident> = new Map();
  emergencySessions: Map<string, IEmergencySession> = new Map();
  isConnectedMongo: boolean = false;

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const demoPasswordHash = bcrypt.hashSync('Demo@123', 10);
    const demoUserId = 'user_demo_101';
    
    // Default Demo User
    const demoUser: IUser = {
      _id: demoUserId,
      name: 'Ishwari Gade',
      email: 'demo@example.com',
      phone: '+91 9876543210',
      passwordHash: demoPasswordHash,
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(demoUserId, demoUser);

    // Load real emergency contacts from contacts.json
    for (const c of realContactsData) {
      const contact: ITrustedContact = {
        _id: c._id,
        userId: demoUserId,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        isPrimary: c.isPrimary,
        createdAt: new Date()
      };
      this.contacts.set(contact._id, contact);
    }

    // Default Sample Trip (Pune Station to Hinjewadi Phase 1)
    const trip1: ITrip = {
      _id: 'trip_demo_501',
      userId: demoUserId,
      source: { name: 'Pune Central Station', lat: 18.5284, lng: 73.8739 },
      destination: { name: 'Hinjewadi IT Park Phase 1', lat: 18.5912, lng: 73.7389 },
      transportType: 'Bus',
      expectedRoute: [
        { lat: 18.5284, lng: 73.8739 },
        { lat: 18.5312, lng: 73.8445 },
        { lat: 18.5524, lng: 73.8012 },
        { lat: 18.5789, lng: 73.7645 },
        { lat: 18.5912, lng: 73.7389 }
      ],
      expectedDuration: 35,
      startTime: new Date(),
      estimatedArrival: new Date(Date.now() + 35 * 60000),
      status: 'completed',
      currentRiskScore: 12,
      currentRiskLevel: 'LOW',
      createdAt: new Date()
    };
    this.trips.set(trip1._id, trip1);

    // Default Historical Incident Audits
    const incident1: IIncident = {
      _id: 'INC-2026-001',
      emergencyId: 'EMG-2026-1014',
      userId: demoUserId,
      userName: 'Ishwari Gade',
      userPhone: '+91 9876543210',
      vehicleId: 'BUS-102',
      tripId: trip1._id,
      type: 'Route Deviation + Isolation Forest Anomaly',
      riskLevel: 'HIGH',
      riskScore: 78,
      description: 'Vehicle deviated 780 meters from scheduled route near Aundh Flyover.',
      location: { lat: 18.5612, lng: 73.8045, address: 'Aundh Bypass Road, Pune' },
      initialLocation: { lat: 18.5284, lng: 73.8739 },
      safeLocation: {
        name: 'Shivajinagar Police Station & Women Desk',
        category: 'Police Station',
        lat: 18.5312,
        lng: 73.8445,
        address: 'JM Road, Shivajinagar, Pune'
      },
      status: 'Resolved',
      createdAt: new Date(Date.now() - 86400000), // 24 hours ago
      resolvedAt: new Date(Date.now() - 85500000), // 15 mins later
      durationMinutes: 15,
      safetyEvents: [
        { time: '12:01:00 AM', event: 'Journey started from Pune Central Station' },
        { time: '12:12:30 AM', event: 'Vehicle deviated 780m outside 0.5km route corridor' },
        { time: '12:13:00 AM', event: 'Isolation Forest ML model flagged ANOMALY (Risk Score: 78)' },
        { time: '12:13:15 AM', event: 'Emergency Session EMG-2026-1014 activated' },
        { time: '12:13:30 AM', event: 'Nearest safe location identified: Shivajinagar Police Station' },
        { time: '12:14:00 AM', event: 'Live GPS location shared with Authority Dashboard' },
        { time: '12:16:00 AM', event: 'Emergency resolved safely by user confirmation' }
      ],
      mlFeatures: {
        distance_from_route_m: 780,
        speed_kmh: 12.4,
        stop_duration_min: 6.5,
        direction_change_deg: 45.0,
        journey_delay_min: 12.0,
        distance_to_destination_km: 8.4
      },
      isolationForestStatus: 'ANOMALY'
    };

    const incident2: IIncident = {
      _id: 'INC-2026-002',
      emergencyId: 'EMG-2026-1088',
      userId: demoUserId,
      userName: 'Ishwari Gade',
      userPhone: '+91 9876543210',
      vehicleId: 'BUS #304',
      tripId: trip1._id,
      type: 'Discreet SOS Trigger',
      riskLevel: 'CRITICAL',
      riskScore: 92,
      description: 'Discreet manual emergency button pressed during travel.',
      location: { lat: 18.5312, lng: 73.8445, address: 'JM Road, Shivajinagar, Pune' },
      initialLocation: { lat: 18.5204, lng: 73.8567 },
      safeLocation: {
        name: 'KEM Hospital Emergency Care',
        category: 'Hospital',
        lat: 18.5204,
        lng: 73.8689,
        address: 'Rasta Peth, Somwar Peth, Pune'
      },
      status: 'Resolved',
      createdAt: new Date(Date.now() - 172800000), // 48 hours ago
      resolvedAt: new Date(Date.now() - 171720000), // 18 mins later
      durationMinutes: 18,
      safetyEvents: [
        { time: '09:15:00 PM', event: 'Journey started from Shivajinagar' },
        { time: '09:24:00 PM', event: 'Discreet SOS button activated by passenger' },
        { time: '09:24:10 PM', event: 'Emergency Session EMG-2026-1088 created' },
        { time: '09:24:20 PM', event: 'Live GPS location streamed to Authority Control Center' },
        { time: '09:42:00 PM', event: 'Emergency resolved after authority assistance' }
      ],
      mlFeatures: {
        distance_from_route_m: 140,
        speed_kmh: 0.0,
        stop_duration_min: 14.0,
        direction_change_deg: 18.0,
        journey_delay_min: 18.0,
        distance_to_destination_km: 4.2
      },
      isolationForestStatus: 'ANOMALY'
    };

    this.incidents.set(incident1._id, incident1);
    this.incidents.set(incident2._id, incident2);
  }
}

export const dbStore = new MemoryDatabase();

export const connectDatabase = async (mongoUri: string): Promise<boolean> => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    dbStore.isConnectedMongo = true;
    console.log('MongoDB connected successfully via Mongoose.');
    return true;
  } catch (error) {
    console.log('MongoDB connection skipped/unavailable. Utilizing high-performance built-in memory database store.');
    dbStore.isConnectedMongo = false;
    return false;
  }
};
