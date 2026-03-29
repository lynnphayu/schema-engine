import {
  GetObjectCommand,
  HeadObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Effect } from "effect";
import mime from "mime-types";
import { env } from "#/config/env";
import {
  S3ObjectNotFoundError,
  S3PresignError,
  S3UploadError,
} from "#/errors/s3";

export const makeS3Service = (s3Client: S3Client) => {
  const checkObjectExists = (key: string) =>
    Effect.tryPromise({
      try: async () => {
        const command = new HeadObjectCommand({
          Key: key,
          Bucket: env.S3_BUCKET_NAME,
        });
        return await s3Client.send(command);
      },
      catch: () => new S3ObjectNotFoundError({ key }),
    });

  return {
    uploadFile: (file: File, tenantId: string) =>
      Effect.tryPromise({
        try: async () => {
          const command = new Upload({
            client: s3Client,
            params: {
              Bucket: env.S3_BUCKET_NAME,
              Key: `tmp/${tenantId}/${file.name}`,
              Body: file,
            },
          });
          const data = await command.done();
          if (!data.Bucket || !data.Key) {
            throw new S3UploadError({
              tenantId,
              fileName: file.name,
              cause: new Error("No bucket or key in upload result"),
            });
          }
          return {
            bucket: data.Bucket,
            key: data.Key,
          };
        },
        catch: (cause) =>
          cause instanceof S3UploadError
            ? cause
            : new S3UploadError({
                tenantId,
                fileName: file.name,
                cause,
              }),
      }),

    getPresignedUrl: (key: string, expireInSeconds: number) =>
      Effect.gen(function* () {
        yield* checkObjectExists(key);
        return yield* Effect.tryPromise({
          try: () =>
            getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: env.S3_BUCKET_NAME,
                Key: key,
              }),
              { expiresIn: expireInSeconds },
            ),
          catch: (cause) => new S3PresignError({ key, cause }),
        });
      }),

    generateGetSignedUrl: (key: string, expireInSeconds: number) =>
      Effect.tryPromise({
        try: () => {
          const command = new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: "inline",
            ResponseContentType: mime.lookup(key) || "application/octet-stream",
          });
          return getSignedUrl(s3Client, command, {
            expiresIn: expireInSeconds,
          });
        },
        catch: (cause) => new S3PresignError({ key, cause }),
      }),

    checkObjectExists,
  };
};
