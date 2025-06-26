import {
  GetObjectCommand,
  HeadObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mime from "mime-types";
import { env } from "#/config/env";

export default (s3Client: S3Client) => ({
  uploadFile: async (file: File, tenantId: string) => {
    const command = new Upload({
      client: s3Client,
      params: {
        Bucket: env.S3_BUCKET_NAME,
        Key: `tmp/${tenantId}/${file.name}`,
        Body: file,
      },
    });
    return command.done().then((data) => {
      if (!data.Bucket || !data.Key) {
        throw new Error("File upload failed. No key generated.");
      } else {
        return {
          bucket: data.Bucket,
          key: data.Key,
        };
      }
    });
  },

  async getPresignedUrl(key: string, expireInSeconds: number) {
    await this.checkObjectExists(key);

    const s3PresignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: expireInSeconds },
    );

    return s3PresignedUrl;
  },

  async generateGetSignedUrl(key: string, expireInSeconds: number) {
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

  async checkObjectExists(key: string) {
    try {
      const command = new HeadObjectCommand({
        Key: key,
        Bucket: env.S3_BUCKET_NAME,
      });
      const result = await s3Client.send(command);
      return result;
    } catch (e) {
      throw new Error("File not found");
    }
  },
});
