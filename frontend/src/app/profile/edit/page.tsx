"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, User, MapPin, Calendar, Briefcase, GraduationCap,
  Heart, BookOpen, Globe, Users, Home, Sparkles, Upload,
  FileText, Eye, EyeOff, ChevronRight, AtSign, CheckCircle, XCircle, Loader2,
  Lock,
} from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/common";
import { profileService } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const sections = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "religious", label: "Religious Info", icon: BookOpen },
  { id: "education", label: "Education & Career", icon: GraduationCap },
  { id: "intentions", label: "Marriage Intentions", icon: Heart },
  { id: "family", label: "Family Background", icon: Users },
  { id: "lifestyle", label: "Lifestyle", icon: Home },
  { id: "personality", label: "Personality", icon: Sparkles },
];

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [usernameCheck, setUsernameCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileService.getMyProfile();
        const p = data.profile || data;
        setFormData({
          username: p.username || user?.username || "",
          firstName: p.firstName || user?.firstName || "",
          lastName: p.lastName || user?.lastName || "",
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : user?.dateOfBirth?.split("T")[0] || "",
          gender: p.gender || user?.gender || "male",
          nationality: p.nationality || "",
          country: p.country || "",
          city: p.city || "",
          height: p.height?.toString() || "",
          weight: p.weight || "",
          appearance: p.appearance || "",
          maritalStatus: p.maritalStatus || "single_never",
          hasWali: p.hasWali || "",
          waliName: p.waliName || "",
          waliPhone: p.waliPhone || "",
          waliRelation: p.waliRelation || "",
          hasChildren: p.hasChildren || "",
          childrenCount: p.childrenCount || "",
          childrenCustody: p.childrenCustody || "",
          childrenStatus: p.childrenStatus || "none",
          religiousCommitment: p.religiousCommitment || "practicing",
          prayerHabits: p.prayerHabits || "always",
          quranReadingFrequency: p.quranReading || "daily",
          islamicClassesAttendance: p.islamicClasses ? "regularly" : "sometimes",
          preferredReligiousCommitment: p.preferredSpouseReligiousCommitment || "practicing",
          educationLevel: p.education || "bachelor",
          occupation: p.occupation || "",
          employmentStatus: p.employmentStatus || "employed",
          monthlyIncomeRange: p.monthlyIncome || "",
          reasonForJoining: p.marriageReason || "seeking_marriage",
          desiredMarriageTimeline: p.marriageTimeline || "1_year",
          childrenPreference: p.childrenPreference || "yes",
          ethnicBackground: p.ethnicity || "",
          motherTongue: p.motherTongue || "",
          familyInvolvement: p.familyInvolvement || "moderate",
          smokingHabits: p.smoking || "never",
          khatUsage: p.khat || "never",
          exerciseHabits: p.exercise || "weekly",
          livingPreference: p.livingPreference || "independent",
          personalPreference: p.personalPreference || "",
          islamicTradition: p.islamicTradition || "",
          islamicTraditionOther: p.islamicTraditionOther || "",
          selfDescription: p.bio || "",
          qualities: p.qualities || [],
          interests: p.interests?.join(", ") || "",
        });
      } catch {
        setFormData({
          username: user?.username || "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          dateOfBirth: user?.dateOfBirth?.split("T")[0] || "",
          gender: user?.gender || "male",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev: any) => ({
        ...prev,
        qualities: checked ? [...(prev.qualities || []), value] : (prev.qualities || []).filter((q: string) => q !== value),
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleUsernameChange = (e: any) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 30);
    setFormData((prev: any) => ({ ...prev, username: raw }));
    setUsernameCheck("idle");
    if (raw.length < 3) return;
    setUsernameCheck("checking");
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/username/check?username=${raw}`);
        setUsernameCheck(data.available ? "available" : "taken");
      } catch {
        setUsernameCheck("idle");
      }
    }, 500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        nationality: formData.nationality,
        country: formData.country,
        city: formData.city,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight,
        appearance: formData.appearance,
        maritalStatus: formData.maritalStatus,
        childrenStatus: formData.childrenStatus,
        religiousCommitment: formData.religiousCommitment,
        prayerHabits: formData.prayerHabits,
        quranReadingFrequency: formData.quranReadingFrequency,
        islamicClassesAttendance: formData.islamicClassesAttendance,
        educationLevel: formData.educationLevel,
        occupation: formData.occupation,
        employmentStatus: formData.employmentStatus,
        monthlyIncomeRange: formData.monthlyIncomeRange,
        reasonForJoining: formData.reasonForJoining,
        desiredMarriageTimeline: formData.desiredMarriageTimeline,
        childrenPreference: formData.childrenPreference,
        ethnicBackground: formData.ethnicBackground,
        motherTongue: formData.motherTongue,
        familyInvolvement: formData.familyInvolvement,
        smokingHabits: formData.smokingHabits,
        khatUsage: formData.khatUsage,
        exerciseHabits: formData.exerciseHabits,
        livingPreference: formData.livingPreference,
        personalPreference: formData.personalPreference,
        islamicTradition: formData.islamicTradition,
        islamicTraditionOther: formData.islamicTraditionOther,
        hasChildren: formData.hasChildren,
        childrenCount: formData.childrenCount,
        childrenCustody: formData.childrenCustody,
        hasWali: formData.hasWali,
        waliName: formData.waliName,
        waliPhone: formData.waliPhone,
        waliRelation: formData.waliRelation,
        bio: formData.selfDescription,
        qualities: formData.qualities,
        interests: formData.interests ? formData.interests.split(",").map((s: string) => s.trim()) : [],
      };
      const [profileRes] = await Promise.all([
        profileService.createOrUpdate(payload),
        formData.username?.length >= 3 ? api.post("/auth/username", { username: formData.username }) : Promise.resolve(),
        api.post("/spouse-preference", { preferredReligiousCommitment: formData.preferredReligiousCommitment }).catch(() => {}),
      ]);
      if (profileRes.data.user) updateUser(profileRes.data.user);
      toast.success("Profile saved successfully");
      router.push("/profile");
    } catch {
      // error toast handled by axios interceptor
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteProfile = async () => {
    setIsCompleting(true);
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        nationality: formData.nationality,
        country: formData.country,
        city: formData.city,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight,
        appearance: formData.appearance,
        maritalStatus: formData.maritalStatus,
        childrenStatus: formData.childrenStatus,
        religiousCommitment: formData.religiousCommitment,
        prayerHabits: formData.prayerHabits,
        quranReadingFrequency: formData.quranReadingFrequency,
        islamicClassesAttendance: formData.islamicClassesAttendance,
        educationLevel: formData.educationLevel,
        occupation: formData.occupation,
        employmentStatus: formData.employmentStatus,
        monthlyIncomeRange: formData.monthlyIncomeRange,
        reasonForJoining: formData.reasonForJoining,
        desiredMarriageTimeline: formData.desiredMarriageTimeline,
        childrenPreference: formData.childrenPreference,
        ethnicBackground: formData.ethnicBackground,
        motherTongue: formData.motherTongue,
        familyInvolvement: formData.familyInvolvement,
        smokingHabits: formData.smokingHabits,
        khatUsage: formData.khatUsage,
        exerciseHabits: formData.exerciseHabits,
        livingPreference: formData.livingPreference,
        personalPreference: formData.personalPreference,
        islamicTradition: formData.islamicTradition,
        islamicTraditionOther: formData.islamicTraditionOther,
        hasChildren: formData.hasChildren,
        childrenCount: formData.childrenCount,
        childrenCustody: formData.childrenCustody,
        hasWali: formData.hasWali,
        waliName: formData.waliName,
        waliPhone: formData.waliPhone,
        waliRelation: formData.waliRelation,
        bio: formData.selfDescription,
        qualities: formData.qualities,
        interests: formData.interests ? formData.interests.split(",").map((s: string) => s.trim()) : [],
      };
      await Promise.all([
        profileService.createOrUpdate(payload),
        formData.username?.length >= 3 ? api.post("/auth/username", { username: formData.username }) : Promise.resolve(),
        api.post("/spouse-preference", { preferredReligiousCommitment: formData.preferredReligiousCommitment }).catch(() => {}),
      ]);
      await profileService.setProfileComplete();
      toast.success("Profile completed successfully");
      router.push("/profile");
    } catch {
      // error toast handled by axios interceptor
    } finally {
      setIsSaving(false);
      setIsCompleting(false);
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

  const renderSection = () => {
    switch (activeSection) {
      case "basic":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Basic Information</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">
                Username <span className="text-charcoal-400 font-normal">(@username)</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <Input
                  name="username"
                  value={formData.username || ""}
                  onChange={handleUsernameChange}
                  placeholder="choose_a_username"
                  className="pl-10 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameCheck === "checking" && <Loader2 className="w-4 h-4 text-charcoal-400 animate-spin" />}
                  {usernameCheck === "available" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {usernameCheck === "taken" && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
              {usernameCheck === "available" && <p className="text-xs text-green-500 mt-1">Username available!</p>}
              {usernameCheck === "taken" && <p className="text-xs text-red-500 mt-1">Username already taken</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  First Name <Lock className="w-3 h-3 text-charcoal-400" />
                </label>
                <Input name="firstName" value={formData.firstName || ""} disabled className="opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  Last Name <Lock className="w-3 h-3 text-charcoal-400" />
                </label>
                <Input name="lastName" value={formData.lastName || ""} disabled className="opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Date of Birth <Lock className="w-3 h-3 text-charcoal-400" />
              </label>
              <Input name="dateOfBirth" type="date" value={formData.dateOfBirth || ""} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-charcoal-400 mt-1">Date of birth cannot be changed after registration.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                Gender <Lock className="w-3 h-3 text-charcoal-400" />
              </label>
              <select name="gender" value={formData.gender || "male"} disabled className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select opacity-60 cursor-not-allowed text-sm sm:text-base">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p className="text-xs text-charcoal-400 mt-1">Gender is permanent and cannot be changed after registration.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Nationality</label>
              <Input name="nationality" value={formData.nationality || ""} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Country</label>
                <Input name="country" value={formData.country || ""} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">City</label>
                <Input name="city" value={formData.city || ""} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Height (cm)</label>
              <Input name="height" type="number" value={formData.height || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Weight (kg)</label>
              <select name="weight" value={formData.weight || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select weight range</option>
                <option value="below_40">Below 40</option>
                <option value="41_50">41 - 50</option>
                <option value="51_60">51 - 60</option>
                <option value="61_70">61 - 70</option>
                <option value="71_80">71 - 80</option>
                <option value="above_80">Above 80</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Appearance (Skin Color)</label>
              <select name="appearance" value={formData.appearance || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select appearance</option>
                <option value="light">Light</option>
                <option value="reddish_brown">Reddish Brown</option>
                <option value="brown">Brown</option>
                <option value="black">Black</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Marital Status</label>
              <select name="maritalStatus" value={formData.maritalStatus || "single_never"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="single_never">Single (Virgin)</option>
                <option value="single_previous">Single (had relationship before)</option>
                {formData.gender === "male" && <option value="married">Married</option>}
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Children Status</label>
              <select name="childrenStatus" value={formData.childrenStatus || "none"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="none">None</option>
                <option value="living_with_me">Living with me</option>
                <option value="not_living_with_me">Not living with me</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Children Count</label>
              <select name="childrenCount" value={formData.childrenCount || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Children Custody</label>
              <select name="childrenCustody" value={formData.childrenCustody || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select</option>
                <option value="full_custody">Full Custody</option>
                <option value="shared_custody">Shared Custody</option>
                <option value="no_custody">No Custody</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Do you have a Wali (Guardian)?</label>
              <select name="hasWali" value={formData.hasWali || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {formData.hasWali === "yes" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Wali Name</label>
                  <Input name="waliName" value={formData.waliName || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Wali Phone</label>
                  <Input name="waliPhone" value={formData.waliPhone || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Wali Relationship</label>
                  <select name="waliRelation" value={formData.waliRelation || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                    <option value="">Select</option>
                    <option value="FATHER">Father</option>
                    <option value="GRANDFATHER">Grandfather</option>
                    <option value="BROTHER">Brother</option>
                    <option value="UNCLE">Uncle</option>
                    <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </>
            )}
          </div>
        );
      case "religious":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Religious Information</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Religious Commitment</label>
              <select name="religiousCommitment" value={formData.religiousCommitment || "practicing"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="practicing">Practicing</option>
                <option value="moderately_practicing">Moderately Practicing</option>
                <option value="traditional">Traditional</option>
                <option value="seeking">Seeking Knowledge</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Prayer Habits</label>
              <select name="prayerHabits" value={formData.prayerHabits || "always"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="always">Always (5 times)</option>
                <option value="usually">Usually</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Quran Reading Frequency</label>
              <select name="quranReadingFrequency" value={formData.quranReadingFrequency || "daily"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="occasionally">Occasionally</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Islamic Classes Attendance</label>
              <select name="islamicClassesAttendance" value={formData.islamicClassesAttendance || "sometimes"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="regularly">Regularly</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Islamic Tradition</label>
              <select name="islamicTradition" value={formData.islamicTradition || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select</option>
                <option value="sunni">Sunni</option>
                <option value="salafi">Salafi</option>
                <option value="sufi">Sufi</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formData.islamicTradition === "other" && (
              <div>
                <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Other Tradition (specify)</label>
                <Input name="islamicTraditionOther" value={formData.islamicTraditionOther || ""} onChange={handleChange} />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Preferred Religious Commitment in Spouse</label>
              <select name="preferredReligiousCommitment" value={formData.preferredReligiousCommitment || "practicing"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="practicing">Practicing</option>
                <option value="moderately_practicing">Moderately Practicing</option>
                <option value="traditional">Traditional</option>
                <option value="any">Any</option>
              </select>
            </div>
          </div>
        );
      case "education":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Education & Career</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Highest Education Level</label>
              <select name="educationLevel" value={formData.educationLevel || "bachelor"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="high_school">High School</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Occupation</label>
              <Input name="occupation" value={formData.occupation || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Employment Status</label>
              <select name="employmentStatus" value={formData.employmentStatus || "employed"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Monthly Income Range (Optional)</label>
              <select name="monthlyIncomeRange" value={formData.monthlyIncomeRange || ""} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="">Select</option>
                <option value="below_5000">Below 5,000 ETB</option>
                <option value="5000_10000">5,000 - 10,000 ETB</option>
                <option value="10000_20000">10,000 - 20,000 ETB</option>
                <option value="20000_50000">20,000 - 50,000 ETB</option>
                <option value="above_50000">Above 50,000 ETB</option>
              </select>
            </div>
          </div>
        );
      case "intentions":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Marriage Intentions</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Reason for Joining</label>
              <select name="reasonForJoining" value={formData.reasonForJoining || "seeking_marriage"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="seeking_marriage">Seeking Marriage</option>
                <option value="family_assisted">Family-Assisted</option>
                <option value="exploring">Exploring Options</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Desired Marriage Timeline</label>
              <select name="desiredMarriageTimeline" value={formData.desiredMarriageTimeline || "1_year"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="asap">As soon as possible</option>
                <option value="6_months">Within 6 months</option>
                <option value="1_year">Within 1 year</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Children Preference</label>
              <select name="childrenPreference" value={formData.childrenPreference || "yes"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="yes">Yes, want children</option>
                <option value="no">No, don't want children</option>
                <option value="maybe">Maybe / Undecided</option>
              </select>
            </div>
          </div>
        );
      case "family":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Family Background</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Ethnic Background (Optional)</label>
              <Input name="ethnicBackground" value={formData.ethnicBackground || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Mother Tongue</label>
              <Input name="motherTongue" value={formData.motherTongue || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Family Involvement Preference</label>
              <select name="familyInvolvement" value={formData.familyInvolvement || "moderate"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="high">Highly Involved</option>
                <option value="moderate">Moderate</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        );
      case "lifestyle":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Lifestyle</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Smoking Habits</label>
              <select name="smokingHabits" value={formData.smokingHabits || "never"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="never">Never</option>
                <option value="occasionally">Occasionally</option>
                <option value="regularly">Regularly</option>
                <option value="trying_to_quit">Trying to quit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Khat Usage</label>
              <select name="khatUsage" value={formData.khatUsage || "never"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="never">Never</option>
                <option value="occasionally">Occasionally</option>
                <option value="regularly">Regularly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Exercise Habits</label>
              <select name="exerciseHabits" value={formData.exerciseHabits || "weekly"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="occasionally">Occasionally</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Living Preference After Marriage</label>
              <select name="livingPreference" value={formData.livingPreference || "independent"} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-select focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-sm sm:text-base">
                <option value="independent">Independent</option>
                <option value="with_family">With Family</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        );
      case "personality":
        return (
          <div className="space-y-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white mb-4 pb-2 border-b border-charcoal-100 dark:border-charcoal-700">Personality & Interests</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Self Description</label>
              <textarea name="selfDescription" rows={4} value={formData.selfDescription || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Qualities (select all that apply)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Honest", "Patient", "Caring", "Respectful", "Kind", "Generous", "Humble", "Ambitious"].map((quality) => (
                  <label key={quality} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E9E9E9] dark:border-charcoal-700 cursor-pointer hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-all">
                    <input type="checkbox" name="qualities" value={quality.toLowerCase()} checked={(formData.qualities || []).includes(quality.toLowerCase())} onChange={handleChange} className="rounded border-charcoal-300 text-accent focus:ring-accent/20" />
                    <span className="text-xs sm:text-sm font-medium">{quality}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Interests & Hobbies</label>
              <textarea name="interests" rows={3} value={formData.interests || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mb-1.5 uppercase tracking-wide">Personal Preference</label>
              <textarea name="personalPreference" rows={3} value={formData.personalPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-[#E9E9E9] dark:border-charcoal-700 rounded-xl premium-input focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none transition-all" placeholder="Any personal preferences you'd like to share..." />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blur-image">
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/profile" className="p-2 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-charcoal-900 dark:text-white truncate">Edit Profile</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-xs sm:text-sm">Update your profile information</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Mobile: horizontal scrollable section tabs */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="flex gap-2.5 pb-3 pt-1 min-w-max">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-accent/30"
                        : "text-charcoal-500 dark:text-charcoal-400 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${activeSection === section.id ? "text-white" : "text-charcoal-400 dark:text-charcoal-500"}`} />
                    <span className="text-sm font-semibold">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: sidebar nav */}
          <div className="hidden lg:block lg:col-span-1">
            <Card>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === section.id ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-accent/30" : "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"}`}
                    >
                      <Icon className={`w-4 h-4 ${activeSection === section.id ? "text-white" : "text-charcoal-400 dark:text-charcoal-500"}`} />
                      <span className="text-sm font-semibold">{section.label}</span>
                      {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto text-white" />}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <div key={activeSection}>
                {renderSection()}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-charcoal-100 dark:border-charcoal-700">
                <Link href="/profile" className="sm:contents">
                  <Button variant="ghost" className="w-full sm:w-auto rounded-xl">Cancel</Button>
                </Link>
                <Button onClick={handleSave} loading={isSaving} className="w-full sm:w-auto rounded-xl shadow-md hover:shadow-lg transition-all">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCompleteProfile} loading={isCompleting} variant="primary" className="w-full sm:w-auto rounded-xl shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
