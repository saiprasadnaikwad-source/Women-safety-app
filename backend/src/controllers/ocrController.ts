import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/authMiddleware';

const OCR_MODEL_URL = process.env.OCR_MODEL_URL || 'http://localhost:8001';

export async function detectPlate(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // Forward image to friend's OCR model as multipart/form-data
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'plate.jpg',
      contentType: req.file.mimetype
    });

    const ocrRes = await axios.post(`${OCR_MODEL_URL}/detect-plate`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    const { plate_number, confidence, bounding_box } = ocrRes.data;

    return res.json({
      success: true,
      plateNumber: plate_number,
      confidence: confidence,
      boundingBox: bounding_box || null,
      source: 'ocr_model'
    });

  } catch (err: any) {
    // OCR model offline — return clear error so frontend can handle
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'OCR model service is offline. Start it on port 8001.',
        source: 'offline'
      });
    }
    console.error('[OCR CONTROLLER]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
