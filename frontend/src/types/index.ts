export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  username?: string;
  gender: "male" | "female";
  dateOfBirth: string;
  role: "user" | "admin";
  adminRole?: "super_admin" | "admin" | null;
  permissions?: string[];
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  isPremium: boolean;
  membershipPlan?: string;
  membershipExpiry?: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  language?: string;
  createdAt: string;
  updatedAt: string;
  photos?: string[];
}

export interface Profile {
  id: string;
  userId: string;
  bio: string;
  firstName: string;
  lastName: string;
  nationality: string;
  country: string;
  city: string;
  height: number;
  maritalStatus: "single" | "divorced" | "widowed";
  childrenStatus: "none" | "living-with-me" | "not-living-with-me";
  religiousCommitment: "practicing" | "moderately-practicing" | "traditional" | "seeking";
  prayerHabits: "always" | "usually" | "sometimes" | "rarely";
  quranReading: "daily" | "weekly" | "occasionally" | "rarely";
  islamicClasses: boolean;
  preferredSpouseReligiousCommitment: string;
  education: string;
  occupation: string;
  employmentStatus: "employed" | "self-employed" | "student" | "unemployed";
  monthlyIncome?: string;
  marriageReason: "seeking-marriage" | "family-assisted" | "exploring";
  marriageTimeline: "6-months" | "1-year" | "2-years" | "no-rush";
  childrenPreference: "yes" | "no" | "maybe";
  ethnicity?: string;
  motherTongue: string;
  familyInvolvement: "high" | "moderate" | "minimal";
  smoking: "never" | "occasionally" | "regularly";
  khat: "never" | "occasionally" | "regularly";
  exercise: "daily" | "weekly" | "occasionally" | "never";
  livingPreference: "independent" | "with-family" | "flexible";
  qualities: string[];
  interests: string[];
  photos: string[];
  idPhoto?: string;
  selfiePhoto?: string;
  preferences: MarriagePreferences;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  isVerified: boolean;
}

export interface MarriagePreferences {
  ageMin: number;
  ageMax: number;
  maritalStatus: string[];
  education: string[];
  location: string[];
  religiousLevel: string[];
  waliInvolvement: "required" | "preferred" | "open";
  polygamyPreference: "yes" | "no" | "open";
  mahrExpectation: "minimal" | "moderate" | "generous" | "open";
  genderInteraction: "segregated" | "limited" | "moderate" | "open";
}

export interface Match {
  id: string;
  user: User;
  profile: Profile;
  compatibilityScore: number;
  compatibilityBreakdown?: Record<string, number>;
  status: "pending" | "accepted" | "rejected" | "blocked";
  interestSent: boolean;
  interestReceived: boolean;
  matchedAt?: string;
}

export interface RecommendedProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  dateOfBirth: string;
  isVerified: boolean;
  profile: Profile | null;
  compatibilityScore: number;
  compatibilityBreakdown?: Record<string, number>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId?: string;
  content: string;
  imageUrl?: string | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    sender: { id: string; firstName: string; lastName: string };
  } | null;
  readAt: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string | null;
  isReported?: boolean;
  isBlocked?: boolean;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isBlocked: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "match" | "interest" | "message" | "verification" | "system" | "admin";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface Complaint {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  totalMatches: number;
  successfulMatches: number;
  totalInterests: number;
  openComplaints: number;
  totalRevenue: number;
  premiumUsers: number;
  bannedUsers: number;
  monthlyRegistrations: { month: string; count: number }[];
  monthlyMatches: { month: string; count: number }[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration: "monthly" | "quarterly" | "yearly";
  features: string[];
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  method: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  user: User;
  idPhoto: string;
  selfiePhoto: string;
  profilePhoto?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}
