"use client";

import { useState, useEffect } from "react";
import {
  Shield, Heart, ArrowLeft, Trash2, Save, AlertTriangle,
  CheckCircle, Eye, EyeOff, Info,
} from "lucide-react";
import { Button } from "@/components/common";
import { healthService, type HealthInfoData } from "@/services/health";
import { toast } from "sonner";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";

export default function HealthInfoPage() {
  const [data, setData] = useState<HealthInfoData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    healthService.getMy().then(({ data: res }) => {
      if (res.healthInfo) setData(res.healthInfo);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await healthService.save(data);
      toast.success("Health information saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove all health information? This cannot be undone.")) return;
    try {
      await healthService.delete();
      setData({});
      toast.success("Health information removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const SelectField = ({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{label}</label>
      <select name={name} value={(data as any)[name] || ""} onChange={handleChange}
        className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
        <option value="">{t('common.preferNotToAnswer')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const yesNoOptions = [
    { value: "yes", label: t('common.yes') },
    { value: "no", label: t('common.no') },
  ];

  const statusOptions = [
    { value: "positive", label: "Positive" },
    { value: "negative", label: "Negative" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-blur-image flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-blur-image">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings" className="p-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">{t('settings.healthInfo')}</h1>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{t('settings.healthInfoDesc')}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('register.step10.importantDisclaimer')}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {t('register.step10.disclaimerText')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 shadow-card p-6 space-y-6">
          {/* HIV Status */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-charcoal-400" /> {t('register.step10.hivStatus')}
            </h3>
            <SelectField name="hivStatus" label={t('register.step10.yourHivStatus')} options={statusOptions} />
          </div>

          {/* STDs */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t('register.step10.stds')}</h3>
            <div className="space-y-3">
              <SelectField name="stdStatus" label={t('register.step10.doYouHaveStds')} options={yesNoOptions} />
              {data.stdStatus === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t('register.step10.pleaseSpecify')}</label>
                  <input name="stdDetails" value={data.stdDetails || ""} onChange={handleChange}
                    placeholder={t('register.step10.stdPlaceholder')}
                    className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              )}
            </div>
          </div>

          {/* Hereditary */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t('register.step10.hereditary')}</h3>
            <div className="space-y-3">
              <SelectField name="hereditaryDiseases" label={t('register.step10.doYouHaveHereditary')} options={yesNoOptions} />
              {data.hereditaryDiseases === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t('register.step10.pleaseSpecify')}</label>
                  <input name="hereditaryDetails" value={data.hereditaryDetails || ""} onChange={handleChange}
                    placeholder={t('register.step10.hereditaryPlaceholder')}
                    className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              )}
            </div>
          </div>

          {/* Chronic */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t('register.step10.chronic')}</h3>
            <div className="space-y-3">
              <SelectField name="chronicConditions" label={t('register.step10.doYouHaveChronic')} options={yesNoOptions} />
              {data.chronicConditions === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t('register.step10.pleaseSpecify')}</label>
                  <input name="chronicDetails" value={data.chronicDetails || ""} onChange={handleChange}
                    placeholder={t('register.step10.chronicPlaceholder')}
                    className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              )}
            </div>
          </div>

          {/* Disabilities */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t('register.step10.disabilities')}</h3>
            <div className="space-y-3">
              <SelectField name="disabilities" label={t('register.step10.doYouHaveDisabilities')} options={yesNoOptions} />
              {data.disabilities === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t('register.step10.pleaseSpecify')}</label>
                  <input name="disabilityDetails" value={data.disabilityDetails || ""} onChange={handleChange}
                    placeholder={t('register.step10.disabilityPlaceholder')}
                    className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              )}
            </div>
          </div>

          {/* Other */}
          <div className="pb-4 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t('register.step10.otherConditions')}</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t('register.step10.otherConditionsLabel')}</label>
              <textarea name="otherConditions" value={data.otherConditions || ""} onChange={handleChange}
                placeholder={t('register.step10.otherConditionsPlaceholder')}
                rows={3}
                className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
            </div>
          </div>

          {/* Matching Preferences */}
          <div className="bg-accent/5 dark:bg-accent/10 rounded-xl p-4 border border-accent/20">
            <h3 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">Matching Preferences</h3>

            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input type="checkbox" name="shareWithMatches" checked={data.shareWithMatches || false} onChange={handleChange}
                className="mt-0.5 rounded border-charcoal-300 text-accent focus:ring-accent/30" />
              <div>
                <p className="text-sm font-medium text-charcoal-900 dark:text-white">Share with potential matches</p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Only visible to people who have also shared their health info</p>
              </div>
            </label>

            {data.shareWithMatches && (
              <div className="space-y-3">
                <select name="hivMatchPreference" value={data.hivMatchPreference || "any"} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="any">HIV — No preference</option>
                  <option value="disclosed">HIV — Only show people who've disclosed</option>
                  <option value="matching">HIV — Only show compatible status</option>
                </select>
                <select name="stdMatchPreference" value={data.stdMatchPreference || "any"} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="any">STDs — No preference</option>
                  <option value="disclosed">STDs — Only show people who've disclosed</option>
                  <option value="matching">STDs — Only show compatible status</option>
                </select>
                <select name="hereditaryMatchPreference" value={data.hereditaryMatchPreference || "any"} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="any">Hereditary diseases — No preference</option>
                  <option value="disclosed">Hereditary — Only show people who've disclosed</option>
                  <option value="matching">Hereditary — Only show compatible status</option>
                </select>
                <select name="healthMatchPreference" value={data.healthMatchPreference || "any"} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="any">Other conditions — No preference</option>
                  <option value="disclosed">Other conditions — Only show people who've shared</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} variant="primary" className="flex-1" loading={saving}>
              <Save className="w-4 h-4 mr-2" /> {t('common.save')}
            </Button>
            <Button onClick={handleDelete} variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
