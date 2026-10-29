import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { dbStore } from '../models/db';

export async function getIncidents(req: AuthRequest, res: Response) {
  const userId = req.user?.userId || 'user_demo_101';
  const incidents = Array.from(dbStore.incidents.values()).filter(i => i.userId === userId);
  res.json(incidents);
}

export async function getIncidentById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const incident = dbStore.incidents.get(id);
  if (!incident) return res.status(404).json({ message: 'Incident not found' });
  res.json(incident);
}

export async function updateIncidentStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status, evidence } = req.body;
  const incident = dbStore.incidents.get(id);
  if (!incident) return res.status(404).json({ message: 'Incident not found' });

  if (status) incident.status = status;
  if (evidence) incident.evidence = { ...incident.evidence, ...evidence };

  dbStore.incidents.set(id, incident);
  res.json(incident);
}
