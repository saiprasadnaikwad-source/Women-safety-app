import { Router } from 'express';
import { getSafeLocations } from '../controllers/safeLocationController';

const router = Router();

router.get('/', getSafeLocations);

export default router;
