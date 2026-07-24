const { z } = require("zod");

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  bio: z.string().max(1000, "Bio too long (max 1000 chars)").optional(),
  height: z.coerce.number().int().min(100).max(250).optional(),
  weight: z.coerce.number().int().min(30).max(300).optional(),
  occupation: z.string().max(100).optional(),
  educationLevel: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  appearance: z.string().max(100).optional(),
  maritalStatus: z.string().max(50).optional(),
  religiousCommitment: z.string().max(100).optional(),
  prayerHabits: z.string().max(100).optional(),
  selfDescription: z.string().max(2000).optional(),
  qualities: z.union([z.string(), z.array(z.string())]).optional(),
  interests: z.union([z.string(), z.array(z.string())]).optional(),
}).strict();

const updateProfileStepSchema = z.object({
  step: z.coerce.number().int().min(1).max(10),
  data: z.record(z.any()),
}).strict();

module.exports = {
  updateProfileSchema,
  updateProfileStepSchema,
};
