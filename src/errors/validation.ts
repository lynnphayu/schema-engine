import { Data } from "effect";
import type { ZodIssue } from "zod";

export type RequestValidationPart = "body" | "params" | "query";

export class RequestValidationError extends Data.TaggedError(
  "RequestValidationError",
)<{
  readonly part: RequestValidationPart;
  readonly issues: readonly ZodIssue[];
}> {}

export class RequestJsonParseError extends Data.TaggedError(
  "RequestJsonParseError",
)<{
  readonly cause: unknown;
}> {}

export type HttpValidationError =
  | RequestValidationError
  | RequestJsonParseError;
