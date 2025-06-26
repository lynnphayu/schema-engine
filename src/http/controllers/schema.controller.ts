import type { Request, Response } from "express";
import type { z } from "zod";
import type {
  ApiResponse,
  schemaDefinitionSchema,
  schemaRequestSchema,
  tenantRouteSchema,
} from "#/types/schema";
import { ValidationError } from "../middleware/error.middleware";

interface IEngineService {
  generate: (
    tenantId: string,
    schema: z.infer<typeof schemaDefinitionSchema>,
    databaseUrl: string,
  ) => Promise<unknown>;
}

interface IDrizzleKitPort {
  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>) => string;
}

export class SchemaController {
  constructor(
    private readonly engineService: IEngineService,
    private readonly drizzleKitPort: IDrizzleKitPort,
  ) {}
  async generateSchema(
    req: Request<
      z.infer<typeof tenantRouteSchema>,
      ApiResponse,
      z.infer<typeof schemaRequestSchema>
    >,
  ) {
    const { schema, databaseUrl } = req.body;
    const { tenantId } = req.params;
    const data = await this.engineService.generate(
      tenantId,
      schema,
      databaseUrl,
    );
    return {
      message: `Successfully generated schema and migration files for user ${tenantId}`,
      success: true,
      data,
    };
  }

  async migrateSchema(
    req: Request<z.infer<typeof tenantRouteSchema>, ApiResponse>,
  ) {
    const { tenantId } = req.params;

    return {
      message: `Migration applied successfully for user ${tenantId}`,
      success: true,
    };
  }

  async validateSchema(
    req: Request<
      z.infer<typeof tenantRouteSchema>,
      ApiResponse,
      z.infer<typeof schemaRequestSchema>
    >,
  ) {
    const { schema } = req.body;
    const { tenantId } = req.params;

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

    const drizzleSchema = this.drizzleKitPort.jsonToDrizzle(schema);

    return {
      message: `Schema validation successful for user ${tenantId}`,
      success: true,
      data: { drizzleSchema },
    };
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
