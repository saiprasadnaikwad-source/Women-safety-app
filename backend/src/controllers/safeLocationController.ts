import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { searchNearbySafeLocations } from '../services/emergencyService';

export interface SafeLocation {
  id: string;
  name: string;
  category: 'Police Station' | 'Hospital' | 'Fire Station' | 'Emergency Services' | 'Other Verified Safe Location';
  lat: number;
  lng: number;
  address: string;
  phone: string;
  isVerified: boolean;
  distanceKm?: number;
  walkingTimeMin?: number;
}

export async function getSafeLocations(req: AuthRequest, res: Response) {
  try {
    const { lat, lng, radius } = req.query;
    const userLat = lat ? parseFloat(lat as string) : 18.5284;
    const userLng = lng ? parseFloat(lng as string) : 73.8739;
    const searchRadius = radius ? parseFloat(radius as string) : 5;

    const dynamicResults = await searchNearbySafeLocations(userLat, userLng, searchRadius);

    const results = dynamicResults.map(loc => {
      const walkingTimeMin = Math.round(((loc.distanceKm || 1) / 4.5) * 60);
      return {
        id: loc.placeId,
        name: loc.name,
        category: loc.category,
        lat: loc.latitude,
        lng: loc.longitude,
        address: loc.address,
        phone: loc.phone,
        isVerified: true,
        distanceKm: loc.distanceKm,
        walkingTimeMin
      };
    });

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dynamic safe locations', details: err.message });
  }
}

