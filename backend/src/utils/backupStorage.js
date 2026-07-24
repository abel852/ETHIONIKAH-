const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

// ============================================================
// S3 / R2 backup offload — uploads backup files to cloud storage
// after creation and downloads them for restore. Falls back to
// local-only when STORAGE_PROVIDER is not configured.
// ============================================================

const BACKUP_PREFIX = "backups/";

let s3Client = null;
let bucketName = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const provider = process.env.STORAGE_PROVIDER;
  if (!provider || provider === "local") return null;

  bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    console.warn("[BACKUP-S3] S3_BUCKET_NAME not set — backups will be local-only");
    return null;
  }

  const config = {
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  };

  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
  }

  s3Client = new S3Client(config);
  console.log(`[BACKUP-S3] S3 client initialized — bucket: ${bucketName}`);
  return s3Client;
}

async function uploadBackup(filepath, filename) {
  const client = getS3Client();
  if (!client) return { uploaded: false, reason: "S3 not configured" };

  try {
    const fileStream = fs.createReadStream(filepath);
    const stats = fs.statSync(filepath);
    const ext = path.extname(filename);
    const contentType = ext === ".sql" ? "application/sql" : ext === ".tar.gz" ? "application/gzip" : "application/octet-stream";

    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: BACKUP_PREFIX + filename,
      Body: fileStream,
      ContentType: contentType,
      ContentLength: stats.size,
    }));

    console.log(`[BACKUP-S3] Uploaded ${filename} (${(stats.size / (1024 * 1024)).toFixed(2)} MB) to S3`);
    return { uploaded: true, key: BACKUP_PREFIX + filename, sizeMB: (stats.size / (1024 * 1024)).toFixed(2) };
  } catch (err) {
    console.error(`[BACKUP-S3] Upload failed for ${filename}: ${err.message}`);
    return { uploaded: false, error: err.message };
  }
}

async function downloadBackup(filename, destPath) {
  const client = getS3Client();
  if (!client) return { downloaded: false, reason: "S3 not configured" };

  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: BACKUP_PREFIX + filename,
    }));

    const writeStream = fs.createWriteStream(destPath);
    await new Promise((resolve, reject) => {
      response.Body.pipe(writeStream);
      response.Body.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("finish", resolve);
    });

    const stats = fs.statSync(destPath);
    console.log(`[BACKUP-S3] Downloaded ${filename} (${(stats.size / (1024 * 1024)).toFixed(2)} MB) from S3`);
    return { downloaded: true, sizeMB: (stats.size / (1024 * 1024)).toFixed(2) };
  } catch (err) {
    console.error(`[BACKUP-S3] Download failed for ${filename}: ${err.message}`);
    return { downloaded: false, error: err.message };
  }
}

async function listS3Backups() {
  const client = getS3Client();
  if (!client) return [];

  try {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: BACKUP_PREFIX,
    }));

    if (!response.Contents) return [];

    return response.Contents
      .filter((obj) => obj.Key.endsWith(".sql") || obj.Key.endsWith(".tar.gz"))
      .map((obj) => {
        const filename = obj.Key.replace(BACKUP_PREFIX, "");
        return {
          filename,
          sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
          createdAt: obj.LastModified.toISOString(),
          type: filename.endsWith(".tar.gz") ? "full" : "database",
          location: "s3",
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error(`[BACKUP-S3] List failed: ${err.message}`);
    return [];
  }
}

async function deleteS3Backup(filename) {
  const client = getS3Client();
  if (!client) return { deleted: false, reason: "S3 not configured" };

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: BACKUP_PREFIX + filename,
    }));

    console.log(`[BACKUP-S3] Deleted ${filename} from S3`);
    return { deleted: true };
  } catch (err) {
    console.error(`[BACKUP-S3] Delete failed for ${filename}: ${err.message}`);
    return { deleted: false, error: err.message };
  }
}

function isS3Configured() {
  return getS3Client() !== null;
}

module.exports = {
  uploadBackup,
  downloadBackup,
  listS3Backups,
  deleteS3Backup,
  isS3Configured,
};
