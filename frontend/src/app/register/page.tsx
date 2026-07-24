"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Check, Calendar, 
  Briefcase, GraduationCap, MapPin, Heart, BookOpen, Building2, Baby, 
  Users, Globe, Cigarette, Dumbbell, Home, Sparkles, Upload, ChevronLeft,
  ChevronRight, Shield
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Input, WordSuggest } from "@/components/common";
import { authService } from "@/services/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "@/context/I18nContext";

const steps = [
  "Account",
  "Basic Info",
  "Religious",
  "Education",
  "Intentions",
  "Family",
  "Lifestyle",
  "Personality",
  "Preferences",
  "Health"
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const LS_DATA = "ethio-nikah-register-data";
  const LS_STEP = "ethio-nikah-register-step";

  useEffect(() => {
    try {
      const savedStep = localStorage.getItem(LS_STEP);
      const savedData = localStorage.getItem(LS_DATA);
      if (savedStep) { const s = parseInt(savedStep); if (s >= 1 && s <= steps.length) setCurrentStep(s); }
      if (savedData) setFormData(JSON.parse(savedData));
    } catch { /* ignore corrupt data */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(formData));
      localStorage.setItem(LS_STEP, currentStep.toString());
    } catch { /* storage full */ }
  }, [formData, currentStep]);

  const updateFormData = (stepData: any) => {
    setFormData((prev: any) => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (payload?: any) => {
    setIsSubmitting(true);
    try {
      const dataToSubmit = payload || formData;
      await authService.register(dataToSubmit);
      localStorage.removeItem(LS_DATA);
      localStorage.removeItem(LS_STEP);
      setRegistered(true);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.error || data?.errors?.[0]?.message || t("register.failed");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (step: number, data: any): string | null => {
    switch (step) {
      case 1:
        if (!data.firstName?.trim()) return t("register.step1.errFirstName");
        if (!data.lastName?.trim()) return t("register.step1.errLastName");
        if (!data.email?.trim()) return t("register.step1.errEmail");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return t("register.step1.errEmailInvalid");
        if (!data.phone?.trim()) return t("register.step1.errPhone");
        if (!/^(09\d{8}|\+2519\d{8})$/.test(data.phone.replace(/[\s\-()]/g, ""))) return t("register.step1.errPhoneInvalid");
        if (!data.password) return t("register.step1.errPassword");
        if (data.password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(data.password)) return "Password must include at least one uppercase letter";
        if (!/[a-z]/.test(data.password)) return "Password must include at least one lowercase letter";
        if (!/[0-9]/.test(data.password)) return "Password must include at least one number";
        if (!/[^A-Za-z0-9]/.test(data.password)) return "Password must include at least one symbol (e.g. !@#$%)";
        return null;
      case 2:
        if (!data.gender) return t("register.step2.errGender");
        if (!data.dateOfBirth) return t("register.step2.errDob");
        { const b = new Date(data.dateOfBirth), td = new Date(); let a = td.getFullYear() - b.getFullYear(); const m = td.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && td.getDate() < b.getDate())) a--; if (a < 18) return t("register.step2.errAge"); }
        if (!data.nationality?.trim()) return t("register.step2.errNationality");
        if (data.nationality === "Other" && !data.nationalityOther?.trim()) return t("register.step2.errNationalitySpecify");
        if (!data.country?.trim()) return t("register.step2.errCountry");
        if (data.country === "Other" && !data.countryOther?.trim()) return t("register.step2.errCountrySpecify");
        if (!data.city?.trim()) return t("register.step2.errCity");
        if (data.city === "Other" && !data.cityOther?.trim()) return t("register.step2.errCitySpecify");
        if (!data.maritalStatus) return t("register.step2.errMaritalStatus");
        return null;
      case 3:
        if (!data.religiousCommitment) return t("register.step3.errReligiousCommitment");
        if (!data.prayerHabits) return t("register.step3.errPrayerHabits");
        if (!data.quranReadingFrequency) return t("register.step3.errQuranFrequency");
        return null;
      case 4:
        if (!data.educationLevel) return t("register.step4.errEducation");
        if (!data.occupation?.trim()) return t("register.step4.errOccupation");
        if (!data.employmentStatus) return t("register.step4.errEmployment");
        return null;
      case 5:
        if (!data.reasonForJoining) return t("register.step5.errReason");
        if (!data.desiredMarriageTimeline) return t("register.step5.errTimeline");
        if (!data.childrenPreference) return t("register.step5.errChildren");
        return null;
      case 6:
        if (!data.motherTongue?.trim()) return t("register.step6.errMotherTongue");
        if (!data.familyInvolvement) return t("register.step6.errFamilyInvolvement");
        return null;
      case 7:
        if (!data.smokingHabits) return t("register.step7.errSmoking");
        if (!data.khatUsage) return t("register.step7.errKhat");
        if (!data.exerciseHabits) return t("register.step7.errExercise");
        if (!data.livingPreference) return t("register.step7.errLiving");
        return null;
      case 8:
        if (!data.selfDescription?.trim()) return t("register.step8.errSelfDescription");
        if (!data.interests?.trim()) return t("register.step8.errInterests");
        return null;
      case 9:
        if (!data.preferredAgeMin) return t("register.step9.errAgeMin");
        if (!data.preferredAgeMax) return t("register.step9.errAgeMax");
        if (parseInt(data.preferredAgeMin) < 18) return t("register.step9.errAgeMin18");
        if (parseInt(data.preferredAgeMax) > 120) return t("register.step9.errAgeMax120");
        if (parseInt(data.preferredAgeMax) < parseInt(data.preferredAgeMin)) return t("register.step9.errAgeRange");
        if (!data.preferredMaritalStatus) return t("register.step9.errMaritalStatus");
        if (!data.preferredEducationLevel) return t("register.step9.errEducationLevel");
        if (!data.preferredLocation?.trim()) return t("register.step9.errLocation");
        if (!data.waliInvolvement) return t("register.step9.errWali");
        if (data.gender !== "male" && !data.polygamyPreference) return t("register.step9.errPolygamy");
        if (!data.genderInteraction) return t("register.step9.errGenderInteraction");
        return null;
      case 10:
        if (data.dwarfismStatus === "other" && !data.dwarfismDetails?.trim()) return t("register.step10.errDwarfismDetails");
        return null;
      default: return null;
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-50 dark:bg-charcoal-900 px-4">
        <div className="max-w-md w-full text-center">
          <Image src="/images/logo.png" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-charcoal-900 dark:ring-charcoal-700" />
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t("register.congratulations")}</h2>
            <p className="text-charcoal-500 dark:text-charcoal-400 mb-6">{t("register.successMessage")}</p>
            <Link href="/login" className="inline-flex items-center justify-center w-full px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
              {t("register.signInNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepVisuals = [
    { img: "https://images.unsplash.com/photo-1751912708908-d6dd0120f437?w=800&q=80", icon: Heart, gradient: "from-rose-900/60 via-pink-900/50 to-amber-900/40" },
    { img: "https://images.unsplash.com/photo-1758915445207-75961ba3f4e4?w=800&q=80", icon: User, gradient: "from-amber-900/60 via-yellow-900/50 to-orange-900/40" },
    { img: "https://images.unsplash.com/photo-1774810307050-b66434a7c1c5?w=800&q=80", icon: BookOpen, gradient: "from-emerald-900/60 via-teal-900/50 to-green-900/40" },
    { img: "https://images.unsplash.com/photo-1759347172521-6d8e8163e307?w=800&q=80", icon: GraduationCap, gradient: "from-blue-900/60 via-indigo-900/50 to-purple-900/40" },
    { img: "https://images.unsplash.com/photo-1763295493241-198f4c67c87a?w=800&q=80", icon: Sparkles, gradient: "from-purple-900/60 via-fuchsia-900/50 to-pink-900/40" },
    { img: "https://images.unsplash.com/photo-1763295491678-a3312a46e579?w=800&q=80", icon: Users, gradient: "from-teal-900/60 via-cyan-900/50 to-blue-900/40" },
    { img: "https://images.unsplash.com/photo-1774604523505-78c3327b2e69?w=800&q=80", icon: Home, gradient: "from-orange-900/60 via-amber-900/50 to-yellow-900/40" },
    { img: "https://images.unsplash.com/photo-1766498737210-d51c34391eaf?w=800&q=80", icon: Heart, gradient: "from-pink-900/60 via-rose-900/50 to-red-900/40" },
    { img: "https://images.unsplash.com/photo-1772435687742-7ecd1494386e?w=800&q=80", icon: Globe, gradient: "from-indigo-900/60 via-blue-900/50 to-cyan-900/40" },
    { img: "https://images.unsplash.com/photo-1759784372627-445fc00e6c73?w=800&q=80", icon: Shield, gradient: "from-green-900/60 via-emerald-900/50 to-teal-900/40" },
  ];

  return (
    <div className="min-h-screen flex dark:bg-charcoal-900">
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden">
        <Image src={stepVisuals[currentStep - 1]?.img || stepVisuals[0].img} alt="" fill priority className="object-cover transition-all duration-700" />
        <div className={`absolute inset-0 bg-gradient-to-br ${stepVisuals[currentStep - 1]?.gradient || stepVisuals[0].gradient}`} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(251,207,232,0.5) 2px, transparent 2px), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.4) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(254,215,170,0.4) 1.5px, transparent 1.5px)", backgroundSize: "55px 55px" }} />
        <div className="relative z-10 max-w-md text-center">
          <Image src="/images/logo.png" alt="Ethio Nikah" width={72} height={72} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-white/20 shadow-2xl" />
          <div className={`mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-br ${stepVisuals[currentStep - 1]?.gradient || stepVisuals[0].gradient} flex items-center justify-center shadow-2xl ring-2 ring-white/20`}>
            {(() => { const SI = stepVisuals[currentStep - 1]?.icon || Heart; return <SI className="w-8 h-8 text-white drop-shadow-lg" />; })()}
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3 drop-shadow-lg">{t("register.sideTitle")}</h2>
          <p className="text-white/80 text-sm mb-8 drop-shadow-md max-w-sm mx-auto leading-relaxed">{t("register.sideStep" + currentStep)}</p>
          <div className="space-y-2 text-left text-sm max-w-xs mx-auto">
            {steps.map((_, i) => {
              const stepNum = i + 1;
              const isDone = currentStep > stepNum;
              const isActive = currentStep === stepNum;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDone ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30" : isActive ? "bg-white text-accent ring-4 ring-white/30 shadow-lg scale-110" : "bg-white/20 text-white/60"}`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{stepNum}</span>}
                  </div>
                  <span className={`${isActive ? "text-white font-semibold" : isDone ? "text-white/80" : "text-white/50"} transition-all`}>{t("register.sideStep" + stepNum)}</span>
                  {isActive && <div className="flex-1 h-0.5 bg-gradient-to-r from-accent to-transparent rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <Image src="/images/logo.png" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
              <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
                Ethio Nikah
              </span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">{t("register.title")}</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400">{t("register.step", { current: currentStep, total: steps.length, name: t("register.sideStep" + currentStep) })}</p>
          </div>

          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < currentStep ? "bg-accent" : "bg-charcoal-200 dark:bg-charcoal-700"}`} />
                ))}
              </div>
              <span className="text-sm text-charcoal-500 dark:text-charcoal-400">{currentStep}/{steps.length}</span>
            </div>

            {currentStep === 1 && <AccountStep key="step-1" formData={formData} updateFormData={updateFormData} nextStep={nextStep} showPassword={showPassword} setShowPassword={setShowPassword} validate={validate} />}
            {currentStep === 2 && <BasicInfoStep key="step-2" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 3 && <ReligiousStep key="step-3" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 4 && <EducationStep key="step-4" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 5 && <IntentionsStep key="step-5" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 6 && <FamilyStep key="step-6" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 7 && <LifestyleStep key="step-7" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 8 && <PersonalityStep key="step-8" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 9 && <PreferencesStep key="step-9" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 10 && <HealthStep key="step-10" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} validate={validate} />}

            <div className="mt-6 text-center">
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
                {t("register.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-accent hover:text-accent-dark font-medium">{t("register.signIn")}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountStep({ formData, updateFormData, nextStep, showPassword, setShowPassword, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === "phone") {
      let v = value.replace(/[^0-9+]/g, "").slice(0, 13);
      const plusCount = (v.match(/\+/g) || []).length;
      if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
      if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
      sanitized = v;
    } else if (name === "email") {
      sanitized = value.replace(/[^a-zA-Z0-9@.]/g, "");
    }
    setLocalData((prev: any) => ({ ...prev, [name]: sanitized }));
  };

  const handleNext = () => {
    const err = validate(1, localData);
    if (err) { setError(err); return; }
    if (!acceptedTerms) { setError(t("register.step1.errTerms")); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div key="step-1" className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step1.title")}</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step1.fullName")}</label>
          <input name="firstName" type="text" placeholder={t("register.step1.firstNamePlaceholder")} value={localData.firstName || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step1.lastName")}</label>
          <input name="lastName" type="text" placeholder={t("register.step1.lastNamePlaceholder")} value={localData.lastName || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step1.email")}</label>
        <input name="email" type="email" placeholder={t("register.step1.emailPlaceholder")} value={localData.email || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step1.phone")}</label>
        <input name="phone" type="tel" placeholder={t("register.step1.phonePlaceholder")} value={localData.phone || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step1.password")}</label>
        <input name="password" type={showPassword ? "text" : "password"} placeholder={t("register.step1.passwordPlaceholder")} value={localData.password || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-charcoal-400 hover:text-charcoal-600">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        {localData.password && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${localData.password.length >= 8 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              8+ chars
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[A-Z]/.test(localData.password) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              Uppercase
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[a-z]/.test(localData.password) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              Lowercase
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[0-9]/.test(localData.password) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              Number
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[^A-Za-z0-9]/.test(localData.password) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-charcoal-100 text-charcoal-500 dark:bg-charcoal-700 dark:text-charcoal-400"}`}>
              Symbol
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="rounded border-charcoal-300" />
        <label htmlFor="terms" className="text-sm text-charcoal-600 dark:text-charcoal-400">{t("register.step1.agreeTerms")}</label>
      </div>
      <Button onClick={handleNext} variant="primary" className="w-full" size="lg">
        {t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function BasicInfoStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const initDob = formData.dateOfBirth ? formData.dateOfBirth.split("-") : [];
  const [localData, setLocalData] = useState({
    ...formData,
    dobDay: initDob[2] || "",
    dobMonth: initDob[1] || "",
    dobYear: initDob[0] || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === "waliPhone") {
      let v = value.replace(/[^0-9+]/g, "").slice(0, 13);
      const plusCount = (v.match(/\+/g) || []).length;
      if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
      if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
      sanitized = v;
    }
    setLocalData((prev: any) => ({ ...prev, [name]: sanitized }));
  };

  const handleDOB = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => {
      const next = { ...prev, [name]: value };
      if (next.dobDay && next.dobMonth && next.dobYear) {
        next.dateOfBirth = `${next.dobYear}-${next.dobMonth}-${next.dobDay}`;
      }
      return next;
    });
  };
  const handleSelect = (field: string) => (e: any) => {
    setLocalData((prev: any) => ({ ...prev, [field]: e.target.value }));
  };
  const handleOther = (field: string) => (e: any) => {
    setLocalData((prev: any) => ({ ...prev, [field + "Other"]: e.target.value }));
  };

  const handleNext = () => {
    const merged = { ...localData };
    if (merged.nationality === "Other") merged.nationality = merged.nationalityOther?.trim() || "Other";
    if (merged.country === "Other") merged.country = merged.countryOther?.trim() || "Other";
    if (merged.city === "Other") merged.city = merged.cityOther?.trim() || "Other";
    const err = validate(2, merged);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(merged);
    nextStep();
  };

  const sc = "w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";

  const nationalities = [
    "Afghan", "Albanian", "Algerian", "American", "Angolan", "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
    "Bahraini", "Bangladeshi", "Belarusian", "Belgian", "Beninese", "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British", "Bulgarian", "Burkinabe", "Burundian",
    "Cambodian", "Cameroonian", "Canadian", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech",
    "Danish", "Djiboutian", "Dominican", "Dutch",
    "Ecuadorian", "Egyptian", "Emirati", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian",
    "Finnish", "French",
    "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Guatemalan", "Guinean",
    "Haitian", "Honduran", "Hungarian",
    "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Italian", "Ivorian",
    "Jamaican", "Japanese", "Jordanian",
    "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz",
    "Lao", "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian", "Luxembourgish",
    "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Myanmar",
    "Namibian", "Nepalese", "New Zealander", "Nicaraguan", "Nigerien", "Nigerian", "North Korean", "North Macedonian", "Norwegian",
    "Omani",
    "Pakistani", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Filipino", "Polish", "Portuguese",
    "Qatari",
    "Romanian", "Russian", "Rwandan",
    "Salvadoran", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean", "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish", "Swiss", "Syrian",
    "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian", "Turkish", "Turkmen",
    "Ugandan", "Ukrainian", "Uruguayan", "Uzbek",
    "Venezuelan", "Vietnamese",
    "Yemeni",
    "Zambian", "Zimbabwean"
  ];

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahrain", "Bangladesh", "Belarus", "Belgium", "Benin", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominican Republic",
    "Ecuador", "Egypt", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
    "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guinea-Bissau",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Liberia", "Libya", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];

  const allNat = [...new Set(nationalities)].sort((a, b) => {
    if (a === "Ethiopian") return -1; if (b === "Ethiopian") return 1;
    return a.localeCompare(b);
  });

  const allCountries = [...new Set(countries)].sort((a, b) => {
    if (a === "Ethiopia") return -1; if (b === "Ethiopia") return 1;
    return a.localeCompare(b);
  });

  const cityMap: Record<string, string[]> = {
    "Ethiopia": ["Adama (Nazret)", "Addis Ababa", "Adigrat", "Alamata", "Ambo", "Arba Minch", "Assosa", "Axum", "Bahir Dar", "Bishoftu", "Bonga", "Debre Birhan", "Debre Markos", "Debre Tabor", "Dessie", "Dila", "Dire Dawa", "Gambela", "Gode", "Gondar", "Harar", "Hawassa", "Hosaena", "Jijiga", "Jimma", "Jinka", "Konso", "Korem", "Lalibela", "Maichew", "Mekelle", "Mizan Teferi", "Mojo", "Negele Borana", "Nekemte", "Sawla", "Semera", "Shashamane", "Shire", "Sodo", "Weldiya", "Wolkite", "Yabelo"],
    "Eritrea": ["Asmara", "Keren", "Massawa", "Mendefera", "Assab", "Barentu", "Tessenei", "Dekemhare", "Nakfa", "Adi Quala"],
    "Somalia": ["Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Bosaso", "Galkayo", "Merca", "Berbera", "Burao", "Jowhar", "Beledweyne", "Qardho"],
    "Djibouti": ["Djibouti City", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Malindi", "Nyeri", "Thika", "Machakos", "Garissa"],
    "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Nyala", "Kassala", "El Obeid", "Gedaref", "Wad Madani"],
    "South Sudan": ["Juba", "Malakal", "Wau", "Bor", "Yei", "Rumbek", "Torit", "Bentiu"],
    "Egypt": ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Sharm el-Sheikh", "Port Said", "Suez", "Tanta", "Mansoura"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Kaduna", "Benin City", "Enugu", "Jos", "Zaria"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "Soweto"],
    "Ghana": ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Cape Coast", "Tema"],
    "Morocco": ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda"],
    "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Setif", "Tlemcen"],
    "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes"],
    "Libya": ["Tripoli", "Benghazi", "Misrata", "Al Bayda", "Tobruk", "Sabha"],
    "Tanzania": ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya", "Zanzibar City", "Tanga"],
    "Uganda": ["Kampala", "Gulu", "Lira", "Mbarara", "Jinja", "Entebbe", "Mbale"],
    "Rwanda": ["Kigali", "Butare", "Gisenyi", "Ruhengeri", "Cyangugu"],
    "Burundi": ["Bujumbura", "Gitega", "Ngozi", "Ruyigi"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk", "Abha", "Yanbu"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Al Ain"],
    "Qatar": ["Doha", "Al Wakrah", "Al Khor", "Mesaieed"],
    "Kuwait": ["Kuwait City", "Al Ahmadi", "Hawalli", "Farwaniya", "Salmiya"],
    "Oman": ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur"],
    "Bahrain": ["Manama", "Riffa", "Muharraq", "Isa Town", "Hamad Town"],
    "Jordan": ["Amman", "Zarqa", "Irbid", "Aqaba", "Madaba", "Salt"],
    "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre", "Baalbek", "Jounieh"],
    "Syria": ["Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Raqqa"],
    "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Kirkuk", "Najaf", "Karbala"],
    "Yemen": ["Sana'a", "Aden", "Taiz", "Hudaydah", "Mukalla", "Ibb"],
    "Palestine": ["Jerusalem", "Ramallah", "Gaza City", "Hebron", "Nablus", "Bethlehem", "Jenin"],
    "Iran": ["Tehran", "Isfahan", "Mashhad", "Tabriz", "Shiraz", "Qom", "Ahvaz", "Kermanshah"],
    "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Gaziantep", "Mersin"],
    "Pakistan": ["Islamabad", "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Quetta"],
    "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur"],
    "India": ["New Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Lucknow", "Jaipur"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Yogyakarta", "Makassar", "Palembang"],
    "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru", "Kota Kinabalu", "Kuching", "Ipoh", "Malacca"],
    "Philippines": ["Manila", "Quezon City", "Cebu City", "Davao City", "Zamboanga City", "Baguio"],
    "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Hong Kong"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Leeds", "Edinburgh", "Sheffield", "Bristol"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf", "Leipzig"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence", "Bologna", "Venice"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao", "Granada"],
    "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Maastricht"],
    "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne"],
    "Sweden": ["Stockholm", "Gothenburg", "Malmo", "Uppsala", "Linkoping"],
    "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromso"],
    "Russia": ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Novosibirsk", "Yekaterinburg"],
    "Ukraine": ["Kyiv", "Lviv", "Odessa", "Kharkiv", "Dnipro"],
    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Washington DC", "Boston", "Detroit", "Seattle", "Miami", "Atlanta"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Edmonton", "Winnipeg", "Quebec City"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"],
    "Afghanistan": ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Kunduz"],
    "Somaliland": ["Hargeisa", "Burao", "Berbera", "Erigavo", "Las Anod"],
    "Kazakhstan": ["Nur-Sultan", "Almaty", "Shymkent", "Karaganda", "Aktobe"],
    "Uzbekistan": ["Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan"],
    "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"],
    "Ireland": ["Dublin", "Cork", "Galway", "Limerick"],
    "Austria": ["Vienna", "Salzburg", "Graz", "Innsbruck", "Linz"],
    "Belgium": ["Brussels", "Antwerp", "Ghent", "Bruges", "Liege"],
    "Denmark": ["Copenhagen", "Aarhus", "Odense", "Aalborg"],
    "Finland": ["Helsinki", "Tampere", "Turku", "Espoo"],
    "Poland": ["Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan"],
    "Czech Republic": ["Prague", "Brno", "Ostrava", "Plzen"],
    "Portugal": ["Lisbon", "Porto", "Braga", "Faro", "Coimbra"],
    "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"],
    "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Krabi"],
    "Singapore": ["Singapore"],
    "Brazil": ["Brasilia", "Rio de Janeiro", "Sao Paulo", "Salvador", "Fortaleza", "Recife"],
    "Argentina": ["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "La Plata"],
    "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Cancun", "Tijuana", "Puebla"],
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step2.title")}</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.gender")}</label>
        <div className="grid grid-cols-2 gap-3">
          {["male", "female"].map(g => (
            <label key={g} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="gender" value={g} checked={localData.gender === g} onChange={handleChange} className="sr-only" />
              <span className="text-sm font-medium capitalize">{g === "male" ? t("register.step2.male") : t("register.step2.female")}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.dob")}</label>
        <div className="grid grid-cols-3 gap-3">
          <select name="dobDay" value={localData.dobDay || ""} onChange={handleDOB} className={sc}>
            <option value="">{t("register.step2.day")}</option>
            {Array.from({length: 31}, (_, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>
            ))}
          </select>
          <select name="dobMonth" value={localData.dobMonth || ""} onChange={handleDOB} className={sc}>
            <option value="">{t("register.step2.month")}</option>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((n, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{t("months." + n.toLowerCase())}</option>
            ))}
          </select>
          <select name="dobYear" value={localData.dobYear || ""} onChange={handleDOB} className={sc}>
            <option value="">{t("register.step2.year")}</option>
            {Array.from({length: 83}, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.nationality")}</label>
        <select name="nationality" value={localData.nationality === "Other" ? "Other" : localData.nationality || ""} onChange={handleSelect("nationality")} className={sc}>
          <option value="">{t("register.step2.selectNationality")}</option>
          {allNat.map(n => <option key={n} value={n}>{n}</option>)}
          <option value="Other">{t("common.other")}</option>
        </select>
        {localData.nationality === "Other" && (
          <input name="nationalityOther" placeholder={t("register.step2.errNationalitySpecify")} value={localData.nationalityOther || ""} onChange={handleOther("nationality")} className={[sc, "mt-2"].join(" ")} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.country")}</label>
          <select name="country" value={localData.country === "Other" ? "Other" : localData.country || ""} onChange={handleSelect("country")} className={sc}>
            <option value="">{t("register.step2.selectCountry")}</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Other">{t("common.other")}</option>
          </select>
          {localData.country === "Other" && (
            <input name="countryOther" placeholder={t("register.step2.errCountrySpecify")} value={localData.countryOther || ""} onChange={handleOther("country")} className={[sc, "mt-2"].join(" ")} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.city")}</label>
          {(() => {
            const countryCities = localData.country && localData.country !== "Other" ? cityMap[localData.country] : null;
            return (
              <>
                <select name="city" value={localData.city === "Other" ? "Other" : localData.city || ""} onChange={handleSelect("city")} className={sc}>
                  <option value="">
                    {!localData.country ? t("register.step2.selectCountryFirst") : countryCities ? t("register.step2.selectCity") : t("register.step2.noCities")}
                  </option>
                  {countryCities?.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">{t("common.other")}</option>
                </select>
                {localData.city === "Other" && (
                  <input name="cityOther" placeholder={t("register.step2.errCitySpecify")} value={localData.cityOther || ""} onChange={handleOther("city")} className={[sc, "mt-2"].join(" ")} />
                )}
              </>
            );
          })()}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.height")}</label>
        <input name="height" type="number" placeholder={t("register.step2.heightPlaceholder")} value={localData.height || ""} onChange={handleChange} className={sc} />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.weight")}</label>
        <select name="weight" value={localData.weight || ""} onChange={handleChange} className={sc}>
          <option value="">{t("register.step2.selectWeight")}</option>
          <option value="below_40">{t("register.step2.weightBelow40")}</option>
          <option value="41_50">{t("register.step2.weight41to50")}</option>
          <option value="51_60">{t("register.step2.weight51to60")}</option>
          <option value="61_70">{t("register.step2.weight61to70")}</option>
          <option value="71_80">{t("register.step2.weight71to80")}</option>
          <option value="above_80">{t("register.step2.weightAbove80")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.appearance")}</label>
        <select name="appearance" value={localData.appearance || ""} onChange={handleChange} className={sc}>
          <option value="">{t("register.step2.selectAppearance")}</option>
          <option value="light">{t("register.step2.appearanceLight")}</option>
          <option value="reddish_brown">{t("register.step2.appearanceReddishBrown")}</option>
          <option value="brown">{t("register.step2.appearanceBrown")}</option>
          <option value="black">{t("register.step2.appearanceBlack")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.maritalStatus")}</label>
          <select name="maritalStatus" value={localData.maritalStatus || ""} onChange={handleChange} className={sc}>
            <option value="">{t("register.step2.selectStatus")}</option>
            <option value="single_never">{t("register.step2.singleVirgin")}</option>
            <option value="single_previous">{t("register.step2.singlePrevious")}</option>
            {localData.gender === "male" && <option value="married">{t("register.step2.married")}</option>}
            <option value="divorced">{t("register.step2.divorced")}</option>
            <option value="widowed">{t("register.step2.widowed")}</option>
          </select>
      </div>
      {localData.maritalStatus !== "single_never" && (
        <div className="space-y-4 border-t border-charcoal-100 dark:border-charcoal-700 pt-4">
          <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{t("register.step2.childrenInfo")}</p>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.hasChildren")}</label>
            <div className="flex gap-3">
              {["no", "yes", "prefer_not"].map((v) => (
                <label key={v} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                  <input type="radio" name="hasChildren" value={v} checked={localData.hasChildren === v} onChange={handleChange} className="sr-only" />
                  <span className="text-sm font-medium">{v === "prefer_not" ? t("register.step2.hasChildrenPreferNot") : v === "yes" ? t("register.step2.hasChildrenYes") : t("register.step2.hasChildrenNo")}</span>
                </label>
              ))}
            </div>
          </div>
          {localData.hasChildren === "yes" && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.childrenCount")}</label>
                <select name="childrenCount" value={localData.childrenCount || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="1">{t("register.step2.childrenCount1")}</option>
                  <option value="2">{t("register.step2.childrenCount2")}</option>
                  <option value="3">{t("register.step2.childrenCount3")}</option>
                  <option value="4">{t("register.step2.childrenCount4")}</option>
                  <option value="5_or_more">{t("register.step2.childrenCount5")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.childrenCustody")}</label>
                <select name="childrenCustody" value={localData.childrenCustody || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="with_me">{t("register.step2.custodyWithMe")}</option>
                  <option value="with_other">{t("register.step2.custodyWithOther")}</option>
                  <option value="shared">{t("register.step2.custodyShared")}</option>
                  <option value="independent">{t("register.step2.custodyIndependent")}</option>
                  <option value="other">{t("register.step2.custodyOther")}</option>
                  <option value="prefer_not">{t("register.step2.custodyPreferNot")}</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
      {localData.gender === "female" && (
        <div className="space-y-4 border-t border-charcoal-100 dark:border-charcoal-700 pt-4">
          <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{t("register.step2.waliInfo")}</p>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.hasWali")}</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                <input type="radio" name="hasWali" value="yes" checked={localData.hasWali === "yes"} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium">{t("common.yes")}</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                <input type="radio" name="hasWali" value="no" checked={localData.hasWali === "no"} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium">{t("common.no")}</span>
              </label>
            </div>
          </div>
          {localData.hasWali === "yes" && (
            <div className="space-y-3 pl-4 border-l-2 border-accent/30">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.waliName")}</label>
                <input name="waliName" type="text" placeholder={t("register.step2.waliNamePlaceholder")} value={localData.waliName || ""} onChange={handleChange} className={sc} />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.waliPhone")}</label>
                <input name="waliPhone" type="tel" placeholder={t("register.step2.waliPhonePlaceholder")} value={localData.waliPhone || ""} onChange={handleChange} className={sc} />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step2.waliRelation")}</label>
                <select name="waliRelation" value={localData.waliRelation || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="father">{t("register.step2.waliFather")}</option>
                  <option value="brother">{t("register.step2.waliBrother")}</option>
                  <option value="uncle">{t("register.step2.waliUncle")}</option>
                  <option value="grandfather">{t("register.step2.waliGrandfather")}</option>
                  <option value="other">{t("register.step2.waliOther")}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function ReligiousStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(3, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step3.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.religiousCommitment")}</label>
        <select name="religiousCommitment" value={localData.religiousCommitment || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="practicing">{t("register.step3.practicing")}</option>
          <option value="moderately_practicing">{t("register.step3.moderatelyPracticing")}</option>
          <option value="traditional">{t("register.step3.traditional")}</option>
          <option value="seeking">{t("register.step3.seekingKnowledge")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.prayerHabits")}</label>
        <select name="prayerHabits" value={localData.prayerHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="always">{t("register.step3.always5")}</option>
          <option value="usually">{t("register.step3.usually")}</option>
          <option value="sometimes">{t("register.step3.sometimes")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.quranFrequency")}</label>
        <select name="quranReadingFrequency" value={localData.quranReadingFrequency || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="daily">{t("register.step3.daily")}</option>
          <option value="weekly">{t("register.step3.weekly")}</option>
          <option value="monthly">{t("register.step3.monthly")}</option>
          <option value="occasionally">{t("register.step3.occasionally")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.islamicClasses")}</label>
        <select name="islamicClassesAttendance" value={localData.islamicClassesAttendance || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="regularly">{t("register.step3.regularly")}</option>
          <option value="sometimes">{t("register.step3.sometimes")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
          <option value="never">{t("register.step3.never")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.preferredCommitment")}</label>
        <select name="preferredReligiousCommitment" value={localData.preferredReligiousCommitment || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="practicing">{t("register.step3.practicing")}</option>
          <option value="moderately_practicing">{t("register.step3.moderatelyPracticing")}</option>
          <option value="traditional">{t("register.step3.traditional")}</option>
          <option value="any">{t("register.step3.any")}</option>
        </select>
      </div>
      <div className="space-y-3 pt-2 border-t border-charcoal-100 dark:border-charcoal-700">
        <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{t("register.step3.islamicTradition")}</p>
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.islamicTraditionQuestion")}</label>
          <select name="islamicTradition" value={localData.islamicTradition || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
            <option value="">{t("common.select")}</option>
            <option value="sunni">{t("register.step3.sunni")}</option>
            <option value="shia">{t("register.step3.shia")}</option>
            <option value="sufi">{t("register.step3.sufi")}</option>
            <option value="salafi">{t("register.step3.salafi")}</option>
            <option value="prefer_not">{t("common.preferNotToSay")}</option>
            <option value="other">{t("register.step3.otherSpecify")}</option>
          </select>
          {localData.islamicTradition === "other" && (
            <input name="islamicTraditionOther" type="text" placeholder={t("common.pleaseSpecify")} value={localData.islamicTraditionOther || ""} onChange={handleChange} className="w-full px-4 py-3 mt-2 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          )}
        </div>
        {localData.islamicTradition && localData.islamicTradition !== "prefer_not" && (
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step3.matchTradition")}</label>
            <select name="islamicMatchPreference" value={localData.islamicMatchPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
              <option value="">{t("common.select")}</option>
              <option value="own">{t("register.step3.traditionOwn")}</option>
              <option value="similar">{t("register.step3.traditionSimilar")}</option>
              <option value="any">{t("register.step3.traditionAny")}</option>
              <option value="no_preference">{t("common.noPreference")}</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function EducationStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const OCCUPATIONS = [
    "Accountant", "Actor", "Architect", "Artist", "Business Owner", "Consultant", "Dentist", "Doctor",
    "Engineer", "Entrepreneur", "Farmer", "Graphic Designer", "HR Manager", "Imam / Religious Scholar",
    "IT Specialist", "Journalist", "Judge", "Lawyer", "Lecturer", "Manager", "Merchant / Trader",
    "Military / Defense", "Nurse", "Pharmacist", "Photographer", "Physiotherapist", "Pilot", "Police Officer",
    "Politician", "Professor", "Programmer", "Psychologist", "Real Estate Agent", "Researcher", "Retail Manager",
    "Sales Representative", "Scientist", "Self-Employed", "Social Worker", "Software Developer", "Student",
    "Teacher", "Technician", "Translator", "Veterinarian", "Writer"
  ];

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const merged = { ...localData };
    if (merged.occupation === "other_occupation") merged.occupation = merged.occupationOther?.trim() || "Other";
    const err = validate(4, merged);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(merged);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step4.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step4.educationLevel")}</label>
        <select name="educationLevel" value={localData.educationLevel || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="high_school">{t("register.step4.highSchool")}</option>
          <option value="diploma">{t("register.step4.diploma")}</option>
          <option value="bachelor">{t("register.step4.bachelor")}</option>
          <option value="master">{t("register.step4.master")}</option>
          <option value="phd">{t("register.step4.phd")}</option>
          <option value="other">{t("register.step4.other")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step4.occupation")}</label>
        <select name="occupation" value={localData.occupation === "other_occupation" ? "other_occupation" : (OCCUPATIONS.includes(localData.occupation) ? localData.occupation : localData.occupation ? "other_occupation" : "")} onChange={(e) => { const v = e.target.value; setLocalData((prev: any) => ({ ...prev, occupation: v, occupationOther: v === "other_occupation" ? (prev.occupationOther || "") : v })); }} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="other_occupation">{t("register.step4.other")}</option>
        </select>
        {localData.occupation === "other_occupation" && (
          <input name="occupationOther" type="text" placeholder={t("register.step4.occupationPlaceholder")} value={localData.occupationOther || ""} onChange={handleChange} className="w-full px-4 py-3 mt-2 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step4.employmentStatus")}</label>
        <select name="employmentStatus" value={localData.employmentStatus || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="employed">{t("register.step4.employed")}</option>
          <option value="self_employed">{t("register.step4.selfEmployed")}</option>
          <option value="student">{t("register.step4.student")}</option>
          <option value="unemployed">{t("register.step4.unemployed")}</option>
          <option value="retired">{t("register.step4.retired")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step4.incomeRange")}</label>
        <select name="monthlyIncomeRange" value={localData.monthlyIncomeRange || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="below_5000">{t("register.step4.below5000")}</option>
          <option value="5000_10000">{t("register.step4.range5000to10000")}</option>
          <option value="10000_20000">{t("register.step4.range10000to20000")}</option>
          <option value="20000_50000">{t("register.step4.range20000to50000")}</option>
          <option value="above_50000">{t("register.step4.above50000")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function IntentionsStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(5, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step5.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step5.reason")}</label>
        <select name="reasonForJoining" value={localData.reasonForJoining || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="seeking_marriage">{t("register.step5.seekingMarriage")}</option>
          <option value="family_assisted">{t("register.step5.familyAssisted")}</option>
          <option value="exploring">{t("register.step5.exploring")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step5.timeline")}</label>
        <select name="desiredMarriageTimeline" value={localData.desiredMarriageTimeline || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="asap">{t("register.step5.asap")}</option>
          <option value="6_months">{t("register.step5.within6Months")}</option>
          <option value="1_year">{t("register.step5.within1Year")}</option>
          <option value="flexible">{t("register.step5.flexible")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step5.childrenPreference")}</label>
        <select name="childrenPreference" value={localData.childrenPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="yes">{t("register.step5.wantChildren")}</option>
          <option value="no">{t("register.step5.dontWantChildren")}</option>
          <option value="maybe">{t("register.step5.undecided")}</option>
        </select>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-charcoal-900 dark:text-white">{t("register.step5.personalPreference")}</p>
        <label className="flex items-start gap-3 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
          <input type="radio" name="personalPreference" value="no_experience" checked={localData.personalPreference === "no_experience"} onChange={handleChange} className="sr-only mt-0.5" />
          <span className="text-sm text-charcoal-700 dark:text-charcoal-300">{t("register.step5.preferNoExperience")}</span>
        </label>
        <label className="flex items-start gap-3 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
          <input type="radio" name="personalPreference" value="no_preference" checked={localData.personalPreference === "no_preference"} onChange={handleChange} className="sr-only mt-0.5" />
          <span className="text-sm text-charcoal-700 dark:text-charcoal-300">{t("register.step5.noPreference")}</span>
        </label>
        <label className="flex items-start gap-3 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
          <input type="radio" name="personalPreference" value="prefer_not" checked={localData.personalPreference === "prefer_not"} onChange={handleChange} className="sr-only mt-0.5" />
          <span className="text-sm text-charcoal-700 dark:text-charcoal-300">{t("register.step5.preferNotToAnswer")}</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function FamilyStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(6, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step6.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step6.ethnicBackground")}</label>
        <input name="ethnicBackground" type="text" placeholder={t("register.step6.ethnicPlaceholder")} value={localData.ethnicBackground || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step6.motherTongue")}</label>
        <input name="motherTongue" type="text" placeholder={t("register.step6.motherTonguePlaceholder")} value={localData.motherTongue || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step6.familyInvolvement")}</label>
        <select name="familyInvolvement" value={localData.familyInvolvement || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="high">{t("register.step6.highlyInvolved")}</option>
          <option value="moderate">{t("register.step6.moderate")}</option>
          <option value="minimal">{t("register.step6.minimal")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function LifestyleStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(7, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step7.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step7.smoking")}</label>
        <select name="smokingHabits" value={localData.smokingHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="never">{t("register.step7.never")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="regularly">{t("register.step7.regularly")}</option>
          <option value="trying_to_quit">{t("register.step7.tryingToQuit")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step7.khat")}</label>
        <select name="khatUsage" value={localData.khatUsage || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="never">{t("register.step7.never")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="regularly">{t("register.step7.regularly")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step7.exercise")}</label>
        <select name="exerciseHabits" value={localData.exerciseHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="daily">{t("register.step3.daily")}</option>
          <option value="weekly">{t("register.step3.weekly")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step7.livingPreference")}</label>
        <select name="livingPreference" value={localData.livingPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="independent">{t("register.step7.independent")}</option>
          <option value="with_family">{t("register.step7.withFamily")}</option>
          <option value="flexible">{t("register.step7.flexible")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function PersonalityStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(8, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step8.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step8.selfDescription")}</label>
        <WordSuggest
          value={localData.selfDescription || ""}
          onChange={(val) => setLocalData((prev: any) => ({ ...prev, selfDescription: val }))}
          placeholder={t("register.step8.selfDescriptionPlaceholder")}
          rows={3}
          className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step8.qualities")}</label>
        <div className="grid grid-cols-2 gap-2">
          {["Honest", "Patient", "Caring", "Respectful", "Kind", "Generous", "Humble", "Ambitious"].map((quality) => (
            <label key={quality} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent">
              <input type="checkbox" name="qualities" value={quality.toLowerCase()} onChange={handleChange} className="rounded" />
              <span className="text-sm">{t("register.step8." + quality.toLowerCase())}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step8.interests")}</label>
        <WordSuggest
          value={localData.interests || ""}
          onChange={(val) => setLocalData((prev: any) => ({ ...prev, interests: val }))}
          placeholder={t("register.step8.interestsPlaceholder")}
          rows={3}
          className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function PreferencesStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(9, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">{t("register.step9.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.ageRange")}</label>
          <div className="flex gap-2">
            <input name="preferredAgeMin" type="number" placeholder={t("register.step9.min")} value={localData.preferredAgeMin || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            <input name="preferredAgeMax" type="number" placeholder={t("register.step9.max")} value={localData.preferredAgeMax || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.maritalStatus")}</label>
          <select name="preferredMaritalStatus" value={localData.preferredMaritalStatus || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
            <option value="">{t("common.select")}</option>
            <option value="single_never">{t("register.step2.singleVirgin")}</option>
            <option value="single_previous">{t("register.step2.singlePrevious")}</option>
            {localData.gender !== "male" && <option value="married">{t("register.step2.married")}</option>}
            <option value="divorced">{t("register.step2.divorced")}</option>
            <option value="widowed">{t("register.step2.widowed")}</option>
            <option value="any">{t("register.step3.any")}</option>
          </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.educationLevel")}</label>
        <select name="preferredEducationLevel" value={localData.preferredEducationLevel || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="high_school">{t("register.step4.highSchool")}</option>
          <option value="diploma">{t("register.step4.diploma")}</option>
          <option value="bachelor">{t("register.step4.bachelor")}</option>
          <option value="master">{t("register.step4.master")}</option>
          <option value="phd">{t("register.step4.phd")}</option>
          <option value="any">{t("register.step3.any")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.location")}</label>
        <input name="preferredLocation" type="text" placeholder={t("register.step9.locationPlaceholder")} value={localData.preferredLocation || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.waliInvolvement")}</label>
        <select name="waliInvolvement" value={localData.waliInvolvement || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="required">{t("register.step9.required")}</option>
          <option value="preferred">{t("register.step9.preferred")}</option>
          <option value="optional">{t("register.step9.optional")}</option>
        </select>
      </div>
      {localData.gender !== "male" && (
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.polygamy")}</label>
        <select name="polygamyPreference" value={localData.polygamyPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="not_acceptable">{t("register.step9.polygamyNotAcceptable")}</option>
          <option value="acceptable">{t("register.step9.polygamyAcceptable")}</option>
          <option value="depends">{t("register.step9.polygamyDepends")}</option>
        </select>
      </div>
      )}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.mahr")}</label>
        <input name="mahrExpectation" type="text" placeholder={t("register.step9.mahrPlaceholder")} value={localData.mahrExpectation || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{t("register.step9.genderInteraction")}</label>
        <select name="genderInteraction" value={localData.genderInteraction || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">{t("common.select")}</option>
          <option value="conservative">{t("register.step9.conservative")}</option>
          <option value="moderate">{t("register.step9.moderate")}</option>
          <option value="flexible">{t("register.step9.flexible")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function HealthStep({ formData, updateFormData, handleSubmit, isSubmitting, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleNext = () => {
    const err = validate(10, localData);
    if (err) { setError(err); return; }
    setError("");
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const merged = { ...formData, ...localData };
    updateFormData(localData);
    handleSubmit(merged);
  };

  const SelectField = ({ name, label, options, value, detailName, noOther }: { name: string; label: string; options: { value: string; label: string }[]; value?: string; detailName?: string; noOther?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{label}</label>
      <select name={name} value={value || ""} onChange={handleChange}
        className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
        <option value="">{t("common.select")}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {!noOther && <option value="other">{t("common.other")}</option>}
      </select>
      {value === "other" && detailName && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("common.pleaseSpecify")}</label>
          <input name={detailName} value={localData[detailName] || ""} onChange={handleChange}
            placeholder={t("register.step10.dwarfismRequired")}
            className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
      )}
    </div>
  );

  const yesNoOptions = [
    { value: "yes", label: t("common.yes") },
    { value: "no", label: t("common.no") },
  ];

  const statusOptions = [
    { value: "yes", label: t("common.yes") },
    { value: "no", label: t("common.no") },
  ];

  const preferenceOptions = [
    { value: "any", label: "No preference — show all" },
    { value: "disclosed", label: "Only show people who have disclosed their status" },
    { value: "matching", label: "Only show people with compatible health information" },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("register.step10.title")}</h3>
      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">{t("register.step10.disclaimer")}</p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t("register.step10.importantDisclaimer")}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {t("register.step10.disclaimerText")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.hivStatus")}</h4>
          <SelectField name="hivStatus" label={t("register.step10.yourHivStatus")} options={statusOptions} value={localData.hivStatus} noOther />
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.stds")}</h4>
          <div className="space-y-3">
            <SelectField name="stdStatus" label={t("register.step10.doYouHaveStds")} options={yesNoOptions} value={localData.stdStatus} noOther />
            {localData.stdStatus === "yes" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.pleaseSpecify")}</label>
                <input name="stdDetails" value={localData.stdDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.stdPlaceholder")}
                  className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.hereditary")}</h4>
          <div className="space-y-3">
            <SelectField name="hereditaryDiseases" label={t("register.step10.doYouHaveHereditary")} options={yesNoOptions} value={localData.hereditaryDiseases} noOther />
            {localData.hereditaryDiseases === "yes" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.pleaseSpecify")}</label>
                <input name="hereditaryDetails" value={localData.hereditaryDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.hereditaryPlaceholder")}
                  className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.chronic")}</h4>
          <div className="space-y-3">
            <SelectField name="chronicConditions" label={t("register.step10.doYouHaveChronic")} options={yesNoOptions} value={localData.chronicConditions} noOther />
            {localData.chronicConditions === "yes" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.pleaseSpecify")}</label>
                <input name="chronicDetails" value={localData.chronicDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.chronicPlaceholder")}
                  className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.disabilities")}</h4>
          <div className="space-y-3">
            <SelectField name="disabilities" label={t("register.step10.doYouHaveDisabilities")} options={yesNoOptions} value={localData.disabilities} noOther />
            {localData.disabilities === "yes" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.pleaseSpecify")}</label>
                <input name="disabilityDetails" value={localData.disabilityDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.disabilityPlaceholder")}
                  className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.dwarfism")}</h4>
          <div className="space-y-3">
            <select name="dwarfismStatus" value={localData.dwarfismStatus || ""} onChange={handleChange}
              className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">{t("common.select")}</option>
              <option value="none">{t("register.step10.dwarfismNone")}</option>
              <option value="achondroplasia">{t("register.step10.dwarfismAchondroplasia")}</option>
              <option value="hypochondroplasia">{t("register.step10.dwarfismHypochondroplasia")}</option>
              <option value="other">{t("register.step10.dwarfismOther")}</option>
            </select>
            {localData.dwarfismStatus === "other" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.pleaseSpecify")}</label>
                <input name="dwarfismDetails" value={localData.dwarfismDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.dwarfismRequired")}
                  className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-charcoal-100 dark:border-white/10">
          <h4 className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">{t("register.step10.otherConditions")}</h4>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">{t("register.step10.otherConditionsLabel")}</label>
            <textarea name="otherConditions" value={localData.otherConditions || ""} onChange={handleChange}
              placeholder={t("register.step10.otherConditionsPlaceholder")}
              rows={3}
              className="w-full px-4 py-2.5 bg-charcoal-50 dark:bg-black/60 dark:text-white border border-charcoal-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-xl border border-charcoal-100 dark:border-charcoal-700 p-6 max-w-sm w-full">
            <h4 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t("register.step10.confirmTitle")}</h4>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-6">
              {t("register.step10.confirmText")}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowConfirm(false)} variant="ghost" className="flex-1">{t("register.step10.goBack")}</Button>
              <Button onClick={handleConfirm} variant="primary" className="flex-1" loading={isSubmitting}>
                {isSubmitting ? t("register.step10.creating") : t("register.step10.yesImSure")}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3 pt-6">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1" loading={isSubmitting}>
          {isSubmitting ? t("register.step10.creatingAccount") : t("register.step10.createAccount")} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}


