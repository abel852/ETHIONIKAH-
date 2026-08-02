"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { useNotificationStore } from "@/store/notifications";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, string> = {
  match: "\u2764\uFE0F",
  interest: "\u2B50",
  message: "\uD83D\uDCAC",
  verification: "\uD83D\uDEE1\uFE0F",
  system: "\uD83D\uDD14",
  admin: "\uD83D\uDD14",
  admin_message: "\uD83D\uDCAC",
  admin_broadcast: "\uD83D\uDD14",
  payment: "\uD83D\uDCB3",
};

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setIsAdmin(user?.role === "admin");
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const poll = useCallback(() => { fetchUnreadCount(); }, [fetchUnreadCount]);
  useEffect(() => {
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [poll]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dw = 384;
      let left = rect.left;
      if (left + dw > window.innerWidth - 8) {
        left = window.innerWidth - dw - 8;
      }
      if (left < 8) left = 8;
      setDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${left}px`,
        zIndex: 100000,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-charcoal-800">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle} className="w-[90vw] sm:w-96 max-w-sm bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100 dark:border-charcoal-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-100 dark:border-charcoal-700">
            <h3 className="font-semibold text-sm text-charcoal-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-accent hover:underline" title="Mark all read">
                  <Check className="w-3.5 h-3.5 inline mr-0.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors">
                <X className="w-3.5 h-3.5 text-charcoal-400" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-charcoal-400">No notifications yet</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-charcoal-50 dark:border-charcoal-700/50 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/30 transition-colors cursor-pointer ${!n.read ? "bg-accent/5 dark:bg-accent/10" : ""}`}
                  onClick={() => { markAsRead(n.id); }}
                >
                  <span className="text-lg shrink-0 mt-0.5">{typeIcons[n.type] || "\uD83D\uDD14"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{n.title}</p>
                    <p className="text-xs text-charcoal-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-charcoal-300 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <Link
              href={isAdmin ? "/admin" : "/notifications"}
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-accent font-medium py-3 border-t border-charcoal-100 dark:border-charcoal-700 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/30 transition-colors"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
