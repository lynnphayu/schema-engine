import { Hono } from "hono";
import { container } from "#/di/container";
import { TYPES } from "#/di/types";
import type { SchemaController } from "#/http/controllers/schema.controller";
import {
  validateBody,
  validateParams,
} from "#/http/middleware/validation.middleware";
import { schemaRequestSchema, tenantRouteSchema } from "#/types/schema";

const schemaRoutes = new Hono();

// Get controller instance from DI container
const schemaController = container.get<SchemaController>(
  TYPES.SchemaController,
);

schemaRoutes.post(
  "/validate/:tenantId",
  validateParams(tenantRouteSchema),
  validateBody(schemaRequestSchema),
  (c) => schemaController.validateSchema(c),
);

schemaRoutes.post(
  "/generate/:tenantId",
  validateParams(tenantRouteSchema),
  validateBody(schemaRequestSchema),
  (c) => schemaController.generateSchema(c),
);

schemaRoutes.post(
  "/migrate/:tenantId",
  validateParams(tenantRouteSchema),
  (c) => schemaController.migrateSchema(c),
);

export { schemaRoutes };
