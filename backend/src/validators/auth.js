const { z } = require("zod");

// Helper: treat empty strings as undefined for optional number/boolean fields
const optionalNumber = (min, max) => z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(min).max(max).optional()
);
const optionalBoolean = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.boolean().optional()
);
// Helper: treat empty strings as undefined for optional string fields
const optionalString = (max) => z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.string().max(max).optional()
);

const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().transform((v) => {
    let cleaned = v.replace(/[\s\-()+]/g, "");
    if (cleaned.startsWith("09")) cleaned = "+2519" + cleaned.slice(2);
    else if (cleaned.startsWith("9") && cleaned.length === 9) cleaned = "+251" + cleaned;
    else if (cleaned.startsWith("2519")) cleaned = "+" + cleaned;
    return cleaned;
  }).pipe(
    z.string().regex(/^\+2519\d{8}$/, "Phone must be in format 09XXXXXXXXX (digits only)")
  ),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol (e.g. !@#$%)"),
  firstName: z.string().min(2, "First name too short").max(50, "First name too long").regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes"),
  lastName: z.string().min(2, "Last name too short").max(50, "Last name too long").regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes"),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),

  // Basic Info
  nationality: optionalString(100),
  country: optionalString(100),
  city: optionalString(100),
  height: optionalNumber(100, 250),
  weight: optionalString(50),
  appearance: optionalString(100),
  hasWali: optionalString(20),
  waliName: optionalString(100),
  waliPhone: optionalString(20),
  waliRelation: z.enum(["FATHER", "GRANDFATHER", "BROTHER", "UNCLE", "LEGAL_GUARDIAN", "OTHER"]).optional(),
  waliEmail: optionalString(255),
  maritalStatus: optionalString(50),
  hasChildren: optionalString(20),
  childrenCount: optionalString(20),
  childrenCustody: optionalString(100),
  childrenStatus: optionalString(100),

  // Religious Info
  religiousCommitment: optionalString(100),
  prayerHabits: optionalString(100),
  quranReadingFrequency: optionalString(100),
  islamicClassesAttendance: optionalString(100),
  islamicTradition: optionalString(100),
  islamicTraditionOther: optionalString(100),
  islamicMatchPreference: optionalString(100),
  preferredReligiousCommitment: optionalString(100),

  // Education & Career
  educationLevel: optionalString(100),
  occupation: optionalString(100),
  employmentStatus: optionalString(50),
  monthlyIncomeRange: optionalString(50),

  // Marriage Intentions
  reasonForJoining: optionalString(500),
  desiredMarriageTimeline: optionalString(100),
  childrenPreference: optionalString(100),

  // Family Background
  ethnicBackground: optionalString(100),
  motherTongue: optionalString(50),
  familyInvolvement: optionalString(100),

  // Lifestyle
  smokingHabits: optionalString(50),
  khatUsage: optionalString(50),
  exerciseHabits: optionalString(50),
  livingPreference: optionalString(100),

  // Personality & Interests
  selfDescription: optionalString(2000),
  qualities: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),
  interests: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),

  // Spouse Preferences
  preferredAgeMin: optionalNumber(18, 120),
  preferredAgeMax: optionalNumber(18, 120),
  preferredMaritalStatus: optionalString(50),
  preferredEducationLevel: optionalString(100),
  preferredLocation: optionalString(100),
  waliInvolvement: optionalString(100),
  polygamyPreference: optionalString(50),
  mahrExpectation: optionalString(200),
  genderInteraction: optionalString(100),

  // Health Information (optional)
  hivStatus: optionalString(50),
  stdStatus: optionalString(50),
  stdDetails: optionalString(500),
  hereditaryDiseases: optionalString(50),
  hereditaryDetails: optionalString(500),
  chronicConditions: optionalString(50),
  chronicDetails: optionalString(500),
  disabilities: optionalString(50),
  disabilityDetails: optionalString(500),
  dwarfismStatus: optionalString(50),
  dwarfismDetails: optionalString(500),
  otherConditions: optionalString(500),
  shareWithMatches: optionalBoolean,
  hivMatchPreference: optionalString(50),
  stdMatchPreference: optionalString(50),
  hereditaryMatchPreference: optionalString(50),
  healthMatchPreference: optionalString(50),
  personalPreference: optionalString(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(9, "Phone number is required"),
  password: z.string().min(1),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = { registerSchema, loginSchema, phoneLoginSchema, validate };
