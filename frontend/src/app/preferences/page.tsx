"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart, Save, ArrowLeft, ChevronRight, Sparkles, Filter,
  SlidersHorizontal, User, MapPin, GraduationCap, BookOpen,
  Users, Shield, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Button, Input, Card, Badge } from "@/components/common";
import { profileService } from "@/services/profile";

export default function PreferencesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileService.getSpousePreference();
        const p = data.spousePreference || data;
        setFormData({
          preferredAgeMin: p.preferredAgeMin?.toString() ?? "22",
          preferredAgeMax: p.preferredAgeMax?.toString() ?? "35",
          preferredMaritalStatus: p.preferredMaritalStatus ?? "single",
          preferredEducationLevel: p.preferredEducationLevel ?? "bachelor",
          preferredLocation: p.preferredLocation ?? "Ethiopia",
          waliInvolvement: p.waliInvolvement ?? "preferred",
          polygamyPreference: p.polygamyPreference ?? "not_acceptable",
          mahrExpectation: p.mahrExpectation ?? "To be discussed",
          genderInteraction: p.genderInteraction ?? "moderate",
          preferredReligiousCommitment: p.preferredReligiousCommitment ?? "practicing",
        });
      } catch {
        setFormData({
          preferredAgeMin: "22",
          preferredAgeMax: "35",
          preferredMaritalStatus: "single",
          preferredEducationLevel: "bachelor",
          preferredLocation: "Ethiopia",
          waliInvolvement: "preferred",
          polygamyPreference: "not_acceptable",
          mahrExpectation: "To be discussed",
          genderInteraction: "moderate",
          preferredReligiousCommitment: "practicing",
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
    setIsSaving(true);
    try {
      await profileService.updateSpousePreference({
        preferredAgeMin: Number(formData.preferredAgeMin),
        preferredAgeMax: Number(formData.preferredAgeMax),
        preferredMaritalStatus: formData.preferredMaritalStatus,
        preferredEducationLevel: formData.preferredEducationLevel,
        preferredLocation: formData.preferredLocation,
        waliInvolvement: formData.waliInvolvement,
        polygamyPreference: formData.polygamyPreference,
        mahrExpectation: formData.mahrExpectation,
        genderInteraction: formData.genderInteraction,
        preferredReligiousCommitment: formData.preferredReligiousCommitment,
      });
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal-50 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-50 dark:bg-charcoal-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Spouse Preferences</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">Define what you&apos;re looking for in a partner</p>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-charcoal-200 dark:border-charcoal-700">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Partner Criteria</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Set your preferences for potential matches</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Preferred Age Range
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    name="preferredAgeMin"
                    type="number"
                    placeholder="Min"
                    value={formData.preferredAgeMin || ""}
                    onChange={handleChange}
                  />
                </div>
                <span className="text-charcoal-400">to</span>
                <div className="flex-1">
                  <Input
                    name="preferredAgeMax"
                    type="number"
                    placeholder="Max"
                    value={formData.preferredAgeMax || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Preferred Marital Status
              </label>
              <select
                name="preferredMaritalStatus"
                value={formData.preferredMaritalStatus || "single"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="single">Single</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Preferred Education Level
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
                <option value="any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Preferred Location
              </label>
              <Input
                name="preferredLocation"
                placeholder="Ethiopia or specific city"
                value={formData.preferredLocation || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Preferred Religious Commitment
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
                <option value="any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Wali/Guardian Involvement Preference
              </label>
              <select
                name="waliInvolvement"
                value={formData.waliInvolvement || "preferred"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="required">Required</option>
                <option value="preferred">Preferred</option>
                <option value="optional">Optional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Polygamy Preference
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
                Mahr Expectation
              </label>
              <Input
                name="mahrExpectation"
                placeholder="Describe your expectation"
                value={formData.mahrExpectation || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Gender Interaction Preference
              </label>
              <select
                name="genderInteraction"
                value={formData.genderInteraction || "moderate"}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">Tip</p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Setting specific preferences helps us find better matches for you. You can always update these preferences later.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
              <Link href="/profile">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button onClick={handleSave} loading={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
