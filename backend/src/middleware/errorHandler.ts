import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error occurred',
    timestamp: new Date()
  });
}
