import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { isDevelopment } from "#/config/env";
import {
  createErrorResponse,
  ERROR_CODES,
  getErrorDefinition,
} from "../../constants/errors";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class ValidationError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  constructor(
    message?: string,
    details?: unknown,
    code = ERROR_CODES.VALIDATION_ERROR,
  ) {
    const errorDef = getErrorDefinition(code);
    super(message || errorDef.message);
    this.name = "ValidationError";
    this.statusCode = errorDef.statusCode;
    this.code = errorDef.code;
    this.details = details;
  }
}

export class DatabaseError extends Error {
  statusCode: number;
  code: string;

  constructor(message?: string, code = ERROR_CODES.DATABASE_ERROR) {
    const errorDef = getErrorDefinition(code);
    super(message || errorDef.message);
    this.name = "DatabaseError";
    this.statusCode = errorDef.statusCode;
    this.code = errorDef.code;
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  code: string;

  constructor(message?: string, code = ERROR_CODES.NOT_FOUND) {
    const errorDef = getErrorDefinition(code);
    super(message || errorDef.message);
    this.name = "NotFoundError";
    this.statusCode = errorDef.statusCode;
    this.code = errorDef.code;
  }
}

const formatZodError = (error: ZodError) => {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  return {
    message: "Validation failed",
    issues,
  };
};

export const errorHandler = (err: Error | AppError, c: Context) => {
  console.error("Global Error Handler:", {
    error: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof ZodError) {
    const formatted = formatZodError(err);
    const response = createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      formatted.message,
      formatted.issues,
    );
    return c.json(response, 400);
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      },
      err.status,
    );
  }

  if ("statusCode" in err && typeof err.statusCode === "number") {
    const appErr = err as AppError;
    const statusCode = (appErr.statusCode || 500) as
      | 400
      | 401
      | 403
      | 404
      | 409
      | 500
      | 503;
    const code = (appErr.code ||
      ERROR_CODES.UNKNOWN_ERROR) as keyof typeof ERROR_CODES;
    const response = createErrorResponse(code, appErr.message, appErr.details);
    return c.json(response, statusCode);
  }

  if (err.message.includes("ECONNREFUSED")) {
    const response = createErrorResponse(ERROR_CODES.DATABASE_CONNECTION_ERROR);
    return c.json(response, 503);
  }

  if (err.message.includes("duplicate key")) {
    const response = createErrorResponse(ERROR_CODES.DUPLICATE_RESOURCE);
    return c.json(response, 409);
  }

  const errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  const errorMessage = isDevelopment
    ? err.message
    : getErrorDefinition(errorCode).message;
  const response = createErrorResponse(errorCode, errorMessage);

  if (isDevelopment) {
    (response as Record<string, unknown>).stack = err.stack;
  }

  return c.json(response, 500);
};

export const notFoundHandler = (c: Context) => {
  const response = createErrorResponse(
    ERROR_CODES.ROUTE_NOT_FOUND,
    `Route ${c.req.method} ${c.req.url} not found`,
  );
  return c.json(response, 404);
};
