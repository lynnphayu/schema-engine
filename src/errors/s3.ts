import { Data } from "effect";

export class S3UploadError extends Data.TaggedError("S3UploadError")<{
  readonly tenantId: string;
  readonly fileName: string;
  readonly cause: unknown;
}> {}

export class S3ObjectNotFoundError extends Data.TaggedError(
  "S3ObjectNotFoundError",
)<{
  readonly key: string;
}> {}

export class S3PresignError extends Data.TaggedError("S3PresignError")<{
  readonly key: string;
  readonly cause: unknown;
}> {}

export type S3Error = S3UploadError | S3ObjectNotFoundError | S3PresignError;
