"use client";

import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Smartphone, Banknote, Building2, Wallet,
} from "lucide-react";
import { Card } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import { useI18n } from "@/context/I18nContext";

const glass = "bg-white dark:bg-white/[0.06] backdrop-blur-xl border-charcoal-100 dark:border-white/10";

const methodIcons: Record<string, any> = {
  telebirr: Smartphone,
  cbe_birr: Wallet,
  bank_transfer: Building2,
};

export default function PaymentMethodsPage() {
  const { t } = useI18n();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await adminService.getPaymentMethods();
      setMethods(res.data.data || []);
    } catch (e) {
      console.error("Failed to load payment methods:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await adminService.updatePaymentMethod(editing.id, data);
      } else {
        await adminService.createPaymentMethod(data);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to save payment method");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment method?")) return;
    try {
      await adminService.deletePaymentMethod(id);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete");
    }
  };

  const handleToggle = async (method: any) => {
    try {
      await adminService.updatePaymentMethod(method.id, { isActive: !method.isActive });
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to toggle");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('admin.paymentMethods.title')}</h1>
        <p className="text-sm text-charcoal-500 dark:text-white/60 mt-1">{t('admin.paymentMethods.subtitle')}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white">Active Methods</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => {
          const Icon = methodIcons[method.key] || Banknote;
          return (
            <Card key={method.id} hover={false} className={glass}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${method.isActive ? "bg-accent/10" : "bg-charcoal-100 dark:bg-charcoal-800"} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${method.isActive ? "text-accent" : "text-charcoal-400"}`} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(method)}
                    className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                    title={method.isActive ? "Disable" : "Enable"}
                  >
                    {method.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-charcoal-400" />}
                  </button>
                  <button
                    onClick={() => { setEditing(method); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-charcoal-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white mb-1">{method.name}</h3>
              {method.instructions && (
                <p className="text-xs text-charcoal-400 dark:text-white/60 mb-2">{method.instructions}</p>
              )}
              {method.accountInfo && (
                <div className="mt-2 pt-2 border-t border-charcoal-100 dark:border-white/5">
                  <p className="text-[11px] text-charcoal-400 mb-0.5">Account Info</p>
                  <p className="text-xs font-mono text-charcoal-700 dark:text-white/80">{method.accountInfo}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showForm && (
        <MethodFormModal
          method={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </AdminLayout>
  );
}

function MethodFormModal({ method, onSave, onClose }: { method: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    key: method?.key || "",
    name: method?.name || "",
    instructions: method?.instructions || "",
    accountInfo: method?.accountInfo || "",
    isActive: method?.isActive ?? true,
    sortOrder: method?.sortOrder ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, sortOrder: Number(form.sortOrder) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-4">{method ? "Edit Method" : "Add Method"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Key (unique)</label>
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                disabled={!!method}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white disabled:opacity-50"
                placeholder="telebirr"
                required
              />
            </div>
            <div>
              <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
                placeholder="Telebirr"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white resize-none"
              rows={3}
              placeholder="Send payment to the number below..."
            />
          </div>
          <div>
            <label className="text-xs text-charcoal-500 dark:text-white/60 mb-1 block">Account Info</label>
            <input
              value={form.accountInfo}
              onChange={(e) => setForm({ ...form, accountInfo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-200 dark:border-white/10 bg-transparent text-sm text-charcoal-900 dark:text-white"
              placeholder="Phone: 0912345678"
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
              {method ? "Update" : "Create"}
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
