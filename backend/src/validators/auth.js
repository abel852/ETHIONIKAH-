const { z } = require("zod");

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
  nationality: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  height: z.coerce.number().int().min(100).max(250).optional(),
  weight: z.string().max(50).optional(),
  appearance: z.string().max(100).optional(),
  hasWali: z.string().max(20).optional(),
  waliName: z.string().max(100).optional(),
  waliPhone: z.string().max(20).optional(),
  waliRelation: z.string().max(50).optional(),
  maritalStatus: z.string().max(50).optional(),
  hasChildren: z.string().max(20).optional(),
  childrenCount: z.string().max(20).optional(),
  childrenCustody: z.string().max(100).optional(),
  childrenStatus: z.string().max(100).optional(),

  // Religious Info
  religiousCommitment: z.string().max(100).optional(),
  prayerHabits: z.string().max(100).optional(),
  quranReadingFrequency: z.string().max(100).optional(),
  islamicClassesAttendance: z.string().max(100).optional(),
  islamicTradition: z.string().max(100).optional(),
  islamicTraditionOther: z.string().max(100).optional(),
  islamicMatchPreference: z.string().max(100).optional(),
  preferredReligiousCommitment: z.string().max(100).optional(),

  // Education & Career
  educationLevel: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  employmentStatus: z.string().max(50).optional(),
  monthlyIncomeRange: z.string().max(50).optional(),

  // Marriage Intentions
  reasonForJoining: z.string().max(500).optional(),
  desiredMarriageTimeline: z.string().max(100).optional(),
  childrenPreference: z.string().max(100).optional(),

  // Family Background
  ethnicBackground: z.string().max(100).optional(),
  motherTongue: z.string().max(50).optional(),
  familyInvolvement: z.string().max(100).optional(),

  // Lifestyle
  smokingHabits: z.string().max(50).optional(),
  khatUsage: z.string().max(50).optional(),
  exerciseHabits: z.string().max(50).optional(),
  livingPreference: z.string().max(100).optional(),

  // Personality & Interests
  selfDescription: z.string().max(2000).optional(),
  qualities: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),
  interests: z.union([z.string().max(100), z.array(z.string().max(100))]).optional(),

  // Spouse Preferences
  preferredAgeMin: z.coerce.number().int().min(18).max(120).optional(),
  preferredAgeMax: z.coerce.number().int().min(18).max(120).optional(),
  preferredMaritalStatus: z.string().max(50).optional(),
  preferredEducationLevel: z.string().max(100).optional(),
  preferredLocation: z.string().max(100).optional(),
  waliInvolvement: z.string().max(100).optional(),
  polygamyPreference: z.string().max(50).optional(),
  mahrExpectation: z.string().max(200).optional(),
  genderInteraction: z.string().max(100).optional(),

  // Health Information (optional)
  hivStatus: z.string().max(50).optional(),
  stdStatus: z.string().max(50).optional(),
  stdDetails: z.string().max(500).optional(),
  hereditaryDiseases: z.string().max(50).optional(),
  hereditaryDetails: z.string().max(500).optional(),
  chronicConditions: z.string().max(50).optional(),
  chronicDetails: z.string().max(500).optional(),
  disabilities: z.string().max(50).optional(),
  disabilityDetails: z.string().max(500).optional(),
  dwarfismStatus: z.string().max(50).optional(),
  dwarfismDetails: z.string().max(500).optional(),
  otherConditions: z.string().max(500).optional(),
  shareWithMatches: z.coerce.boolean().optional(),
  hivMatchPreference: z.string().max(50).optional(),
  stdMatchPreference: z.string().max(50).optional(),
  hereditaryMatchPreference: z.string().max(50).optional(),
  healthMatchPreference: z.string().max(50).optional(),
  personalPreference: z.string().max(200).optional(),
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
