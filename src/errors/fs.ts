import { Data } from "effect";

export class FilesystemWriteError extends Data.TaggedError(
  "FilesystemWriteError",
)<{
  readonly dir: string;
  readonly filename: string;
  readonly cause: unknown;
}> {}

export class FilesystemReadError extends Data.TaggedError(
  "FilesystemReadError",
)<{
  readonly dir: string;
  readonly filename: string;
  readonly cause: unknown;
}> {}

export class FilesystemListError extends Data.TaggedError(
  "FilesystemListError",
)<{
  readonly dir: string;
  readonly cause: unknown;
}> {}

export type FilesystemError =
  | FilesystemWriteError
  | FilesystemReadError
  | FilesystemListError;
