"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, AlertTriangle, CheckCheck, X, Ban,
  MessageSquare, Clock, UserX, Eye,
} from "lucide-react";
import { Button, Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionModal, setActionModal] = useState<{ id: string; type: string } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getReports(statusFilter !== "all" ? statusFilter : undefined);
      setReports(data.reports);
    } catch { toast.error("Failed to fetch reports"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [statusFilter]);

  const filtered = reports.filter((r) =>
    !search || r.reason?.toLowerCase().includes(search.toLowerCase()) ||
    r.reportedUser?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    r.reporter?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    investigating: reports.filter((r) => r.status === "investigating").length,
    resolved: reports.filter((r) => r.status === "resolved" || r.status === "dismissed").length,
  };

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "resolve") {
        await adminService.updateReportStatus(actionModal.id, "resolved", adminNote);
        toast.success("Report resolved");
      } else if (actionModal.type === "dismiss") {
        await adminService.dismissReport(actionModal.id, adminNote);
        toast.success("Report dismissed");
      }
      setActionModal(null);
      setAdminNote("");
      fetchReports();
    } catch { toast.error("Action failed"); }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Content Moderation</h1>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Review and moderate user-reported content</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Reports", value: stats.total, icon: AlertTriangle, color: "text-charcoal-500", bg: "bg-charcoal-50 dark:bg-charcoal-700" },
          { label: "Open", value: stats.open, icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { label: "In Review", value: stats.investigating, icon: Eye, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Resolved", value: stats.resolved, icon: CheckCheck, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover={false}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-charcoal-400">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckCheck className="w-12 h-12 text-charcoal-200 dark:text-charcoal-700 mx-auto mb-3" />
            <p className="text-sm text-charcoal-400">No reports found</p>
          </div>
        </Card>
      ) : filtered.map((report: any, i: number) => (
        <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card className="mb-4">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    report.status === "open" ? "bg-red-50 dark:bg-red-500/10" :
                    report.status === "investigating" ? "bg-amber-50 dark:bg-amber-500/10" :
                    "bg-green-50 dark:bg-green-500/10"
                  }`}>
                    <AlertTriangle className={`w-4.5 h-4.5 ${
                      report.status === "open" ? "text-red-500" :
                      report.status === "investigating" ? "text-amber-500" :
                      "text-green-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal-900 dark:text-white text-sm">{report.reason}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        report.status === "open" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                        report.status === "investigating" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                        "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      }`}>{report.status}</span>
                    </div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mb-3">{report.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Reported by: {report.reporter?.firstName} {report.reporter?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserX className="w-3 h-3" />
                        Against: {report.reportedUser?.firstName} {report.reportedUser?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                {report.adminNote && (
                  <div className="text-xs text-charcoal-400 bg-charcoal-50 dark:bg-charcoal-700/30 px-3 py-2 rounded-lg">
                    Admin note: {report.adminNote}
                  </div>
                )}
              </div>
              {(report.status === "open" || report.status === "investigating") && (
                <div className="flex items-center gap-2 lg:flex-col shrink-0">
                  <Button variant="primary" size="sm" onClick={() => setActionModal({ id: report.id, type: "resolve" })}>
                    <CheckCheck className="w-4 h-4 mr-1.5" />Resolve
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setActionModal({ id: report.id, type: "dismiss" })}>
                    <X className="w-4 h-4 mr-1.5" />Dismiss
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                actionModal.type === "resolve" ? "bg-green-500/10" : "bg-charcoal-500/10"
              }`}>
                {actionModal.type === "resolve" ? (
                  <CheckCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-charcoal-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white capitalize">{actionModal.type} Report</h3>
                <p className="text-sm text-charcoal-400">Add a note (optional)</p>
              </div>
            </div>
            <div className="mb-4">
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter admin note..."
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant={actionModal.type === "resolve" ? "primary" : "secondary"} onClick={handleAction}>
                {actionModal.type === "resolve" ? "Resolve Report" : "Dismiss Report"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
