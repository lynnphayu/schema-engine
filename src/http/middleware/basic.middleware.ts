import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { validateMultiple } from "./validation.middleware";

export const basicRouteMiddleware =
  <
    B extends z.ZodTypeAny,
    P extends z.ZodTypeAny,
    Q extends z.ZodTypeAny
  >(validationSchemas: {
    body?: B;
    params?: P;
    query?: Q;
  }) =>
  <R>(
    handler: (
      req: Request<z.infer<P>, unknown, z.infer<B>, z.infer<Q>>,
      res: Response,
      next: NextFunction
    ) => R
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    const schemasArray: z.ZodTypeAny[] = [];
    const paramsArray: unknown[] = [];
    if (validationSchemas.body) {
      schemasArray.push(validationSchemas.body);
      paramsArray.push(req.body);
    }
    if (validationSchemas.params) {
      schemasArray.push(validationSchemas.params);
      paramsArray.push(req.params);
    }
    if (validationSchemas.query) {
      schemasArray.push(validationSchemas.query);
      paramsArray.push(req.query);
    }
    const validated = validateMultiple(...schemasArray)(...paramsArray);
    if (validationSchemas.body) {
      req.body = validated.shift();
    }
    if (validationSchemas.params) {
      req.params = validated.shift();
    }
    if (validationSchemas.query) {
      req.query = validated.shift();
    }
    Promise.resolve(handler(req, res, next))
      .catch(next)
      .then((result) => {
        if (result) {
          res.status(200).json(result);
        }
        return result;
      });
  };
