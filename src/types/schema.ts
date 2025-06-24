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
