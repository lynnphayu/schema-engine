import { Data } from "effect";

export class EngineMigrationNotFoundError extends Data.TaggedError(
  "EngineMigrationNotFoundError",
)<{
  readonly migrationsDir: string;
}> {}

export type EngineError = EngineMigrationNotFoundError;
