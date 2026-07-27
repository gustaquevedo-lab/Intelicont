import { exec } from "child_process";
import { promisify } from "util";
import { S3StorageProvider } from "../packages/core/src/storage";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

async function runBackup() {
  console.log("🚀 Starting database backup task...");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL env var is missing.");
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tempFile = path.join(__dirname, `../temp/backup-${timestamp}.sql`);

  // Ensure temp folder exists
  const tempDir = path.dirname(tempFile);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log("📦 Dumping database to temp file...");
    await execAsync(`pg_dump "${dbUrl}" -F p -f "${tempFile}"`);

    console.log("☁️ Uploading backup to Cloudflare R2...");
    const storage = new S3StorageProvider({
      bucket: process.env.R2_BACKUP_BUCKET || "intelicont-backups",
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    });

    const fileContent = fs.readFileSync(tempFile);
    const key = `db-backups/backup-${timestamp}.sql`;
    const url = await storage.uploadFile(key, fileContent, {
      contentType: "application/sql",
    });

    console.log(`✅ Backup successfully uploaded! URL: ${url}`);
  } catch (err) {
    console.error("❌ Backup failed:", err);
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

runBackup();
