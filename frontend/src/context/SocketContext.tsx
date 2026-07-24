"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useMessageStore } from "@/store/messages";
import { useNotificationStore } from "@/store/notifications";
import { playMessageSound } from "@/lib/messageSound";

interface ToastNotif {
  name: string;
  content: string;
}

interface SocketContextValue {
  socket: Socket | null;
  typingUsers: Record<string, boolean>;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, typingUsers: {}, emitTyping: () => {} });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const addMessage = useMessageStore((s) => s.addMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const setMessageRead = useMessageStore((s) => s.setMessageRead);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // Refs to keep latest store functions without triggering effect re-runs
  const addMessageRef = useRef(addMessage);
  const removeMessageRef = useRef(removeMessage);
  const setMessageReadRef = useRef(setMessageRead);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  addMessageRef.current = addMessage;
  removeMessageRef.current = removeMessage;
  setMessageReadRef.current = setMessageRead;
  fetchUnreadCountRef.current = fetchUnreadCount;
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [notif, setNotif] = useState<ToastNotif | null>(null);
  const lostShownRef = useRef(false);
  const failCountRef = useRef(0);

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

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:5000", {
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
        if (store.activeConversation === msg.senderId) {
          addMessageRef.current(msg);
        } else {
          const updated = store.conversations.map((c) =>
            c.id === msg.senderId ? { ...c, unreadCount: c.unreadCount + 1 } : c
          );
          useMessageStore.setState({ conversations: updated });
        }
        setNotif({ name: senderName, content: preview });
        setTimeout(() => setNotif(null), 3000);
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
        toast.success(notification?.title || "New notification", {
          description: notification?.body || "",
          duration: 5000,
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

    socket.on("connect_error", () => {
      failCountRef.current += 1;
      // Stay silent for the first few attempts — brief server restarts
      // recover in 1-3 seconds and the user never needs to know.
      if (failCountRef.current >= 3 && !lostShownRef.current) {
        lostShownRef.current = true;
        toast.loading("Reconnecting...", { id: "socket-reconnecting", duration: Infinity });
        setTimeout(() => toast.dismiss("socket-reconnecting"), 60000);
      }
    });

    socket.io.on("reconnect", () => {
      failCountRef.current = 0;
      toast.dismiss("socket-reconnecting");
      // Only announce recovery if we told the user we lost connection
      if (lostShownRef.current) {
        lostShownRef.current = false;
        toast.success("Reconnected", { id: "socket-err", duration: 2000 });
      }
    });

    socket.io.on("reconnect_failed", () => {
      failCountRef.current = 0;
      lostShownRef.current = false;
      toast.dismiss("socket-reconnecting");
      toast.error("Connection failed. Please refresh the page.", { id: "socket-err", duration: 5000 });
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
      {notif && (
        <div className="fixed top-0 left-0 right-0 z-[200] animate-slideDown">
          <div className="bg-white dark:bg-charcoal-800 shadow-elevated flex items-stretch cursor-pointer" onClick={() => setNotif(null)}>
            <div className="w-1 bg-primary-500 shrink-0" />
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 dark:text-white truncate">{notif.name}</p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate">{notif.content}</p>
              </div>
              <button className="shrink-0 p-1 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 rounded-full" onClick={(e) => { e.stopPropagation(); setNotif(null); }}>
                <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);