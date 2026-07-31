const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const { logAudit } = require("../utils/auditLogger");
const { uploadBackup: uploadToS3, listS3Backups, deleteS3Backup, downloadBackup: downloadFromS3, isS3Configured } = require("../utils/backupStorage");

const execAsync = promisify(exec);

let restoreProgress = { active: false, percent: 0, phase: "idle", totalLines: 0, processedLines: 0 };

function getRestoreProgress() {
  return { ...restoreProgress };
}

function countFileLines(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

function runPsqlWithProgress(db, sqlFilepath, env) {
  return new Promise((resolve, reject) => {
    const totalLines = countFileLines(sqlFilepath);
    restoreProgress.totalLines = totalLines;
    restoreProgress.processedLines = 0;
    restoreProgress.percent = 0;
    restoreProgress.phase = "restoring database";

    const args = [
      "-h", db.host,
      "-p", String(db.port),
      "-U", db.user,
      "-d", db.database,
      "-f", sqlFilepath,
    ];

    const child = spawn("psql", args, { env });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      const newLines = data.toString().split("\n").length - 1;
      restoreProgress.processedLines += newLines;
      if (totalLines > 0) {
        restoreProgress.percent = Math.min(99, Math.round((restoreProgress.processedLines / totalLines) * 100));
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      restoreProgress.percent = 100;
      restoreProgress.phase = "completed";
      if (code === 0 || stderr.includes("already exists") || stderr.includes("duplicate key")) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error("psql failed with code " + code);
        err.stderr = stderr;
        err.stdout = stdout;
        reject(err);
      }
    });

    child.on("error", (err) => {
      restoreProgress.phase = "error";
      reject(err);
    });
  });
}

const BACKUP_DIR = path.join(__dirname, "..", "..", "backups");
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function parseDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
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

// POST /api/admin/backup/create
exports.createBackup = async (req, res) => {
  try {
    const db = parseDatabaseUrl();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const cmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p --clean --if-exists -f "${filepath}"`;
    await execAsync(cmd, { env: buildEnv(db), maxBuffer: 1024 * 1024 * 100 });

    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Offload to S3/R2 if configured
    let s3Result = null;
    if (isS3Configured()) {
      s3Result = await uploadToS3(filepath, filename);
    }

    await logAudit({
      adminId: req.user.userId,
      action: "create_backup",
      resource: "backup",
      details: { filename, sizeMB, s3Uploaded: s3Result?.uploaded || false },
    });

    res.json({
      success: true,
      filename,
      sizeMB,
      createdAt: new Date().toISOString(),
      s3Uploaded: s3Result?.uploaded || false,
    });
  } catch (error) {
    console.error("Backup creation error:", error.message);
    res.status(500).json({ error: "Failed to create backup" });
  }
};

// GET /api/admin/backup/list
exports.listBackups = async (req, res) => {
  try {
    // Local backups
    const localFiles = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".sql") || f.endsWith(".tar.gz"));
    const localBackups = localFiles.map((f) => {
      const filepath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filepath);
      return {
        filename: f,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        createdAt: stats.mtime.toISOString(),
        type: f.endsWith(".tar.gz") ? "full" : "database",
        location: "local",
      };
    });

    // Merge with S3 backups if configured
    let allBackups = localBackups;
    if (isS3Configured()) {
      const s3Backups = await listS3Backups();
      const localNames = new Set(localBackups.map((b) => b.filename));
      const s3Only = s3Backups.filter((b) => !localNames.has(b.filename));
      // Mark local backups that also exist in S3
      const s3Names = new Set(s3Backups.map((b) => b.filename));
      allBackups = [
        ...localBackups.map((b) => ({ ...b, s3Uploaded: s3Names.has(b.filename) })),
        ...s3Only,
      ];
    }

    allBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ backups: allBackups });
  } catch (error) {
    res.status(500).json({ error: "Failed to list backups" });
  }
};

// GET /api/admin/backup/download/:filename
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!((filename.endsWith(".sql") || filename.endsWith(".tar.gz")) && !filename.includes("..") && !filename.includes("/"))) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    let filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      // Try downloading from S3
      if (isS3Configured()) {
        const s3Result = await downloadFromS3(filename, filepath);
        if (!s3Result.downloaded) {
          return res.status(404).json({ error: "Backup file not found" });
        }
      } else {
        return res.status(404).json({ error: "Backup file not found" });
      }
    }

    await logAudit({
      adminId: req.user.userId,
      action: "download_backup",
      resource: "backup",
      details: { filename },
    });

    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ error: "Failed to download backup" });
  }
};

// POST /api/admin/backup/restore
exports.restoreBackup = async (req, res) => {
  let tempDir = null;
  try {
    const { filename } = req.body;
    if (!filename || (filename.includes("..") || filename.includes("/"))) {
      return res.status(400).json({ error: "Invalid backup filename." });
    }
    if (!filename.endsWith(".sql") && !filename.endsWith(".tar.gz")) {
      return res.status(400).json({ error: "Only .sql and .tar.gz backup files are allowed." });
    }

    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      // Try downloading from S3
      if (isS3Configured()) {
        const s3Result = await downloadFromS3(filename, filepath);
        if (!s3Result.downloaded) {
          return res.status(404).json({ error: `Backup file "${filename}" not found on the server or in cloud storage.` });
        }
      } else {
        return res.status(404).json({ error: `Backup file "${filename}" not found on the server.` });
      }
    }

    const stats = fs.statSync(filepath);
    if (stats.size === 0) {
      return res.status(400).json({ error: `Backup file "${filename}" is empty (0 bytes). Cannot restore from an empty file.` });
    }

    let sqlFilepath = filepath;
    let restoredFiles = false;
    let fileCount = 0;

    // If it's a .tar.gz full backup, extract first
    if (filename.endsWith(".tar.gz")) {
      const timestamp = Date.now();
      tempDir = path.join(BACKUP_DIR, `temp-restore-${timestamp}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const extractCmd = `tar -xzf "${filepath}" -C "${tempDir}"`;
      await execAsync(extractCmd, { maxBuffer: 1024 * 1024 * 200 });

      // Find the SQL dump inside
      const extractedItems = fs.readdirSync(tempDir);
      const sqlFile = extractedItems.find((f) => f.endsWith(".sql"));

      if (!sqlFile) {
        throw new Error("No .sql database dump found inside the backup archive.");
      }

      sqlFilepath = path.join(tempDir, sqlFile);

      // Check if uploads directory exists in the archive
      const uploadsBackupDir = path.join(tempDir, "uploads");
      if (fs.existsSync(uploadsBackupDir)) {
        // Backup current uploads before overwriting
        const currentUploadsBackup = path.join(BACKUP_DIR, `uploads-backup-${timestamp}`);
        if (fs.existsSync(UPLOADS_DIR)) {
          fs.renameSync(UPLOADS_DIR, currentUploadsBackup);
        }

        // Move extracted uploads to the correct location
        fs.renameSync(uploadsBackupDir, UPLOADS_DIR);

        // Count restored files
        const countFiles = (dir) => {
          let count = 0;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
              count += countFiles(itemPath);
            } else {
              count++;
            }
          }
          return count;
        };
        fileCount = countFiles(UPLOADS_DIR);
        restoredFiles = true;

        // Clean up old uploads backup
        if (fs.existsSync(currentUploadsBackup)) {
          fs.rmSync(currentUploadsBackup, { recursive: true, force: true });
        }
      }
    }

    // Restore database from SQL dump with progress tracking
    const db = parseDatabaseUrl();
    restoreProgress.active = true;
    restoreProgress.percent = 0;
    restoreProgress.phase = "preparing";

    let stdout = "", stderr = "";
    try {
      const result = await runPsqlWithProgress(db, sqlFilepath, buildEnv(db));
      stdout = result.stdout || "";
      stderr = result.stderr || "";
    } catch (execErr) {
      stderr = execErr.stderr || execErr.message || "";
      restoreProgress.active = false;
      if (stderr.includes("password authentication failed")) {
        return res.status(500).json({ error: "Database authentication failed. Check DATABASE_URL credentials." });
      }
      if (stderr.includes("could not connect to server")) {
        return res.status(500).json({ error: "Could not connect to database server. Check if PostgreSQL is running." });
      }
      if (stderr.includes("database") && stderr.includes("does not exist")) {
        return res.status(500).json({ error: `Target database does not exist. Verify the database name in DATABASE_URL.` });
      }
      return res.status(500).json({
        error: "Database restore command failed.",
        details: stderr.slice(0, 500),
      });
    }

    if (stderr && stderr.includes("ERROR:")) {
      const allErrorLines = stderr.split("\n").filter((l) => l.includes("ERROR:"));
      const NON_FATAL_PATTERNS = [
        "already exists",
        "duplicate key",
        "multiple primary keys",
        "relation already exists",
        "function already exists",
        "constraint already exists",
        "column already exists",
        "sequence already exists",
        "schema already exists",
      ];
      const fatalErrors = allErrorLines.filter((l) =>
        !NON_FATAL_PATTERNS.some((p) => l.includes(p))
      );
      const skippedCount = allErrorLines.length - fatalErrors.length;

      if (fatalErrors.length > 0) {
        return res.status(500).json({
          error: "Restore completed with errors.",
          details: fatalErrors.slice(0, 3).join("; "),
        });
      }

      console.log(`[RESTORE] ${skippedCount} non-fatal errors ignored (schema/data already exists)`);
    }

    restoreProgress.active = false;
    restoreProgress.phase = "completed";

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    await logAudit({
      adminId: req.user.userId,
      action: "restore_backup",
      resource: "backup",
      details: { filename, sizeMB: (stats.size / (1024 * 1024)).toFixed(2), restoredFiles, fileCount },
    });

    const skippedNote = stderr && stderr.includes("ERROR:")
      ? " (database was already up to date — existing data preserved)"
      : "";
    const filesNote = restoredFiles ? ` Files restored: ${fileCount}.` : "";

    res.json({
      success: true,
      message: `Backup restored successfully${skippedNote}${filesNote}`,
      filename,
      restoredFiles,
      fileCount,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    // Clean up temp directory on error
    if (tempDir && fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    console.error("Backup restore error:", error.message);
    restoreProgress.active = false;
    restoreProgress.phase = "error";
    res.status(500).json({
      error: "An unexpected error occurred during restore.",
    });
  }
};

// DELETE /api/admin/backup/:filename
exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!((filename.endsWith(".sql") || filename.endsWith(".tar.gz")) && !filename.includes("..") && !filename.includes("/"))) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filepath = path.join(BACKUP_DIR, filename);
    const localExists = fs.existsSync(filepath);

    // Delete from S3 if configured
    let s3Deleted = false;
    if (isS3Configured()) {
      const s3Result = await deleteS3Backup(filename);
      s3Deleted = s3Result.deleted;
    }

    if (!localExists && !s3Deleted) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    if (localExists) fs.unlinkSync(filepath);

    await logAudit({
      adminId: req.user.userId,
      action: "delete_backup",
      resource: "backup",
      details: { filename, s3Deleted },
    });

    res.json({ success: true, message: "Backup deleted", s3Deleted });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete backup" });
  }
};

// POST /api/admin/backup/create-full
// Creates a full backup: database SQL dump + uploads directory in a single .tar.gz
exports.createFullBackup = async (req, res) => {
  let tempSqlPath = null;
  try {
    const db = parseDatabaseUrl();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `full-backup-${timestamp}.tar.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Step 1: Create database dump to temp file
    tempSqlPath = path.join(BACKUP_DIR, `temp-db-${timestamp}.sql`);
    const dumpCmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p --clean --if-exists -f "${tempSqlPath}"`;
    await execAsync(dumpCmd, { env: buildEnv(db), maxBuffer: 1024 * 1024 * 200 });

    // Step 2: Create tar.gz with both the SQL dump and uploads directory
    // Structure inside the archive:
    //   db-<timestamp>.sql
    //   uploads/ (all subdirectories and files)
    const sqlFilename = `db-${timestamp}.sql`;
    const tarCmd = `tar -czf "${filepath}" -C "${BACKUP_DIR}" "${path.basename(tempSqlPath)}" -C "${path.dirname(UPLOADS_DIR)}" "${path.basename(UPLOADS_DIR)}" --transform "s|${path.basename(tempSqlPath)}|${sqlFilename}|"`;
    await execAsync(tarCmd, { maxBuffer: 1024 * 1024 * 200 });

    // Clean up temp SQL file
    if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
    tempSqlPath = null;

    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Count uploaded files
    let fileCount = 0;
    const countFiles = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      let count = 0;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          count += countFiles(itemPath);
        } else {
          count++;
        }
      }
      return count;
    };
    fileCount = countFiles(UPLOADS_DIR);

    // Offload to S3/R2 if configured
    let s3Result = null;
    if (isS3Configured()) {
      s3Result = await uploadToS3(filepath, filename);
    }

    await logAudit({
      adminId: req.user.userId,
      action: "create_full_backup",
      resource: "backup",
      details: { filename, sizeMB, fileCount, s3Uploaded: s3Result?.uploaded || false },
    });

    res.json({
      success: true,
      filename,
      sizeMB,
      fileCount,
      type: "full",
      createdAt: new Date().toISOString(),
      s3Uploaded: s3Result?.uploaded || false,
    });
  } catch (error) {
    // Clean up temp SQL file on error
    if (tempSqlPath && fs.existsSync(tempSqlPath)) {
      try { fs.unlinkSync(tempSqlPath); } catch {}
    }
    console.error("Full backup creation error:", error.message);
    res.status(500).json({ error: "Failed to create full backup" });
  }
};

// GET /api/admin/backup/restore-progress
exports.getRestoreProgress = (req, res) => {
  res.json(getRestoreProgress());
};

// POST /api/admin/backup/upload
exports.uploadBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No backup file provided" });
    }
    const filepath = path.join(BACKUP_DIR, req.file.filename);
    const stats = fs.statSync(filepath);

    let s3Uploaded = false;
    if (isS3Configured()) {
      const s3Result = await uploadToS3(filepath, req.file.filename);
      s3Uploaded = s3Result.uploaded;
    }

    await logAudit({
      adminId: req.user.userId,
      action: "upload_backup",
      resource: "backup",
      details: { filename: req.file.filename, sizeMB: (stats.size / (1024 * 1024)).toFixed(2), s3Uploaded },
    });

    res.json({
      success: true,
      filename: req.file.filename,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      s3Uploaded,
    });
  } catch (error) {
    console.error("Backup upload error:", error);
    res.status(500).json({ error: "Failed to upload backup file" });
  }
};
