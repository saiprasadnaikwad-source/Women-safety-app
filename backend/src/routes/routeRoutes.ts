import { Router } from 'express';
import { calculateRoute } from '../controllers/routeController';

const router = Router();

router.post('/', calculateRoute);

export default router;
