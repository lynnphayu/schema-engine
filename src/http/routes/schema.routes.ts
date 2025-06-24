import { Router } from "express";
import { basicRouteMiddleware } from "#/http/middleware/basic.middleware";
import drizzleKitPort from "#/services/drizzle.service";
import engineService from "#/services/engine.service";
import filesystemService from "#/services/filesystem.service";
import { schemaRequestSchema, tenantRouteSchema } from "../../types/schema";
import { SchemaController } from "../controllers/schema.controller";

const router: Router = Router();
const fsport = filesystemService();
const drizzleKit = drizzleKitPort();

const schemaController = new SchemaController(
  engineService(fsport, drizzleKit),
  drizzleKit,
);

router.post(
  "/validate/:tenantId",
  basicRouteMiddleware({
    body: schemaRequestSchema,
    params: tenantRouteSchema,
  })(schemaController.validateSchema.bind(schemaController)),
);

router.post(
  "/generate/:tenantId",
  basicRouteMiddleware({
    body: schemaRequestSchema,
    params: tenantRouteSchema,
  })(schemaController.generateSchema.bind(schemaController)),
);

router.post(
  "/migrate/:tenantId",
  basicRouteMiddleware({
    params: tenantRouteSchema,
  })(schemaController.migrateSchema.bind(schemaController)),
);

export { router as schemaRoutes };
