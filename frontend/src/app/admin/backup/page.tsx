"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/common";
import api from "@/lib/api";
import {
  Database, Download, Upload, RefreshCw, Trash2, AlertTriangle,
  CheckCircle, Loader2, FileText, HardDrive, Clock, XCircle,
  Archive, Package, X, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RestoreStatus = "idle" | "loading" | "success" | "error";

export default function BackupPage() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingFull, setCreatingFull] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; speedMBps: number; uploadedMB: number; totalMB: number } | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore modal state
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>("idle");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [restoreDetails, setRestoreDetails] = useState("");
  const [restoreFilename, setRestoreFilename] = useState("");
  const [restorePercent, setRestorePercent] = useState(0);
  const [restorePhase, setRestorePhase] = useState("");
  const restorePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSuperAdmin = user?.adminRole === "super_admin";
  const userPerms = new Set(user?.permissions || []);
  const canView = isSuperAdmin || userPerms.has("backup.view");
  const canCreate = isSuperAdmin || userPerms.has("backup.create");
  const canRestore = isSuperAdmin || userPerms.has("backup.restore");
  const canDelete = isSuperAdmin || userPerms.has("backup.delete");

  const fetchBackups = async () => {
    try {
      const { data } = await api.get("/admin/backup/list");
      setBackups(data.backups || []);
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) fetchBackups();
    else setLoading(false);
  }, [canView]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/admin/backup/create");
      toast.success(`Database backup created (${data.sizeMB} MB)`);
      fetchBackups();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || "Failed to create backup";
      toast.error(errMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFullBackup = async () => {
    setCreatingFull(true);
    try {
      const { data } = await api.post("/admin/backup/create-full");
      toast.success(`Full backup created (${data.sizeMB} MB, ${data.fileCount} files)`);
      fetchBackups();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || "Failed to create full backup";
      toast.error(errMsg);
    } finally {
      setCreatingFull(false);
    }
  };

  const handleDownload = (filename: string) => {
    try {
      setDownloading(filename);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      // Direct streaming native download — prevents 30s JS timeout and memory buffer limit
      const downloadUrl = `${apiBase}/admin/backup/download/${encodeURIComponent(filename)}?token=${encodeURIComponent(token || "")}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Download started for ${filename}`);
      setTimeout(() => setDownloading(null), 3000);
    } catch (err) {
      console.error("Failed to start backup download:", err);
      toast.error("Failed to download backup");
      setDownloading(null);
    }
  };

  const startRestorePolling = () => {
    if (restorePollRef.current) clearInterval(restorePollRef.current);
    restorePollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get("/admin/backup/restore-progress", { _noToast: true } as any);
        if (data.active) {
          setRestorePercent(data.percent || 0);
          setRestorePhase(data.phase || "");
        }
      } catch {
        // ignore polling errors
      }
    }, 1000);
  };

  const stopRestorePolling = () => {
    if (restorePollRef.current) {
      clearInterval(restorePollRef.current);
      restorePollRef.current = null;
    }
  };

  const handleRestore = async (filename: string) => {
    setRestoring(true);
    setRestoreStatus("loading");
    setRestoreFilename(filename);
    setRestoreMessage(`Restoring database from "${filename}"...`);
    setRestoreDetails("");
    setRestorePercent(0);
    setRestorePhase("preparing");
    setConfirmRestore(null);
    startRestorePolling();

    try {
      const { data } = await api.post("/admin/backup/restore", { filename });
      stopRestorePolling();
      setRestorePercent(100);
      setRestoreStatus("success");
      setRestoreMessage(data.message || "Backup restored successfully");
      const detailsParts = [`Restored from: ${data.filename || filename}`];
      if (data.restoredFiles) {
        detailsParts.push(`Files restored: ${data.fileCount}`);
      }
      setRestoreDetails(detailsParts.join(" • "));
      toast.success("Backup restored successfully");
      fetchBackups();
    } catch (err: any) {
      stopRestorePolling();
      setRestoreStatus("error");
      const errMsg = err?.response?.data?.error || "Failed to restore backup";
      const errDetails = err?.response?.data?.details || "";
      setRestoreMessage(errMsg);
      setRestoreDetails(errDetails);
    } finally {
      setRestoring(false);
    }
  };

  const closeRestoreModal = () => {
    stopRestorePolling();
    setRestoreStatus("idle");
    setRestoreMessage("");
    setRestoreDetails("");
    setRestoreFilename("");
    setRestorePercent(0);
    setRestorePhase("");
  };

  const handleDelete = async (filename: string) => {
    setDeleting(filename);
    try {
      await api.delete(`/admin/backup/${filename}`);
      toast.success("Backup deleted");
      setConfirmDelete(null);
      fetchBackups();
    } catch {
      toast.error("Failed to delete backup");
    } finally {
      setDeleting(null);
    }
  };

  const startUpload = async (file: File) => {
    if (!file.name.endsWith(".sql") && !file.name.endsWith(".tar.gz")) {
      toast.error("Only .sql and .tar.gz backup files are allowed");
      return;
    }
    setUploading(true);
    setUploadError(false);
    setUploadProgress({ percent: 0, speedMBps: 0, uploadedMB: 0, totalMB: file.size / (1024 * 1024) });
    const startTime = Date.now();
    abortControllerRef.current = new AbortController();
    try {
      const fd = new FormData();
      fd.append("backupFile", file);
      const { data } = await api.post("/admin/backup/upload", fd, {
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          const uploaded = progressEvent.loaded || 0;
          const total = progressEvent.total || file.size;
          const percent = total > 0 ? Math.round((uploaded / total) * 100) : 0;
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speedMBps = elapsedSec > 0 ? (uploaded / (1024 * 1024)) / elapsedSec : 0;
          setUploadProgress({
            percent,
            speedMBps,
            uploadedMB: uploaded / (1024 * 1024),
            totalMB: total / (1024 * 1024),
          });
        },
      });
      toast.success(`Backup uploaded (${data.sizeMB} MB)`);
      fetchBackups();
      setLastFile(null);
      setUploadProgress(null);
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        toast("Upload cancelled");
        setUploadProgress(null);
      } else {
        setUploadError(true);
        toast.error(err?.response?.data?.error || "Failed to upload backup");
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLastFile(file);
    startUpload(file);
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const handleRetryUpload = () => {
    if (lastFile) startUpload(lastFile);
  };

  if (!canView) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-500 dark:text-gray-400">You do not have permission to view or manage backups.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <Database className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
              Backup &amp; Restore
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create, download, upload, and restore backups (database and files).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.tar.gz"
              className="hidden"
              onChange={handleUpload}
            />
            {canCreate && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Backup
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCreateBackup}
                  disabled={creating || creatingFull}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Database Only
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateFullBackup}
                  disabled={creating || creatingFull}
                >
                  {creatingFull ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  Create Full Backup
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Upload progress bar */}
        {(uploading || uploadError) && uploadProgress && (
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploadError ? "Upload failed" : "Uploading backup…"}
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm font-bold text-amber-500">{uploadProgress.percent}%</span>
                {uploading && (
                  <button
                    onClick={handleCancelUpload}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
                {uploadError && (
                  <button
                    onClick={handleRetryUpload}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${uploadError ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{uploadProgress.uploadedMB.toFixed(1)} MB / {uploadProgress.totalMB.toFixed(1)} MB</span>
              <span>{uploadProgress.speedMBps.toFixed(1)} MB/s</span>
            </div>
          </div>
        )}

        {/* Warning banner */}
        <div className="mb-6 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-start gap-2 sm:gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold mb-1">Warning</p>
            <p>Restoring a backup will <strong>overwrite all current data</strong> with the contents of the backup file. This action cannot be undone. Always create a backup before restoring.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Total Backups
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{backups.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <HardDrive className="w-4 h-4" />
              Total Size
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {backups.reduce((sum, b) => sum + parseFloat(b.sizeMB), 0).toFixed(2)} MB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Latest Backup
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {backups.length > 0
                ? new Date(backups[0].createdAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        {/* Backups list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Database className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No backups yet. Click &quot;Create Backup&quot; to get started.</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Filename</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Size</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Created</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filename} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {backup.type === "full" ? (
                          <Archive className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {backup.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        backup.type === "full"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {backup.type === "full" ? (
                          <><Package className="w-3 h-3" /> Full</>
                        ) : (
                          <><Database className="w-3 h-3" /> DB</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{backup.sizeMB} MB</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canView && (
                          <button
                            onClick={() => handleDownload(backup.filename)}
                            disabled={downloading === backup.filename}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                            title="Download"
                          >
                            {downloading === backup.filename ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {canRestore && (confirmRestore === backup.filename ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRestore(backup.filename)}
                              disabled={restoring}
                              className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                              {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmRestore(null)}
                              disabled={restoring}
                              className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestore(backup.filename)}
                            disabled={restoring}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                            title="Restore"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        ))}

                        {canDelete && (confirmDelete === backup.filename ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(backup.filename)}
                              disabled={deleting === backup.filename}
                              className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                              {deleting === backup.filename ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(backup.filename)}
                            disabled={restoring}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Centered Restore Status Modal */}
      {restoreStatus !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Loading state */}
            {restoreStatus === "loading" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Restoring Backup...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{restoreMessage}</p>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${restorePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{restorePhase || "processing"}...</span>
                  <span className="font-bold text-amber-500">{restorePercent}%</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Please do not close this window.</p>
              </div>
            )}

            {/* Success state */}
            {restoreStatus === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Restore Successful</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{restoreMessage}</p>
                {restoreDetails && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{restoreDetails}</p>
                )}
                <button
                  onClick={closeRestoreModal}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Error state */}
            {restoreStatus === "error" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Restore Failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">{restoreMessage}</p>
                {restoreDetails && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-left">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Error details:</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">{restoreDetails}</p>
                  </div>
                )}
                <button
                  onClick={closeRestoreModal}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
