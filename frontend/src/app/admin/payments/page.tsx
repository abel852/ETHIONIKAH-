"use client";

import { useState, useEffect } from "react";
import {
  Search, CreditCard, DollarSign, TrendingUp, Clock,
  CheckCircle, XCircle, Eye, Receipt, Wallet, Shield,
  ScanSearch, AlertTriangle, Info, User, RefreshCw,
} from "lucide-react";
import { Card, Button } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { formatDate, formatRemaining, mediaUrl } from "@/lib/utils";
import { Modal } from "@/components/common";
import toast from "react-hot-toast";
import { useI18n } from "@/context/I18nContext";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  approved: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const planIcons: Record<string, any> = {
  credit: Wallet,
  gold: CreditCard,
  platinum: Shield,
  boost: TrendingUp,
  verification: Shield,
};

export default function AdminPaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [now, setNow] = useState(Date.now());

  // Transaction checker state
  const [txQuery, setTxQuery] = useState("");
  const [txResult, setTxResult] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.planType = planFilter;
      if (search) params.search = search;

      const [payRes, statsRes] = await Promise.all([
        adminService.getAdminPayments(params),
        adminService.getPaymentStats(),
      ]);
      setPayments(payRes.data.data || []);
      setTotalPages(payRes.data.pagination?.totalPages || 1);
      setStats(statsRes.data.data || {});
    } catch {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, planFilter, search, page]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await adminService.approvePayment(id, adminNote);
      toast.success("Payment approved and service activated");
      setSelected(null);
      setAdminNote("");
      fetchData();
    } catch {
      toast.error("Failed to approve payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (id: string) => {
    setProcessing(true);
    try {
      await adminService.reactivatePayment(id);
      toast.success("Payment reactivated — credits/benefits applied");
      setSelected(null);
      fetchData();
    } catch {
      toast.error("Failed to reactivate payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(true);
    try {
      await adminService.rejectPayment(id, adminNote);
      toast.success("Payment rejected");
      setSelected(null);
      setAdminNote("");
      fetchData();
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyTransaction = async () => {
    if (!txQuery.trim() || txQuery.trim().length < 3) {
      setTxError("Enter at least 3 characters");
      return;
    }
    setTxLoading(true);
    setTxError("");
    setTxResult(null);
    try {
      const { data } = await adminService.verifyTransaction(txQuery.trim());
      setTxResult(data.data);
    } catch (err: any) {
      setTxError(err?.response?.data?.error || "Failed to verify transaction");
    } finally {
      setTxLoading(false);
    }
  };

  const verdictStyles: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
    blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    red: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
    amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    gray: { bg: "bg-gray-50 dark:bg-gray-500/10", text: "text-gray-700 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" },
  };

  const flagStyles: Record<string, { bg: string; text: string; icon: any }> = {
    critical: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", icon: AlertTriangle },
    warning: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
    info: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", icon: Info },
  };

  const statCards = [
    { label: "Total Revenue", value: `ETB ${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Pending", value: stats.pending ?? 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Approved", value: stats.approved ?? 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Rejected", value: stats.rejected ?? 0, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.payments.title')}</h1>
            <p className="text-sm text-charcoal-500 dark:text-white">{t('admin.payments.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Transaction Number Checker */}
      <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-charcoal-900 dark:text-white">Transaction Number Checker</h2>
            <p className="text-xs text-charcoal-400 dark:text-white">Verify if a payment reference is real, duplicate, or suspicious</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              placeholder="Enter transaction ID or reference number..."
              value={txQuery}
              onChange={(e) => setTxQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyTransaction()}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <Button
            variant="primary"
            loading={txLoading}
            onClick={handleVerifyTransaction}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ScanSearch className="w-4 h-4 mr-1.5" /> Verify
          </Button>
        </div>

        {txError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-3">
            {txError}
          </div>
        )}

        {txResult && (
          <div className="space-y-4">
            {/* Verdict Banner */}
            <div className={`p-4 rounded-xl border-2 ${verdictStyles[txResult.verdictColor]?.border || verdictStyles.gray.border} ${verdictStyles[txResult.verdictColor]?.bg || verdictStyles.gray.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {txResult.verdict === "not_found" ? (
                    <XCircle className={`w-8 h-8 ${verdictStyles[txResult.verdictColor]?.text || verdictStyles.gray.text}`} />
                  ) : txResult.verdict === "suspicious" ? (
                    <AlertTriangle className={`w-8 h-8 ${verdictStyles[txResult.verdictColor]?.text || verdictStyles.gray.text}`} />
                  ) : txResult.verdict === "verified" ? (
                    <CheckCircle className={`w-8 h-8 ${verdictStyles[txResult.verdictColor]?.text || verdictStyles.gray.text}`} />
                  ) : (
                    <ScanSearch className={`w-8 h-8 ${verdictStyles[txResult.verdictColor]?.text || verdictStyles.gray.text}`} />
                  )}
                  <div>
                    <p className={`font-bold text-lg ${verdictStyles[txResult.verdictColor]?.text || verdictStyles.gray.text}`}>
                      {txResult.verdictLabel}
                    </p>
                    <p className="text-xs text-charcoal-400 dark:text-white">
                      {txResult.totalMatches} total match(es) · {txResult.exactMatches} exact match(es)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-charcoal-400 dark:text-white">Query</p>
                  <p className="text-sm font-mono font-medium text-charcoal-900 dark:text-white">{txResult.query}</p>
                </div>
              </div>
            </div>

            {/* Fraud Flags */}
            {txResult.flags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-charcoal-500 dark:text-white uppercase tracking-wider">Fraud Indicators</p>
                {txResult.flags.map((flag: any, i: number) => {
                  const style = flagStyles[flag.severity] || flagStyles.info;
                  const FlagIcon = style.icon;
                  return (
                    <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${style.bg} ${style.text}`}>
                      <FlagIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium capitalize">{flag.type.replace(/_/g, " ")}</p>
                        <p className="text-xs">{flag.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Matching Payments */}
            {txResult.payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-charcoal-500 dark:text-white uppercase tracking-wider">
                  Matching Payment{txResult.payments.length > 1 ? "s" : ""} ({txResult.payments.length})
                </p>
                {txResult.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border ${p.isExactMatch ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-500/5" : "border-charcoal-100 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-800/30"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {((p.user?.firstName || "U").charAt(0) + (p.user?.lastName || "").charAt(0)).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-charcoal-900 dark:text-white truncate">
                            {p.user?.firstName} {p.user?.lastName}
                            {p.isExactMatch && <span className="ml-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">EXACT MATCH</span>}
                          </p>
                          <p className="text-xs text-charcoal-400 dark:text-white truncate">{p.user?.email} · {p.user?.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || statusColors.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === "approved" ? "bg-green-500" : p.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`} />
                          {p.status}
                        </span>
                        <button
                          onClick={() => { setSelected(p); setAdminNote(p.adminNote || ""); }}
                          className="p-2.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-charcoal-400 dark:text-white">Plan:</span>{" "}
                        <span className="font-medium text-charcoal-900 dark:text-white capitalize">{p.planType}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-400 dark:text-white">Amount:</span>{" "}
                        <span className="font-medium text-charcoal-900 dark:text-white">{p.currency} {p.amount}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-400 dark:text-white">Method:</span>{" "}
                        <span className="font-medium text-charcoal-900 dark:text-white capitalize">{p.paymentMethod?.replace(/_/g, " ")}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-400 dark:text-white">Date:</span>{" "}
                        <span className="font-medium text-charcoal-900 dark:text-white">{formatDate(p.createdAt)}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <span className="text-charcoal-400 dark:text-white">Reference:</span>{" "}
                        <span className="font-mono font-medium text-charcoal-900 dark:text-white">{p.referenceNumber || "—"}</span>
                        {p.transactionId && (
                          <>
                            <span className="text-charcoal-400 dark:text-white ml-3">TxID:</span>{" "}
                            <span className="font-mono font-medium text-charcoal-900 dark:text-white">{p.transactionId}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {p.receiptUrl && (
                      <a href={mediaUrl(p.receiptUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-accent font-medium hover:underline">
                        <Receipt className="w-3.5 h-3.5" /> View Receipt
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {txResult.verdict === "not_found" && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-500/10 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No payments found with reference/transaction number containing <span className="font-mono font-medium">"{txResult.query}"</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This could mean the transaction number is invalid, or the user hasn't submitted a payment yet
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label}>
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-charcoal-400 dark:text-white">{stat.label}</p>
            </Card>
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === "all" ? "" : s); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (statusFilter === s || (s === "all" && !statusFilter))
                    ? "bg-accent text-white"
                    : "text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
                }`}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["", "credit", "gold", "platinum", "boost", "verification"].map((p) => (
              <button
                key={p || "all"}
                onClick={() => { setPlanFilter(p); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  planFilter === p
                    ? "bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-900"
                    : "text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
                }`}
              >
                {p ? p[0].toUpperCase() + p.slice(1) : "All Plans"}
              </button>
            ))}
          </div>
          <div className="relative lg:ml-auto w-full lg:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              placeholder="Search by name, email, reference..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>
      </Card>

      <Card padding="none" hover={false} className="relative z-10">
        <div className="overflow-x-auto" style={{ touchAction: 'pan-x pinch-zoom', pointerEvents: 'auto' }}>
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-charcoal-700 bg-charcoal-50/50 dark:bg-charcoal-800/50">
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">Reference</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Method</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">Membership</th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3.5 px-4 text-xs font-medium text-charcoal-400 dark:text-white uppercase tracking-wider sticky right-0 bg-charcoal-50/50 dark:bg-charcoal-800/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-sm text-charcoal-400 dark:text-white">No payments found</td></tr>
                ) : payments.map((p: any) => {
                  const PlanIcon = planIcons[p.planType] || CreditCard;
                  return (
                    <tr key={p.id}
                      onClick={() => { setSelected(p); setAdminNote(p.adminNote || ""); }}
                      className="border-b border-charcoal-50 dark:border-charcoal-700/50 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/20 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold">
                            {((p.user?.firstName || "U").charAt(0) + (p.user?.lastName || "").charAt(0)).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-charcoal-900 dark:text-white">{p.user?.firstName} {p.user?.lastName}</p>
                            <p className="text-xs text-charcoal-400 dark:text-white">{p.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-charcoal-50 dark:bg-charcoal-700 text-charcoal-700 dark:text-white">
                          <PlanIcon className="w-3 h-3" /> {p.planType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-charcoal-900 dark:text-white">ETB {p.amount}</td>
                      <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">{p.referenceNumber || "—"}</td>
                      <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white capitalize">{p.paymentMethod?.replace("_", " ")}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || statusColors.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === "approved" ? "bg-green-500" : p.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">
                        {p.status === "approved" && p.subscription?.endDate ? (
                          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Clock className="w-3 h-3" /> {formatRemaining(p.subscription.endDate, now)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-charcoal-500 dark:text-white hidden md:table-cell">{formatDate(p.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white dark:bg-charcoal-800/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelected(p); setAdminNote(p.adminNote || ""); }}
                          className="p-2.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal-100 dark:border-charcoal-700">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-sm text-charcoal-500 hover:text-charcoal-900 disabled:opacity-40">Previous</button>
            <span className="text-xs text-charcoal-400">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-sm text-charcoal-500 hover:text-charcoal-900 disabled:opacity-40">Next</button>
          </div>
        )}
      </Card>

      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => { setSelected(null); setAdminNote(""); }}
          title="Payment Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
                {((selected.user?.firstName || "U").charAt(0) + (selected.user?.lastName || "").charAt(0)).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-charcoal-900 dark:text-white">{selected.user?.firstName} {selected.user?.lastName}</p>
                <p className="text-sm text-charcoal-500 dark:text-white">{selected.user?.email}</p>
                <p className="text-xs text-charcoal-400 dark:text-white">{selected.user?.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-charcoal-50 dark:bg-charcoal-700/50 p-3 rounded-xl">
                <p className="text-xs text-charcoal-400 dark:text-white">Plan</p>
                <p className="font-semibold text-charcoal-900 dark:text-white capitalize">{selected.planType}</p>
              </div>
              <div className="bg-charcoal-50 dark:bg-charcoal-700/50 p-3 rounded-xl">
                <p className="text-xs text-charcoal-400 dark:text-white">Amount</p>
                <p className="font-semibold text-charcoal-900 dark:text-white">ETB {selected.amount}</p>
              </div>
              <div className="bg-charcoal-50 dark:bg-charcoal-700/50 p-3 rounded-xl">
                <p className="text-xs text-charcoal-400 dark:text-white">Method</p>
                <p className="font-semibold text-charcoal-900 dark:text-white capitalize">{selected.paymentMethod?.replace("_", " ")}</p>
              </div>
              <div className="bg-charcoal-50 dark:bg-charcoal-700/50 p-3 rounded-xl">
                <p className="text-xs text-charcoal-400 dark:text-white">Reference</p>
                <p className="font-semibold text-charcoal-900 dark:text-white">{selected.referenceNumber || "—"}</p>
              </div>
            </div>

            {selected.receiptUrl && (
              <div>
                <p className="text-xs text-charcoal-400 dark:text-white mb-2">Receipt</p>
                <a href={mediaUrl(selected.receiptUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20">
                  <Receipt className="w-4 h-4" /> View Receipt
                </a>
              </div>
            )}

            <div>
              <label className="block text-xs text-charcoal-400 dark:text-white mb-1.5">Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-xl text-sm text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Optional note for approval/rejection"
              />
            </div>

            {selected.status === "pending" ? (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  loading={processing}
                  onClick={() => handleApprove(selected.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  loading={processing}
                  onClick={() => handleReject(selected.id)}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>
            ) : (
              <div className="pt-2">
                <p className="text-sm text-charcoal-500 dark:text-white">This payment has already been {selected.status}.</p>
                {selected.verifiedAt && <p className="text-xs text-charcoal-400 dark:text-white mt-1">Verified at {formatDate(selected.verifiedAt)}</p>}
                {selected.adminNote && <p className="text-xs text-charcoal-400 dark:text-white mt-1">Note: {selected.adminNote}</p>}
                {selected.status === "approved" && (
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      loading={processing}
                      onClick={() => handleReactivate(selected.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" /> Reactivate (Re-apply Credits)
                    </Button>
                    <p className="text-xs text-charcoal-400 dark:text-white mt-1.5 text-center">Use this if the user didn't receive their credits/subscription after approval.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
