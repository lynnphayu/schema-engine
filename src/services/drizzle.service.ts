import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Config } from "drizzle-kit";
import type { z } from "zod";
import type { schemaDefinitionSchema } from "../types/schema";

const execAsync = promisify(exec);

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

  jsonToDrizzle: (schema: z.infer<typeof schemaDefinitionSchema>): string => {
    let drizzleSchema = `import { pgTable, serial, varchar, timestamp, integer, text, boolean, numeric, date, time, json, jsonb, uuid, decimal, real, doublePrecision } from 'drizzle-orm/pg-core';

`;

    // Generate table definitions
    for (const table of schema.tables) {
      drizzleSchema += `export const ${table.name} = pgTable('${table.name}', {
`;

      // Generate column definitions
      for (const column of table.columns) {
        let drizzleType: string;

        // Map SQL types to Drizzle ORM types
        const typeMatch = column.type
          .toLowerCase()
          .match(/^([a-z]+)(\((\d+)\))?/i);
        const baseType = typeMatch ? typeMatch[1] : column.type.toLowerCase();
        const size = typeMatch ? typeMatch[3] : null;

        switch (baseType) {
          case "serial":
            drizzleType = "serial().primaryKey()";
            break;
          case "integer":
          case "int":
            drizzleType = "integer()";
            break;
          case "bigint":
            drizzleType = "bigint()";
            break;
          case "varchar":
          case "character varying":
            drizzleType = size ? `varchar(${size})` : "varchar(255)";
            break;
          case "text":
            drizzleType = "text()";
            break;
          case "boolean":
          case "bool":
            drizzleType = "boolean()";
            break;
          case "numeric":
          case "decimal":
            drizzleType = size ? `decimal(${size})` : "decimal()";
            break;
          case "real":
            drizzleType = "real()";
            break;
          case "double precision":
            drizzleType = "doublePrecision()";
            break;
          case "timestamp":
            drizzleType = "timestamp()";
            break;
          case "date":
            drizzleType = "date()";
            break;
          case "time":
            drizzleType = "time()";
            break;
          case "json":
            drizzleType = "json()";
            break;
          case "jsonb":
            drizzleType = "jsonb()";
            break;
          case "uuid":
            drizzleType = "uuid()";
            break;
          default:
            drizzleType = `text() /* Original type: ${column.type} */`;
        }

        // Add constraints
        if (column.unique) {
          drizzleType += ".unique()";
        }
        if (column.nullable === false) {
          drizzleType += ".notNull()";
        }
        if (column.default) {
          if (
            baseType === "timestamp" &&
            column.default.toLowerCase() === "current_timestamp"
          ) {
            drizzleType += ".defaultNow()";
          } else {
            drizzleType += `.default(${column.default})`;
          }
        }

        drizzleSchema += `  ${column.name}: ${drizzleType},\n`;
      }

      drizzleSchema += "});\n\n";
    }

    return drizzleSchema;
  },
});
