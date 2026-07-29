"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Shield, UserPlus, Star, Bell, Check, X } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Button, Badge, NotificationSkeleton, IslamicPatternBackground } from "@/components/common";
import { useNotificationStore } from "@/store/notifications";
import { conversationPermissionService } from "@/services/conversationPermission";
import { mediaUrl } from "@/lib/utils";

const iconMap: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  match: { icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  interest: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10" },
  message: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  verification: { icon: Shield, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
  system: { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  admin: { icon: Bell, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  conversation_permission_request: { icon: Shield, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  conversation_permission_response: { icon: Shield, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10" },
  payment: { icon: Bell, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
};

export default function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAllAsRead, markAsRead } = useNotificationStore();
  const [permRequests, setPermRequests] = useState<any[]>([]);
  const [permLoading, setPermLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    conversationPermissionService.getReceivedPermissions("pending").then(({ data }) => {
      setPermRequests(data.permissions || []);
    }).catch(() => {});
  }, [fetchNotifications]);

  const handlePermRespond = async (permId: string, status: "approved" | "denied") => {
    setPermLoading(permId);
    try {
      await conversationPermissionService.respondToPermission(permId, status);
      setPermRequests(prev => prev.filter(p => p.id !== permId));
    } catch {
      // ignore
    } finally {
      setPermLoading(null);
    }
  };

  return (
    <IslamicPatternBackground>
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Notifications</h1>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mt-1">Stay updated with your activity</p>
            </div>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Bell className="w-4 h-4 mr-1.5" /> Mark All Read
            </Button>
          </div>

          {/* Permission Requests */}
          {permRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Permission Requests ({permRequests.length})
              </h2>
              <div className="space-y-2">
                {permRequests.map((perm) => (
                  <motion.div
                    key={perm.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                        {perm.requester?.firstName} {perm.requester?.lastName}
                      </p>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                        wants to talk to {perm.targetUser?.firstName} {perm.targetUser?.lastName}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handlePermRespond(perm.id, "approved")}
                        disabled={permLoading === perm.id}
                        className="w-9 h-9 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePermRespond(perm.id, "denied")}
                        disabled={permLoading === perm.id}
                        className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"
                        title="Deny"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {isLoading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
              <h3 className="font-semibold text-charcoal-900 dark:text-white">No notifications yet</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Activity updates will appear here</p>
            </div>
          ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = iconMap[notif.type] || iconMap.system;
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-colors cursor-pointer ${
                    !notif.read ? "bg-accent/5 border border-accent/20" : "bg-white dark:bg-charcoal-800 border border-transparent dark:border-charcoal-700 hover:border-charcoal-100/50 dark:hover:border-charcoal-600"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white">{notif.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notif.read && <Badge variant="gold" size="sm">New</Badge>}
                        <span className="text-xs text-charcoal-400 dark:text-charcoal-500">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-0.5">{notif.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}
        </main>
      </div>
    </IslamicPatternBackground>
  );
}
