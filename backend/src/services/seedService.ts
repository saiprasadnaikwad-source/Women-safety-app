import bcrypt from 'bcryptjs';
import { dbStore, IUser, ITrustedContact, ITrip, IIncident } from '../models/db';

export async function seedDatabase() {
  console.log('Seeding demo database...');

  const demoUserId = 'user_demo_101';
  const passwordHash = await bcrypt.hash('Demo@123', 10);

  const demoUser: IUser = {
    _id: demoUserId,
    name: 'Ishwari Gade',
    email: 'demo@example.com',
    phone: '+91 9876543210',
    passwordHash: passwordHash,
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  dbStore.users.set(demoUserId, demoUser);

  // Emergency contacts (Radhika Gade and Aarav Gade permanently removed)

  const sampleTrip: ITrip = {
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
    status: 'active',
    currentRiskScore: 12,
    currentRiskLevel: 'LOW',
    createdAt: new Date()
  };

  dbStore.trips.set(sampleTrip._id, sampleTrip);

  const incident: IIncident = {
    _id: 'inc_901',
    userId: demoUserId,
    tripId: sampleTrip._id,
    type: 'Route Deviation Alert',
    description: 'Vehicle deviated 780 meters from scheduled corridor near Aundh Flyover.',
    location: { lat: 18.5612, lng: 73.8045, address: 'Aundh Bypass Road, Pune' },
    status: 'Resolved',
    createdAt: new Date(Date.now() - 3600000)
  };

  dbStore.incidents.set(incident._id, incident);

  console.log('Seed completed successfully. Demo credentials: demo@example.com / Demo@123');
}

if (require.main === module) {
  seedDatabase();
}
