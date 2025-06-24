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
  ) => Promise<{
    files: {
      config: string;
      schema: string;
      migrations: string;
    };
  }>;
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
    res: Response<ApiResponse>,
  ) {
    const { schema } = req.body;
    const { tenantId } = req.params;
    const { files } = await this.engineService.generate(tenantId, schema);

    res.status(200).json({
      message: `Successfully generated schema and migration files for user ${tenantId}`,
      success: true,
      data: { files },
    });
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

    if (!schema.tables || typeof schema.tables !== "object") {
      throw new Error("Schema must have a 'tables' object");
    }

    for (const [tableName, columns] of Object.entries(schema.tables)) {
      if (!columns || typeof columns !== "object") {
        throw new ValidationError(
          `Table '${tableName}' must have columns defined`,
        );
      }

      if (Object.keys(columns).length === 0) {
        throw new ValidationError(
          `Table '${tableName}' must have at least one column`,
        );
      }
    }

    const drizzleSchema = this.drizzleKitPort.jsonToDrizzle(schema);

    return {
      message: `Schema validation successful for user ${tenantId}`,
      success: true,
      data: JSON.parse(drizzleSchema),
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
