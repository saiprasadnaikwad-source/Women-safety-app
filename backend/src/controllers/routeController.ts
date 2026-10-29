import { Request, Response } from 'express';
import { fetchRoadRoute } from '../services/routingService';

export async function calculateRoute(req: Request, res: Response) {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination || origin.latitude === undefined || destination.latitude === undefined) {
      return res.status(400).json({ message: 'Origin and destination coordinates are required' });
    }

    const route = await fetchRoadRoute(
      { latitude: parseFloat(origin.latitude), longitude: parseFloat(origin.longitude) },
      { latitude: parseFloat(destination.latitude), longitude: parseFloat(destination.longitude) }
    );

    res.json(route);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
