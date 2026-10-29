import { Router } from 'express';
import { triggerSOS, getSOSById, resolveSOS } from '../controllers/sosController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.post('/', triggerSOS);
router.get('/:id', getSOSById);
router.put('/:id/resolve', resolveSOS);

export default router;
