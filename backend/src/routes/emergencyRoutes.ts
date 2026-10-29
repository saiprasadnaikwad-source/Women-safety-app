import { Router } from 'express';
import {
  getNearbySafeLocations,
  handleStartEmergency,
  handleUpdateEmergencyLocation,
  getEmergencySession,
  getAllActiveEmergencies,
  handleResolveEmergency,
  handleShareLocation
} from '../controllers/emergencyController';

const router = Router();

router.get('/nearby-safe-locations', getNearbySafeLocations);
router.get('/active/all', getAllActiveEmergencies);
router.post('/start', handleStartEmergency);
router.post('/location', handleUpdateEmergencyLocation);
router.post('/share-location', handleShareLocation);
router.post('/resolve', handleResolveEmergency);
router.get('/:id', getEmergencySession);

export default router;
