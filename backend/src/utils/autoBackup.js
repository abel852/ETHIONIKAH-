const cron = require("node-cron");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const { uploadBackup: uploadToS3, deleteS3Backup, isS3Configured } = require("./backupStorage");

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, "..", "..", "backups");
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const MAX_AUTO_BACKUPS = 30;

function parseDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error("Invalid DATABASE_URL format");
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

function buildEnv(db) {
  return {
    ...process.env,
    PGPASSWORD: db.password,
  };
}

async function createAutoBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `auto-backup-${timestamp}.tar.gz`;
  const filepath = path.join(BACKUP_DIR, filename);
  let tempSqlPath = null;

  console.log(`[AUTO-BACKUP] Starting daily full backup: ${filename}`);

  try {
    const db = parseDatabaseUrl();

    // Step 1: Create database dump to temp file
    tempSqlPath = path.join(BACKUP_DIR, `temp-db-${timestamp}.sql`);
    const dumpCmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p --clean --if-exists -f "${tempSqlPath}"`;
    await execAsync(dumpCmd, { env: buildEnv(db), maxBuffer: 1024 * 1024 * 200 });

    // Step 2: Create tar.gz with both the SQL dump and uploads directory
    const sqlFilename = `db-${timestamp}.sql`;
    const tarCmd = `tar -czf "${filepath}" -C "${BACKUP_DIR}" "${path.basename(tempSqlPath)}" -C "${path.dirname(UPLOADS_DIR)}" "${path.basename(UPLOADS_DIR)}" --transform "s|${path.basename(tempSqlPath)}|${sqlFilename}|"`;
    await execAsync(tarCmd, { maxBuffer: 1024 * 1024 * 200 });

    // Clean up temp SQL file
    if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
    tempSqlPath = null;

    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[AUTO-BACKUP] Full backup created: ${filename} (${sizeMB} MB)`);

    // Offload to S3/R2 if configured
    let s3Uploaded = false;
    if (isS3Configured()) {
      const s3Result = await uploadToS3(filepath, filename);
      s3Uploaded = s3Result.uploaded;
      if (s3Uploaded) {
        // Remove local copy to save disk space — backup is safely in S3
        fs.unlinkSync(filepath);
        console.log(`[AUTO-BACKUP] Uploaded to S3, local copy removed to save disk space`);
      }
    }

    // Clean up old auto-backups (keep last MAX_AUTO_BACKUPS)
    cleanupOldAutoBackups();

    return { success: true, filename, sizeMB };
  } catch (error) {
    // Clean up temp SQL file on error
    if (tempSqlPath && fs.existsSync(tempSqlPath)) {
      try { fs.unlinkSync(tempSqlPath); } catch {}
    }
    console.error(`[AUTO-BACKUP] Failed: ${error.message}`);

    return { success: false, error: error.message };
  }
}

function cleanupOldAutoBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("auto-backup-") && f.endsWith(".tar.gz"))
      .map((f) => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > MAX_AUTO_BACKUPS) {
      const toDelete = files.slice(MAX_AUTO_BACKUPS);
      for (const f of toDelete) {
        fs.unlinkSync(f.path);
        // Also delete from S3 if configured
        if (isS3Configured()) {
          deleteS3Backup(f.name).catch(() => {});
        }
        console.log(`[AUTO-BACKUP] Deleted old backup: ${f.name}`);
      }
    }
  } catch (e) {
    console.error(`[AUTO-BACKUP] Cleanup error: ${e.message}`);
  }
}

function startAutoBackupScheduler() {
  // Run at midnight (00:00) every day
  const schedule = process.env.BACKUP_CRON || "0 0 * * *";

  if (!cron.validate(schedule)) {
    console.error(`[AUTO-BACKUP] Invalid cron schedule: ${schedule}`);
    return;
  }

  cron.schedule(schedule, () => {
    createAutoBackup().catch((err) => {
      console.error(`[AUTO-BACKUP] Unhandled error: ${err.message}`);
    });
  });

  console.log(`[AUTO-BACKUP] Scheduler started — runs daily at cron: "${schedule}"`);
}

module.exports = {
  startAutoBackupScheduler,
  createAutoBackup,
};
