"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useI18n } from "@/context/I18nContext";
import {
  BookOpen, ChevronRight, LayoutDashboard, Users, ShieldCheck,
  Flag, CreditCard, BarChart3, ShieldAlert, Sliders, Heart,
  Database, Puzzle, Bot, FileText, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CollapsibleSection({ title, icon: Icon, children }: {
  title: string; icon: any; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-purple-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminManualPage() {
  const { t } = useI18n();

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-purple-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("admin.manual.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin.manual.subtitle")}</p>
          </div>
        </div>

        {/* Dashboard */}
        <CollapsibleSection title={t("admin.manual.dashboard")} icon={LayoutDashboard}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Overview</strong> — The dashboard shows key platform metrics: total users, active users, verified users, total matches, messages, revenue, pending verifications, open reports, and open complaints.</li>
            <li><strong>Activity feed</strong> — Monitor recent user activity including registrations, verifications, matches, and payments in real-time.</li>
            <li><strong>Quick actions</strong> — Use the dashboard to quickly navigate to pending items that need admin attention.</li>
          </ul>
        </CollapsibleSection>

        {/* User Management */}
        <CollapsibleSection title={t("admin.manual.userManagement")} icon={Users}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>User list</strong> — View all users with filters for status, verification, membership plan, and search by name/email.</li>
            <li><strong>User details</strong> — Click any user to view their full profile, verification status, matches, messages count, and payment history.</li>
            <li><strong>Suspend/Unsuspend</strong> — Suspend users who violate policies. Suspended users cannot log in or appear in matches.</li>
            <li><strong>Delete user</strong> — Permanently delete a user. This moves them to the Recycle Bin for 30 days before permanent erasure.</li>
            <li><strong>Recycle Bin</strong> — View and restore deleted users within the 30-day grace period.</li>
          </ul>
        </CollapsibleSection>

        {/* Verifications */}
        <CollapsibleSection title={t("admin.manual.verifications")} icon={ShieldCheck}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pending reviews</strong> — View users who submitted ID documents and selfies for verification.</li>
            <li><strong>Approve/Reject</strong> — Review the documents and approve or reject with an optional admin note. Rejected users receive the note as feedback.</li>
            <li><strong>Verified badge</strong> — Approved users get a verified badge on their profile, increasing trust and visibility.</li>
          </ul>
        </CollapsibleSection>

        {/* Marriage Success */}
        <CollapsibleSection title={t("admin.manual.marriageSuccess")} icon={Heart}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Submissions list</strong> — View all marriage success submissions filtered by status: Pending Review, Approved, Rejected, Awaiting Partner, Awaiting Photos.</li>
            <li><strong>Review detail</strong> — Click a submission to view wedding/engagement/ring photos, marriage certificate, success story, and consent status.</li>
            <li><strong>Approve</strong> — Approving marks both users as married, ends their exclusive partnership, and publishes their success story (if consent given).</li>
            <li><strong>Reject</strong> — Rejecting sends the submission back with an optional admin note. Users can resubmit.</li>
          </ul>
        </CollapsibleSection>

        {/* Moderation */}
        <CollapsibleSection title={t("admin.manual.moderation")} icon={Flag}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Reports</strong> — View user-submitted reports for inappropriate behavior, spam, or policy violations. Take action by warning, suspending, or banning the reported user.</li>
            <li><strong>Complaints</strong> — View support complaints submitted via the Help & Support section. Respond via email or close the complaint.</li>
            <li><strong>Content flags</strong> — AI-automated content flags appear for review. Confirm or dismiss flags as needed.</li>
          </ul>
        </CollapsibleSection>

        {/* Revenue */}
        <CollapsibleSection title={t("admin.manual.revenue")} icon={CreditCard}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Payments</strong> — View all payment transactions, filter by status (completed, pending, failed), and issue refunds.</li>
            <li><strong>Membership Plans</strong> — Create and manage Gold and Platinum plans, set pricing, features, and credits.</li>
            <li><strong>Payment Methods</strong> — Configure accepted payment methods (Stripe, PayPal, bank transfer, mobile money).</li>
            <li><strong>Analytics</strong> — Revenue charts, MRR, churn rate, and conversion metrics.</li>
          </ul>
        </CollapsibleSection>

        {/* Security */}
        <CollapsibleSection title={t("admin.manual.security")} icon={ShieldAlert}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Security center</strong> — View failed login attempts, suspicious activities, and IP-based blocks.</li>
            <li><strong>Audit logs</strong> — Every admin action is logged: who did what, when, and from which IP. Filter by action type or admin.</li>
            <li><strong>Admin management</strong> — Add or remove admins, assign roles and permissions. Use least-privilege principle.</li>
          </ul>
        </CollapsibleSection>

        {/* Matchmaking & AI */}
        <CollapsibleSection title={t("admin.manual.matchmakingAI")} icon={Bot}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Matchmaking settings</strong> — Configure compatibility scoring weights, match limits, and daily recommendation rules.</li>
            <li><strong>AI Automation</strong> — View AI-detected fraud patterns, fake profile flags, and automated moderation actions.</li>
          </ul>
        </CollapsibleSection>

        {/* System */}
        <CollapsibleSection title={t("admin.manual.system")} icon={Sliders}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Settings</strong> — Configure branding (site name, logo, colors), security (2FA enforcement, password policy), language defaults, privacy, notifications, and email templates.</li>
            <li><strong>Feature Toggles</strong> — Enable or disable platform features (messaging, matching, payments, wali system) without deploying code.</li>
            <li><strong>Backup & Restore</strong> — Schedule automatic database backups, download backups, and restore from a previous backup.</li>
            <li><strong>Books</strong> — Manage Islamic educational books and resources available to users in the app.</li>
          </ul>
        </CollapsibleSection>

        {/* Admin Roles */}
        <CollapsibleSection title={t("admin.manual.adminRoles")} icon={Crown}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Super Admin</strong> — Full access to all sections including settings, admin management, and system configuration.</li>
            <li><strong>Admin</strong> — Access to user management, verifications, reports, complaints, and marriage success. No system settings access.</li>
            <li><strong>Moderator</strong> — Limited to reports, complaints, and content moderation. Cannot manage users or view revenue.</li>
            <li><strong>Permissions</strong> — Each role has granular permissions. Assign the minimum required access for each admin.</li>
          </ul>
        </CollapsibleSection>
      </div>
    </AdminLayout>
  );
}
