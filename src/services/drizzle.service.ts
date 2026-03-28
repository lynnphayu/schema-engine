import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Config } from "drizzle-kit";
import { injectable } from "inversify";
import _ from "lodash";
import "reflect-metadata";
import type {
  ColumnDefinition,
  DynamicSchema,
  TableDefinition,
} from "../types/schema";

const execAsync = promisify(exec);

const sanitizeSqlExpression = (expression: string) =>
  expression.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

type ColumnBuilderResult = {
  expression: string;
  importName: string;
};

const columnTypeBuilders: Record<
  ColumnDefinition["column_type"],
  (column: ColumnDefinition) => ColumnBuilderResult
> = {
  UUID: (column) => ({
    expression: `uuid("${column.identifier}")`,
    importName: "uuid",
  }),
  VARCHAR: (column) => ({
    expression: column.length
      ? `varchar("${column.identifier}", { length: ${column.length} })`
      : `varchar("${column.identifier}")`,
    importName: "varchar",
  }),
  TEXT: (column) => ({
    expression: `text("${column.identifier}")`,
    importName: "text",
  }),
  INTEGER: (column) => ({
    expression: `integer("${column.identifier}")`,
    importName: "integer",
  }),
  BIGINT: (column) => ({
    expression: `bigint("${column.identifier}")`,
    importName: "bigint",
  }),
  SMALLINT: (column) => ({
    expression: `smallint("${column.identifier}")`,
    importName: "smallint",
  }),
  DECIMAL: (column) => ({
    expression: `decimal("${column.identifier}")`,
    importName: "decimal",
  }),
  NUMERIC: (column) => ({
    expression: `numeric("${column.identifier}")`,
    importName: "numeric",
  }),
  REAL: (column) => ({
    expression: `real("${column.identifier}")`,
    importName: "real",
  }),
  "DOUBLE PRECISION": (column) => ({
    expression: `doublePrecision("${column.identifier}")`,
    importName: "doublePrecision",
  }),
  BOOLEAN: (column) => ({
    expression: `boolean("${column.identifier}")`,
    importName: "boolean",
  }),
  DATE: (column) => ({
    expression: `date("${column.identifier}")`,
    importName: "date",
  }),
  TIME: (column) => ({
    expression: `time("${column.identifier}")`,
    importName: "time",
  }),
  TIMESTAMP: (column) => ({
    expression: `timestamp("${column.identifier}")`,
    importName: "timestamp",
  }),
  TIMESTAMPTZ: (column) => ({
    expression: `timestamp("${column.identifier}", { withTimezone: true })`,
    importName: "timestamp",
  }),
  JSONB: (column) => ({
    expression: `jsonb("${column.identifier}")`,
    importName: "jsonb",
  }),
  JSON: (column) => ({
    expression: `json("${column.identifier}")`,
    importName: "json",
  }),
  "TEXT[]": (column) => ({
    expression: `text("${column.identifier}").array()`,
    importName: "text",
  }),
  "INTEGER[]": (column) => ({
    expression: `integer("${column.identifier}").array()`,
    importName: "integer",
  }),
  "UUID[]": (column) => ({
    expression: `uuid("${column.identifier}").array()`,
    importName: "uuid",
  }),
  BYTEA: (column) => ({
    expression: `bytea("${column.identifier}")`,
    importName: "bytea",
  }),
  INET: (column) => ({
    expression: `inet("${column.identifier}")`,
    importName: "inet",
  }),
  CIDR: (column) => ({
    expression: `cidr("${column.identifier}")`,
    importName: "cidr",
  }),
  MACADDR: (column) => ({
    expression: `macaddr("${column.identifier}")`,
    importName: "macaddr",
  }),
};

const resolveColumnBuilder = (
  column: ColumnDefinition,
): ColumnBuilderResult => {
  const builder = columnTypeBuilders[column.column_type];
  if (!builder) {
    throw new Error(`Unsupported column type: ${column.column_type}`);
  }
  return builder(column);
};

const generateColumn = (column: ColumnDefinition) => {
  const { expression, importName } = resolveColumnBuilder(column);
  const imports: string[] = [importName];
  let requiresSql = false;
  let checkConstraint: string | undefined;

  let expr = expression;
  if (!column.is_nullable) expr += ".notNull()";
  if (column.is_primary_key) expr += ".primaryKey()";
  if (column.is_unique && !column.is_primary_key) expr += ".unique()";
  if (!_.isUndefined(column.default_value)) {
    const value = () => {
      const dataType = typeof column.default_value;
      switch (dataType) {
        case "string":
          return (column.default_value as string).startsWith("sql")
            ? (column.default_value as string)
            : `"${column.default_value}"`;
        case "number":
          return column.default_value as number;
        case "boolean":
          return column.default_value as boolean;
        case "object":
          return column.default_value as Record<string, unknown>;
        default:
          return column.default_value;
      }
    };
    expr += `.default(${value()})`;
  }
  if (column.default_now) {
    expr += ".defaultNow()";
  }
  if (column.default_random) {
    expr += ".defaultRandom()";
  }
  if (column.check_constraint) {
    requiresSql = true;
    checkConstraint = sanitizeSqlExpression(column.check_constraint);
  }
  // Column order is enforced when building tables; drizzle columns do not expose an order API.

  return {
    line: `  ${column.identifier}: ${expr},`,
    imports,
    requiresSql,
    checkConstraint,
  };
};

const generateTable = (table: TableDefinition) => {
  const imports = new Set<string>(["pgTable"]);
  const columnLines: string[] = [];
  const indexLines: string[] = [];
  const fkLines: string[] = [];
  const checkConfigs: string[] = [];
  let requiresSql = false;

  const sortedColumns = [...table.columns].sort(
    (a, b) => a.column_order - b.column_order,
  );

  for (const col of sortedColumns) {
    const {
      line,
      imports: colImports,
      requiresSql: colNeedsSql,
      checkConstraint,
    } = generateColumn(col);
    columnLines.push(line);
    for (const colImport of colImports) {
      imports.add(colImport);
    }
    if (colNeedsSql) {
      requiresSql = true;
    }
    if (checkConstraint) {
      imports.add("check");
      const constraintName = `${table.identifier}_${col.identifier}_check`;
      checkConfigs.push(
        `check("${constraintName}", sql\`${checkConstraint}\`)`,
      );
    }
  }

  if (table.indexes) {
    imports.add("index");
    for (const idx of table.indexes) {
      const columns = idx.columns.includes(",")
        ? `[${idx.columns
            .split(",")
            .map((c: string) => `"${c.trim()}"`)
            .join(", ")}]`
        : `"${idx.columns}"`;
      const options = idx.is_unique
        ? `, { unique: true${
            idx.where_clause
              ? `, where: sql\`${sanitizeSqlExpression(idx.where_clause)}\``
              : ""
          } }`
        : idx.where_clause
          ? `, { where: sql\`${sanitizeSqlExpression(idx.where_clause)}\` }`
          : "";
      indexLines.push(
        `export const ${idx.identifier} = index("${idx.identifier}", ${columns}${options});`,
      );
      if (idx.where_clause) {
        requiresSql = true;
      }
    }
  }

  if (table.foreign_keys) {
    imports.add("foreignKey");
    for (const fk of table.foreign_keys) {
      const fkLine = `export const ${fk.constraint_name} = foreignKey(() => ${table.identifier}.${fk.source_column}, {
  name: "${fk.constraint_name}",
  references: () => ${fk.referenced_table}.${fk.referenced_column},
  onUpdate: "${fk.on_update}",
  onDelete: "${fk.on_delete}"
});`;
      fkLines.push(fkLine);
    }
  }

  const extraConfigBlock =
    checkConfigs.length > 0
      ? `,
(/* table */) => [
${checkConfigs.map((cfg) => `  ${cfg}`).join(",\n")}
]`
      : "";

  const tableDef = `export const ${table.identifier} = pgTable("${table.identifier}", {
${columnLines.join("\n")}
}${extraConfigBlock});`;

  return { lines: [tableDef, ...indexLines, ...fkLines], imports, requiresSql };
};

@injectable()
export class DrizzleKitService {
  async drizzleToSQL(config: string): Promise<void> {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit generate --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit generation failed: ${stderr}`);
    }
  }

  async migrate(config: string): Promise<void> {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit migrate --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit migration failed: ${stderr}`);
    }
  }

  async pull(config: string): Promise<void> {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit pull --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit pull failed: ${stderr}`);
    }
  }

  async validate(config: string): Promise<void> {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit check --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit validation failed: ${stderr}`);
    }
  }

  async updateSnapshot(config: string): Promise<void> {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit up --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit snapshot update failed: ${stderr}`);
    }
  }

  async generateConfig(
    prefix: string,
    userId: string,
    databaseUrl: string,
  ): Promise<Config> {
    const config: Config = {
      dialect: "postgresql",
      schema: `${prefix}/${userId}/schema.ts`,
      out: `${prefix}/${userId}/migrations`,
      migrations: {
        prefix: "timestamp",
        table: `__${userId}__migrations__`,
      },
      dbCredentials: { url: databaseUrl },
    };

    return config;
  }

  jsonToDrizzle(schema: DynamicSchema): string {
    const allImports = new Set<string>();
    const allLines: string[] = [];

    let requiresSql = false;

    for (const table of schema.tables) {
      const {
        lines,
        imports,
        requiresSql: tableNeedsSql,
      } = generateTable(table);
      for (const line of lines) {
        allLines.push(line);
      }
      for (const pgImport of imports) {
        allImports.add(pgImport);
      }
      if (tableNeedsSql) {
        requiresSql = true;
      }
    }

    const pgImports = Array.from(allImports)
      .filter((imp) => imp !== "sql")
      .sort();
    const importLines: string[] = [];

    if (requiresSql) {
      importLines.push(`import { sql } from "drizzle-orm";`);
    }

    if (pgImports.length > 0) {
      importLines.push(
        `import { ${pgImports.join(", ")} } from "drizzle-orm/pg-core";`,
      );
    }

    return `${importLines.join("\n")}\n\n${allLines.join("\n\n")}`;
  }
}
