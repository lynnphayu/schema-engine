import { z } from "zod";

export const columnDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
  unique: z.boolean().optional(),
  nullable: z.boolean().optional(),
  default: z.string().optional(),
});

export const tableDefinitionSchema = z.object({
  name: z.string(),
  columns: z.array(columnDefinitionSchema),
});

export const schemaDefinitionSchema = z.object({
  tables: z.array(tableDefinitionSchema),
});

export const schemaRequestSchema = z.object({
  schema: z.object({
    tables: z.array(tableDefinitionSchema),
  }),
  databaseUrl: z.string().url("Invalid database URL format"),
});

export const tenantRouteSchema = z.object({
  tenantId: z.string().min(1, "tenantID cannot be empty"),
});

export interface ApiResponse<T = unknown> {
  message?: string;
  success?: boolean;
  error?: string;
  data?: T;
}

const UuidSchema = z.string().uuid("Invalid UUID format");
const NonEmptyStringSchema = z.string().min(1, "Cannot be empty");
const IdentifierSchema = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Must be a valid identifier");

// ============================================================================
// COLUMN DEFINITION SCHEMAS
// ============================================================================

const PostgresDataTypeSchema = z.enum([
  "UUID",
  "VARCHAR",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "DECIMAL",
  "NUMERIC",
  "REAL",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "JSONB",
  "JSON",
  "TEXT[]",
  "INTEGER[]",
  "UUID[]",
  "BYTEA",
  "INET",
  "CIDR",
  "MACADDR",
]);

const CheckConstraintSchema = z
  .string()
  .refine((val) => {
    const patterns = [
      /^LENGTH\(.+\)\s*[><=]+\s*\d+$/, // LENGTH(field) >= 2
      /^.+\s*[><=]+\s*\d+(\.\d+)?$/, // field >= 0
      /^.+\s+IN\s*\(.+\)$/, // field IN ('VAL1', 'VAL2')
      /^.+\s*~\s*'.+'$/, // field ~ 'regex'
      /^.+\s*IS\s+(NOT\s+)?NULL$/, // field IS NOT NULL
    ];
    return patterns.some((pattern) => pattern.test(val));
  }, "Invalid check constraint format")
  .optional();

export const ColumnDefinitionSchema = z
  .object({
    id: UuidSchema,
    identifier: IdentifierSchema,
    name: NonEmptyStringSchema,
    column_type: PostgresDataTypeSchema,
    length: z.number().int().positive().optional().nullable(),
    is_nullable: z.boolean(),
    is_primary_key: z.boolean(),
    is_unique: z.boolean(),
    is_auto_increment: z.boolean(),
    column_order: z.number().int().positive(),
    default_value: z.string().optional().nullable(),
    check_constraint: CheckConstraintSchema,
  })
  .refine(
    (data) => {
      if (data.is_primary_key && data.is_nullable) {
        return false;
      }
      if (
        data.is_auto_increment &&
        !["INTEGER", "BIGINT", "SMALLINT"].includes(data.column_type)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Invalid column configuration",
    },
  );

const IndexTypeSchema = z.enum([
  "BTREE",
  "HASH",
  "GIN",
  "GIST",
  "SPGIST",
  "BRIN",
]);

export const IndexDefinitionSchema = z
  .object({
    id: UuidSchema,
    identifier: IdentifierSchema,
    name: NonEmptyStringSchema,
    columns: NonEmptyStringSchema, // Comma-separated column names
    index_type: IndexTypeSchema,
    is_unique: z.boolean(),
    where_clause: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.index_type === "GIN" && data.is_unique) {
        return false;
      }
      return true;
    },
    {
      message: "GIN indexes cannot be unique",
    },
  );

const ReferentialActionSchema = z.enum([
  "CASCADE",
  "RESTRICT",
  "SET NULL",
  "SET DEFAULT",
  "NO ACTION",
]);

export const ForeignKeyDefinitionSchema = z.object({
  id: UuidSchema,
  constraint_name: IdentifierSchema,
  source_column: IdentifierSchema,
  referenced_schema: IdentifierSchema,
  referenced_table: IdentifierSchema,
  referenced_column: IdentifierSchema,
  on_update: ReferentialActionSchema,
  on_delete: ReferentialActionSchema,
  is_deferrable: z.boolean(),
});

export const TableDefinitionSchema = z
  .object({
    identifier: IdentifierSchema,
    name: NonEmptyStringSchema,
    columns: z
      .array(ColumnDefinitionSchema)
      .min(1, "Table must have at least one column"),
    indexes: z.array(IndexDefinitionSchema).default([]),
    foreign_keys: z.array(ForeignKeyDefinitionSchema).default([]),
  })
  .refine(
    (data) => {
      const primaryKeys = data.columns.filter((col) => col.is_primary_key);
      if (primaryKeys.length !== 1) {
        return false;
      }

      const orders = data.columns
        .map((col) => col.column_order)
        .sort((a, b) => a - b);
      const expectedOrders = Array.from(
        { length: orders.length },
        (_, i) => i + 1,
      );
      if (!orders.every((order, index) => order === expectedOrders[index])) {
        return false;
      }

      return true;
    },
    {
      message:
        "Table must have exactly one primary key and sequential column orders",
    },
  );

export const SchemaDefinitionSchema = z.object({
  identifier: IdentifierSchema,
  name: NonEmptyStringSchema,
});

export const DynamicSchemaSchema = z
  .object({
    schema: SchemaDefinitionSchema,
    tables: z
      .array(TableDefinitionSchema)
      .min(1, "Schema must have at least one table"),
  })
  .refine(
    (data) => {
      for (const table of data.tables) {
        for (const fk of table.foreign_keys) {
          const referencedTableExists = data.tables.some(
            (t) => t.identifier === fk.referenced_table,
          );
          if (
            fk.referenced_schema === data.schema.identifier &&
            !referencedTableExists
          ) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message:
        "Schema validation failed: table references or identifier uniqueness",
    },
  );

export type ColumnDefinition = z.infer<typeof ColumnDefinitionSchema>;
export type IndexDefinition = z.infer<typeof IndexDefinitionSchema>;
export type ForeignKeyDefinition = z.infer<typeof ForeignKeyDefinitionSchema>;
export type TableDefinition = z.infer<typeof TableDefinitionSchema>;
export type SchemaDefinition = z.infer<typeof SchemaDefinitionSchema>;
export type DynamicSchema = z.infer<typeof DynamicSchemaSchema>;
