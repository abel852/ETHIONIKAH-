const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().transform((v) => v.replace(/[\s\-()]/g, "")).pipe(
    z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),

  // Basic Info
  nationality: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  height: z.coerce.number().int().optional(),
  maritalStatus: z.string().optional(),
  childrenStatus: z.string().optional(),

  // Religious Info
  religiousCommitment: z.string().optional(),
  prayerHabits: z.string().optional(),
  quranReadingFrequency: z.string().optional(),
  islamicClassesAttendance: z.string().optional(),
  preferredReligiousCommitment: z.string().optional(),

  // Education & Career
  educationLevel: z.string().optional(),
  occupation: z.string().optional(),
  employmentStatus: z.string().optional(),
  monthlyIncomeRange: z.string().optional(),

  // Marriage Intentions
  reasonForJoining: z.string().optional(),
  desiredMarriageTimeline: z.string().optional(),
  childrenPreference: z.string().optional(),

  // Family Background
  ethnicBackground: z.string().optional(),
  motherTongue: z.string().optional(),
  familyInvolvement: z.string().optional(),

  // Lifestyle
  smokingHabits: z.string().optional(),
  khatUsage: z.string().optional(),
  exerciseHabits: z.string().optional(),
  livingPreference: z.string().optional(),

  // Personality & Interests
  selfDescription: z.string().optional(),
  qualities: z.union([z.string(), z.array(z.string())]).optional(),
  interests: z.union([z.string(), z.array(z.string())]).optional(),

  // Spouse Preferences
  preferredAgeMin: z.coerce.number().int().optional(),
  preferredAgeMax: z.coerce.number().int().optional(),
  preferredMaritalStatus: z.string().optional(),
  preferredEducationLevel: z.string().optional(),
  preferredLocation: z.string().optional(),
  waliInvolvement: z.string().optional(),
  polygamyPreference: z.string().optional(),
  mahrExpectation: z.string().optional(),
  genderInteraction: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
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

module.exports = { registerSchema, loginSchema, validate };
