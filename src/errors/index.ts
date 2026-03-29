export {
  DrizzleKitCommandError,
  type DrizzleKitError,
  type DrizzleKitOperation,
  DrizzleKitSchemaError,
  DrizzleKitUnsupportedColumnError,
} from "./drizzle-kit";
export {
  type EngineError,
  EngineMigrationNotFoundError,
} from "./engine";
export {
  type FilesystemError,
  FilesystemListError,
  FilesystemReadError,
  FilesystemWriteError,
} from "./fs";
export {
  type S3Error,
  S3ObjectNotFoundError,
  S3PresignError,
  S3UploadError,
} from "./s3";
export {
  type HttpValidationError,
  RequestJsonParseError,
  RequestValidationError,
  type RequestValidationPart,
} from "./validation";

import type { DrizzleKitError } from "./drizzle-kit";
import type { EngineError } from "./engine";
import type { FilesystemError } from "./fs";
import type { S3Error } from "./s3";

export type ServiceTaggedError =
  | FilesystemError
  | DrizzleKitError
  | S3Error
  | EngineError;
