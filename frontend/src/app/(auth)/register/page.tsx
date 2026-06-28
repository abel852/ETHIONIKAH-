"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Check, Calendar, 
  Briefcase, GraduationCap, MapPin, Heart, BookOpen, Building2, Baby, 
  Users, Globe, Cigarette, Dumbbell, Home, Sparkles, Upload, ChevronLeft,
  ChevronRight, Shield, FileText, Camera
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/common";
import { authService } from "@/services/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  "Verification"
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (files?: { profilePhoto?: File; nationalId?: File; selfie?: File }) => {
    setIsSubmitting(true);
    try {
      const { data } = await authService.register(formData);
      if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.removeItem(LS_DATA);
      localStorage.removeItem(LS_STEP);
      if (files?.profilePhoto || files?.nationalId || files?.selfie) {
        try {
          if (files.profilePhoto) {
            const pf = new FormData();
            pf.append("profilePhoto", files.profilePhoto);
            await api.post("/profile/photo", pf, { headers: { "Content-Type": "multipart/form-data" } });
          }
          const vf = new FormData();
          if (files.nationalId) vf.append("nationalId", files.nationalId);
          if (files.selfie) vf.append("selfie", files.selfie);
          if (files.nationalId || files.selfie) {
            await api.post("/verification", vf, { headers: { "Content-Type": "multipart/form-data" } });
          }
        } catch { /* docs upload optional */ }
      }
      toast.success("Account created! Your documents have been sent for verification.");
      window.location.href = "/matches";
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.error || data?.errors?.[0]?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (step: number, data: any): string | null => {
    const e = (msg: string) => msg;
    switch (step) {
      case 1:
        if (!data.firstName?.trim()) return e("First name is required");
        if (!data.lastName?.trim()) return e("Last name is required");
        if (!data.email?.trim()) return e("Email is required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return e("Invalid email format");
        if (!data.phone?.trim()) return e("Phone number is required");
        if (!/^\+?[\d\s\-()]{7,15}$/.test(data.phone)) return e("Invalid phone number");
        if (!data.password) return e("Password is required");
        if (data.password.length < 8) return e("Password must be at least 8 characters");
        return null;
      case 2:
        if (!data.gender) return e("Gender is required");
        if (!data.dateOfBirth) return e("Date of birth is required");
        { const b = new Date(data.dateOfBirth), t = new Date(); let a = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--; if (a < 18) return e("You must be at least 18 years old"); }
        if (!data.nationality?.trim()) return e("Nationality is required");
        if (data.nationality === "Other" && !data.nationalityOther?.trim()) return e("Please specify your nationality");
        if (!data.country?.trim()) return e("Country of residence is required");
        if (data.country === "Other" && !data.countryOther?.trim()) return e("Please specify your country");
        if (!data.city?.trim()) return e("City is required");
        if (data.city === "Other" && !data.cityOther?.trim()) return e("Please specify your city");
        if (!data.maritalStatus) return e("Marital status is required");
        return null;
      case 3:
        if (!data.religiousCommitment) return e("Religious commitment is required");
        if (!data.prayerHabits) return e("Prayer habits are required");
        if (!data.quranReadingFrequency) return e("Quran reading frequency is required");
        return null;
      case 4:
        if (!data.educationLevel) return e("Education level is required");
        if (!data.occupation?.trim()) return e("Occupation is required");
        if (!data.employmentStatus) return e("Employment status is required");
        return null;
      case 5:
        if (!data.reasonForJoining) return e("Reason for joining is required");
        if (!data.desiredMarriageTimeline) return e("Desired marriage timeline is required");
        if (!data.childrenPreference) return e("Children preference is required");
        return null;
      case 6:
        if (!data.motherTongue?.trim()) return e("Mother tongue is required");
        if (!data.familyInvolvement) return e("Family involvement preference is required");
        return null;
      case 7:
        if (!data.smokingHabits) return e("Smoking habits are required");
        if (!data.khatUsage) return e("Khat usage is required");
        if (!data.exerciseHabits) return e("Exercise habits are required");
        if (!data.livingPreference) return e("Living preference is required");
        return null;
      case 8:
        if (!data.selfDescription?.trim()) return e("Self description is required");
        if (!data.interests?.trim()) return e("Interests and hobbies are required");
        return null;
      case 9:
        if (!data.preferredAgeMin) return e("Preferred minimum age is required");
        if (!data.preferredAgeMax) return e("Preferred maximum age is required");
        if (parseInt(data.preferredAgeMin) < 18) return e("Minimum age must be at least 18");
        if (parseInt(data.preferredAgeMax) < parseInt(data.preferredAgeMin)) return e("Maximum age cannot be less than minimum age");
        if (!data.preferredMaritalStatus) return e("Preferred marital status is required");
        if (!data.preferredEducationLevel) return e("Preferred education level is required");
        if (!data.preferredLocation?.trim()) return e("Preferred location is required");
        if (!data.waliInvolvement) return e("Wali/guardian involvement is required");
        if (!data.polygamyPreference) return e("Polygamy preference is required");
        if (!data.genderInteraction) return e("Gender interaction preference is required");
        return null;
      case 10: return null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-charcoal-900">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 dark:from-accent/10 dark:to-charcoal-800 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div>
            <Image src="/images/logo.png" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-charcoal-900 dark:ring-charcoal-700" />
            <h2 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white mb-4">Begin Your Journey</h2>
            <div className="space-y-4 text-left text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? "gold-gradient" : "bg-charcoal-200"}`}>
                  {currentStep > 1 ? <Check className="w-3 h-3 text-white" /> : <span className="text-white text-xs">1</span>}
                </div>
                <span className="text-charcoal-700 dark:text-charcoal-300">Account Creation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? "gold-gradient" : "bg-charcoal-200"}`}>
                  {currentStep > 2 ? <Check className="w-3 h-3 text-white" /> : <span className="text-white text-xs">2</span>}
                </div>
                <span className="text-charcoal-700 dark:text-charcoal-300">Basic Information</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? "gold-gradient" : "bg-charcoal-200"}`}>
                  {currentStep > 3 ? <Check className="w-3 h-3 text-white" /> : <span className="text-white text-xs">3</span>}
                </div>
                <span className="text-charcoal-700 dark:text-charcoal-300">Religious Information</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 10 ? "gold-gradient" : "bg-charcoal-200"}`}>
                  {currentStep > 10 ? <Check className="w-3 h-3 text-white" /> : <span className="text-white text-xs">10</span>}
                </div>
                <span className="text-charcoal-700 dark:text-charcoal-300">Verification</span>
              </div>
            </div>
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
            <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-charcoal-500 dark:text-charcoal-400">Step {currentStep} of {steps.length}: {steps[currentStep - 1]}</p>
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
            {currentStep === 10 && <VerificationStep key="step-10" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} validate={validate} />}

            <div className="mt-6 text-center">
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:text-accent-dark font-medium">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountStep({ formData, updateFormData, nextStep, showPassword, setShowPassword, validate }: any) {
  const [localData, setLocalData] = useState({ ...formData });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const err = validate(1, localData);
    if (err) { setError(err); return; }
    if (!acceptedTerms) { setError("Please accept the Terms & Conditions"); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };

  return (
    <div key="step-1" className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 1: Account Creation</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Full Name</label>
          <input name="firstName" type="text" placeholder="First Name" value={localData.firstName || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Last Name</label>
          <input name="lastName" type="text" placeholder="Last Name" value={localData.lastName || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Email Address</label>
        <input name="email" type="email" placeholder="your@email.com" value={localData.email || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Phone Number (for OTP)</label>
        <input name="phone" type="tel" placeholder="+251 911 000 000" value={localData.phone || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Password</label>
        <input name="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={localData.password || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-charcoal-400 hover:text-charcoal-600">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="rounded border-charcoal-300" />
        <label htmlFor="terms" className="text-sm text-charcoal-600 dark:text-charcoal-400">I agree to Terms & Conditions</label>
      </div>
      <Button onClick={handleNext} variant="primary" className="w-full" size="lg">
        Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function BasicInfoStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 2: Basic Profile Information</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Gender</label>
        <div className="grid grid-cols-2 gap-3">
          {["male", "female"].map(g => (
            <label key={g} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="gender" value={g} checked={localData.gender === g} onChange={handleChange} className="sr-only" />
              <span className="text-sm font-medium capitalize">{g}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Date of Birth</label>
        <div className="grid grid-cols-3 gap-3">
          <select name="dobDay" value={localData.dobDay || ""} onChange={handleDOB} className={sc}>
            <option value="">Day</option>
            {Array.from({length: 31}, (_, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>
            ))}
          </select>
          <select name="dobMonth" value={localData.dobMonth || ""} onChange={handleDOB} className={sc}>
            <option value="">Month</option>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((n, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{n}</option>
            ))}
          </select>
          <select name="dobYear" value={localData.dobYear || ""} onChange={handleDOB} className={sc}>
            <option value="">Year</option>
            {Array.from({length: 83}, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Nationality</label>
        <select name="nationality" value={localData.nationality === "Other" ? "Other" : localData.nationality || ""} onChange={handleSelect("nationality")} className={sc}>
          <option value="">Select nationality</option>
          {allNat.map(n => <option key={n} value={n}>{n}</option>)}
          <option value="Other">Other</option>
        </select>
        {localData.nationality === "Other" && (
          <input name="nationalityOther" placeholder="Please specify your nationality" value={localData.nationalityOther || ""} onChange={handleOther("nationality")} className={[sc, "mt-2"].join(" ")} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Country of Residence</label>
          <select name="country" value={localData.country === "Other" ? "Other" : localData.country || ""} onChange={handleSelect("country")} className={sc}>
            <option value="">Select country</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Other">Other</option>
          </select>
          {localData.country === "Other" && (
            <input name="countryOther" placeholder="Please specify your country" value={localData.countryOther || ""} onChange={handleOther("country")} className={[sc, "mt-2"].join(" ")} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">City</label>
          {(() => {
            const countryCities = localData.country && localData.country !== "Other" ? cityMap[localData.country] : null;
            return (
              <>
                <select name="city" value={localData.city === "Other" ? "Other" : localData.city || ""} onChange={handleSelect("city")} className={sc}>
                  <option value="">
                    {!localData.country ? "Select a country first" : countryCities ? "Select city" : "No cities listed"}
                  </option>
                  {countryCities?.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">Other</option>
                </select>
                {localData.city === "Other" && (
                  <input name="cityOther" placeholder="Please specify your city" value={localData.cityOther || ""} onChange={handleOther("city")} className={[sc, "mt-2"].join(" ")} />
                )}
              </>
            );
          })()}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Height (cm)</label>
        <input name="height" type="number" placeholder="175" value={localData.height || ""} onChange={handleChange} className={sc} />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Marital Status</label>
        <select name="maritalStatus" value={localData.maritalStatus || ""} onChange={handleChange} className={sc}>
          <option value="">Select status</option>
          <option value="single">Single</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Children Status</label>
        <select name="childrenStatus" value={localData.childrenStatus || ""} onChange={handleChange} className={sc}>
          <option value="">Select</option>
          <option value="none">None</option>
          <option value="living_with_me">Living with me</option>
          <option value="not_living_with_me">Not living with me</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function ReligiousStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 3: Religious Information</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Religious Commitment</label>
        <select name="religiousCommitment" value={localData.religiousCommitment || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="practicing">Practicing</option>
          <option value="moderately_practicing">Moderately Practicing</option>
          <option value="traditional">Traditional</option>
          <option value="seeking">Seeking Knowledge</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Prayer Habits</label>
        <select name="prayerHabits" value={localData.prayerHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="always">Always (5 times)</option>
          <option value="usually">Usually</option>
          <option value="sometimes">Sometimes</option>
          <option value="rarely">Rarely</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Quran Reading Frequency</label>
        <select name="quranReadingFrequency" value={localData.quranReadingFrequency || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="occasionally">Occasionally</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Islamic Classes Attendance</label>
        <select name="islamicClassesAttendance" value={localData.islamicClassesAttendance || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="regularly">Regularly</option>
          <option value="sometimes">Sometimes</option>
          <option value="rarely">Rarely</option>
          <option value="never">Never</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Religious Commitment in Spouse</label>
        <select name="preferredReligiousCommitment" value={localData.preferredReligiousCommitment || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="practicing">Practicing</option>
          <option value="moderately_practicing">Moderately Practicing</option>
          <option value="traditional">Traditional</option>
          <option value="any">Any</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function EducationStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");

  const OCCUPATIONS = [
    "Accountant", "Actor", "Architect", "Artist", "Business Owner", "Consultant", "Dentist", "Doctor",
    "Engineer", "Entrepreneur", "Farmer", "Graphic Designer", "HR Manager", "Imam / Religious Scholar",
    "IT Specialist", "Journalist", "Judge", "Lawyer", "Lecturer", "Manager", "Military / Defense",
    "Nurse", "Pharmacist", "Photographer", "Physiotherapist", "Pilot", "Police Officer", "Politician",
    "Professor", "Programmer", "Psychologist", "Real Estate Agent", "Researcher", "Retail Manager",
    "Sales Representative", "Scientist", "Social Worker", "Software Developer", "Student", "Teacher",
    "Technician", "Translator", "Veterinarian", "Writer"
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 4: Education & Career</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Highest Education Level</label>
        <select name="educationLevel" value={localData.educationLevel || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
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
        <select name="occupation" value={localData.occupation === "other_occupation" ? "other_occupation" : (OCCUPATIONS.includes(localData.occupation) ? localData.occupation : localData.occupation ? "other_occupation" : "")} onChange={(e) => { const v = e.target.value; setLocalData((prev: any) => ({ ...prev, occupation: v, occupationOther: v === "other_occupation" ? (prev.occupationOther || "") : v })); }} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="other_occupation">Other</option>
        </select>
        {localData.occupation === "other_occupation" && (
          <input name="occupationOther" type="text" placeholder="Enter your occupation" value={localData.occupationOther || ""} onChange={handleChange} className="w-full px-4 py-3 mt-2 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Employment Status</label>
        <select name="employmentStatus" value={localData.employmentStatus || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="employed">Employed</option>
          <option value="self_employed">Self-Employed</option>
          <option value="student">Student</option>
          <option value="unemployed">Unemployed</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Monthly Income Range (Optional)</label>
        <select name="monthlyIncomeRange" value={localData.monthlyIncomeRange || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="below_5000">Below 5,000 ETB</option>
          <option value="5000_10000">5,000 - 10,000 ETB</option>
          <option value="10000_20000">10,000 - 20,000 ETB</option>
          <option value="20000_50000">20,000 - 50,000 ETB</option>
          <option value="above_50000">Above 50,000 ETB</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function IntentionsStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 5: Marriage Intentions</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Reason for Joining</label>
        <select name="reasonForJoining" value={localData.reasonForJoining || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="seeking_marriage">Seeking Marriage</option>
          <option value="family_assisted">Family-Assisted</option>
          <option value="exploring">Exploring Options</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Desired Marriage Timeline</label>
        <select name="desiredMarriageTimeline" value={localData.desiredMarriageTimeline || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="asap">As soon as possible</option>
          <option value="6_months">Within 6 months</option>
          <option value="1_year">Within 1 year</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Children Preference</label>
        <select name="childrenPreference" value={localData.childrenPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="yes">Yes, want children</option>
          <option value="no">No, don't want children</option>
          <option value="maybe">Maybe / Undecided</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function FamilyStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 6: Family Background</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Ethnic Background (Optional)</label>
        <input name="ethnicBackground" type="text" placeholder="Oromo, Amhara, etc." value={localData.ethnicBackground || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Mother Tongue</label>
        <input name="motherTongue" type="text" placeholder="Afaan Oromoo, Amharic, etc." value={localData.motherTongue || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Family Involvement Preference</label>
        <select name="familyInvolvement" value={localData.familyInvolvement || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="high">Highly Involved</option>
          <option value="moderate">Moderate</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function LifestyleStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 7: Lifestyle</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Smoking Habits</label>
        <select name="smokingHabits" value={localData.smokingHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="never">Never</option>
          <option value="occasionally">Occasionally</option>
          <option value="regularly">Regularly</option>
          <option value="trying_to_quit">Trying to quit</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Khat Usage</label>
        <select name="khatUsage" value={localData.khatUsage || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="never">Never</option>
          <option value="occasionally">Occasionally</option>
          <option value="regularly">Regularly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Exercise Habits</label>
        <select name="exerciseHabits" value={localData.exerciseHabits || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="occasionally">Occasionally</option>
          <option value="rarely">Rarely</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Living Preference After Marriage</label>
        <select name="livingPreference" value={localData.livingPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="independent">Independent</option>
          <option value="with_family">With Family</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function PersonalityStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 8: Personality & Interests</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Self Description</label>
        <textarea name="selfDescription" rows={3} placeholder="Tell us about yourself..." value={localData.selfDescription || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Qualities (select all that apply)</label>
        <div className="grid grid-cols-2 gap-2">
          {["Honest", "Patient", "Caring", "Respectful", "Kind", "Generous", "Humble", "Ambitious"].map((quality) => (
            <label key={quality} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal-200 dark:border-charcoal-700 cursor-pointer hover:border-accent">
              <input type="checkbox" name="qualities" value={quality.toLowerCase()} onChange={handleChange} className="rounded" />
              <span className="text-sm">{quality}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Interests & Hobbies</label>
        <textarea name="interests" rows={3} placeholder="Reading, Sports, Travel, Islamic Studies, etc." value={localData.interests || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function PreferencesStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
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
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 9: Spouse Preferences</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Age Range</label>
          <div className="flex gap-2">
            <input name="preferredAgeMin" type="number" placeholder="Min" value={localData.preferredAgeMin || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            <input name="preferredAgeMax" type="number" placeholder="Max" value={localData.preferredAgeMax || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Marital Status</label>
        <select name="preferredMaritalStatus" value={localData.preferredMaritalStatus || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="single">Single</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
          <option value="any">Any</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Education Level</label>
        <select name="preferredEducationLevel" value={localData.preferredEducationLevel || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="high_school">High School</option>
          <option value="diploma">Diploma</option>
          <option value="bachelor">Bachelor's Degree</option>
          <option value="master">Master's Degree</option>
          <option value="phd">PhD</option>
          <option value="any">Any</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Preferred Location</label>
        <input name="preferredLocation" type="text" placeholder="Ethiopia or specific city" value={localData.preferredLocation || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Wali/Guardian Involvement</label>
        <select name="waliInvolvement" value={localData.waliInvolvement || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="required">Required</option>
          <option value="preferred">Preferred</option>
          <option value="optional">Optional</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Polygamy Preference</label>
        <select name="polygamyPreference" value={localData.polygamyPreference || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="not_acceptable">Not Acceptable</option>
          <option value="acceptable">Acceptable</option>
          <option value="depends">Depends on circumstances</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Mahr Expectation</label>
        <input name="mahrExpectation" type="text" placeholder="Describe your expectation" value={localData.mahrExpectation || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Gender Interaction Preference</label>
        <select name="genderInteraction" value={localData.genderInteraction || ""} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
          <option value="">Select</option>
          <option value="conservative">Conservative</option>
          <option value="moderate">Moderate</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}

function VerificationStep({ formData, updateFormData, nextStep, prevStep, handleSubmit, isSubmitting, validate }: any) {
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const [files, setFiles] = useState<{ profilePhoto?: File; nationalId?: File; selfie?: File }>({});
  const [previews, setPreviews] = useState<{ profilePhoto?: string; nationalId?: string; selfie?: string }>({});
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFile = (field: "profilePhoto" | "nationalId") => (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev: any) => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPreviews((prev: any) => ({ ...prev, [field]: ev.target?.result }));
    reader.readAsDataURL(file);
  };

  const removeFile = (field: "profilePhoto" | "nationalId" | "selfie") => () => {
    setFiles((prev: any) => ({ ...prev, [field]: undefined }));
    setPreviews((prev: any) => ({ ...prev, [field]: undefined }));
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setError("Camera access denied. Please allow camera permission to take a selfie.");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFiles((prev: any) => ({ ...prev, selfie: file }));
      setPreviews((prev: any) => ({ ...prev, selfie: URL.createObjectURL(blob) }));
      closeCamera();
    }, "image/jpeg", 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleSubmitStep = () => {
    const err = validate(10, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    handleSubmit(files);
  };

  const uploadBox = (field: "profilePhoto" | "nationalId", label: string, desc: string, Icon: any) => (
    <div>
      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">{label}</label>
      {previews[field] ? (
        <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-700">
          <img src={previews[field]} alt={label} className="w-full h-48 object-cover" />
          <button type="button" onClick={removeFile(field)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 px-3 py-1.5 bg-charcoal-50 dark:bg-charcoal-900">{files[field]?.name}</p>
        </div>
      ) : (
        <label className="border-2 border-dashed border-charcoal-200 dark:border-charcoal-700 rounded-xl p-6 text-center hover:border-accent transition-colors cursor-pointer block">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile(field)} className="hidden" />
          <Icon className="w-8 h-8 mx-auto text-charcoal-400 mb-2" />
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{desc}</p>
          <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-1">PNG, JPG up to 5MB</p>
        </label>
      )}
    </div>
  );

  return (
    <div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-4">Step 10: Verification</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-charcoal-900 dark:text-white">Verification Required</p>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">Upload your documents to get verified. While pending, you can browse profiles and save favorites but cannot message anyone.</p>
          </div>
        </div>
      </div>
      {uploadBox("profilePhoto", "Profile Photo", "Click to upload your profile photo", Camera)}
      {uploadBox("nationalId", "Government ID", "Click to upload your ID (Passport, National ID, or Driver's License)", FileText)}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">Selfie Photo</label>
        {previews.selfie ? (
          <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-700">
            <img src={previews.selfie} alt="Selfie" className="w-full h-48 object-cover" />
            <button type="button" onClick={removeFile("selfie")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 px-3 py-1.5 bg-charcoal-50 dark:bg-charcoal-900">selfie-captured.jpg</p>
          </div>
        ) : showCamera ? (
          <div className="border-2 border-charcoal-200 dark:border-charcoal-700 rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover bg-black" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3 p-3">
              <Button onClick={closeCamera} variant="ghost" className="flex-1">Cancel</Button>
              <Button onClick={captureSelfie} variant="primary" className="flex-1">Capture</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={openCamera} className="border-2 border-dashed border-charcoal-200 dark:border-charcoal-700 rounded-xl p-6 w-full text-center hover:border-accent transition-colors cursor-pointer">
            <Camera className="w-8 h-8 mx-auto text-charcoal-400 mb-2" />
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">Open camera to take a selfie holding your ID</p>
            <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-1">Camera only — no file upload</p>
          </button>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">Back</Button>
        <Button onClick={handleSubmitStep} variant="primary" className="flex-1" loading={isSubmitting}>Complete Registration <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
