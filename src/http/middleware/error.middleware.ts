import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { isDevelopment } from "#/config/env";
import { logger } from "#/config/logger";
import {
  DrizzleKitCommandError,
  DrizzleKitSchemaError,
  DrizzleKitUnsupportedColumnError,
  EngineMigrationNotFoundError,
  FilesystemListError,
  FilesystemReadError,
  FilesystemWriteError,
  RequestJsonParseError,
  RequestValidationError,
  S3ObjectNotFoundError,
  S3PresignError,
  S3UploadError,
} from "#/errors";
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
  logger.error({
    err: { message: err.message, stack: err.stack },
    url: c.req.url,
    method: c.req.method,
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

  if (err instanceof RequestValidationError) {
    const issues = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    const response = createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      { part: err.part, issues },
    );
    return c.json(response, 400);
  }

  if (err instanceof RequestJsonParseError) {
    const response = createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid JSON request body",
      isDevelopment ? { cause: err.cause } : undefined,
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

  if (err instanceof FilesystemWriteError) {
    const response = createErrorResponse(
      ERROR_CODES.FILE_WRITE_ERROR,
      err.message || `Failed to write ${err.filename}`,
      isDevelopment ? { dir: err.dir, cause: err.cause } : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof FilesystemReadError) {
    const response = createErrorResponse(
      ERROR_CODES.FILE_READ_ERROR,
      err.message || `Failed to read ${err.filename}`,
      isDevelopment ? { dir: err.dir, cause: err.cause } : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof FilesystemListError) {
    const response = createErrorResponse(
      ERROR_CODES.FILE_SYSTEM_ERROR,
      err.message || "Failed to list directory",
      isDevelopment ? { dir: err.dir, cause: err.cause } : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof DrizzleKitCommandError) {
    const response = createErrorResponse(
      ERROR_CODES.SCHEMA_GENERATION_FAILED,
      err.message || `Drizzle CLI failed (${err.operation})`,
      isDevelopment
        ? { operation: err.operation, command: err.command, stderr: err.stderr }
        : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof DrizzleKitUnsupportedColumnError) {
    const response = createErrorResponse(
      ERROR_CODES.INVALID_DATA_TYPE,
      err.message || `Unsupported column type: ${err.columnType}`,
      isDevelopment ? { columnType: err.columnType } : undefined,
    );
    return c.json(response, 400);
  }

  if (err instanceof DrizzleKitSchemaError) {
    const response = createErrorResponse(
      ERROR_CODES.INVALID_SCHEMA_FORMAT,
      err.message || "Schema code generation failed",
      isDevelopment ? { cause: err.cause } : undefined,
    );
    return c.json(response, 400);
  }

  if (err instanceof S3ObjectNotFoundError) {
    const response = createErrorResponse(
      ERROR_CODES.FILE_NOT_FOUND,
      err.message || `Object not found: ${err.key}`,
      isDevelopment ? { key: err.key } : undefined,
    );
    return c.json(response, 404);
  }

  if (err instanceof S3UploadError) {
    const response = createErrorResponse(
      ERROR_CODES.SCHEMA_GENERATION_FAILED,
      err.message || "Upload to object storage failed",
      isDevelopment
        ? { tenantId: err.tenantId, fileName: err.fileName, cause: err.cause }
        : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof S3PresignError) {
    const response = createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      err.message || "Failed to generate signed URL",
      isDevelopment ? { key: err.key, cause: err.cause } : undefined,
    );
    return c.json(response, 500);
  }

  if (err instanceof EngineMigrationNotFoundError) {
    const response = createErrorResponse(
      ERROR_CODES.SCHEMA_GENERATION_FAILED,
      err.message || "No migration file was produced",
      isDevelopment ? { migrationsDir: err.migrationsDir } : undefined,
    );
    return c.json(response, 500);
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
