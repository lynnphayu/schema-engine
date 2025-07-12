import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Config } from "drizzle-kit";
import type {
  ColumnDefinition,
  DynamicSchema,
  TableDefinition,
} from "../types/schema";

const execAsync = promisify(exec);

const generateColumn = (column: ColumnDefinition) => {
  const imports: string[] = [];
  imports.push(column.column_type);

  let args = `"${column.identifier}"`;
  if (column.length && ["varchar"].includes(column.column_type)) {
    args += `, { length: ${column.length} }`;
  }

  let expr = `${column.column_type}(${args})`;
  if (!column.is_nullable) expr += ".notNull()";
  if (column.is_primary_key) expr += ".primaryKey()";
  if (column.is_unique && !column.is_primary_key) expr += ".unique()";
  if (column.default_value !== null) {
    expr += `.default(${JSON.stringify(column.default_value)})`;
  }
  if (column.check_constraint) {
    expr += `.check(${column.check_constraint})`;
  }
  if (column.is_auto_increment) {
    expr += ".autoIncrement()";
  }
  if (column.column_order) {
    expr += `.order(${column.column_order})`;
  }

  return {
    line: `  ${column.identifier}: ${expr},`,
    imports,
  };
};

const generateTable = (table: TableDefinition) => {
  const imports = new Set<string>(["pgTable"]);
  const columnLines: string[] = [];
  const indexLines: string[] = [];
  const fkLines: string[] = [];

  for (const col of table.columns) {
    const { line, imports: colImports } = generateColumn(col);
    columnLines.push(line);
    colImports.forEach((i) => imports.add(i));
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
        ? `, { unique: true${idx.where_clause ? `, where: sql\`${idx.where_clause}\`` : ""} }`
        : idx.where_clause
          ? `, { where: sql\`${idx.where_clause}\` }`
          : "";
      indexLines.push(
        `export const ${idx.identifier} = index("${idx.identifier}", ${columns}${options});`,
      );
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

  const tableDef = `export const ${table.identifier} = pgTable("${table.identifier}", {
${columnLines.join("\n")}
});`;

  return { lines: [tableDef, ...indexLines, ...fkLines], imports };
};

export default () => ({
  drizzleToSQL: async (config: string): Promise<void> => {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit generate --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit generation failed: ${stderr}`);
    }
  },

  migrate: async (config: string): Promise<void> => {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit migrate --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit migration failed: ${stderr}`);
    }
  },

  pull: async (config: string): Promise<void> => {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit pull --config=${config}`,
    ).catch((err) => {
      console.error(err);
      throw err;
    });
    if (stderr) {
      throw new Error(`Drizzle kit pull failed: ${stderr}`);
    }
  },

  validate: async (config: string): Promise<void> => {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit check --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit validation failed: ${stderr}`);
    }
  },

  updateSnapshot: async (config: string): Promise<void> => {
    const { stdout: _stdout, stderr } = await execAsync(
      `pnpm drizzle-kit up --config=${config}`,
    );
    if (stderr) {
      throw new Error(`Drizzle kit snapshot update failed: ${stderr}`);
    }
  },

  generateConfig: async (
    prefix: string,
    userId: string,
    databaseUrl: string,
  ): Promise<Config> => {
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
  },

  jsonToDrizzle: (schema: DynamicSchema) => {
    const allImports = new Set<string>();
    const allLines: string[] = [];

    for (const table of schema.tables) {
      const { lines, imports } = generateTable(table);
      lines.forEach((l) => allLines.push(l));
      imports.forEach((i) => allImports.add(i));
    }

    const importLine = `import { ${Array.from(allImports).sort().join(", ")} } from "drizzle-orm/pg-core";\n`;
    if (allImports.has("sql")) {
      return `import { sql } from "drizzle-orm";\n${importLine}\n${allLines.join("\n\n")}`;
    }
    return `${importLine}\n${allLines.join("\n\n")}`;
  },
});
