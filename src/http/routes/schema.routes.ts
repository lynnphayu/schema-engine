import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { Router } from "express";
import { env } from "#/config/env";
import { basicRouteMiddleware } from "#/http/middleware/basic.middleware";
import drizzleKitPort from "#/services/drizzle.service";
import engineService from "#/services/engine.service";
import filesystemService from "#/services/filesystem.service";
import s3Service from "#/services/s3.service";
import { schemaRequestSchema, tenantRouteSchema } from "../../types/schema";
import { SchemaController } from "../controllers/schema.controller";

const router: Router = Router();
const fsport = filesystemService();
const drizzleKit = drizzleKitPort();
const s3Config: S3ClientConfig = {
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
};
if (env.S3_LOCALSTACK) {
  s3Config.forcePathStyle = true;
  s3Config.endpoint = "http://127.0.0.1:4566";
}
const s3Port = s3Service(new S3Client(s3Config));

const schemaController = new SchemaController(
  engineService(fsport, drizzleKit, s3Port),
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
