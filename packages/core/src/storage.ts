import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export type StorageConfig = {
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type UploadOptions = {
  contentType?: string;
  metadata?: Record<string, string>;
};

export interface FileStorage {
  uploadFile(key: string, body: Buffer | Uint8Array, options?: UploadOptions): Promise<string>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

export class S3StorageProvider implements FileStorage {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint || `https://${config.bucket}.s3.amazonaws.com`;
    
    const accessKeyId = config.accessKeyId || process.env.R2_ACCESS_KEY_ID || "";
    const secretAccessKey = config.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || "";

    this.client = new S3Client({
      endpoint: config.endpoint || process.env.R2_ENDPOINT,
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(key: string, body: Buffer | Uint8Array, options?: UploadOptions): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      })
    );
    return this.getFileUrl(key);
  }

  async getFileUrl(key: string): Promise<string> {
    const customDomain = process.env.R2_CUSTOM_DOMAIN;
    if (customDomain) {
      return `${customDomain}/${key}`;
    }
    return `${this.endpoint}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}
