import type { Config } from "drizzle-kit";
import type { z } from "zod";
import { NotFoundError } from "#/http/middleware/error.middleware";
import type { schemaDefinitionSchema } from "#/types/schema";

interface DrizzleKitPort {
  generateConfig: (prefix: string, userId: string) => Promise<Config>;
  pull: (config: string) => Promise<void>;
  drizzleToSQL: (config: string) => Promise<void>;
  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>) => string;
  migrate: (config: string) => Promise<void>;
}

interface FSPort {
  write: (dir: string, filename: string, content: string) => Promise<string>;
  read: (dir: string, filename: string) => Promise<string>;
  delete: (dir: string) => Promise<void>;
  exists: (dir: string, filename?: string) => Promise<boolean>;
}

export default (fsport: FSPort, drizzleKitPort: DrizzleKitPort) => ({
  generate: async (
    tenantId: string,
    schema: z.infer<typeof schemaDefinitionSchema>,
  ) => {
    const drizzleArtifactsDir = "drizzle";
    const outputDir = `${drizzleArtifactsDir}/${tenantId}`;

    const cfg = await drizzleKitPort.generateConfig(
      drizzleArtifactsDir,
      tenantId,
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
    return {
      files: {
        config: `${outputDir}/config.json`,
        schema: `${outputDir}/schema.ts`,
        migrations: `${outputDir}/migrations`,
      },
    };
  },

  migrate: async (tenantId: string) => {
    const drizzleArtifactsDir = "drizzle";
    const outputDir = `${drizzleArtifactsDir}/${tenantId}`;
    const cfgPath = `${outputDir}/config.json`;

    // Check if config exists
    if (!(await fsport.exists(outputDir, "config.json"))) {
      throw new NotFoundError(
        `No configuration found for user ${tenantId}. Please generate schema first.`,
      );
    }

    await drizzleKitPort.migrate(cfgPath);
  },

  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>) => {
    return drizzleKitPort.jsonToDrizzle(schema);
  },
});
