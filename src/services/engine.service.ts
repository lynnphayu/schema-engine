import type { Config } from "drizzle-kit";
import type { z } from "zod";
import { NotFoundError } from "#/http/middleware/error.middleware";
import type { schemaDefinitionSchema } from "#/types/schema";

interface DrizzleKitPort {
  generateConfig: (
    prefix: string,
    userId: string,
    databaseUrl: string,
  ) => Promise<Config>;
  pull: (config: string) => Promise<void>;
  drizzleToSQL: (config: string) => Promise<void>;
  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>) => string;
  migrate: (config: string) => Promise<void>;
}

interface FSPort {
  write: (dir: string, filename: string, content: string) => Promise<string>;
  read: (dir: string, filename: string) => Promise<Buffer>;
  ls: (dir: string) => Promise<string[]>;
}

interface S3Port {
  uploadFile: (
    file: File,
    tenantId: string,
  ) => Promise<{ bucket: string; key: string }>;
  getPresignedUrl: (key: string, expireInSeconds: number) => Promise<string>;
}

export default (
  fsport: FSPort,
  drizzleKitPort: DrizzleKitPort,
  s3Port: S3Port,
) => ({
  generate: async (
    tenantId: string,
    schema: z.infer<typeof schemaDefinitionSchema>,
    databaseUrl: string,
  ) => {
    const drizzleArtifactsDir = "drizzle";
    const outputDir = `${drizzleArtifactsDir}/${tenantId}`;
    const migrationsDir = `${outputDir}/migrations`;

    const cfg = await drizzleKitPort.generateConfig(
      drizzleArtifactsDir,
      tenantId,
      databaseUrl,
    );
    const cfgPath = await fsport.write(
      outputDir,
      "config.json",
      JSON.stringify(cfg, null, 2),
    );
    await drizzleKitPort.pull(cfgPath);

    const drizzleSchema = drizzleKitPort.jsonToDrizzle(schema);
    await fsport.write(outputDir, "schema.ts", drizzleSchema);

    await drizzleKitPort.drizzleToSQL(cfgPath);

    const migrations = await fsport
      .ls(migrationsDir)
      .then((migrations) => migrations.filter((file) => file.endsWith(".sql")));
    const latestMigration = migrations.sort().pop();

    if (!latestMigration) {
      throw new Error("Latest migration not found");
    }
    const migration = await fsport.read(migrationsDir, latestMigration);
    const presignedUrl = await s3Port.uploadFile(
      new File([migration], latestMigration),
      tenantId,
    );

    return {
      path: presignedUrl,
    };
  },

  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>) => {
    return drizzleKitPort.jsonToDrizzle(schema);
  },
});
