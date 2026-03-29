import type { S3Client } from "@aws-sdk/client-s3";
import type { Config } from "drizzle-kit";
import { Effect } from "effect";
import type {
  DrizzleKitCommandError,
  DrizzleKitError,
  DrizzleKitSchemaError,
  DrizzleKitUnsupportedColumnError,
  EngineError,
  FilesystemError,
  S3Error,
} from "#/errors";
import type { DynamicSchema } from "#/types/schema";

export class S3ClientTag extends Effect.Tag("S3Client")<
  S3ClientTag,
  S3Client
>() {}

export class FilesystemService extends Effect.Tag("FilesystemService")<
  FilesystemService,
  {
    readonly write: (
      dir: string,
      filename: string,
      content: string,
    ) => Effect.Effect<string, FilesystemError>;
    readonly ls: (
      dir: string,
    ) => Effect.Effect<readonly string[], FilesystemError>;
    readonly read: (
      dir: string,
      filename: string,
    ) => Effect.Effect<Buffer, FilesystemError>;
  }
>() {}

export class DrizzleKitService extends Effect.Tag("DrizzleKitService")<
  DrizzleKitService,
  {
    readonly drizzleToSQL: (
      config: string,
    ) => Effect.Effect<void, DrizzleKitCommandError>;
    readonly migrate: (
      config: string,
    ) => Effect.Effect<void, DrizzleKitCommandError>;
    readonly pull: (
      config: string,
    ) => Effect.Effect<void, DrizzleKitCommandError>;
    readonly validate: (
      config: string,
    ) => Effect.Effect<void, DrizzleKitCommandError>;
    readonly updateSnapshot: (
      config: string,
    ) => Effect.Effect<void, DrizzleKitCommandError>;
    readonly generateConfig: (
      prefix: string,
      userId: string,
      databaseUrl: string,
    ) => Effect.Effect<Config, never>;
    readonly jsonToDrizzle: (
      schema: DynamicSchema,
    ) => Effect.Effect<
      string,
      DrizzleKitUnsupportedColumnError | DrizzleKitSchemaError
    >;
  }
>() {}

export class S3Service extends Effect.Tag("S3Service")<
  S3Service,
  {
    readonly uploadFile: (
      file: File,
      tenantId: string,
    ) => Effect.Effect<{ bucket: string; key: string }, S3Error>;
    readonly getPresignedUrl: (
      key: string,
      expireInSeconds: number,
    ) => Effect.Effect<string, S3Error>;
    readonly generateGetSignedUrl: (
      key: string,
      expireInSeconds: number,
    ) => Effect.Effect<string, S3Error>;
    readonly checkObjectExists: (
      key: string,
    ) => Effect.Effect<unknown, S3Error>;
  }
>() {}

export class EngineService extends Effect.Tag("EngineService")<
  EngineService,
  {
    readonly generate: (
      tenantId: string,
      schema: DynamicSchema,
      databaseUrl: string,
    ) => Effect.Effect<
      { path: { bucket: string; key: string } },
      FilesystemError | DrizzleKitError | S3Error | EngineError
    >;
    readonly jsonToDrizzle: (
      schema: DynamicSchema,
    ) => Effect.Effect<
      string,
      DrizzleKitUnsupportedColumnError | DrizzleKitSchemaError
    >;
  }
>() {}
