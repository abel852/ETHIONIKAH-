"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, MessageSquare, Clock, CheckCheck,
  X, Send, AlertCircle, User,
} from "lucide-react";
import { Button, Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responseModal, setResponseModal] = useState<any>(null);
  const [responseText, setResponseText] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getComplaints(statusFilter !== "all" ? statusFilter : undefined);
      setComplaints(data.complaints);
    } catch { toast.error("Failed to fetch complaints"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  const filtered = complaints.filter((c) =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress" || c.status === "investigating").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const handleRespond = async () => {
    if (!responseModal || !responseText) return;
    try {
      await adminService.respondToComplaint(responseModal, responseText, "resolved");
      toast.success("Response sent");
      setResponseModal(null);
      setResponseText("");
      fetchComplaints();
    } catch { toast.error("Failed to respond"); }
  };

  const handleClose = async (id: string) => {
    try {
      await adminService.closeComplaint(id);
      toast.success("Complaint closed");
      fetchComplaints();
    } catch { toast.error("Failed to close"); }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Complaints</h1>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Manage and respond to user complaints</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Complaints", value: stats.total, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Open", value: stats.open, icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
          { label: "In Progress", value: stats.inProgress, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
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
              placeholder="Search complaints..."
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
            <option value="investigating">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckCheck className="w-12 h-12 text-charcoal-200 dark:text-charcoal-700 mx-auto mb-3" />
            <p className="text-sm text-charcoal-400">No complaints found</p>
          </div>
        </Card>
      ) : filtered.map((complaint: any, i: number) => (
        <motion.div key={complaint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card className="mb-4">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(complaint.user?.firstName || "U").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal-900 dark:text-white text-sm">{complaint.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        complaint.status === "open" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                        complaint.status === "investigating" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                        "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      }`}>{complaint.status}</span>
                    </div>
                    <p className="text-xs text-charcoal-400 mb-1">
                      {complaint.user?.firstName} {complaint.user?.lastName} &middot; {complaint.user?.email}
                    </p>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-300 bg-charcoal-50 dark:bg-charcoal-700/30 p-3 rounded-xl mb-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-charcoal-400">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(complaint.createdAt)}
                    </div>
                  </div>
                </div>
                {complaint.adminResponse && (
                  <div className="text-xs text-accent-dark dark:text-accent-light bg-accent/5 dark:bg-accent/10 px-3 py-2 rounded-lg flex items-start gap-2">
                    <Send className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Response: {complaint.adminResponse}</span>
                  </div>
                )}
              </div>
              {complaint.status !== "resolved" && (
                <div className="flex items-center gap-2 lg:flex-col shrink-0">
                  <Button variant="primary" size="sm" onClick={() => setResponseModal(complaint.id)}>
                    <Send className="w-4 h-4 mr-1.5" />Respond
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleClose(complaint.id)}>
                    <X className="w-4 h-4 mr-1.5" />Close
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setResponseModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white">Respond to Complaint</h3>
                <p className="text-sm text-charcoal-400">This will mark the complaint as resolved</p>
              </div>
            </div>
            <div className="mb-4">
              <textarea
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response..."
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setResponseModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleRespond}>Send Response</Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
