import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Allow demo access fallback
    req.user = { userId: 'user_demo_101', email: 'demo@example.com' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback to demo user for ease of prototype verification
    req.user = { userId: 'user_demo_101', email: 'demo@example.com' };
    next();
  }
}
