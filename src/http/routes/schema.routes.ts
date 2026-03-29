import { Hono } from "hono";
import {
  validateBody,
  validateParams,
} from "#/http/middleware/validation.middleware";
import {
  generateSchemaEffect,
  migrateSchemaEffect,
  runSchemaEffect,
  validateSchemaEffect,
} from "#/http/schema.handlers";
import { appRuntime } from "#/layers/live";
import { schemaRequestSchema, tenantRouteSchema } from "#/types/schema";

const schemaRoutes = new Hono();

schemaRoutes.post(
  "/validate/:tenantId",
  validateParams(tenantRouteSchema),
  validateBody(schemaRequestSchema),
  (c) =>
    runSchemaEffect(
      appRuntime,
      validateSchemaEffect({
        tenantId: c.get("validatedParams").tenantId,
        body: c.get("validatedBody"),
      }),
      c,
    ),
);

schemaRoutes.post(
  "/generate/:tenantId",
  validateParams(tenantRouteSchema),
  validateBody(schemaRequestSchema),
  (c) =>
    runSchemaEffect(
      appRuntime,
      generateSchemaEffect({
        tenantId: c.get("validatedParams").tenantId,
        body: c.get("validatedBody"),
      }),
      c,
    ),
);

schemaRoutes.post(
  "/migrate/:tenantId",
  validateParams(tenantRouteSchema),
  (c) =>
    runSchemaEffect(
      appRuntime,
      migrateSchemaEffect(c.get("validatedParams").tenantId),
      c,
    ),
);

export { schemaRoutes };
