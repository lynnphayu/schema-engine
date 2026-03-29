import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { Layer, ManagedRuntime } from "effect";
import { env } from "#/config/env";
import {
  DrizzleKitService,
  EngineService,
  FilesystemService,
  S3ClientTag,
  S3Service,
} from "#/layers/tags";
import { DrizzleKitService as DrizzleKitServiceClass } from "#/services/drizzle.service";
import { makeEngineService } from "#/services/engine.service";
import { makeFilesystemService } from "#/services/filesystem.service";
import { makeS3Service } from "#/services/s3.service";

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
} else if (env.S3_ENDPOINT) {
  s3Config.forcePathStyle = true;
  s3Config.endpoint = env.S3_ENDPOINT;
}

const s3Client = new S3Client(s3Config);

const filesystem = makeFilesystemService();
const drizzleKit = new DrizzleKitServiceClass();
const s3 = makeS3Service(s3Client);
const engine = makeEngineService({
  fsService: filesystem,
  drizzleKitService: drizzleKit,
  s3Service: s3,
});

/** Eager wiring keeps the merged layer’s environment fully satisfied (no `Layer.provide*` inference gaps). */
export const AppLayer = Layer.mergeAll(
  Layer.succeed(S3ClientTag, s3Client),
  Layer.succeed(FilesystemService, filesystem),
  Layer.succeed(DrizzleKitService, drizzleKit),
  Layer.succeed(S3Service, s3),
  Layer.succeed(EngineService, engine),
);

export const appRuntime = ManagedRuntime.make(AppLayer);
