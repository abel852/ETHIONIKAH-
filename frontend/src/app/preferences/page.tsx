"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart, Save, ArrowLeft, ChevronRight, Sparkles, Filter,
  SlidersHorizontal, User, MapPin, GraduationCap, BookOpen,
  Users, Shield, DollarSign, CheckCircle2, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button, Input, Card, Badge } from "@/components/common";
import { profileService } from "@/services/profile";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";

export default function PreferencesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileService.getSpousePreference();
        const p = data.spousePreference || data;
        setFormData({
          preferredAgeMin: p.preferredAgeMin?.toString() ?? "22",
          preferredAgeMax: p.preferredAgeMax?.toString() ?? "35",
          preferredMaritalStatus: p.preferredMaritalStatus ?? "single_never",
          preferredEducationLevel: p.preferredEducationLevel ?? "bachelor",
          preferredLocation: p.preferredLocation ?? "Ethiopia",
          waliInvolvement: p.waliInvolvement ?? "preferred",
          polygamyPreference: p.polygamyPreference ?? "not_acceptable",
          mahrExpectation: p.mahrExpectation ?? "To be discussed",
          genderInteraction: p.genderInteraction ?? "moderate",
          preferredReligiousCommitment: p.preferredReligiousCommitment ?? "practicing",
          islamicMatchPreference: p.islamicMatchPreference ?? "",
        });
      } catch {
        setFormData({
          preferredAgeMin: "22",
          preferredAgeMax: "35",
          preferredMaritalStatus: "single_never",
          preferredEducationLevel: "bachelor",
          preferredLocation: "Ethiopia",
          waliInvolvement: "preferred",
          polygamyPreference: "not_acceptable",
          mahrExpectation: "To be discussed",
          genderInteraction: "moderate",
          preferredReligiousCommitment: "practicing",
          islamicMatchPreference: "",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    const min = Number(formData.preferredAgeMin);
    const max = Number(formData.preferredAgeMax);
    if (min < 18 || min > 120) {
      setError(t('preferences.errAgeMin'));
      toast.error(t('preferences.errAgeMin'), { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    if (max < 18 || max > 120) {
      setError(t('preferences.errAgeMax'));
      toast.error(t('preferences.errAgeMax'), { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    if (max < min) {
      setError(t('preferences.errAgeRange'));
      toast.error(t('preferences.errAgeRange'), { icon: <AlertCircle className="w-5 h-5" /> });
      return;
    }
    setIsSaving(true);
    try {
      await profileService.updateSpousePreference({
        preferredAgeMin: min,
        preferredAgeMax: max,
        preferredMaritalStatus: formData.preferredMaritalStatus,
        preferredEducationLevel: formData.preferredEducationLevel,
        preferredLocation: formData.preferredLocation,
        waliInvolvement: formData.waliInvolvement,
        polygamyPreference: formData.polygamyPreference,
        mahrExpectation: formData.mahrExpectation,
        genderInteraction: formData.genderInteraction,
        preferredReligiousCommitment: formData.preferredReligiousCommitment,
        islamicMatchPreference: formData.islamicMatchPreference || "",
      });
      setError("");
      toast.success(t('preferences.saved'), { icon: <CheckCircle2 className="w-5 h-5" /> });
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('preferences.failed');
      setError(msg);
      toast.error(msg, { icon: <AlertCircle className="w-5 h-5" /> });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blur-image">
          <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blur-image">
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">{t('preferences.title')}</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">{t('preferences.subtitle')}</p>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-charcoal-200 dark:border-charcoal-700">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">{t('preferences.partnerCriteria')}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{t('preferences.setPreferences')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('preferences.ageRange')}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    name="preferredAgeMin"
                    type="number"
                    placeholder={t('preferences.min')}
                    value={formData.preferredAgeMin || ""}
                    onChange={handleChange}
                  />
                </div>
                <span className="text-charcoal-400">{t('preferences.to')}</span>
                <div className="flex-1">
                  <Input
                    name="preferredAgeMax"
                    type="number"
                    placeholder={t('preferences.max')}
                    value={formData.preferredAgeMax || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('preferences.maritalStatus')}
              </label>
              <select
                name="preferredMaritalStatus"
                value={formData.preferredMaritalStatus || "single_never"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="single_never">Single (Virgin)</option>
                <option value="single_previous">Single (had relationship before)</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="any">{t('common.any')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t('preferences.educationLevel')}
              </label>
              <select
                name="preferredEducationLevel"
                value={formData.preferredEducationLevel || "bachelor"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="high_school">High School</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor&apos;s Degree</option>
                <option value="master">Master&apos;s Degree</option>
                <option value="phd">PhD</option>
                <option value="any">{t('common.any')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('preferences.location')}
              </label>
              <Input
                name="preferredLocation"
                placeholder={t('preferences.locationPlaceholder')}
                value={formData.preferredLocation || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('preferences.religiousCommitment')}
              </label>
              <select
                name="preferredReligiousCommitment"
                value={formData.preferredReligiousCommitment || "practicing"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="practicing">Practicing</option>
                <option value="moderately_practicing">Moderately Practicing</option>
                <option value="traditional">Traditional</option>
                <option value="any">{t('common.any')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('preferences.islamicTraditionMatch')}
              </label>
              <select
                name="islamicMatchPreference"
                value={formData.islamicMatchPreference || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">{t('common.select')}</option>
                <option value="own">My own Islamic tradition only</option>
                <option value="similar">Similar Islamic traditions</option>
                <option value="any">Any Muslim, regardless of tradition</option>
                <option value="no_preference">{t('common.noPreference')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('preferences.waliInvolvement')}
              </label>
              <select
                name="waliInvolvement"
                value={formData.waliInvolvement || "preferred"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="required">{t('common.required')}</option>
                <option value="preferred">Preferred</option>
                <option value="optional">{t('common.optional')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('preferences.polygamy')}
              </label>
              <select
                name="polygamyPreference"
                value={formData.polygamyPreference || "not_acceptable"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="not_acceptable">Not Acceptable</option>
                <option value="acceptable">Acceptable</option>
                <option value="depends">Depends on circumstances</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t('preferences.mahr')}
              </label>
              <Input
                name="mahrExpectation"
                placeholder={t('preferences.mahrPlaceholder')}
                value={formData.mahrExpectation || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('preferences.genderInteraction')}
              </label>
              <select
                name="genderInteraction"
                value={formData.genderInteraction || "moderate"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="conservative">{t('preferences.conservative')}</option>
                <option value="moderate">{t('preferences.moderate')}</option>
                <option value="flexible">{t('preferences.flexible')}</option>
              </select>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{t('preferences.tip')}</p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                    {t('preferences.tipText')}
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
              <Link href="/profile">
                <Button variant="ghost">{t('preferences.cancel')}</Button>
              </Link>
              <Button onClick={handleSave} loading={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {t('preferences.save')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
