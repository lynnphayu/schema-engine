import "reflect-metadata";
import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { Container } from "inversify";
import { env } from "#/config/env";
import { SchemaController } from "#/http/controllers/schema.controller";
import { DrizzleKitService } from "#/services/drizzle.service";
import { EngineService } from "#/services/engine.service";
import { FilesystemService } from "#/services/filesystem.service";
import { S3Service } from "#/services/s3.service";
import { TYPES } from "./types";

const container = new Container();

// Configure S3 Client
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

// Bind external dependencies
container
  .bind<S3Client>(TYPES.S3Client)
  .toConstantValue(new S3Client(s3Config));

// Bind services
container
  .bind<FilesystemService>(TYPES.FilesystemService)
  .to(FilesystemService)
  .inSingletonScope();
container
  .bind<DrizzleKitService>(TYPES.DrizzleKitService)
  .to(DrizzleKitService)
  .inSingletonScope();
container.bind<S3Service>(TYPES.S3Service).to(S3Service).inSingletonScope();
container
  .bind<EngineService>(TYPES.EngineService)
  .to(EngineService)
  .inSingletonScope();

// Bind controllersschemaDefinitionSchema
container.bind<SchemaController>(TYPES.SchemaController).to(SchemaController);

export { container };
