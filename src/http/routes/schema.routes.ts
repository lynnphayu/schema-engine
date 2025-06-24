import { Router } from "express";
import { basicRouteMiddleware } from "#/http/middleware/basic.middleware";
import { schemaController } from "../controllers/schema.controller";
import { schemaRequestSchema, tenantRouteSchema } from "../../types/schema";

const router: Router = Router();

router.post(
  "/validate/:tenantId",
  basicRouteMiddleware({
    body: schemaRequestSchema,
    params: tenantRouteSchema,
  })(schemaController.validateSchema.bind(schemaController))
);

router.post(
  "/generate/:tenantId",
  basicRouteMiddleware({
    body: schemaRequestSchema,
    params: tenantRouteSchema,
  })(schemaController.generateSchema.bind(schemaController))
);

router.post(
  "/migrate/:tenantId",
  basicRouteMiddleware({
    params: tenantRouteSchema,
  })(schemaController.migrateSchema.bind(schemaController))
);

export { router as schemaRoutes };
