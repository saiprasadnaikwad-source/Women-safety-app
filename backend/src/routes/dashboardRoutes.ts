import { Router } from 'express';
import {
  getDashboardOverview,
  getDashboardJourneys,
  getDashboardAlerts,
  getDashboardIncidents
} from '../controllers/dashboardController';

const router = Router();

router.get('/', getDashboardOverview);
router.get('/overview', getDashboardOverview);
router.get('/journeys', getDashboardJourneys);
router.get('/alerts', getDashboardAlerts);
router.get('/incidents', getDashboardIncidents);

export default router;
