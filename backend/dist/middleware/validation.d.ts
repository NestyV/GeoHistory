/**
 * Request validation middleware
 */
import { NextFunction, Request, Response } from 'express';
export declare const requireFields: (...fields: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateEmailAndPassword: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map