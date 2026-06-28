"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin, Briefcase, GraduationCap, Heart, Globe, Languages,
  Book, Edit3, Shield, Calendar, Mail, Phone, Crown,
  Lock, KeyRound, RefreshCw, CheckCircle, XCircle,
  User, Users, Star, MessageCircle, Bell, Flag,
  CreditCard, Activity, Settings, LogOut,
  ChevronRight, Camera, ExternalLink, Loader2, AlertTriangle,
  Home, Sparkles, Smile, Ruler, Baby, Moon, BookOpen,
  DollarSign, TrendingUp, Zap, Coffee, Dumbbell,
  FileText, Check, X,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge, Card, VerifiedBadge } from "@/components/common";
import { ProfileImageEditor } from "@/components/profile/ProfileImageEditor";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profile";
import { notificationService } from "@/services/notifications";
import { matchService } from "@/services/matches";
import api from "@/lib/api";
import { mediaUrl, formatDate } from "@/lib/utils";

const labelize = (s?: string) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [twoFA, setTwoFA] = useState<any>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      await Promise.all([
        profileService.getMyProfile().then((r) => setProfile(r.data.profile)).catch(() => {}),
        notificationService.getUnreadCount().then((r) => setNotifCount(r.data.count || 0)).catch(() => {}),
        matchService.getFavorites().then((r) => {
          const list = r.data.favorites || r.data;
          setFavCount(Array.isArray(list) ? list.length : 0);
        }).catch(() => {}),
        api.get("/auth/2fa/status").then((r) => setTwoFA(r.data)).catch(() => {}),
      ]);
    } catch { /* all caught individually */ }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchAll();
  }, [user, authLoading, fetchAll, router]);

  const handleEditorSave = async (blob: Blob) => {
    setEditorOpen(false);
    setPhotoUploading(true);
    try {
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      await profileService.uploadPhoto(file);
      const [profileRes, userRes] = await Promise.all([
        profileService.getMyProfile(),
        api.get("/auth/me"),
      ]);
      setProfile(profileRes.data.profile);
      updateUser(userRes.data.user);
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
  };

  const handleSaveBio = async () => {
    try {
      await profileService.createOrUpdate({ bio: bioValue });
      setProfile((prev: any) => ({ ...prev, bio: bioValue }));
      setEditingBio(false);
      toast.success("Bio updated");
    } catch { toast.error("Failed to update bio"); }
  };

  const p = profile || {};
  const sp = (p as any).spousePreference;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.adminRole;

  const statCards = [
    { icon: Heart, label: "Interests Sent", value: "—", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { icon: Star, label: "Favorites", value: favCount, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { icon: Bell, label: "Unread Notifications", value: notifCount, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: Shield, label: "Verification", value: user?.verificationStatus === "verified" ? "Verified" : user?.verificationStatus === "pending" ? "Pending" : "Unverified", color: user?.verificationStatus === "verified" ? "text-green-500" : "text-charcoal-500", bg: user?.verificationStatus === "verified" ? "bg-green-50 dark:bg-green-500/10" : "bg-charcoal-100 dark:bg-charcoal-700" },
  ];

  const personalFields = [
    { icon: Calendar, label: "Date of Birth", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—" },
    { icon: Briefcase, label: "Occupation", value: p.occupation || "—" },
    { icon: GraduationCap, label: "Education", value: p.educationLevel || p.education || "—" },
    { icon: Globe, label: "Nationality", value: p.nationality || "—" },
    { icon: Languages, label: "Mother Tongue", value: p.motherTongue || "—" },
    { icon: Book, label: "Religious Practice", value: p.religiousCommitment ? labelize(p.religiousCommitment) : "—" },
    { icon: Heart, label: "Marital Status", value: p.maritalStatus ? labelize(p.maritalStatus) : "—" },
    { icon: Users, label: "Ethnicity", value: p.ethnicity || p.ethnicBackground || "—" },
    { icon: MapPin, label: "Location", value: [p.city, p.country].filter(Boolean).join(", ") || "—" },
    { icon: Ruler, label: "Height", value: p.height ? `${p.height} cm` : "—" },
    { icon: Baby, label: "Children Status", value: p.childrenStatus ? labelize(p.childrenStatus) : "—" },
    { icon: DollarSign, label: "Income", value: p.monthlyIncomeRange ? labelize(p.monthlyIncomeRange) : "—" },
    { icon: TrendingUp, label: "Employment", value: p.employmentStatus ? labelize(p.employmentStatus) : "—" },
  ];

  const spousePrefFields = sp ? [
    { label: "Age Range", value: sp.preferredAgeMin != null && sp.preferredAgeMax != null ? `${sp.preferredAgeMin} - ${sp.preferredAgeMax}` : "—" },
    { label: "Marital Status", value: labelize(sp.preferredMaritalStatus) },
    { label: "Education Level", value: labelize(sp.preferredEducationLevel) },
    { label: "Location", value: sp.preferredLocation || "—" },
    { label: "Religious Commitment", value: labelize(sp.preferredReligiousCommitment) },
    { label: "Wali Involvement", value: labelize(sp.waliInvolvement) },
    { label: "Polygamy Preference", value: labelize(sp.polygamyPreference) },
    { label: "Mahr Expectation", value: sp.mahrExpectation || "—" },
    { label: "Gender Interaction", value: labelize(sp.genderInteraction) },
  ] : [];

  if (authLoading) return (
    <div className="min-h-screen bg-blur-image flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="h-52 bg-charcoal-100 dark:bg-charcoal-800 rounded-3xl animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
            </div>
            <div className="h-96 bg-charcoal-100 dark:bg-charcoal-800 rounded-3xl animate-pulse" />
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-5xl mx-auto">
          <div className="space-y-6">

            {/* ─── PROFILE HEADER ─── */}
            <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
              <div className="h-28 sm:h-36 relative overflow-hidden bg-charcoal-200 dark:bg-charcoal-800">
                {p.photos?.[0] ? (
                  <img src={mediaUrl(p.photos[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="px-5 sm:px-7 pb-6 -mt-14 sm:-mt-18">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="relative group">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-charcoal-800 shadow-elevated overflow-hidden bg-gradient-to-br from-accent to-teal-500">
                      {p.photos?.[0] ? (
                        <img src={mediaUrl(p.photos[0])} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-full">
                          <span className="text-4xl font-display font-bold text-white">{initials || "U"}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setEditorOpen(true)} disabled={photoUploading}
                      className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent shadow-lg flex items-center justify-center hover:bg-accent-dark text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Change photo"
                    >
                      {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Change photo</span>
                    {user?.verificationStatus === "verified" && (
                      <div className="absolute -top-2 -right-2"><VerifiedBadge /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-2 sm:pt-16">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-white truncate">{fullName}</h1>
                          {user?.gender && <Badge size="sm" variant="default">{user.gender}</Badge>}
                        </div>
                        <p className="text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1.5 mt-1 text-sm">
                          <MapPin className="w-4 h-4 shrink-0" /> {p.city || "Not set"}{p.country ? `, ${p.country}` : ""}
                        </p>
                        {editingBio ? (
                          <div className="mt-2 space-y-2">
                            <textarea value={bioValue} onChange={(e) => setBioValue(e.target.value)}
                              className="w-full text-sm rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                              rows={2} placeholder="Write something about yourself..."
                            />
                            <div className="flex gap-2">
                              <Button variant="primary" size="sm" onClick={handleSaveBio}><Check className="w-3.5 h-3.5 mr-1" /> Save</Button>
                              <Button variant="secondary" size="sm" onClick={() => setEditingBio(false)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 mt-0.5">
                            <p className="text-charcoal-400 dark:text-charcoal-500 text-sm italic flex-1">
                              {p.bio ? `"${p.bio.slice(0, 120)}${p.bio.length > 120 ? "..." : ""}"` : "No bio yet"}
                            </p>
                            <button onClick={() => { setBioValue(p.bio || ""); setEditingBio(true); }}
                              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                      <Link href="/profile/edit">
                        <Button variant="secondary" size="sm" className="shrink-0 gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {user?.dateOfBirth && <Badge variant="gold" size="md">{new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()} yrs</Badge>}
                      {p.maritalStatus && <Badge size="md">{labelize(p.maritalStatus)}</Badge>}
                      {p.occupation && <Badge size="md">{p.occupation}</Badge>}
                      {p.religiousCommitment && <Badge size="md">{labelize(p.religiousCommitment)}</Badge>}
                      {(p as any).educationLevel && <Badge size="md">{(p as any).educationLevel}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── STATS ROW ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
                    <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── EMPTY STATE ─── */}
            {(!profile || !profile.id) && (
              <Card>
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">Complete Your Profile</h3>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-md mx-auto mb-5">
                    Fill in your personal details, preferences, and upload photos so our AI matchmaking can find the perfect spouse for you.
                  </p>
                  <Link href="/profile/edit">
                    <Button variant="primary" size="md">Create Profile</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* ─── MAIN CONTENT GRID ─── */}
            {profile && profile.id && (
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Account Information */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" /> Account
                  </h3>
                  <Crown className={`w-5 h-5 ${user?.isPremium ? "text-amber-500" : "text-charcoal-300"}`} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Email</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{user?.email || "—"}</p>
                      </div>
                    </div>
                    <Badge variant={user?.email ? "success" : "default"} size="sm">{user?.email ? "Verified" : "Unverified"}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Phone</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{user?.phone || "—"}</p>
                      </div>
                    </div>
                    <Badge variant={(user as any)?.isPhoneVerified ? "success" : "default"} size="sm">{(user as any)?.isPhoneVerified ? "Verified" : "Unverified"}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Membership</p>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">{user?.isPremium ? "Premium" : "Free"}</p>
                      </div>
                    </div>
                      {!user?.isPremium && (
                        <Link href="/settings"><Button variant="primary" size="sm">Upgrade</Button></Link>
                    )}
                  </div>
                </div>
              </Card>

              {/* Security & Settings */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-accent" /> Security
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Two-Factor Auth</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{twoFA?.enabled ? "Enabled" : "Disabled"}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Google Authenticator</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{twoFA?.hasSecret ? "Configured" : "Not set up"}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Password & Session</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Change password, logout all devices</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Spouse Preferences */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" /> Spouse Preferences
                  </h3>
                  <Link href="/preferences"><Badge variant="gold" size="sm" className="cursor-pointer">Edit</Badge></Link>
                </div>
                {spousePrefFields.length > 0 ? (
                  <div className="space-y-1.5">
                    {spousePrefFields.map((f) => (
                      <div key={f.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-charcoal-50/50 dark:hover:bg-charcoal-700/30">
                        <span className="text-xs text-charcoal-500 dark:text-charcoal-400">{f.label}</span>
                        <span className="text-sm font-medium text-charcoal-900 dark:text-white">{f.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-charcoal-400 mb-3">No spouse preferences set yet</p>
                    <Link href="/preferences"><Button variant="primary" size="sm">Set Preferences</Button></Link>
                  </div>
                )}
              </Card>

              {/* Matchmaking */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" /> Matchmaking
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/favorites" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Saved Favorites</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{favCount} saved profiles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/matches" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Match Suggestions</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">AI-powered recommendations</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Activity & History */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> Activity
                  </h3>
                </div>
                <div className="space-y-2">
                  <Link href="/messages" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Messages</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Recent conversations</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Notifications</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{notifCount} unread</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                  <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal-900 dark:text-white">Subscription</p>
                        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">Plan & billing history</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-accent transition-colors" />
                  </Link>
                </div>
              </Card>

              {/* Admin Section */}
              {isAdmin && (
                <div className="lg:col-span-2">
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" /> Admin Panel
                      </h3>
                      <Badge variant="gold" size="sm">Admin</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { href: "/admin/users", icon: Users, label: "User Management", desc: "View & manage users", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                        { href: "/admin/verifications", icon: Shield, label: "Verifications", desc: "Review ID & selfie docs", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                        { href: "/admin/complaints", icon: Flag, label: "Complaints", desc: "Resolve disputes", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
                        { href: "/admin", icon: Activity, label: "Analytics", desc: "Dashboard & stats", color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href}
                          className="flex items-start gap-3 p-4 rounded-xl hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50 transition-colors border border-charcoal-100/50 dark:border-charcoal-700"
                        >
                          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-charcoal-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
            )}

            {/* ─── PERSONAL INFO ─── */}
            {profile && profile.id && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-accent" /> Personal Information
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalFields.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <item.icon className="w-4 h-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>}

            {/* ─── RELIGIOUS & LIFESTYLE ─── */}
            {profile && profile.id && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <Moon className="w-4 h-4 text-accent" /> Religious & Lifestyle
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Moon, label: "Prayer Habits", value: p.prayerHabits ? labelize(p.prayerHabits) : "—" },
                  { icon: BookOpen, label: "Quran Reading", value: p.quranReadingFrequency ? labelize(p.quranReadingFrequency) : "—" },
                  { icon: Book, label: "Islamic Classes", value: p.islamicClassesAttendance ? labelize(p.islamicClassesAttendance) : "—" },
                  { icon: Users, label: "Family Involvement", value: p.familyInvolvement ? labelize(p.familyInvolvement) : "—" },
                  { icon: Zap, label: "Smoking", value: p.smokingHabits ? labelize(p.smokingHabits) : "—" },
                  { icon: Coffee, label: "Khat Usage", value: p.khatUsage ? labelize(p.khatUsage) : "—" },
                  { icon: Dumbbell, label: "Exercise", value: p.exerciseHabits ? labelize(p.exerciseHabits) : "—" },
                  { icon: Home, label: "Living Preference", value: p.livingPreference ? labelize(p.livingPreference) : "—" },
                  { icon: Heart, label: "Marriage Timeline", value: p.desiredMarriageTimeline ? labelize(p.desiredMarriageTimeline) : "—" },
                  { icon: Baby, label: "Children Preference", value: p.childrenPreference ? labelize(p.childrenPreference) : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50/50 dark:bg-charcoal-700/50">
                    <item.icon className="w-4 h-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>}

            {/* ─── ABOUT ME ─── */}
            {profile && profile.id && (p.selfDescription || (p as any).qualities?.length > 0 || (p as any).interests?.length > 0) && <Card>
              <h3 className="text-base font-semibold text-charcoal-900 dark:text-white flex items-center gap-2 mb-4">
                <Smile className="w-4 h-4 text-accent" /> About Me
              </h3>
              {p.selfDescription && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mb-4 italic leading-relaxed">&ldquo;{p.selfDescription}&rdquo;</p>
              )}
              <div className="flex flex-wrap gap-3">
                {(p as any).qualities?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">Qualities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).qualities.map((q: string) => <Badge key={q} size="sm">{q}</Badge>)}
                    </div>
                  </div>
                )}
                {(p as any).interests?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).interests.map((i: string) => <Badge key={i} size="sm" variant="gold">{i}</Badge>)}
                    </div>
                  </div>
                )}
                {(p as any).languages?.length > 0 && (
                  <div>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-1.5 font-medium">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p as any).languages.map((l: string) => <Badge key={l} size="sm">{l}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </Card>}

          </div>
        </main>
      </div>

      <ProfileImageEditor
        isOpen={editorOpen}
        currentImage={p.photos?.[0] ? mediaUrl(p.photos[0]) : undefined}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    </div>
  );
}
