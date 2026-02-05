import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

const validationRequest =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync(req.body);
      if (!result.success) {
        return next(result.error);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };

export default validationRequest;
