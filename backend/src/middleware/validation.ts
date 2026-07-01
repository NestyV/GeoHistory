/**
 * Request validation middleware
 */

import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@/utils/errors';

export const requireFields = (...fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const field of fields) {
      const value = req.body?.[field];
      if (value === undefined || value === null || value === '') {
        next(new ValidationError(`${field} is required`));
        return;
      }
    }

    next();
  };
};

export const validateEmailAndPassword = (req: Request, _res: Response, next: NextFunction): void => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    next(new ValidationError('Valid email is required'));
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    next(new ValidationError('Password must be at least 8 characters long'));
    return;
  }

  next();
};
