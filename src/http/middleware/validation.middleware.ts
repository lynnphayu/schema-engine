import type { Context, MiddlewareHandler, Next } from "hono";
import { z } from "zod";

export const validateBody = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedBody = schema.parse(body);
      c.set("validatedBody", validatedBody);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return c.json(
          {
            error: `Validation failed: ${errorMessages}`,
            success: false,
            details: error.errors,
          },
          400,
        );
      }
      return c.json(
        {
          error: `Invalid request body: ${error instanceof Error ? error.message : String(error)}`,
          success: false,
        },
        400,
      );
    }
  };
};

export const validateParams = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedParams = schema.parse(params);
      c.set("validatedParams", validatedParams);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return c.json(
          {
            error: `Validation failed: ${errorMessages}`,
            success: false,
            details: error.errors,
          },
          400,
        );
      }
      return c.json(
        {
          error: `Invalid request params: ${error instanceof Error ? error.message : String(error)}`,
          success: false,
        },
        400,
      );
    }
  };
};

export const validateQuery = <T extends z.ZodTypeAny>(
  schema: T,
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      c.set("validatedQuery", validatedQuery);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return c.json(
          {
            error: `Validation failed: ${errorMessages}`,
            success: false,
            details: error.errors,
          },
          400,
        );
      }
      return c.json(
        {
          error: `Invalid request query: ${error instanceof Error ? error.message : String(error)}`,
          success: false,
        },
        400,
      );
    }
  };
};
