import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const step1AccountSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().regex(/^(09\d{8}|\+2519\d{8})$/, "Phone must be in format 09XXXXXXXXX or +251XXXXXXXXX"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol (e.g. !@#$%)"),
  confirmPassword: z.string(),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const step2BasicSchema = z.object({
  gender: z.enum(["male", "female"], { required_error: "Please select your gender" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  height: z.string().min(1, "Height is required"),
  maritalStatus: z.enum(["single", "divorced", "widowed"]),
  childrenStatus: z.enum(["none", "living-with-me", "not-living-with-me"]),
});

export const step3ReligiousSchema = z.object({
  religiousCommitment: z.enum(["practicing", "moderately-practicing", "traditional", "seeking"]),
  prayerHabits: z.enum(["always", "usually", "sometimes", "rarely"]),
  quranReading: z.enum(["daily", "weekly", "occasionally", "rarely"]),
  islamicClasses: z.enum(["yes", "no"]),
  preferredSpouseReligiousCommitment: z.string().min(1, "Please select an option"),
});

export const step4EducationSchema = z.object({
  education: z.string().min(2, "Education level is required"),
  occupation: z.string().min(2, "Occupation is required"),
  employmentStatus: z.enum(["employed", "self-employed", "student", "unemployed"]),
  monthlyIncome: z.string().optional(),
});

export const step5MarriageSchema = z.object({
  marriageReason: z.enum(["seeking-marriage", "family-assisted", "exploring"]),
  marriageTimeline: z.enum(["6-months", "1-year", "2-years", "no-rush"]),
  childrenPreference: z.enum(["yes", "no", "maybe"]),
});

export const step6FamilySchema = z.object({
  ethnicity: z.string().optional(),
  motherTongue: z.string().min(2, "Mother tongue is required"),
  familyInvolvement: z.enum(["high", "moderate", "minimal"]),
});

export const step7LifestyleSchema = z.object({
  smoking: z.enum(["never", "occasionally", "regularly"]),
  khat: z.enum(["never", "occasionally", "regularly"]),
  exercise: z.enum(["daily", "weekly", "occasionally", "never"]),
  livingPreference: z.enum(["independent", "with-family", "flexible"]),
});

export const step8PersonalitySchema = z.object({
  bio: z.string().max(500, "Description must be under 500 characters").optional(),
  qualities: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export const step9PreferencesSchema = z.object({
  ageMin: z.string().min(1, "Required"),
  ageMax: z.string().min(1, "Required"),
  preferredMaritalStatus: z.array(z.string()).min(1, "Select at least one"),
  preferredEducation: z.array(z.string()).min(1, "Select at least one"),
  preferredLocation: z.array(z.string()).min(1, "Select at least one"),
  waliInvolvement: z.enum(["required", "preferred", "open"]),
  polygamyPreference: z.enum(["yes", "no", "open"]),
  mahrExpectation: z.enum(["minimal", "moderate", "generous", "open"]),
  genderInteraction: z.enum(["segregated", "limited", "moderate", "open"]),
});

export const step10VerificationSchema = z.object({
  profilePhoto: z.any().optional(),
  idPhoto: z.any().optional(),
  selfiePhoto: z.any().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol (e.g. !@#$%)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type Step1AccountFormData = z.infer<typeof step1AccountSchema>;
export type Step2BasicFormData = z.infer<typeof step2BasicSchema>;
export type Step3ReligiousFormData = z.infer<typeof step3ReligiousSchema>;
export type Step4EducationFormData = z.infer<typeof step4EducationSchema>;
export type Step5MarriageFormData = z.infer<typeof step5MarriageSchema>;
export type Step6FamilyFormData = z.infer<typeof step6FamilySchema>;
export type Step7LifestyleFormData = z.infer<typeof step7LifestyleSchema>;
export type Step8PersonalityFormData = z.infer<typeof step8PersonalitySchema>;
export type Step9PreferencesFormData = z.infer<typeof step9PreferencesSchema>;
export type Step10VerificationFormData = z.infer<typeof step10VerificationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
