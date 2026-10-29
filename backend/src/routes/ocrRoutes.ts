import { Router } from 'express';
import multer from 'multer';
import { detectPlate } from '../controllers/ocrController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Store in memory — no disk writes, forward directly to OCR model
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

router.post('/verify-plate', authenticateToken, upload.single('image'), detectPlate);

export default router;
