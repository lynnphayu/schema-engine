import { Data } from "effect";

export type DrizzleKitOperation =
  | "drizzleToSQL"
  | "migrate"
  | "pull"
  | "validate"
  | "updateSnapshot";

export class DrizzleKitCommandError extends Data.TaggedError(
  "DrizzleKitCommandError",
)<{
  readonly operation: DrizzleKitOperation;
  readonly command: string;
  readonly stderr: string;
}> {}

export class DrizzleKitUnsupportedColumnError extends Data.TaggedError(
  "DrizzleKitUnsupportedColumnError",
)<{
  readonly columnType: string;
}> {}

export class DrizzleKitSchemaError extends Data.TaggedError(
  "DrizzleKitSchemaError",
)<{
  readonly cause: unknown;
}> {}

export type DrizzleKitError =
  | DrizzleKitCommandError
  | DrizzleKitUnsupportedColumnError
  | DrizzleKitSchemaError;
