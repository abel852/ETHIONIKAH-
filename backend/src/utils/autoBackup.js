const cron = require("node-cron");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const { sendEmail } = require("./email");
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

    // Send email notification if BACKUP_EMAIL is set
    const backupEmail = process.env.BACKUP_EMAIL;
    if (backupEmail) {
      const attachFile = !s3Uploaded && fs.existsSync(filepath);
      await sendBackupEmail(backupEmail, filename, sizeMB, attachFile ? filepath : null, s3Uploaded);
    } else {
      console.log("[AUTO-BACKUP] BACKUP_EMAIL not set — skipping email notification");
    }

    return { success: true, filename, sizeMB };
  } catch (error) {
    // Clean up temp SQL file on error
    if (tempSqlPath && fs.existsSync(tempSqlPath)) {
      try { fs.unlinkSync(tempSqlPath); } catch {}
    }
    console.error(`[AUTO-BACKUP] Failed: ${error.message}`);

    // Send failure email if BACKUP_EMAIL is set
    const backupEmail = process.env.BACKUP_EMAIL;
    if (backupEmail) {
      try {
        await sendBackupFailureEmail(backupEmail, error.message);
      } catch (e) {
        console.error(`[AUTO-BACKUP] Failed to send error email: ${e.message}`);
      }
    }

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

async function sendBackupEmail(to, filename, sizeMB, filepath, s3Uploaded) {
  const date = new Date().toLocaleString();
  const locationText = s3Uploaded ? "Cloud storage (S3/R2)" : `backups/${filename}`;
  const attachmentText = filepath ? "<p>The backup file is attached to this email and also stored in cloud storage.</p>" : "<p>The backup has been uploaded to cloud storage (S3/R2). Contact your admin to download it from the backup management panel.</p>";
  const html = `
    <p>A daily automatic full backup has been completed successfully.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:600;color:#15803d;">Backup Details</p>
      <p style="margin:0 0 4px;color:#444;"><strong>File:</strong> ${filename}</p>
      <p style="margin:0 0 4px;color:#444;"><strong>Size:</strong> ${sizeMB} MB</p>
      <p style="margin:0 0 4px;color:#444;"><strong>Date:</strong> ${date}</p>
      <p style="margin:0;color:#444;"><strong>Location:</strong> ${locationText}</p>
    </div>
    ${attachmentText}
  `;

  const emailParams = {
    to,
    subject: `Daily Backup Successful — ${filename}`,
    text: `Daily full backup completed successfully. File: ${filename}, Size: ${sizeMB} MB, Date: ${date}, Location: ${locationText}`,
    html,
  };

  if (filepath) {
    emailParams.attachments = [{ filename, path: filepath }];
  }

  await sendEmail(emailParams);

  console.log(`[AUTO-BACKUP] Success email sent to ${to}`);
}

async function sendBackupFailureEmail(to, errorMessage) {
  const date = new Date().toLocaleString();
  const html = `
    <p style="color:#dc2626;font-weight:600;">The daily automatic database backup has failed.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:600;color:#dc2626;">Error Details</p>
      <p style="margin:0 0 4px;color:#444;"><strong>Date:</strong> ${date}</p>
      <p style="margin:0;color:#444;"><strong>Error:</strong> ${errorMessage}</p>
    </div>
    <p>Please check the server logs and database configuration to resolve this issue.</p>
  `;

  await sendEmail({
    to,
    subject: `URGENT: Daily Backup FAILED — ${date}`,
    text: `Daily database backup FAILED on ${date}. Error: ${errorMessage}`,
    html,
  });

  console.log(`[AUTO-BACKUP] Failure email sent to ${to}`);
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
  if (process.env.BACKUP_EMAIL) {
    console.log(`[AUTO-BACKUP] Email notifications will be sent to: ${process.env.BACKUP_EMAIL}`);
  } else {
    console.log("[AUTO-BACKUP] No BACKUP_EMAIL set — email notifications disabled");
  }
}

module.exports = {
  startAutoBackupScheduler,
  createAutoBackup,
};
