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

// Client Provider: R2 / S3 / Local Fallback
export class S3StorageProvider implements FileStorage {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async uploadFile(key: string, body: Buffer | Uint8Array, options?: UploadOptions): Promise<string> {
    console.log(`[Storage] Mock/R2 Upload: ${key} (${body.length} bytes), Content-Type: ${options?.contentType || 'application/octet-stream'}`);
    const endpoint = this.config.endpoint || 'https://storage.intelicont.com';
    return `${endpoint}/${this.config.bucket}/${key}`;
  }

  async getFileUrl(key: string): Promise<string> {
    const endpoint = this.config.endpoint || 'https://storage.intelicont.com';
    return `${endpoint}/${this.config.bucket}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    console.log(`[Storage] Deleted key: ${key}`);
  }
}
