"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useMessageStore } from "@/store/messages";
import { useNotificationStore } from "@/store/notifications";
import { playMessageSound } from "@/lib/messageSound";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface ToastNotif {
  id: string;
  name: string;
  content: string;
  type?: string;
  url?: string;
  avatar?: string;
}

interface SocketContextValue {
  socket: Socket | null;
  typingUsers: Record<string, boolean>;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, typingUsers: {}, emitTyping: () => {} });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  usePushNotifications();
  const socketRef = useRef<Socket | null>(null);
  const addMessage = useMessageStore((s) => s.addMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const setMessageRead = useMessageStore((s) => s.setMessageRead);
  const setMessageReaction = useMessageStore((s) => s.setMessageReaction);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // Refs to keep latest store functions without triggering effect re-runs
  const addMessageRef = useRef(addMessage);
  const removeMessageRef = useRef(removeMessage);
  const updateMessageRef = useRef(updateMessage);
  const setMessageReadRef = useRef(setMessageRead);
  const setMessageReactionRef = useRef(setMessageReaction);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  addMessageRef.current = addMessage;
  removeMessageRef.current = removeMessage;
  updateMessageRef.current = updateMessage;
  setMessageReadRef.current = setMessageRead;
  setMessageReactionRef.current = setMessageReaction;
  fetchUnreadCountRef.current = fetchUnreadCount;
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [notifs, setNotifs] = useState<ToastNotif[]>([]);
  const notifIdRef = useRef(0);
  const lostShownRef = useRef(false);
  const failCountRef = useRef(0);

  const pushNotif = useCallback((n: Omit<ToastNotif, "id">) => {
    const id = `notif-${++notifIdRef.current}`;
    setNotifs((prev) => [...prev.slice(-3), { ...n, id }]);
    setTimeout(() => {
      setNotifs((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismissNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (isTyping) {
      socket.emit("typing", { conversationId });
    } else {
      socket.emit("stop_typing", { conversationId });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Refresh the auth token on every reconnect attempt so we never
    // retry with a stale/expired token (which causes endless "Reconnecting...")
    socket.io.on("reconnect_attempt", () => {
      const freshToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      socket.auth = { token: freshToken };
    });

    socket.on("new_message", (msg) => {
      const senderName = msg.sender?.firstName || "Someone";
      const preview = msg.content?.startsWith("IMG:") ? "📷 Image" : (msg.content || "");
      if (msg.senderId !== user?.id) {
        const store = useMessageStore.getState();
        // Ignore messages from blocked users
        if (store.blockedUsers?.includes(msg.senderId)) return;

        // Admin messages: don't show message badge, only notification bell
        if (msg.sender?.role === "admin") {
          fetchUnreadCountRef.current();
          if (store.activeConversation === msg.senderId) {
            addMessageRef.current(msg);
          }
          pushNotif({ name: senderName, content: preview, type: "message", url: "/messages" });
          playMessageSound("receive");
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`Message from ${senderName}`, { body: preview, icon: "/favicon.ico" });
          }
          return;
        }

        // Regular user messages: show message badge
        if (store.activeConversation === msg.senderId) {
          addMessageRef.current(msg);
          // Auto-mark as read since user is viewing this conversation — sends read receipt to sender
          import("@/services/messages").then(({ messageService }) => {
            messageService.markAsRead(msg.id).catch(() => {});
          });
        } else {
          const updated = store.conversations.map((c) =>
            c.id === msg.senderId ? { ...c, unreadCount: c.unreadCount + 1 } : c
          );
          useMessageStore.setState({ conversations: updated });
        }
        pushNotif({ name: senderName, content: preview, type: "message", url: "/messages" });
        playMessageSound("receive");
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`Message from ${senderName}`, { body: preview, icon: "/favicon.ico" });
        }
      }
    });

    socket.on("message_deleted", ({ messageId, deletedFor }) => {
      if (messageId === "all") {
        removeMessageRef.current("all");
      } else {
        removeMessageRef.current(messageId);
      }
    });

    socket.on("message_read", ({ messageId }) => {
      setMessageReadRef.current(messageId);
    });

    socket.on("message_edited", (message) => {
      updateMessageRef.current(message);
    });

    socket.on("message_reaction", ({ messageId, reaction, reactionBy }) => {
      setMessageReactionRef.current(messageId, reaction, reactionBy);
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: true }));
        if (typingTimeoutRef.current[conversationId]) {
          clearTimeout(typingTimeoutRef.current[conversationId]);
        }
        typingTimeoutRef.current[conversationId] = setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [conversationId]: false }));
        }, 4000);
      } else {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: false }));
        if (typingTimeoutRef.current[conversationId]) {
          clearTimeout(typingTimeoutRef.current[conversationId]);
        }
      }
    });

    socket.on("user_status", ({ userId, isOnline }) => {
      const store = useMessageStore.getState();
      const updated = store.conversations.map((c) =>
        c.id === userId ? { ...c, isOnline } : c
      );
      useMessageStore.setState({ conversations: updated });
    });

    // --- Real-time notifications ---
    socket.on("new_notification", (notification) => {
      fetchUnreadCountRef.current();
      if (notification?.type !== "message") {
        pushNotif({
          name: notification?.title || "New notification",
          content: notification?.body || "",
          type: notification?.type || "system",
          url: notification?.type === "match" ? "/matches" : notification?.type === "interest" ? "/liked-interest" : "/notifications",
        });
      }
    });

    // --- Real-time payment status updates ---
    socket.on("payment_status_changed", (payment) => {
      if (payment?.status === "approved") {
        toast.success("Payment Approved!", {
          description: `Your payment has been approved. Enjoy your benefits!`,
          duration: 6000,
        });
      } else if (payment?.status === "rejected") {
        toast.error("Payment Rejected", {
          description: payment?.adminNote || "Please contact support for details.",
          duration: 6000,
        });
      }
      // Dispatch custom event so pages can react
      window.dispatchEvent(new CustomEvent("payment-status-changed", { detail: payment }));
    });

    // --- Real-time verification status updates ---
    socket.on("verification_status_changed", (verification) => {
      if (verification?.status === "approved") {
        toast.success("Verification Approved!", {
          description: "You are now a verified user!",
          duration: 6000,
        });
      } else if (verification?.status === "rejected") {
        toast.error("Verification Rejected", {
          description: verification?.adminNote || "Please submit new documents.",
          duration: 6000,
        });
      }
      // Dispatch custom event so pages can react
      window.dispatchEvent(new CustomEvent("verification-status-changed", { detail: verification }));
    });

    socket.on("connect", () => {
      failCountRef.current = 0;
      lostShownRef.current = false;
      toast.dismiss("socket-reconnecting");
    });

    socket.on("disconnect", () => {});

    // Reconnect silently in the background — no "Reconnecting..." toast.
    socket.on("connect_error", () => {
      failCountRef.current += 1;
    });

    socket.io.on("reconnect", () => {
      failCountRef.current = 0;
      lostShownRef.current = false;
    });

    socket.io.on("reconnect_failed", () => {
      failCountRef.current = 0;
      lostShownRef.current = false;
      toast.dismiss("socket-reconnecting");
      toast.error("Connection failed. Please refresh the page.", { id: "socket-err", duration: 1000 });
    });

    socketRef.current = socket;

    return () => {
      lostShownRef.current = false;
      toast.dismiss("socket-reconnecting");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, typingUsers, emitTyping }}>
      {children}
      {/* In-app notification popups — floating top-right, dark/gold theme */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: "calc(100vw - 2rem)" }}>
        {notifs.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto rounded-2xl bg-[#1A1A24] border border-[#2D2D2D] shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            style={{ animation: "notifIn 0.35s ease-out", width: 360, maxWidth: "calc(100vw - 2rem)" }}
            onClick={() => {
              if (n.url) {
                window.location.href = n.url;
              }
              dismissNotif(n.id);
            }}
          >
            <div className="flex items-stretch">
              {/* Gold accent bar */}
              <div className="w-1 bg-gradient-to-b from-[#D4AF37] to-[#F2D675] shrink-0" />
              <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                {/* Icon based on type */}
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center shrink-0">
                  {n.type === "message" ? (
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ) : n.type === "match" ? (
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  ) : n.type === "interest" ? (
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{n.name}</p>
                  <p className="text-xs text-[#C8C8C8] truncate">{n.content}</p>
                </div>
                <button
                  className="shrink-0 p-1 hover:bg-[#2D2D2D] rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                >
                  <svg className="w-4 h-4 text-[#8B8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-[#D4AF37]/20">
              <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F2D675]" style={{ animation: "notifProgress 5s linear forwards" }} />
            </div>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);