import { Router } from 'express';
import { createTrip, getTrips, getTripById, recordLocationUpdate, endTrip } from '../controllers/tripController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/:id/location', recordLocationUpdate);
router.post('/:id/end', endTrip);

export default router;
