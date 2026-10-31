"use client";

import { useState, useEffect } from "react";
import {
  Crown, Gem, CreditCard, Zap, Shield, Plus, Pencil, Trash2,
  Check, X, DollarSign, Calendar, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { useI18n } from "@/context/I18nContext";

const glass = "bg-white dark:bg-white/[0.06] backdrop-blur-xl border-charcoal-100 dark:border-white/10";

const planTypeIcons: Record<string, any> = {
  free: Shield,
  subscription: Crown,
  verification: Shield,
  boost: Zap,
  credit: CreditCard,
};

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function MembershipPlansPage() {
  const { t } = useI18n();
  const isDark = useIsDarkMode();
  const [plans, setPlans] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showCreditForm, setShowCreditForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([
        adminService.getMembershipPlans(),
        adminService.getCreditPackages(),
      ]);
      setPlans(p.data.data || []);
      setCreditPackages(c.data.data || []);
    } catch (e) {
      console.error("Failed to load plans:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (data: any) => {
    try {
      if (editingPlan) {
        await adminService.updateMembershipPlan(editingPlan.id, data);
      } else {
        await adminService.createMembershipPlan(data);
      }
      setShowPlanForm(false);
      setEditingPlan(null);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to save plan");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    try {
      await adminService.deleteMembershipPlan(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete plan");
    }
  };

  const handleTogglePlan = async (plan: any) => {
    try {
      await adminService.updateMembershipPlan(plan.id, { isActive: !plan.isActive });
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to toggle plan");
    }
  };

  const handleSaveCredit = async (data: any) => {
    try {
      if (editingCredit) {
        await adminService.updateCreditPackage(editingCredit.id, data);
      } else {
        await adminService.createCreditPackage(data);
      }
      setShowCreditForm(false);
      setEditingCredit(null);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to save package");
    }
  };

  const handleDeleteCredit = async (id: string) => {
    if (!confirm("Delete this credit package?")) return;
    try {
      await adminService.deleteCreditPackage(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete package");
    }
  };

  const handleToggleCredit = async (pkg: any) => {
    try {
      await adminService.updateCreditPackage(pkg.id, { isActive: !pkg.isActive });
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to toggle package");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-40 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.plans.title')}</h1>
        <p className="text-sm text-charcoal-500 dark:text-white/60 mt-1">{t('admin.plans.subtitle')}</p>
      </div>

      {/* Membership Plans Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white">Plans & Pricing</h2>
          <button
            onClick={() => { setEditingPlan(null); setShowPlanForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = planTypeIcons[plan.planType] || Crown;
            return (
              <Card key={plan.id} hover={false} className={glass}>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: plan.isActive
                        ? "rgba(212, 175, 55, 0.15)"
                        : isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "#f3f4f6",
                    }}
                  >
                    <Icon className={`w-5 h-5 ${plan.isActive ? "text-accent" : isDark ? "text-white/40" : "text-charcoal-400"}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePlan(plan)}
                      className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                      title={plan.isActive ? "Disable" : "Enable"}
                    >
                      {plan.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-charcoal-400" />}
                    </button>
                    <button
                      onClick={() => { setEditingPlan(plan); setShowPlanForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-charcoal-500" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-charcoal-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-charcoal-400 dark:text-white/60 mb-3 line-clamp-2">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-charcoal-900 dark:text-white">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-charcoal-400">{plan.currency}</span>
                  {plan.durationDays > 0 && <span className="text-xs text-charcoal-400 ml-1">/ {plan.durationDays} days</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.slice(0, 4).map((f: string) => (
                    <span
                      key={f}
                      className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors"
                      style={{
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
                        color: isDark ? "#ffffff" : "#374151",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e5e7eb",
                      }}
                    >
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                  {plan.features.length > 4 && (
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors"
                      style={{
                        backgroundColor: isDark ? "rgba(212, 175, 55, 0.18)" : "rgba(212, 175, 55, 0.15)",
                        color: isDark ? "#FCD34D" : "#B8860B",
                        border: isDark ? "1px solid rgba(212, 175, 55, 0.35)" : "1px solid rgba(212, 175, 55, 0.4)",
                      }}
                    >
                      +{plan.features.length - 4} more
                    </span>
                  )}
                </div>
                <div
                  className="mt-3 pt-3 border-t transition-colors"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6" }}
                >
                  <span className="text-[11px]" style={{ color: isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280" }}>
                    Type: <span className="font-medium capitalize" style={{ color: isDark ? "#ffffff" : "#111111" }}>{plan.planType}</span>
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Credit Packages Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white">Contact Credit Packages</h2>
          <button
            onClick={() => { setEditingCredit(null); setShowCreditForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Package
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} hover={false} className={glass}>
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: pkg.isActive
                      ? isDark ? "rgba(168, 85, 247, 0.15)" : "#faf5ff"
                      : isDark ? "rgba(255, 255, 255, 0.06)" : "#f3f4f6",
                  }}
                >
                  <CreditCard className={`w-5 h-5 ${pkg.isActive ? "text-purple-500" : isDark ? "text-white/40" : "text-charcoal-400"}`} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleCredit(pkg)}
                    className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                  >
                    {pkg.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-charcoal-400" />}
                  </button>
                  <button
                    onClick={() => { setEditingCredit(pkg); setShowCreditForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-charcoal-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteCredit(pkg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-charcoal-900 dark:text-white">{pkg.credits}</span>
                <span className="text-sm text-charcoal-400">credits</span>
              </div>
              <p className="text-lg font-bold text-accent">{pkg.price.toLocaleString()} {pkg.currency}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Plan Form Modal */}
      {showPlanForm && (
        <PlanFormModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => { setShowPlanForm(false); setEditingPlan(null); }}
        />
      )}

      {/* Credit Package Form Modal */}
      {showCreditForm && (
        <CreditFormModal
          pkg={editingCredit}
          onSave={handleSaveCredit}
          onClose={() => { setShowCreditForm(false); setEditingCredit(null); }}
        />
      )}
    </AdminLayout>
  );
}

function PlanFormModal({ plan, onSave, onClose }: { plan: any; onSave: (data: any) => void; onClose: () => void }) {
  const isDark = useIsDarkMode();
  const [form, setForm] = useState({
    key: plan?.key || "",
    name: plan?.name || "",
    description: plan?.description || "",
    price: plan?.price ?? 0,
    currency: plan?.currency || "Birr",
    durationDays: plan?.durationDays ?? 0,
    planType: plan?.planType || "subscription",
    features: plan?.features?.join(", ") || "",
    isActive: plan?.isActive ?? true,
    sortOrder: plan?.sortOrder ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      sortOrder: Number(form.sortOrder),
      features: form.features.split(",").map((f: string) => f.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transition-colors"
        style={{
          backgroundColor: isDark ? "#151028" : "#ffffff",
          color: isDark ? "#ffffff" : "#111111",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: isDark ? "#ffffff" : "#111111" }}>
          {plan ? "Edit Plan" : "Add Plan"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Key (unique)
              </label>
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!plan}
                className="w-full px-3 py-2 rounded-lg text-sm disabled:opacity-50 focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
                placeholder="gold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
                placeholder="Gold Membership"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
              Description
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
              style={{
                backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                color: isDark ? "#ffffff" : "#111111",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
              }}
              placeholder="Unlimited messaging and advanced features"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Price
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Currency
              </label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Duration (days)
              </label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Plan Type
              </label>
              <select
                value={form.planType}
                onChange={(e) => setForm({ ...form, planType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
              >
                <option value="free" style={{ backgroundColor: isDark ? "#151028" : "#ffffff", color: isDark ? "#ffffff" : "#111111" }}>Free</option>
                <option value="subscription" style={{ backgroundColor: isDark ? "#151028" : "#ffffff", color: isDark ? "#ffffff" : "#111111" }}>Subscription</option>
                <option value="verification" style={{ backgroundColor: isDark ? "#151028" : "#ffffff", color: isDark ? "#ffffff" : "#111111" }}>Verification</option>
                <option value="boost" style={{ backgroundColor: isDark ? "#151028" : "#ffffff", color: isDark ? "#ffffff" : "#111111" }}>Boost</option>
                <option value="credit" style={{ backgroundColor: isDark ? "#151028" : "#ffffff", color: isDark ? "#ffffff" : "#111111" }}>Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Features (comma-separated)
              </label>
              <span className="text-[11px] font-semibold" style={{ color: isDark ? "#FCD34D" : "#B8860B" }}>
                Click tags below to add/remove
              </span>
            </div>
            <input
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
              style={{
                backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                color: isDark ? "#ffffff" : "#111111",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
              }}
              placeholder="unlimited_messaging, advanced_search, view_visitors"
            />
            <div
              className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl transition-colors"
              style={{
                backgroundColor: isDark ? "rgba(26, 18, 53, 0.7)" : "#f3f4f6",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e5e7eb",
              }}
            >
              {[
                { key: "unlimited_messaging", label: "Unlimited Messaging" },
                { key: "unlimited_browsing", label: "Unlimited Browsing" },
                { key: "advanced_search", label: "Advanced Search" },
                { key: "view_visitors", label: "View Visitors" },
                { key: "view_likes", label: "View Likes" },
                { key: "priority_visibility", label: "Priority Visibility" },
                { key: "last_seen_visibility", label: "Last Seen Visibility" },
                { key: "polygamy_chat", label: "Polygamy Chat" },
                { key: "verified_badge", label: "Verified Badge" },
                { key: "featured_placement", label: "Featured Placement" },
                { key: "top_search_ranking", label: "Top Search Ranking" },
                { key: "vip_badge", label: "VIP Badge" },
                { key: "no_credit_charges", label: "No Credit Charges" },
              ].map((item) => {
                const currentFeatures = (form.features || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                const isSelected = currentFeatures.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const updated = currentFeatures.filter((f: string) => f !== item.key);
                        setForm({ ...form, features: updated.join(", ") });
                      } else {
                        const updated = [...currentFeatures, item.key];
                        setForm({ ...form, features: updated.join(", ") });
                      }
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer"
                    style={
                      isSelected
                        ? {
                            backgroundColor: isDark ? "rgba(212, 175, 55, 0.25)" : "rgba(212, 175, 55, 0.2)",
                            color: isDark ? "#FCD34D" : "#B8860B",
                            borderColor: "#D4AF37",
                            fontWeight: 600,
                          }
                        : {
                            backgroundColor: isDark ? "#221a42" : "#ffffff",
                            color: isDark ? "#ffffff" : "#374151",
                            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#d1d5db",
                          }
                    }
                  >
                    {isSelected ? "✓ " : "+ "}{item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#374151" }}>
              Active
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
              style={{
                backgroundColor: "#D4AF37",
                color: isDark ? "#111111" : "#ffffff",
              }}
            >
              {plan ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              style={{
                backgroundColor: isDark ? "transparent" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                color: isDark ? "rgba(255,255,255,0.8)" : "#4b5563",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreditFormModal({ pkg, onSave, onClose }: { pkg: any; onSave: (data: any) => void; onClose: () => void }) {
  const isDark = useIsDarkMode();
  const [form, setForm] = useState({
    key: pkg?.key || "",
    name: pkg?.name || "",
    credits: pkg?.credits ?? 1,
    price: pkg?.price ?? 0,
    currency: pkg?.currency || "Birr",
    isActive: pkg?.isActive ?? true,
    sortOrder: pkg?.sortOrder ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      credits: Number(form.credits),
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl transition-colors"
        style={{
          backgroundColor: isDark ? "#151028" : "#ffffff",
          color: isDark ? "#ffffff" : "#111111",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: isDark ? "#ffffff" : "#111111" }}>
          {pkg ? "Edit Package" : "Add Package"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
              Key (unique)
            </label>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!pkg}
              className="w-full px-3 py-2 rounded-lg text-sm disabled:opacity-50 focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
              style={{
                backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                color: isDark ? "#ffffff" : "#111111",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
              }}
              placeholder="credit_1"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
              style={{
                backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                color: isDark ? "#ffffff" : "#111111",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
              }}
              placeholder="1 Contact Credit"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Credits
              </label>
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
                min={1}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                Price
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-accent/40 focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "#1e1738" : "#f9fafb",
                  color: isDark ? "#ffffff" : "#111111",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                }}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm font-medium" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#374151" }}>
              Active
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
              style={{
                backgroundColor: "#D4AF37",
                color: isDark ? "#111111" : "#ffffff",
              }}
            >
              {pkg ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              style={{
                backgroundColor: isDark ? "transparent" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #d1d5db",
                color: isDark ? "rgba(255,255,255,0.8)" : "#4b5563",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
