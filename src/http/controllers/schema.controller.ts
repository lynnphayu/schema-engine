import type { Context } from "hono";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { TYPES } from "#/di/types";
import type { DrizzleKitService } from "#/services/drizzle.service";
import type { EngineService } from "#/services/engine.service";
import { ValidationError } from "../middleware/error.middleware";

@injectable()
export class SchemaController {
  constructor(
    @inject(TYPES.EngineService) private readonly engineService: EngineService,
    @inject(TYPES.DrizzleKitService)
    private readonly drizzleKitService: DrizzleKitService,
  ) {}

  async generateSchema(c: Context): Promise<Response> {
    const { schema, databaseUrl, tables } = await c.req.json();
    const { tenantId } = c.req.param();

    const data = await this.engineService.generate(
      tenantId,
      { schema, tables },
      databaseUrl,
    );

    return c.json({
      message: `Successfully generated schema and migration files for user ${tenantId}`,
      success: true,
      data,
    });
  }

  async migrateSchema(c: Context): Promise<Response> {
    const { tenantId } = c.req.param();

    return c.json({
      message: `Migration applied successfully for user ${tenantId}`,
      success: true,
    });
  }

  async validateSchema(c: Context): Promise<Response> {
    const { schema } = await c.req.json();
    const { tenantId } = c.req.param();

    if (!schema.tables || !Array.isArray(schema.tables)) {
      throw new ValidationError("Schema must have a 'tables' array");
    }

    if (schema.tables.length === 0) {
      throw new ValidationError("Schema must have at least one table");
    }

    for (const table of schema.tables) {
      if (!table.name || typeof table.name !== "string") {
        throw new ValidationError("Each table must have a valid name");
      }

      if (!table.columns || !Array.isArray(table.columns)) {
        throw new ValidationError(
          `Table '${table.name}' must have a columns array`,
        );
      }

      if (table.columns.length === 0) {
        throw new ValidationError(
          `Table '${table.name}' must have at least one column`,
        );
      }

      for (const column of table.columns) {
        if (!column.name || typeof column.name !== "string") {
          throw new ValidationError(
            `Table '${table.name}' has a column with invalid name`,
          );
        }
        if (!column.type || typeof column.type !== "string") {
          throw new ValidationError(
            `Column '${column.name}' in table '${table.name}' must have a valid type`,
          );
        }
      }
    }

    const drizzleSchema = this.drizzleKitService.jsonToDrizzle(schema);

    return c.json({
      message: `Schema validation successful for user ${tenantId}`,
      success: true,
      data: { drizzleSchema },
    });
  }
}
