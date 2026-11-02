import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/authMiddleware';
import { config } from '../config';

const OCR_MODEL_URL = config.ocrModelUrl;

export async function detectPlate(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // Forward image to OCR model as multipart/form-data
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'plate.jpg',
      contentType: req.file.mimetype
    });

    let ocrRes;
    try {
      ocrRes = await axios.post(`${OCR_MODEL_URL}/detect-plate`, form, {
        headers: form.getHeaders(),
        timeout: 15000
      });
    } catch (primaryErr: any) {
      // If port 8001 is offline, try unified mlServiceUrl (e.g. port 8000)
      if ((primaryErr.code === 'ECONNREFUSED' || primaryErr.code === 'ENOTFOUND') && config.mlServiceUrl && OCR_MODEL_URL !== config.mlServiceUrl) {
        try {
          const fallbackForm = new FormData();
          fallbackForm.append('file', req.file.buffer, {
            filename: req.file.originalname || 'plate.jpg',
            contentType: req.file.mimetype
          });
          ocrRes = await axios.post(`${config.mlServiceUrl}/detect-plate`, fallbackForm, {
            headers: fallbackForm.getHeaders(),
            timeout: 15000
          });
        } catch {
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    const { plate_number, confidence, bounding_box, plates } = ocrRes.data;

    return res.json({
      success: ocrRes.data.success ?? Boolean(plate_number),
      plateNumber: plate_number || (plates && plates[0]?.plate_number) || '',
      confidence: confidence ?? (plates && plates[0]?.confidence) ?? 0,
      boundingBox: bounding_box || (plates && plates[0]?.bounding_box) || null,
      plates: plates || [],
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
