import {
  GetObjectCommand,
  HeadObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { inject, injectable } from "inversify";
import mime from "mime-types";
import "reflect-metadata";
import { env } from "#/config/env";
import { TYPES } from "#/di/types";

@injectable()
export class S3Service {
  constructor(@inject(TYPES.S3Client) private s3Client: S3Client) {}

  async uploadFile(file: File, tenantId: string) {
    const command = new Upload({
      client: this.s3Client,
      params: {
        Bucket: env.S3_BUCKET_NAME,
        Key: `tmp/${tenantId}/${file.name}`,
        Body: file,
      },
    });
    return command.done().then((data) => {
      if (!data.Bucket || !data.Key) {
        throw new Error("File upload failed. No key generated.");
      }
      return {
        bucket: data.Bucket,
        key: data.Key,
      };
    });
  }

  async getPresignedUrl(key: string, expireInSeconds: number) {
    await this.checkObjectExists(key);

    const s3PresignedUrl = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: expireInSeconds },
    );

    return s3PresignedUrl;
  }

  async generateGetSignedUrl(key: string, expireInSeconds: number) {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: mime.lookup(key) || "application/octet-stream",
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expireInSeconds,
    });
  }

  async checkObjectExists(key: string) {
    try {
      const command = new HeadObjectCommand({
        Key: key,
        Bucket: env.S3_BUCKET_NAME,
      });
      const result = await this.s3Client.send(command);
      return result;
    } catch (_e) {
      throw new Error("File not found");
    }
  }
}
