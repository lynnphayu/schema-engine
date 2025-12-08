import { File } from "node:buffer";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { TYPES } from "#/di/types";
import type { DynamicSchema } from "#/types/schema";
import type { DrizzleKitService } from "./drizzle.service";
import type { FilesystemService } from "./filesystem.service";
import type { S3Service } from "./s3.service";

@injectable()
export class EngineService {
  constructor(
    @inject(TYPES.FilesystemService) private fsService: FilesystemService,
    @inject(TYPES.DrizzleKitService)
    private drizzleKitService: DrizzleKitService,
    @inject(TYPES.S3Service) private s3Service: S3Service,
  ) {}

  async generate(tenantId: string, schema: DynamicSchema, databaseUrl: string) {
    const drizzleArtifactsDir = "drizzle";
    const outputDir = `${drizzleArtifactsDir}/${tenantId}`;
    const migrationsDir = `${outputDir}/migrations`;

    const cfg = await this.drizzleKitService.generateConfig(
      drizzleArtifactsDir,
      tenantId,
      databaseUrl,
    );
    const cfgPath = await this.fsService.write(
      outputDir,
      "config.json",
      JSON.stringify(cfg, null, 2),
    );
    await this.drizzleKitService.pull(cfgPath);

    const drizzleSchema = this.drizzleKitService.jsonToDrizzle(schema);
    await this.fsService.write(outputDir, "schema.ts", drizzleSchema);

    await this.drizzleKitService.drizzleToSQL(cfgPath);

    const migrations = await this.fsService
      .ls(migrationsDir)
      .then((migrations) => migrations.filter((file) => file.endsWith(".sql")));
    const latestMigration = migrations.sort().pop();

    if (!latestMigration) {
      throw new Error("Latest migration not found");
    }
    const migration = await this.fsService.read(migrationsDir, latestMigration);
    const presignedUrl = await this.s3Service.uploadFile(
      new File([migration], latestMigration),
      tenantId,
    );

    return {
      path: presignedUrl,
    };
  }

  jsonToDrizzle(schema: DynamicSchema): string {
    return this.drizzleKitService.jsonToDrizzle(schema);
  }
}
