export interface ErrorDefinition {
  code: string;
  message: string;
  statusCode: number;
  description?: string;
}

export const ERROR_CODES = {
  // Validation Errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_SCHEMA_FORMAT: "INVALID_SCHEMA_FORMAT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_DATA_TYPE: "INVALID_DATA_TYPE",

  // Authentication & Authorization Errors (401, 403)
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Not Found Errors (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  CONFIGURATION_NOT_FOUND: "CONFIGURATION_NOT_FOUND",
  SCHEMA_NOT_FOUND: "SCHEMA_NOT_FOUND",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",

  // Conflict Errors (409)
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  SCHEMA_ALREADY_EXISTS: "SCHEMA_ALREADY_EXISTS",
  CONFIGURATION_EXISTS: "CONFIGURATION_EXISTS",

  // Database Errors (500, 503)
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  MIGRATION_FAILED: "MIGRATION_FAILED",
  SCHEMA_GENERATION_FAILED: "SCHEMA_GENERATION_FAILED",

  // File System Errors (500)
  FILE_SYSTEM_ERROR: "FILE_SYSTEM_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_WRITE_ERROR: "FILE_WRITE_ERROR",
  FILE_READ_ERROR: "FILE_READ_ERROR",

  // Generic Server Errors (500)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export const ERROR_DICTIONARY: Record<
  keyof typeof ERROR_CODES,
  ErrorDefinition
> = {
  // Validation Errors (400)
  [ERROR_CODES.VALIDATION_ERROR]: {
    code: ERROR_CODES.VALIDATION_ERROR,
    message: "Validation failed",
    statusCode: 400,
    description: "Request data does not meet validation requirements",
  },
  [ERROR_CODES.INVALID_SCHEMA_FORMAT]: {
    code: ERROR_CODES.INVALID_SCHEMA_FORMAT,
    message: "Invalid schema format provided",
    statusCode: 400,
    description: "The schema structure does not match expected format",
  },
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: {
    code: ERROR_CODES.MISSING_REQUIRED_FIELD,
    message: "Required field is missing",
    statusCode: 400,
    description: "One or more required fields are not provided",
  },
  [ERROR_CODES.INVALID_DATA_TYPE]: {
    code: ERROR_CODES.INVALID_DATA_TYPE,
    message: "Invalid data type provided",
    statusCode: 400,
    description: "The provided data type does not match expected type",
  },

  // Authentication & Authorization Errors (401, 403)
  [ERROR_CODES.UNAUTHORIZED]: {
    code: ERROR_CODES.UNAUTHORIZED,
    message: "Authentication required",
    statusCode: 401,
    description: "Request requires authentication",
  },
  [ERROR_CODES.FORBIDDEN]: {
    code: ERROR_CODES.FORBIDDEN,
    message: "Access forbidden",
    statusCode: 403,
    description: "User does not have permission to access this resource",
  },
  [ERROR_CODES.INVALID_TOKEN]: {
    code: ERROR_CODES.INVALID_TOKEN,
    message: "Invalid or expired token",
    statusCode: 401,
    description: "The provided authentication token is invalid or expired",
  },

  // Not Found Errors (404)
  [ERROR_CODES.NOT_FOUND]: {
    code: ERROR_CODES.NOT_FOUND,
    message: "Resource not found",
    statusCode: 404,
    description: "The requested resource could not be found",
  },
  [ERROR_CODES.RESOURCE_NOT_FOUND]: {
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "Requested resource not found",
    statusCode: 404,
    description: "The specific resource you requested does not exist",
  },
  [ERROR_CODES.CONFIGURATION_NOT_FOUND]: {
    code: ERROR_CODES.CONFIGURATION_NOT_FOUND,
    message: "Configuration not found",
    statusCode: 404,
    description: "No configuration found for the specified tenant",
  },
  [ERROR_CODES.SCHEMA_NOT_FOUND]: {
    code: ERROR_CODES.SCHEMA_NOT_FOUND,
    message: "Schema not found",
    statusCode: 404,
    description: "The requested schema does not exist",
  },
  [ERROR_CODES.ROUTE_NOT_FOUND]: {
    code: ERROR_CODES.ROUTE_NOT_FOUND,
    message: "Route not found",
    statusCode: 404,
    description: "The requested API endpoint does not exist",
  },

  // Conflict Errors (409)
  [ERROR_CODES.DUPLICATE_RESOURCE]: {
    code: ERROR_CODES.DUPLICATE_RESOURCE,
    message: "Resource already exists",
    statusCode: 409,
    description: "A resource with the same identifier already exists",
  },
  [ERROR_CODES.SCHEMA_ALREADY_EXISTS]: {
    code: ERROR_CODES.SCHEMA_ALREADY_EXISTS,
    message: "Schema already exists",
    statusCode: 409,
    description: "A schema with the same name already exists for this tenant",
  },
  [ERROR_CODES.CONFIGURATION_EXISTS]: {
    code: ERROR_CODES.CONFIGURATION_EXISTS,
    message: "Configuration already exists",
    statusCode: 409,
    description: "Configuration already exists for this tenant",
  },

  // Database Errors (500, 503)
  [ERROR_CODES.DATABASE_ERROR]: {
    code: ERROR_CODES.DATABASE_ERROR,
    message: "Database operation failed",
    statusCode: 500,
    description: "An error occurred while performing database operation",
  },
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: {
    code: ERROR_CODES.DATABASE_CONNECTION_ERROR,
    message: "Database connection failed",
    statusCode: 503,
    description: "Unable to establish connection to the database",
  },
  [ERROR_CODES.MIGRATION_FAILED]: {
    code: ERROR_CODES.MIGRATION_FAILED,
    message: "Database migration failed",
    statusCode: 500,
    description: "An error occurred while applying database migrations",
  },
  [ERROR_CODES.SCHEMA_GENERATION_FAILED]: {
    code: ERROR_CODES.SCHEMA_GENERATION_FAILED,
    message: "Schema generation failed",
    statusCode: 500,
    description: "An error occurred while generating schema files",
  },

  // File System Errors (500)
  [ERROR_CODES.FILE_SYSTEM_ERROR]: {
    code: ERROR_CODES.FILE_SYSTEM_ERROR,
    message: "File system operation failed",
    statusCode: 500,
    description: "An error occurred while performing file system operation",
  },
  [ERROR_CODES.FILE_NOT_FOUND]: {
    code: ERROR_CODES.FILE_NOT_FOUND,
    message: "File not found",
    statusCode: 404,
    description: "The requested file does not exist",
  },
  [ERROR_CODES.FILE_WRITE_ERROR]: {
    code: ERROR_CODES.FILE_WRITE_ERROR,
    message: "Failed to write file",
    statusCode: 500,
    description: "An error occurred while writing to file",
  },
  [ERROR_CODES.FILE_READ_ERROR]: {
    code: ERROR_CODES.FILE_READ_ERROR,
    message: "Failed to read file",
    statusCode: 500,
    description: "An error occurred while reading file",
  },

  // Generic Server Errors (500)
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: {
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    statusCode: 500,
    description: "An unexpected error occurred on the server",
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: "Unknown error occurred",
    statusCode: 500,
    description: "An unknown error occurred while processing the request",
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    code: ERROR_CODES.SERVICE_UNAVAILABLE,
    message: "Service temporarily unavailable",
    statusCode: 503,
    description:
      "The service is temporarily unavailable, please try again later",
  },
};

// Helper function to get error definition
export const getErrorDefinition = (
  code: keyof typeof ERROR_CODES,
): ErrorDefinition => {
  return ERROR_DICTIONARY[code];
};

// Helper function to create standardized error response
export const createErrorResponse = (
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  details?: unknown,
) => {
  const errorDef = getErrorDefinition(code);
  const response: Record<string, unknown> = {
    success: false,
    error: customMessage || errorDef.message,
    code: errorDef.code,
  };

  if (details) {
    response.details = details;
  }

  return response;
};

// Type for error codes (for TypeScript type safety)
export type ErrorCode = keyof typeof ERROR_DICTIONARY;
