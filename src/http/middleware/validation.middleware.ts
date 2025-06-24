import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Type constraint to ensure P has the same length as T
type SameLength<
  T extends readonly unknown[],
  P extends readonly unknown[],
> = T["length"] extends P["length"]
  ? P["length"] extends T["length"]
    ? true
    : false
  : false;

// Type to infer parsed results from Zod schemas
type InferParsedResults<T extends readonly z.ZodTypeAny[]> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny ? z.infer<T[K]> : never;
};

export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        res.status(400).json({
          error: `Validation failed: ${errorMessages}`,
          success: false,
          details: error.errors,
        });
      } else {
        res.status(400).json({
          error: `Invalid request body: ${error instanceof Error ? error.message : String(error)}`,
          success: false,
        });
      }
    }
  };
};

// Multi-schema validator with length constraint and inferred types
export const validateMultiple = <T extends readonly z.ZodTypeAny[]>(
  ...schemas: T
) => {
  return <Args extends readonly unknown[]>(
    ...args: SameLength<T, Args> extends true ? Args : never
  ): InferParsedResults<T> => {
    const results = schemas.map((schema, index) => schema.parse(args[index]));
    return results as InferParsedResults<T>;
  };
};

// Utility function to validate and infer single schema
export const validateAndInfer = <T extends z.ZodTypeAny>(schema: T) => {
  return (data: unknown): z.infer<T> => {
    return schema.parse(data);
  };
};
