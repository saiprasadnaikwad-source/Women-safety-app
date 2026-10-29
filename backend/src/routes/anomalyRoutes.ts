import { Router, Request, Response } from 'express';
import { predictJourneyAnomaly } from '../services/mlService';

const router = Router();

router.post('/predict', async (req: Request, res: Response) => {
  try {
    const result = await predictJourneyAnomaly(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
