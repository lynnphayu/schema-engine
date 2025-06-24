import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { ZodError } from "zod";
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

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log error for debugging
  console.error("Global Error Handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formatted = formatZodError(err);
    const response = createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      formatted.message,
      formatted.issues,
    );
    return res.status(400).json(response);
  }

  if ("statusCode" in err && typeof err.statusCode === "number") {
    const appErr = err as AppError;
    const statusCode = appErr.statusCode || 500;
    const code = (appErr.code ||
      ERROR_CODES.UNKNOWN_ERROR) as keyof typeof ERROR_CODES;
    const response = createErrorResponse(code, appErr.message, appErr.details);
    return res.status(statusCode).json(response);
  }

  if (err.message.includes("ECONNREFUSED")) {
    const response = createErrorResponse(ERROR_CODES.DATABASE_CONNECTION_ERROR);
    return res.status(503).json(response);
  }

  if (err.message.includes("duplicate key")) {
    const response = createErrorResponse(ERROR_CODES.DUPLICATE_RESOURCE);
    return res.status(409).json(response);
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === "development";
  const errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  const errorMessage = isDevelopment
    ? err.message
    : getErrorDefinition(errorCode).message;
  const response = createErrorResponse(errorCode, errorMessage);

  if (isDevelopment) {
    (response as Record<string, unknown>).stack = err.stack;
  }

  return res.status(500).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response) => {
  const response = createErrorResponse(
    ERROR_CODES.ROUTE_NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`,
  );
  res.status(404).json(response);
};
