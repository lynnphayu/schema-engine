import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { drizzleService } from "#/services/drizzle.service";
import { filesystemService } from "#/services/filesystem.service";
import type {
  ApiResponse,
  schemaRequestSchema,
  tenantRouteSchema,
} from "#/types/schema";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../middleware/error.middleware";

export class SchemaController {
  async generateSchema(
    req: Request<
      z.infer<typeof tenantRouteSchema>,
      ApiResponse,
      z.infer<typeof schemaRequestSchema>
    >,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) {
    try {
      // Body is already validated by middleware
      const { schema } = req.body;
      const { tenantId } = req.params;

      // Create output directory
      const drizzleArtifactsDir = "drizzle";
      const outputDir = `${drizzleArtifactsDir}/${tenantId}`;

      // Generate config and pull existing schema
      const cfg = await drizzleService.generateConfig(
        drizzleArtifactsDir,
        tenantId,
      );
      const cfgPath = await filesystemService.write(
        outputDir,
        "config.json",
        JSON.stringify(cfg, null, 2),
      );
      await drizzleService.pull(cfgPath);

      // Convert JSON schema to Drizzle schema format
      const drizzleSchema = drizzleService.jsonToDrizzle(schema);
      await filesystemService.write(outputDir, "schema.ts", drizzleSchema);

      // Generate SQL migration files
      await drizzleService.drizzleToSQL(cfgPath);

      res.status(200).json({
        message: `Successfully generated schema and migration files for user ${tenantId}`,
        success: true,
        data: {
          files: {
            config: `${outputDir}/config.json`,
            schema: `${outputDir}/schema.ts`,
            migrations: `${outputDir}/migrations`,
          },
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      next(new DatabaseError(`Schema generation failed: ${err.message}`));
    }
  }

  async migrateSchema(
    req: Request<z.infer<typeof tenantRouteSchema>, ApiResponse>,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) {
    try {
      const { tenantId } = req.params;
      const drizzleArtifactsDir = "drizzle";
      const outputDir = `${drizzleArtifactsDir}/${tenantId}`;
      const cfgPath = `${outputDir}/config.json`;

      // Check if config exists
      if (!(await filesystemService.exists(outputDir, "config.json"))) {
        throw new NotFoundError(
          `No configuration found for user ${tenantId}. Please generate schema first.`,
        );
      }

      // Run migrations
      await drizzleService.migrate(cfgPath);

      return {
        message: `Migration applied successfully for user ${tenantId}`,
        success: true,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(error);
      } else {
        const err = error instanceof Error ? error : new Error(String(error));
        next(new DatabaseError(`Migration failed: ${err.message}`));
      }
    }
  }

  async validateSchema(
    req: Request<
      z.infer<typeof tenantRouteSchema>,
      ApiResponse,
      z.infer<typeof schemaRequestSchema>
    >,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) {
    try {
      const { schema } = req.body;
      const { tenantId } = req.params;

      // Basic validation - check if schema has required structure
      if (!schema.tables || typeof schema.tables !== "object") {
        throw new Error("Schema must have a 'tables' object");
      }

      // Validate each table
      for (const [tableName, columns] of Object.entries(schema.tables)) {
        if (!columns || typeof columns !== "object") {
          throw new Error(`Table '${tableName}' must have columns defined`);
        }

        if (Object.keys(columns).length === 0) {
          throw new Error(`Table '${tableName}' must have at least one column`);
        }
      }

      // Check if drizzle schema can be generated
      const drizzleSchema = drizzleService.jsonToDrizzle(schema);

      return {
        message: `Schema validation successful for user ${tenantId}`,
        success: true,
        data: {
          valid: true,
          drizzlePreview: `${drizzleSchema.substring(0, 500)}...`, // Preview
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      next(new ValidationError(`Schema validation failed: ${err.message}`));
    }
  }

  private convertSchemaFormat(schema: {
    tables: Record<string, Record<string, string>>;
  }) {
    const tables = Object.entries(schema.tables).map(
      ([tableName, columns]) => ({
        name: tableName,
        columns: Object.entries(columns).map(([columnName, columnType]) => ({
          name: columnName,
          type: columnType,
        })),
      }),
    );

    return { tables };
  }
}

export const schemaController = new SchemaController();
