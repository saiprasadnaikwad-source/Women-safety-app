import { Router } from 'express';
import { getIncidents, getIncidentById, updateIncidentStatus } from '../controllers/incidentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.put('/:id/status', updateIncidentStatus);

export default router;
