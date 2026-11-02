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

// Mongoose Schemas & Persistent Database Models
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false, timestamps: true });

const contactSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  source: { type: Object, required: true },
  destination: { type: Object, required: true },
  transportType: { type: String, default: 'Bus' },
  expectedRoute: { type: Array, default: [] },
  expectedDuration: { type: Number, default: 35 },
  startTime: { type: Date, default: Date.now },
  estimatedArrival: { type: Date },
  status: { type: String, default: 'active' },
  currentRiskScore: { type: Number, default: 0 },
  currentRiskLevel: { type: String, default: 'LOW' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const locationUpdateSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tripId: { type: String, required: true },
  userId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  direction: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const anomalyEventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tripId: { type: String, required: true },
  userId: { type: String, required: true },
  riskScore: { type: Number, required: true },
  anomaly: { type: Boolean, required: true },
  reason: { type: String },
  features: { type: Object },
  latitude: { type: Number },
  longitude: { type: Number },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'new' }
}, { _id: false });

const sosEventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  tripId: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  activationMethod: { type: String, default: 'discreet_button' },
  status: { type: String, default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  emergencyId: { type: String },
  userId: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  vehicleId: { type: String },
  tripId: { type: String },
  type: { type: String },
  riskLevel: { type: String },
  riskScore: { type: Number },
  description: { type: String },
  location: { type: Object },
  initialLocation: { type: Object },
  safeLocation: { type: Object },
  evidence: { type: Object },
  status: { type: String, default: 'Detected' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  durationMinutes: { type: Number },
  safetyEvents: { type: Array, default: [] },
  mlFeatures: { type: Object },
  isolationForestStatus: { type: String }
}, { _id: false });

const emergencySessionSchema = new mongoose.Schema({
  emergencyId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  triggerType: { type: String, default: 'MANUAL_SOS' },
  emergencyStatus: { type: String, default: 'EMERGENCY_DETECTED' },
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  currentLocation: { type: Object },
  safeLocation: { type: Object },
  routeDistanceMeters: { type: Number, default: 0 },
  routeDistanceKm: { type: Number, default: 0 },
  estimatedDurationSeconds: { type: Number, default: 0 },
  estimatedDurationMinutes: { type: Number, default: 0 },
  routeCoordinates: { type: Array, default: [] },
  liveLocationEnabled: { type: Boolean, default: true },
  lastLocationUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const ContactModel = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
export const TripModel = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
export const LocationUpdateModel = mongoose.models.LocationUpdate || mongoose.model('LocationUpdate', locationUpdateSchema);
export const AnomalyEventModel = mongoose.models.AnomalyEvent || mongoose.model('AnomalyEvent', anomalyEventSchema);
export const SOSEventModel = mongoose.models.SOSEvent || mongoose.model('SOSEvent', sosEventSchema);
export const IncidentModel = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
export const EmergencySessionModel = mongoose.models.EmergencySession || mongoose.model('EmergencySession', emergencySessionSchema);

// Persistent Map syncing in-memory state with MongoDB when connected
class PersistentMap<T extends Record<string, any>> extends Map<string, T> {
  private getModel: () => mongoose.Model<any>;
  private idKey: string;

  constructor(getModel: () => mongoose.Model<any>, idKey: string = '_id') {
    super();
    this.getModel = getModel;
    this.idKey = idKey;
  }

  set(key: string, value: T): this {
    super.set(key, value);
    if (dbStore && dbStore.isConnectedMongo) {
      try {
        const model = this.getModel();
        const filter: any = {};
        filter[this.idKey] = key;
        model.updateOne(filter, value, { upsert: true }).catch((err) => {
          console.warn(`[PERSISTENCE ERROR ${model.modelName}]:`, err.message);
        });
      } catch (e: any) {
        console.warn(`[PERSISTENCE ERROR]:`, e.message);
      }
    }
    return this;
  }

  delete(key: string): boolean {
    const res = super.delete(key);
    if (dbStore && dbStore.isConnectedMongo) {
      try {
        const model = this.getModel();
        const filter: any = {};
        filter[this.idKey] = key;
        model.deleteOne(filter).catch((err) => {
          console.warn(`[DELETE ERROR ${model.modelName}]:`, err.message);
        });
      } catch (e: any) {
        console.warn(`[DELETE ERROR]:`, e.message);
      }
    }
    return res;
  }
}

class PersistentLocationArray extends Array<ILocationUpdate> {
  push(...items: ILocationUpdate[]): number {
    const res = super.push(...items);
    if (dbStore && dbStore.isConnectedMongo) {
      for (const item of items) {
        LocationUpdateModel.create(item).catch((err: any) => {
          console.warn('[LOCATION UPDATE PERSIST ERROR]:', err.message);
        });
      }
    }
    return res;
  }
}

// In-Memory Database Store with automatic MongoDB bidirectional persistence
class MemoryDatabase {
  users: Map<string, IUser> = new PersistentMap<IUser>(() => UserModel, '_id');
  contacts: Map<string, ITrustedContact> = new PersistentMap<ITrustedContact>(() => ContactModel, '_id');
  trips: Map<string, ITrip> = new PersistentMap<ITrip>(() => TripModel, '_id');
  locationUpdates: ILocationUpdate[] = new PersistentLocationArray();
  anomalyEvents: Map<string, IAnomalyEvent> = new PersistentMap<IAnomalyEvent>(() => AnomalyEventModel, '_id');
  sosEvents: Map<string, ISOSEvent> = new PersistentMap<ISOSEvent>(() => SOSEventModel, '_id');
  incidents: Map<string, IIncident> = new PersistentMap<IIncident>(() => IncidentModel, '_id');
  emergencySessions: Map<string, IEmergencySession> = new PersistentMap<IEmergencySession>(() => EmergencySessionModel, 'emergencyId');
  isConnectedMongo: boolean = false;

  constructor() {
    this.seedDefaultData();
  }

  async syncFromMongo() {
    try {
      // 1. Sync Users
      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers.length === 0) {
        for (const user of this.users.values()) {
          await UserModel.updateOne({ _id: user._id }, user, { upsert: true });
        }
      } else {
        for (const u of mongoUsers) {
          (this.users as Map<string, IUser>).set(String(u._id), u as any);
        }
      }

      // 2. Sync Contacts
      const mongoContacts = await ContactModel.find().lean();
      if (mongoContacts.length === 0) {
        for (const c of this.contacts.values()) {
          await ContactModel.updateOne({ _id: c._id }, c, { upsert: true });
        }
      } else {
        for (const c of mongoContacts) {
          (this.contacts as Map<string, ITrustedContact>).set(String(c._id), c as any);
        }
      }

      // 3. Sync Trips
      const mongoTrips = await TripModel.find().lean();
      if (mongoTrips.length === 0) {
        for (const t of this.trips.values()) {
          await TripModel.updateOne({ _id: t._id }, t, { upsert: true });
        }
      } else {
        for (const t of mongoTrips) {
          (this.trips as Map<string, ITrip>).set(String(t._id), t as any);
        }
      }

      // 4. Sync Incidents
      const mongoIncidents = await IncidentModel.find().lean();
      if (mongoIncidents.length === 0) {
        for (const inc of this.incidents.values()) {
          await IncidentModel.updateOne({ _id: inc._id }, inc, { upsert: true });
        }
      } else {
        for (const inc of mongoIncidents) {
          (this.incidents as Map<string, IIncident>).set(String(inc._id), inc as any);
        }
      }

      // 5. Sync Emergencies
      const mongoEmergencies = await EmergencySessionModel.find().lean();
      for (const e of mongoEmergencies) {
        (this.emergencySessions as Map<string, IEmergencySession>).set(String(e.emergencyId), e as any);
      }

      console.log(`[MONGODB PERSISTENCE ACTIVE] Database synced: ${this.users.size} users, ${this.contacts.size} contacts, ${this.trips.size} trips.`);
    } catch (err: any) {
      console.warn('[MONGODB SYNC WARNING]:', err.message);
    }
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
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    dbStore.isConnectedMongo = true;
    console.log('MongoDB connected successfully via Mongoose.');
    await dbStore.syncFromMongo();
    return true;
  } catch (error: any) {
    console.log('MongoDB connection skipped/unavailable. Utilizing high-performance built-in memory database store.');
    dbStore.isConnectedMongo = false;
    return false;
  }
};
