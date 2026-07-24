"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check, Crown, Gem, Zap, ShieldCheck, MessageSquare, ChevronLeft,
  Copy, Upload, Clock, CheckCircle2, XCircle, Loader2, Wallet as WalletIcon,
  Lock,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button } from "@/components/common";
import { paymentService } from "@/services/payment";
import { profileService } from "@/services/profile";
import { formatDate, mediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  key: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  period: string;
  icon: any;
  color: string;
  gradient: string;
  popular?: boolean;
  features: string[];
  planType: string;
}

const PLAN_ICON_MAP: Record<string, any> = {
  free: ShieldCheck,
  gold: Crown,
  platinum: Gem,
  verification: ShieldCheck,
  boost: Zap,
};

const PLAN_GRADIENT_MAP: Record<string, { color: string; gradient: string; popular?: boolean }> = {
  gold: { color: "text-amber-500", gradient: "from-amber-400 to-yellow-500", popular: true },
  platinum: { color: "text-purple-500", gradient: "from-purple-500 to-fuchsia-500" },
  verification: { color: "text-green-500", gradient: "from-green-500 to-emerald-500" },
  boost: { color: "text-orange-500", gradient: "from-orange-500 to-red-500" },
  free: { color: "text-charcoal-500", gradient: "from-charcoal-400 to-charcoal-500" },
};

function formatPeriod(durationDays: number): string {
  if (durationDays === 0) return "one-time";
  if (durationDays === 365) return "per year";
  if (durationDays === 30) return "per month";
  if (durationDays === 7) return "for 7 days";
  return `for ${durationDays} days`;
}

function dbPlanToPlan(p: any): Plan {
  const meta = PLAN_GRADIENT_MAP[p.key] || { color: "text-charcoal-500", gradient: "from-charcoal-400 to-charcoal-500" };
  return {
    id: p.key,
    key: p.key,
    name: p.name,
    price: p.price,
    currency: p.currency || "ETB",
    durationDays: p.durationDays,
    period: formatPeriod(p.durationDays),
    icon: PLAN_ICON_MAP[p.key] || MessageSquare,
    color: meta.color,
    gradient: meta.gradient,
    popular: meta.popular,
    features: p.features.map((f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
    planType: p.planType,
  };
}

type Step = "plans" | "payment" | "confirm" | "done";

type CellValue = boolean | string;

interface ComparisonRow {
  feature: string;
  free: CellValue;
  ppc: CellValue;
  gold: CellValue;
  platinum: CellValue;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Profile creation", free: true, ppc: true, gold: true, platinum: true },
  { feature: "Photo uploads", free: true, ppc: true, gold: true, platinum: true },
  { feature: "Browse profiles", free: "Limited (daily cap)", ppc: "Limited (daily cap)", gold: "Unlimited", platinum: "Unlimited" },
  { feature: "Receive messages", free: true, ppc: true, gold: true, platinum: true },
  { feature: "Initiate conversations", free: false, ppc: "Credits required", gold: "Unlimited", platinum: "Unlimited" },
  { feature: "Contact information", free: false, ppc: "After unlock", gold: "Unlimited", platinum: "Unlimited" },
  { feature: "Advanced search filters", free: false, ppc: false, gold: true, platinum: true },
  { feature: "Messaging", free: "Requires credits", ppc: "Credits per new contact", gold: "Unlimited", platinum: "Unlimited" },
  { feature: "Profile visitors", free: false, ppc: false, gold: "Full list", platinum: "Full list" },
  { feature: "Likes received", free: false, ppc: false, gold: "Full list", platinum: "Full list" },
];

function renderCell(value: CellValue) {
  if (value === true) {
    return <Check className="w-4 h-4 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <XCircle className="w-4 h-4 text-charcoal-300 dark:text-charcoal-600 mx-auto" />;
  }
  return <span className="text-xs text-charcoal-600 dark:text-charcoal-300 whitespace-nowrap">{value}</span>;
}

interface PlanTierCardProps {
  name: string;
  icon: any;
  gradient: string;
  color: string;
  priceLabel: string;
  subLabel: string;
  highlights: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  isDisabled?: boolean;
  isUpgrade?: boolean;
  creditPackages?: { credits: number; price: string }[];
  onSelect: () => void;
}

function PlanTierCard({ name, icon: Icon, gradient, color, priceLabel, subLabel, highlights, isPopular, isCurrent, isDisabled, isUpgrade, creditPackages, onSelect }: PlanTierCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-5 bg-white dark:bg-charcoal-800 transition-all flex flex-col ${
        isDisabled ? "opacity-60" : "hover:shadow-elevated hover:-translate-y-0.5"
      } ${
        isCurrent ? "border-2 border-green-400 ring-2 ring-green-400/20" :
        isPopular && !isDisabled ? "border-accent ring-2 ring-accent/30" :
        isUpgrade ? "border-2 border-blue-400 ring-2 ring-blue-400/20" :
        "border-charcoal-100 dark:border-charcoal-700"
      }`}
    >
      {/* Badge */}
      {isPopular && !isDisabled && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold shadow-md whitespace-nowrap">
          MOST POPULAR
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
          CURRENT PLAN
        </span>
      )}
      {isUpgrade && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
          UPGRADE
        </span>
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 ${isDisabled ? "grayscale" : ""}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Name + Price */}
      <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-white">{name}</h3>
      <div className="flex items-baseline gap-1 mt-0.5 mb-3">
        <span className="text-xl font-bold text-charcoal-900 dark:text-white">{priceLabel}</span>
      </div>
      <p className="text-xs text-charcoal-400 -mt-2 mb-3">{subLabel}</p>

      {/* Highlights */}
      <ul className="space-y-1.5 mb-4 flex-1">
        {highlights.map((h) => (
          <li key={h} className={`flex items-start gap-1.5 text-xs ${isDisabled ? "text-charcoal-400 dark:text-charcoal-600" : "text-charcoal-600 dark:text-charcoal-300"}`}>
            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} /> {h}
          </li>
        ))}
      </ul>

      {/* Credit packages mini-display */}
      {creditPackages && (
        <div className="mb-4 space-y-1">
          {creditPackages.map((c) => (
            <div key={c.credits} className="flex items-center justify-between text-xs bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg px-2.5 py-1.5">
              <span className="text-charcoal-600 dark:text-charcoal-300 font-medium">{c.credits} credit{c.credits === 1 ? "" : "s"}</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">{c.price}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {isDisabled ? (
        <div className="w-full py-2.5 rounded-xl bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-400 dark:text-charcoal-500 text-xs font-medium text-center flex items-center justify-center gap-1.5">
          {isCurrent ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</> : <><Lock className="w-3.5 h-3.5" /> Locked</>}
        </div>
      ) : (
        <Button
          variant={isPopular || isUpgrade ? "primary" : "secondary"}
          className="w-full !py-2.5 !text-sm"
          onClick={onSelect}
        >
          {isCurrent ? "Current Plan" : isUpgrade ? `Upgrade` : `Choose ${name}`}
        </Button>
      )}
    </div>
  );
}

export default function MembershipPage() {
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [contactCredits, setContactCredits] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [activeMembership, setActiveMembership] = useState<{ isPremium: boolean; activePlan: string | null; expiresAt: string | null }>({ isPremium: false, activePlan: null, expiresAt: null });

  const fetchHistory = useCallback(async () => {
    try {
      const [payRes, walletRes] = await Promise.all([
        paymentService.getMyPayments({ limit: 10 }),
        paymentService.getWallet(),
      ]);
      setPayments(payRes.data.data || []);
      setWallet(walletRes.data.data?.wallet || null);
      setContactCredits(walletRes.data.data?.contactCredits || null);
    } catch { /* ignore */ }
  }, []);

  const fetchMembership = useCallback(async () => {
    try {
      const { data } = await profileService.getMyProfile();
      if (data.profile?.membership) {
        setActiveMembership(data.profile.membership);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchPlansAndMethods = async () => {
    try {
      const [plansRes, creditsRes, methodsRes] = await Promise.all([
        paymentService.getMembershipPlans(),
        paymentService.getCreditPackages(),
        paymentService.getPaymentMethods(),
      ]);
      const dbPlans = (plansRes.data.data || []).filter((p: any) => p.key !== "free");
      const creditPkgPlans = (creditsRes.data.data || []).map((c: any) => ({
        ...c,
        key: c.key,
        name: c.name,
        price: c.price,
        currency: c.currency || "ETB",
        durationDays: 0,
        planType: "credit",
        features: [`${c.credits} contact credits`, "Credits never expire", "No commitment"],
      }));
      setPlans([...dbPlans.map(dbPlanToPlan), ...creditPkgPlans.map(dbPlanToPlan)]);
      setCreditPackages(creditsRes.data.data || []);
      setPaymentMethods(methodsRes.data.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchHistory(); fetchPlansAndMethods(); fetchMembership(); }, [fetchHistory, fetchMembership]);

  // Poll payment status every 25s when there are pending payments
  const hasPending = payments.some((p) => p.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => fetchHistory(), 25000);
    return () => clearInterval(id);
  }, [hasPending, fetchHistory]);

  // Listen for real-time payment status changes via socket
  useEffect(() => {
    const handler = () => fetchHistory();
    window.addEventListener("payment-status-changed", handler);
    return () => window.removeEventListener("payment-status-changed", handler);
  }, [fetchHistory]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep("payment");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast.success("Copied to clipboard");
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await paymentService.uploadReceipt(file);
      setReceiptUrl(data.receiptUrl || "");
      toast.success("Receipt uploaded");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to upload receipt";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedMethod) return;
    if (!referenceNumber.trim() || referenceNumber.trim().length < 3) {
      toast.error("Please enter a valid transaction/reference number");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.createRequest({
        planType: selectedPlan.key,
        amount: selectedPlan.price,
        paymentMethod: selectedMethod.key,
        transactionId: transactionId.trim() || undefined,
        referenceNumber: referenceNumber.trim(),
        receiptUrl: receiptUrl || undefined,
      });
      setStep("done");
      fetchHistory();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to submit payment. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep("plans");
    setSelectedPlan(null);
    setSelectedMethod(null);
    setReferenceNumber("");
    setTransactionId("");
    setReceiptUrl("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: any; label: string }> = {
      pending: { cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: Clock, label: "Pending Review" },
      approved: { cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400", icon: CheckCircle2, label: "Approved" },
      rejected: { cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: XCircle, label: "Rejected" },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-24 lg:pb-8 px-4 lg:px-8 max-w-5xl mx-auto">
        <div className="py-6">
          <div>
            {/* STEP 1: PLANS */}
            {step === "plans" && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-display font-bold text-charcoal-900 dark:text-white">Upgrade Your Experience</h1>
                  <p className="text-charcoal-500 dark:text-charcoal-400 mt-2">Choose a plan and find your righteous spouse faster</p>
                </div>

                {/* Active membership banner */}
                {activeMembership.isPremium && (
                  <div className={`relative overflow-hidden rounded-2xl p-4 mb-6 text-white shadow-lg ${activeMembership.activePlan === "platinum" ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500" : "bg-gradient-to-r from-amber-400 to-yellow-500"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        {activeMembership.activePlan === "platinum" ? <Gem className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-bold text-sm">Your {(activeMembership.activePlan || "").charAt(0).toUpperCase() + (activeMembership.activePlan || "").slice(1)} membership is active</p>
                        <p className="text-xs text-white/90">You can only upgrade to a higher plan. Downgrades and renewals are available after your current plan expires.</p>
                      </div>
                    </div>
                  </div>
                )}

                {contactCredits && contactCredits.credits > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent-dark dark:text-accent-light text-sm font-medium">
                      <WalletIcon className="w-4 h-4" /> {contactCredits.credits} contact credit{contactCredits.credits === 1 ? "" : "s"} available
                    </span>
                  </div>
                )}

                {/* ─── PLAN TIERS ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  {/* Free */}
                  <PlanTierCard
                    name="Free"
                    icon={ShieldCheck}
                    gradient="from-charcoal-400 to-charcoal-500"
                    color="text-charcoal-500"
                    priceLabel="ETB 0"
                    subLabel="Forever free"
                    highlights={["Profile creation", "Photo uploads", "Receive messages", "Browse profiles (limited)"]}
                    isCurrent={activeMembership.activePlan === "free" || !activeMembership.activePlan}
                    onSelect={() => toast("You're on the Free plan", { icon: "ℹ️" })}
                  />

                  {/* Pay-Per-Contact */}
                  <PlanTierCard
                    name="Pay-Per-Contact"
                    icon={WalletIcon}
                    gradient="from-teal-500 to-cyan-500"
                    color="text-teal-500"
                    priceLabel="From ETB 100"
                    subLabel="Per contact credit"
                    highlights={["Everything in Free", "Initiate conversations", "Unlock contact info", "Credits never expire"]}
                    creditPackages={[
                      { credits: 1, price: "100 ETB" },
                      { credits: 5, price: "400 ETB" },
                      { credits: 10, price: "700 ETB" },
                    ]}
                    isCurrent={activeMembership.activePlan === "pay_per_contact"}
                    onSelect={() => {
                      const pkg = creditPackages[0];
                      if (pkg) {
                        handleSelectPlan({
                          ...pkg, key: pkg.key || "pay_per_contact", name: pkg.name || "Pay-Per-Contact",
                          currency: "ETB", period: "one-time", icon: WalletIcon, color: "text-teal-500",
                          gradient: "from-teal-500 to-cyan-500", features: [`${pkg.credits} contact credits`], planType: "credit",
                        } as Plan);
                      }
                    }}
                  />

                  {/* Gold */}
                  <PlanTierCard
                    name="Gold"
                    icon={Crown}
                    gradient="from-amber-400 to-yellow-500"
                    color="text-amber-500"
                    priceLabel={plans.find(p => p.key === "gold") ? `${plans.find(p => p.key === "gold")!.currency} ${plans.find(p => p.key === "gold")!.price.toLocaleString()}` : "ETB —"}
                    subLabel={plans.find(p => p.key === "gold")?.period || "per month"}
                    highlights={["Everything in Pay-Per-Contact", "Unlimited browsing", "Unlimited messaging", "Advanced search filters", "See profile visitors", "See who liked you"]}
                    isPopular
                    isCurrent={activeMembership.activePlan === "gold"}
                    isDisabled={activeMembership.isPremium && (activeMembership.activePlan === "gold" || activeMembership.activePlan === "platinum")}
                    isUpgrade={activeMembership.isPremium && activeMembership.activePlan === "gold" && false}
                    onSelect={() => {
                      const p = plans.find(p => p.key === "gold");
                      if (p) handleSelectPlan(p);
                    }}
                  />

                  {/* Platinum */}
                  <PlanTierCard
                    name="Platinum"
                    icon={Gem}
                    gradient="from-purple-500 to-fuchsia-500"
                    color="text-purple-500"
                    priceLabel={plans.find(p => p.key === "platinum") ? `${plans.find(p => p.key === "platinum")!.currency} ${plans.find(p => p.key === "platinum")!.price.toLocaleString()}` : "ETB —"}
                    subLabel={plans.find(p => p.key === "platinum")?.period || "per month"}
                    highlights={["Everything in Gold", "Priority profile listing", "Premium badge", "Unlimited everything", "See profile visitors", "See who liked you"]}
                    isCurrent={activeMembership.activePlan === "platinum"}
                    isDisabled={activeMembership.activePlan === "platinum"}
                    onSelect={() => {
                      const p = plans.find(p => p.key === "platinum");
                      if (p) handleSelectPlan(p);
                    }}
                  />
                </div>

                {/* ─── FEATURE COMPARISON TABLE ─── */}
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 overflow-hidden shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-charcoal-100 dark:border-charcoal-700">
                          <th className="text-left p-4 font-display font-bold text-charcoal-900 dark:text-white whitespace-nowrap">Feature</th>
                          <th className="p-4 text-center font-display font-bold text-charcoal-600 dark:text-charcoal-300 whitespace-nowrap">Free</th>
                          <th className="p-4 text-center font-display font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">Pay-Per-Contact</th>
                          <th className="p-4 text-center font-display font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap bg-amber-50/50 dark:bg-amber-500/5">
                            <span className="inline-flex items-center gap-1.5">
                              <Crown className="w-4 h-4" /> Gold
                            </span>
                          </th>
                          <th className="p-4 text-center font-display font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Gem className="w-4 h-4" /> Platinum
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal-50 dark:divide-charcoal-700/50">
                        {COMPARISON_ROWS.map((row, i) => (
                          <tr key={i} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-700/20 transition-colors">
                            <td className="p-4 text-charcoal-700 dark:text-charcoal-300 font-medium whitespace-nowrap">{row.feature}</td>
                            <td className="p-4 text-center">{renderCell(row.free)}</td>
                            <td className="p-4 text-center">{renderCell(row.ppc)}</td>
                            <td className="p-4 text-center bg-amber-50/30 dark:bg-amber-500/5">{renderCell(row.gold)}</td>
                            <td className="p-4 text-center">{renderCell(row.platinum)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Credit packages quick-buy */}
                {creditPackages.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-1">Buy Contact Credits</h2>
                    <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">No subscription needed. Credits never expire.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {creditPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="relative rounded-2xl border border-charcoal-100 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-5 text-center hover:shadow-elevated transition-all premium-shimmer"
                        >
                          {pkg.credits === 5 && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold shadow-md">
                              BEST VALUE
                            </span>
                          )}
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                            <WalletIcon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{pkg.credits}</p>
                          <p className="text-xs text-charcoal-400 mb-3">contact credit{pkg.credits === 1 ? "" : "s"}</p>
                          <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-3">{pkg.currency || "ETB"} {pkg.price.toLocaleString()}</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSelectPlan({
                              ...pkg, key: pkg.key || "pay_per_contact", name: pkg.name || `${pkg.credits} Credits`,
                              currency: "ETB", period: "one-time", icon: WalletIcon, color: "text-teal-500",
                              gradient: "from-teal-500 to-cyan-500", features: [`${pkg.credits} contact credits`], planType: "credit",
                            } as Plan)}
                          >
                            Buy Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment history */}
                {payments.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-4">Payment History</h2>
                    <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 divide-y divide-charcoal-100 dark:divide-charcoal-700">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-charcoal-900 dark:text-white capitalize">{p.planType} — ETB {p.amount}</p>
                            <p className="text-xs text-charcoal-400 mt-0.5">
                              Ref: {p.referenceNumber} · {formatDate(p.createdAt)}
                            </p>
                            {p.status === "rejected" && p.adminNote && (
                              <p className="text-xs text-red-500 mt-1">Reason: {p.adminNote}</p>
                            )}
                          </div>
                          {statusBadge(p.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PAYMENT INFO */}
            {step === "payment" && selectedPlan && (
              <div>
                <button onClick={() => setStep("plans")} className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white mb-4">
                  <ChevronLeft className="w-4 h-4" /> Back to plans
                </button>

                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${selectedPlan.gradient} flex items-center justify-center`}>
                        <selectedPlan.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-charcoal-900 dark:text-white">{selectedPlan.name}</p>
                        <p className="text-xs text-charcoal-400">{selectedPlan.period}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{selectedPlan.currency} {selectedPlan.price.toLocaleString()}</p>
                  </div>
                </div>

                <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-1">Choose Payment Method</h2>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">Send <span className="font-semibold">{selectedPlan.currency} {selectedPlan.price.toLocaleString()}</span> to one of the accounts below, then continue.</p>

                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer bg-white dark:bg-charcoal-800 border-charcoal-200 dark:border-charcoal-700 ${
                        selectedMethod?.id === method.id ? "ring-2 ring-accent" : ""
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod?.id === method.id ? "border-accent" : "border-charcoal-300"}`}>
                            {selectedMethod?.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal-900 dark:text-white">{method.name}</p>
                            {method.instructions && <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{method.instructions}</p>}
                          </div>
                        </div>
                        {method.accountInfo && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-charcoal-900 dark:text-white tracking-wider text-sm">{method.accountInfo}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(method.accountInfo); }}
                              className="w-8 h-8 rounded-lg bg-charcoal-50 dark:bg-charcoal-700 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-600 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-charcoal-600 dark:text-charcoal-300" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-6"
                  disabled={!selectedMethod}
                  onClick={() => setStep("confirm")}
                >
                  I've Made the Payment
                </Button>
              </div>
            )}

            {/* STEP 3: CONFIRM / ENTER TRANSACTION */}
            {step === "confirm" && selectedPlan && selectedMethod && (
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep("payment")} className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white mb-4">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-100 dark:border-charcoal-700 p-6">
                  <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-1">Confirm Your Payment</h2>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-5">
                    Paid <span className="font-semibold">{selectedPlan.currency} {selectedPlan.price.toLocaleString()}</span> for <span className="font-semibold">{selectedPlan.name}</span> via {selectedMethod.name}. Enter your transaction details for verification.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Transaction / Reference Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TB1234567890"
                        className="w-full px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Transaction ID <span className="text-charcoal-400 font-normal">(optional)</span>
                      </label>
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Additional transaction ID if any"
                        className="w-full px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                        Upload Receipt <span className="text-charcoal-400 font-normal">(recommended)</span>
                      </label>
                      {receiptUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-charcoal-200 dark:border-charcoal-600">
                          <img src={mediaUrl(receiptUrl)} alt="Receipt" className="w-full max-h-48 object-contain bg-charcoal-50 dark:bg-charcoal-700" />
                          <button
                            onClick={() => setReceiptUrl("")}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                          >
                            <XCircle className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-charcoal-200 dark:border-charcoal-600 cursor-pointer hover:border-accent transition-colors">
                          {uploading ? (
                            <Loader2 className="w-6 h-6 text-accent animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-charcoal-400" />
                              <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Tap to upload receipt screenshot</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full mt-6"
                    loading={submitting}
                    onClick={handleSubmit}
                  >
                    Submit for Verification
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: DONE */}
            {step === "done" && selectedPlan && (
              <div className="max-w-md mx-auto text-center py-10">
                <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Payment Submitted!</h2>
                <p className="text-charcoal-500 dark:text-charcoal-400 mb-6">
                  Your <span className="font-semibold">{selectedPlan.name}</span> payment is now <span className="font-semibold text-amber-500">pending review</span>. Our admins will verify your transaction and activate your service shortly. You'll be notified once approved.
                </p>
                <div className="flex flex-col gap-3">
                  <Button variant="primary" onClick={resetFlow}>Back to Plans</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
