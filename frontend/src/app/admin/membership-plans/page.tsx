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

export default function MembershipPlansPage() {
  const { t } = useI18n();
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
                  <div className={`w-10 h-10 rounded-xl ${plan.isActive ? "bg-accent/10" : "bg-charcoal-100 dark:bg-charcoal-800"} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${plan.isActive ? "text-accent" : "text-charcoal-400"}`} />
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
                <div className="flex flex-wrap gap-1">
                  {plan.features.slice(0, 4).map((f: string) => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-700/30 text-charcoal-600 dark:text-white/70">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                  {plan.features.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-700/30 text-charcoal-600 dark:text-white/70">
                      +{plan.features.length - 4} more
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-charcoal-100 dark:border-white/5">
                  <span className="text-[11px] text-charcoal-400">Type: <span className="font-medium text-charcoal-600 dark:text-white/80 capitalize">{plan.planType}</span></span>
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
                <div className={`w-10 h-10 rounded-xl ${pkg.isActive ? "bg-purple-50 dark:bg-purple-500/10" : "bg-charcoal-100 dark:bg-charcoal-800"} flex items-center justify-center`}>
                  <CreditCard className={`w-5 h-5 ${pkg.isActive ? "text-purple-500" : "text-charcoal-400"}`} />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4">{plan ? "Edit Plan" : "Add Plan"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Key (unique)</label>
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!plan}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white disabled:opacity-50"
                placeholder="gold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
                placeholder="Gold Membership"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              placeholder="Unlimited messaging and advanced features"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Duration (days)</label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Plan Type</label>
              <select
                value={form.planType}
                onChange={(e) => setForm({ ...form, planType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              >
                <option value="free">Free</option>
                <option value="subscription">Subscription</option>
                <option value="verification">Verification</option>
                <option value="boost">Boost</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Features (comma-separated)</label>
            <input
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              placeholder="unlimited_messaging, advanced_search, view_visitors"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm text-charcoal-700 dark:text-white/80">Active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors">
              {plan ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 text-charcoal-600 dark:text-white/80 text-sm hover:bg-charcoal-50 dark:hover:bg-charcoal-700/30 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreditFormModal({ pkg, onSave, onClose }: { pkg: any; onSave: (data: any) => void; onClose: () => void }) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4">{pkg ? "Edit Package" : "Add Package"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Key (unique)</label>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!pkg}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white disabled:opacity-50"
              placeholder="credit_1"
              required
            />
          </div>
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              placeholder="1 Contact Credit"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Credits</label>
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
                min={1}
                required
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm text-charcoal-700 dark:text-white/80">Active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors">
              {pkg ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 text-charcoal-600 dark:text-white/80 text-sm hover:bg-charcoal-50 dark:hover:bg-charcoal-700/30 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
