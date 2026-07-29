import {
  step2BasicSchema,
  step3ReligiousSchema,
  step4EducationSchema,
  step5MarriageSchema,
  step6FamilySchema,
  step7LifestyleSchema,
  step8PersonalitySchema,
  step9PreferencesSchema,
  verifyOtpSchema,
} from "@/lib/validations";

describe("step2BasicSchema", () => {
  const valid = {
    gender: "male" as const,
    dateOfBirth: "1995-01-01",
    nationality: "Ethiopian",
    country: "Ethiopia",
    city: "Addis Ababa",
    height: "175",
    maritalStatus: "single" as const,
    childrenStatus: "none" as const,
  };

  it("passes with valid data", () => {
    expect(step2BasicSchema.safeParse(valid).success).toBe(true);
  });

  it("passes with female gender", () => {
    expect(step2BasicSchema.safeParse({ ...valid, gender: "female" }).success).toBe(true);
  });

  it("fails with invalid gender", () => {
    expect(step2BasicSchema.safeParse({ ...valid, gender: "other" }).success).toBe(false);
  });

  it("fails with missing dateOfBirth", () => {
    expect(step2BasicSchema.safeParse({ ...valid, dateOfBirth: "" }).success).toBe(false);
  });

  it("fails with short nationality", () => {
    expect(step2BasicSchema.safeParse({ ...valid, nationality: "E" }).success).toBe(false);
  });

  it("fails with missing city", () => {
    expect(step2BasicSchema.safeParse({ ...valid, city: "" }).success).toBe(false);
  });

  it("fails with missing height", () => {
    expect(step2BasicSchema.safeParse({ ...valid, height: "" }).success).toBe(false);
  });

  it("passes with divorced marital status", () => {
    expect(step2BasicSchema.safeParse({ ...valid, maritalStatus: "divorced" }).success).toBe(true);
  });

  it("passes with widowed marital status", () => {
    expect(step2BasicSchema.safeParse({ ...valid, maritalStatus: "widowed" }).success).toBe(true);
  });

  it("passes with children living with me", () => {
    expect(step2BasicSchema.safeParse({ ...valid, childrenStatus: "living-with-me" }).success).toBe(true);
  });
});

describe("step3ReligiousSchema", () => {
  const valid = {
    religiousCommitment: "practicing" as const,
    prayerHabits: "always" as const,
    quranReading: "daily" as const,
    islamicClasses: "yes" as const,
    preferredSpouseReligiousCommitment: "moderately-practicing",
  };

  it("passes with valid data", () => {
    expect(step3ReligiousSchema.safeParse(valid).success).toBe(true);
  });

  it("fails with invalid religiousCommitment", () => {
    expect(step3ReligiousSchema.safeParse({ ...valid, religiousCommitment: "strict" }).success).toBe(false);
  });

  it("fails with missing preferredSpouseReligiousCommitment", () => {
    expect(step3ReligiousSchema.safeParse({ ...valid, preferredSpouseReligiousCommitment: "" }).success).toBe(false);
  });

  it("passes with seeking commitment", () => {
    expect(step3ReligiousSchema.safeParse({ ...valid, religiousCommitment: "seeking" }).success).toBe(true);
  });

  it("passes with rarely prayer habits", () => {
    expect(step3ReligiousSchema.safeParse({ ...valid, prayerHabits: "rarely" }).success).toBe(true);
  });
});

describe("step4EducationSchema", () => {
  const valid = {
    education: "Bachelor's Degree",
    occupation: "Software Engineer",
    employmentStatus: "employed" as const,
  };

  it("passes with valid data", () => {
    expect(step4EducationSchema.safeParse(valid).success).toBe(true);
  });

  it("passes with optional monthlyIncome", () => {
    expect(step4EducationSchema.safeParse({ ...valid, monthlyIncome: "5000" }).success).toBe(true);
  });

  it("fails with short education", () => {
    expect(step4EducationSchema.safeParse({ ...valid, education: "B" }).success).toBe(false);
  });

  it("fails with missing occupation", () => {
    expect(step4EducationSchema.safeParse({ ...valid, occupation: "" }).success).toBe(false);
  });

  it("fails with invalid employmentStatus", () => {
    expect(step4EducationSchema.safeParse({ ...valid, employmentStatus: "freelance" }).success).toBe(false);
  });

  it("passes with self-employed status", () => {
    expect(step4EducationSchema.safeParse({ ...valid, employmentStatus: "self-employed" }).success).toBe(true);
  });

  it("passes with student status", () => {
    expect(step4EducationSchema.safeParse({ ...valid, employmentStatus: "student" }).success).toBe(true);
  });
});

describe("step5MarriageSchema", () => {
  const valid = {
    marriageReason: "seeking-marriage" as const,
    marriageTimeline: "1-year" as const,
    childrenPreference: "yes" as const,
  };

  it("passes with valid data", () => {
    expect(step5MarriageSchema.safeParse(valid).success).toBe(true);
  });

  it("fails with invalid marriageReason", () => {
    expect(step5MarriageSchema.safeParse({ ...valid, marriageReason: "other" }).success).toBe(false);
  });

  it("passes with 6-months timeline", () => {
    expect(step5MarriageSchema.safeParse({ ...valid, marriageTimeline: "6-months" }).success).toBe(true);
  });

  it("passes with no-rush timeline", () => {
    expect(step5MarriageSchema.safeParse({ ...valid, marriageTimeline: "no-rush" }).success).toBe(true);
  });

  it("passes with maybe children preference", () => {
    expect(step5MarriageSchema.safeParse({ ...valid, childrenPreference: "maybe" }).success).toBe(true);
  });

  it("passes with no children preference", () => {
    expect(step5MarriageSchema.safeParse({ ...valid, childrenPreference: "no" }).success).toBe(true);
  });
});

describe("step6FamilySchema", () => {
  const valid = {
    motherTongue: "Amharic",
    familyInvolvement: "moderate" as const,
  };

  it("passes with valid data", () => {
    expect(step6FamilySchema.safeParse(valid).success).toBe(true);
  });

  it("passes with optional ethnicity", () => {
    expect(step6FamilySchema.safeParse({ ...valid, ethnicity: "Oromo" }).success).toBe(true);
  });

  it("fails with short motherTongue", () => {
    expect(step6FamilySchema.safeParse({ ...valid, motherTongue: "A" }).success).toBe(false);
  });

  it("passes with high family involvement", () => {
    expect(step6FamilySchema.safeParse({ ...valid, familyInvolvement: "high" }).success).toBe(true);
  });

  it("passes with minimal family involvement", () => {
    expect(step6FamilySchema.safeParse({ ...valid, familyInvolvement: "minimal" }).success).toBe(true);
  });
});

describe("step7LifestyleSchema", () => {
  const valid = {
    smoking: "never" as const,
    khat: "never" as const,
    exercise: "weekly" as const,
    livingPreference: "independent" as const,
  };

  it("passes with valid data", () => {
    expect(step7LifestyleSchema.safeParse(valid).success).toBe(true);
  });

  it("passes with occasionally smoking", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, smoking: "occasionally" }).success).toBe(true);
  });

  it("passes with regularly khat", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, khat: "regularly" }).success).toBe(true);
  });

  it("passes with daily exercise", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, exercise: "daily" }).success).toBe(true);
  });

  it("passes with never exercise", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, exercise: "never" }).success).toBe(true);
  });

  it("passes with with-family living preference", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, livingPreference: "with-family" }).success).toBe(true);
  });

  it("passes with flexible living preference", () => {
    expect(step7LifestyleSchema.safeParse({ ...valid, livingPreference: "flexible" }).success).toBe(true);
  });
});

describe("step8PersonalitySchema", () => {
  it("passes with empty optional data", () => {
    expect(step8PersonalitySchema.safeParse({}).success).toBe(true);
  });

  it("passes with bio under 500 chars", () => {
    expect(step8PersonalitySchema.safeParse({ bio: "I am a kind person" }).success).toBe(true);
  });

  it("fails with bio over 500 chars", () => {
    expect(step8PersonalitySchema.safeParse({ bio: "a".repeat(501) }).success).toBe(false);
  });

  it("passes with qualities array", () => {
    expect(step8PersonalitySchema.safeParse({ qualities: ["kind", "honest"] }).success).toBe(true);
  });

  it("passes with interests array", () => {
    expect(step8PersonalitySchema.safeParse({ interests: ["reading", "sports"] }).success).toBe(true);
  });
});

describe("step9PreferencesSchema", () => {
  const valid = {
    ageMin: "25",
    ageMax: "35",
    preferredMaritalStatus: ["single"],
    preferredEducation: ["Bachelor's Degree"],
    preferredLocation: ["Addis Ababa"],
    waliInvolvement: "required" as const,
    polygamyPreference: "no" as const,
    mahrExpectation: "moderate" as const,
    genderInteraction: "moderate" as const,
  };

  it("passes with valid data", () => {
    expect(step9PreferencesSchema.safeParse(valid).success).toBe(true);
  });

  it("fails with missing ageMin", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, ageMin: "" }).success).toBe(false);
  });

  it("fails with missing ageMax", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, ageMax: "" }).success).toBe(false);
  });

  it("fails with empty preferredMaritalStatus", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, preferredMaritalStatus: [] }).success).toBe(false);
  });

  it("fails with empty preferredEducation", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, preferredEducation: [] }).success).toBe(false);
  });

  it("fails with empty preferredLocation", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, preferredLocation: [] }).success).toBe(false);
  });

  it("passes with open waliInvolvement", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, waliInvolvement: "open" }).success).toBe(true);
  });

  it("passes with yes polygamyPreference", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, polygamyPreference: "yes" }).success).toBe(true);
  });

  it("passes with open mahrExpectation", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, mahrExpectation: "open" }).success).toBe(true);
  });

  it("passes with segregated genderInteraction", () => {
    expect(step9PreferencesSchema.safeParse({ ...valid, genderInteraction: "segregated" }).success).toBe(true);
  });
});

describe("verifyOtpSchema", () => {
  it("passes with 6-digit OTP", () => {
    expect(verifyOtpSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });

  it("fails with short OTP", () => {
    expect(verifyOtpSchema.safeParse({ otp: "12345" }).success).toBe(false);
  });

  it("fails with long OTP", () => {
    expect(verifyOtpSchema.safeParse({ otp: "1234567" }).success).toBe(false);
  });

  it("fails with empty OTP", () => {
    expect(verifyOtpSchema.safeParse({ otp: "" }).success).toBe(false);
  });
});
