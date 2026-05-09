import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  status?: number
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500
  const message = err.message ?? 'Internal server error'

  logger.error('Request error', {
    method: req.method,
    path: req.path,
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })

  res.status(status).json({ error: message })
}
