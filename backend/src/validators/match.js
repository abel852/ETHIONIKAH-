const { z } = require("zod");

const sendInterestSchema = z.object({
  matchedUserId: z.string().min(1, "matchedUserId is required"),
  message: z.string().max(500, "Message too long").optional(),
});

const respondToInterestSchema = z.object({
  status: z.enum(["accepted", "rejected"], "Invalid status"),
  message: z.string().max(500).optional(),
});

const addFavoriteSchema = z.object({
  favoritedUserId: z.string().min(1, "favoritedUserId is required"),
});

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  ageMin: z.coerce.number().int().min(18).max(120).optional(),
  ageMax: z.coerce.number().int().min(18).max(120).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
}).strict();

module.exports = {
  sendInterestSchema,
  respondToInterestSchema,
  addFavoriteSchema,
  searchSchema,
};
