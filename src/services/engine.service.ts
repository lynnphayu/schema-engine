import { File } from "node:buffer";
import type { Context } from "effect";
import { Effect } from "effect";
import { logger } from "#/config/logger";
import type { DrizzleKitError } from "#/errors/drizzle-kit";
import {
  type EngineError,
  EngineMigrationNotFoundError,
} from "#/errors/engine";
import type { FilesystemError } from "#/errors/fs";
import type { S3Error } from "#/errors/s3";
import type {
  DrizzleKitService as DrizzleKitServiceTag,
  EngineService as EngineServiceTag,
  FilesystemService as FilesystemServiceTag,
  S3Service as S3ServiceTag,
} from "#/layers/tags";
import type { DynamicSchema } from "#/types/schema";

export const makeEngineService = (deps: {
  readonly fsService: Context.Tag.Service<FilesystemServiceTag>;
  readonly drizzleKitService: Context.Tag.Service<DrizzleKitServiceTag>;
  readonly s3Service: Context.Tag.Service<S3ServiceTag>;
}): Context.Tag.Service<EngineServiceTag> => ({
  generate: (
    tenantId: string,
    schema: DynamicSchema,
    databaseUrl: string,
  ): Effect.Effect<
    { path: { bucket: string; key: string } },
    FilesystemError | DrizzleKitError | S3Error | EngineError
  > =>
    Effect.gen(function* () {
      const drizzleArtifactsDir = "drizzle";
      const outputDir = `${drizzleArtifactsDir}/${tenantId}`;
      const migrationsDir = `${outputDir}/migrations`;

      const log = logger.child({ tenantId });

      log.info("starting schema generation");

      const cfg = yield* deps.drizzleKitService.generateConfig(
        drizzleArtifactsDir,
        tenantId,
        databaseUrl,
      );
      const cfgPath = yield* deps.fsService.write(
        outputDir,
        "config.json",
        JSON.stringify(cfg, null, 2),
      );

      log.debug({ cfgPath }, "pulling existing schema");
      yield* deps.drizzleKitService.pull(cfgPath);

      const drizzleSchema = yield* deps.drizzleKitService.jsonToDrizzle(schema);
      yield* deps.fsService.write(outputDir, "schema.ts", drizzleSchema);

      log.debug("generating SQL migration");
      yield* deps.drizzleKitService.drizzleToSQL(cfgPath);

      const migrations = yield* deps.fsService
        .ls(migrationsDir)
        .pipe(
          Effect.map((files) => files.filter((file) => file.endsWith(".sql"))),
        );
      const latestMigration = migrations.sort().pop();

      if (!latestMigration) {
        return yield* Effect.fail(
          new EngineMigrationNotFoundError({ migrationsDir }),
        );
      }

      log.debug(
        { migration: latestMigration },
        "uploading migration to storage",
      );
      const migration = yield* deps.fsService.read(
        migrationsDir,
        latestMigration,
      );
      const presignedUrl = yield* deps.s3Service.uploadFile(
        new File([migration], latestMigration),
        tenantId,
      );

      log.info({ migration: latestMigration }, "schema generation complete");

      return {
        path: presignedUrl,
      };
    }),

  jsonToDrizzle: (schema: DynamicSchema) =>
    deps.drizzleKitService.jsonToDrizzle(schema),
});
