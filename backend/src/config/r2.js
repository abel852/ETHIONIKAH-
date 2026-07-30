const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const path = require("path");
const fs = require("fs");

// ============================================================
// Cloudflare R2 storage — S3-compatible API
// Uploads, deletes, generates signed URLs, monitors usage
// Falls back to local disk when R2 is not configured
// ============================================================

let s3Client = null;
let bucketName = null;
let publicBaseUrl = null;
let isConfigured = false;

function initR2() {
  if (isConfigured) return s3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  bucketName = process.env.R2_BUCKET_NAME;
  publicBaseUrl = process.env.R2_PUBLIC_URL; // e.g. https://uploads.ethionikah.com or https://pub-xxx.r2.dev

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.log("[R2] Not configured — uploads will use local disk");
    return null;
  }

  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  isConfigured = true;
  console.log(`[R2] Client initialized — bucket: ${bucketName}, endpoint: ${endpoint}`);
  return s3Client;
}

function isR2Enabled() {
  return !!initR2();
}

function getPublicUrl(key) {
  if (!publicBaseUrl) return null;
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${publicBaseUrl.replace(/\/$/, "")}/${cleanKey}`;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  return types[ext] || "application/octet-stream";
}

// Upload a file buffer to R2
async function uploadToR2(key, buffer, contentType) {
  const client = initR2();
  if (!client) return null;

  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType || getContentType(cleanKey),
    })
  );

  return getPublicUrl(cleanKey);
}

// Upload a file from multer (req.file) to R2
async function uploadMulterFile(file, folder) {
  const client = initR2();
  if (!client) {
    // Fallback: return local path
    const localPath = `${folder}/${file.filename}`;
    return localPath;
  }

  const key = `${folder}/${file.filename}`;
  const buffer = fs.readFileSync(file.path);
  const publicUrl = await uploadToR2(key, buffer, file.mimetype);

  // Clean up local temp file after R2 upload
  try {
    fs.unlinkSync(file.path);
  } catch {}

  return publicUrl || key;
}

// Delete a file from R2 by key
async function deleteFromR2(key) {
  const client = initR2();
  if (!client) return false;

  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    })
  );

  return true;
}

// Generate a signed URL for temporary access (default 1 hour)
async function getSignedFileUrl(key, expiresIn = 3600) {
  const client = initR2();
  if (!client) return null;

  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucketName, Key: cleanKey }),
    { expiresIn }
  );

  return url;
}

// Get storage usage statistics
async function getStorageUsage() {
  const client = initR2();
  if (!client) return null;

  let totalSize = 0;
  let fileCount = 0;
  let continuationToken = undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        totalSize += obj.Size || 0;
        fileCount++;
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  // R2 free tier: 10 GB
  const planLimitBytes = parseInt(process.env.R2_STORAGE_LIMIT_BYTES || (10 * 1024 * 1024 * 1024).toString(), 10);
  const usagePercent = (totalSize / planLimitBytes) * 100;

  return {
    totalSizeBytes: totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
    fileCount,
    planLimitBytes,
    planLimitGB: (planLimitBytes / (1024 * 1024 * 1024)).toFixed(0),
    usagePercent: usagePercent.toFixed(2),
    alert80: usagePercent >= 80,
    alert90: usagePercent >= 90,
  };
}

// Delete files older than a retention period in a specific prefix
async function deleteOldFiles(prefix, retentionDays) {
  const client = initR2();
  if (!client) return { deleted: 0, errors: 0 };

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  let deleted = 0;
  let errors = 0;
  let continuationToken = undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        const lastModified = new Date(obj.LastModified);
        if (lastModified < cutoffDate) {
          try {
            await client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: obj.Key,
              })
            );
            deleted++;
          } catch {
            errors++;
          }
        }
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`[R2] Retention cleanup: deleted ${deleted} files older than ${retentionDays} days in ${prefix} (${errors} errors)`);
  return { deleted, errors };
}

module.exports = {
  initR2,
  isR2Enabled,
  getPublicUrl,
  getContentType,
  uploadToR2,
  uploadMulterFile,
  deleteFromR2,
  getSignedFileUrl,
  getStorageUsage,
  deleteOldFiles,
};
