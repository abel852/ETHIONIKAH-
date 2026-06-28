"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, User, MapPin, Calendar, Briefcase, GraduationCap,
  Heart, BookOpen, Globe, Users, Home, Sparkles, Upload, Camera,
  FileText, Eye, EyeOff, ChevronRight,
} from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/common";
import { profileService } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";
import { mediaUrl } from "@/lib/utils";

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
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileService.getMyProfile();
        const p = data.profile || data;
        setFormData({
          firstName: p.firstName || user?.firstName || "",
          lastName: p.lastName || user?.lastName || "",
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : user?.dateOfBirth?.split("T")[0] || "",
          gender: p.gender || user?.gender || "male",
          nationality: p.nationality || "",
          country: p.country || "",
          city: p.city || "",
          height: p.height?.toString() || "",
          maritalStatus: p.maritalStatus || "single",
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
          selfDescription: p.bio || "",
          qualities: p.qualities || [],
          interests: p.interests?.join(", ") || "",
        });
      } catch {
        setFormData({
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality,
        country: formData.country,
        city: formData.city,
        height: formData.height ? Number(formData.height) : undefined,
        maritalStatus: formData.maritalStatus,
        childrenStatus: formData.childrenStatus,
        religiousCommitment: formData.religiousCommitment,
        prayerHabits: formData.prayerHabits,
        quranReading: formData.quranReadingFrequency,
        islamicClasses: formData.islamicClassesAttendance === "regularly",
        preferredSpouseReligiousCommitment: formData.preferredReligiousCommitment,
        education: formData.educationLevel,
        occupation: formData.occupation,
        employmentStatus: formData.employmentStatus,
        monthlyIncome: formData.monthlyIncomeRange,
        marriageReason: formData.reasonForJoining,
        marriageTimeline: formData.desiredMarriageTimeline,
        childrenPreference: formData.childrenPreference,
        ethnicity: formData.ethnicBackground,
        motherTongue: formData.motherTongue,
        familyInvolvement: formData.familyInvolvement,
        smoking: formData.smokingHabits,
        khat: formData.khatUsage,
        exercise: formData.exerciseHabits,
        livingPreference: formData.livingPreference,
        bio: formData.selfDescription,
        qualities: formData.qualities,
        interests: formData.interests ? formData.interests.split(",").map((s: string) => s.trim()) : [],
      };
      const { data } = await profileService.createOrUpdate(payload);
      if (data.user) updateUser(data.user);
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { data } = await profileService.uploadPhoto(file);
        updateUser({ photos: [...(user?.photos || []), data.photoUrl].filter(Boolean) });
      } catch {
        // error handled silently
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal-50 dark:bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "basic":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">First Name</label>
                <Input name="firstName" value={formData.firstName || ""} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Last Name</label>
                <Input name="lastName" value={formData.lastName || ""} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Date of Birth</label>
              <Input name="dateOfBirth" type="date" value={formData.dateOfBirth || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Gender</label>
              <select name="gender" value={formData.gender || "male"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Nationality</label>
              <Input name="nationality" value={formData.nationality || ""} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Country</label>
                <Input name="country" value={formData.country || ""} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">City</label>
                <Input name="city" value={formData.city || ""} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Height (cm)</label>
              <Input name="height" type="number" value={formData.height || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Marital Status</label>
              <select name="maritalStatus" value={formData.maritalStatus || "single"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="single">Single</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Children Status</label>
              <select name="childrenStatus" value={formData.childrenStatus || "none"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="none">None</option>
                <option value="living_with_me">Living with me</option>
                <option value="not_living_with_me">Not living with me</option>
              </select>
            </div>
          </div>
        );
      case "religious":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Religious Information</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Religious Commitment</label>
              <select name="religiousCommitment" value={formData.religiousCommitment || "practicing"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="practicing">Practicing</option>
                <option value="moderately_practicing">Moderately Practicing</option>
                <option value="traditional">Traditional</option>
                <option value="seeking">Seeking Knowledge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Prayer Habits</label>
              <select name="prayerHabits" value={formData.prayerHabits || "always"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="always">Always (5 times)</option>
                <option value="usually">Usually</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Quran Reading Frequency</label>
              <select name="quranReadingFrequency" value={formData.quranReadingFrequency || "daily"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="occasionally">Occasionally</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Islamic Classes Attendance</label>
              <select name="islamicClassesAttendance" value={formData.islamicClassesAttendance || "sometimes"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="regularly">Regularly</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Religious Commitment in Spouse</label>
              <select name="preferredReligiousCommitment" value={formData.preferredReligiousCommitment || "practicing"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
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
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Education & Career</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Highest Education Level</label>
              <select name="educationLevel" value={formData.educationLevel || "bachelor"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="high_school">High School</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Occupation</label>
              <Input name="occupation" value={formData.occupation || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Employment Status</label>
              <select name="employmentStatus" value={formData.employmentStatus || "employed"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Monthly Income Range (Optional)</label>
              <select name="monthlyIncomeRange" value={formData.monthlyIncomeRange || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
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
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Marriage Intentions</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Reason for Joining</label>
              <select name="reasonForJoining" value={formData.reasonForJoining || "seeking_marriage"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="seeking_marriage">Seeking Marriage</option>
                <option value="family_assisted">Family-Assisted</option>
                <option value="exploring">Exploring Options</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Desired Marriage Timeline</label>
              <select name="desiredMarriageTimeline" value={formData.desiredMarriageTimeline || "1_year"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="asap">As soon as possible</option>
                <option value="6_months">Within 6 months</option>
                <option value="1_year">Within 1 year</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Children Preference</label>
              <select name="childrenPreference" value={formData.childrenPreference || "yes"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
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
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Family Background</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Ethnic Background (Optional)</label>
              <Input name="ethnicBackground" value={formData.ethnicBackground || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Mother Tongue</label>
              <Input name="motherTongue" value={formData.motherTongue || ""} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Family Involvement Preference</label>
              <select name="familyInvolvement" value={formData.familyInvolvement || "moderate"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
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
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Lifestyle</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Smoking Habits</label>
              <select name="smokingHabits" value={formData.smokingHabits || "never"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="never">Never</option>
                <option value="occasionally">Occasionally</option>
                <option value="regularly">Regularly</option>
                <option value="trying_to_quit">Trying to quit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Khat Usage</label>
              <select name="khatUsage" value={formData.khatUsage || "never"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="never">Never</option>
                <option value="occasionally">Occasionally</option>
                <option value="regularly">Regularly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Exercise Habits</label>
              <select name="exerciseHabits" value={formData.exerciseHabits || "weekly"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="occasionally">Occasionally</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Living Preference After Marriage</label>
              <select name="livingPreference" value={formData.livingPreference || "independent"} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30">
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
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Personality & Interests</h3>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Self Description</label>
              <textarea name="selfDescription" rows={4} value={formData.selfDescription || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Qualities (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {["Honest", "Patient", "Caring", "Respectful", "Kind", "Generous", "Humble", "Ambitious"].map((quality) => (
                  <label key={quality} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent">
                    <input type="checkbox" name="qualities" value={quality.toLowerCase()} checked={(formData.qualities || []).includes(quality.toLowerCase())} onChange={handleChange} className="rounded" />
                    <span className="text-sm">{quality}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Interests & Hobbies</label>
              <textarea name="interests" rows={3} value={formData.interests || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-50 dark:bg-charcoal-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Edit Profile</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">Update your profile information</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === section.id
                          ? "bg-accent text-white"
                          : "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                      {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </nav>
            </Card>

            <Card className="mt-4">
              <h3 className="font-semibold text-charcoal-900 dark:text-white mb-4">Profile Photo</h3>
              <div className="flex flex-col items-center gap-3">
                {user?.photos?.[0] ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img src={mediaUrl(user.photos[0])} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-2xl font-bold">
                  {[formData.firstName, formData.lastName].filter(Boolean).map((n) => n[0]).join("") || "U"}
                </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={handlePhotoUpload}>
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
                <Link href="/profile">
                  <Button variant="ghost">Cancel</Button>
                </Link>
                <Button onClick={handleSave} loading={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
