"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Send, MoreVertical, ChevronLeft, Reply, X, Trash2, Check, CheckCheck, Flag, Shield, ShieldOff, Paperclip, Smile, Heart, Crown, Gem, Sparkles, FileText, Download } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Input, Button, Avatar } from "@/components/common";
import { useMessageStore } from "@/store/messages";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl, formatLastSeen } from "@/lib/utils";
import { conversationPermissionService } from "@/services/conversationPermission";
import type { Message } from "@/types";

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.id;
  const { t } = useI18n();

  const playMessageSound = useCallback((type: "send" | "receive" | "error" = "send") => {
    import("@/lib/messageSound").then(({ playMessageSound }) => playMessageSound(type));
  }, []);

  const store = useMessageStore();
  const conversations = store.conversations;
  const messages = store.messages;
  const activeConversation = store.activeConversation;
  const isLoading = store.isLoading;
  const matchReason = store.matchReason;
  const fetchConversations = store.fetchConversations;
  const fetchMessages = store.fetchMessages;
  const sendMessage = store.sendMessage;
  const deleteMessage = store.deleteMessage;
  const deleteConversation = store.deleteConversation;
  const blockUser = store.blockUser;
  const unblockUser = store.unblockUser;
  const blockedUsers = store.blockedUsers;
  const setActiveConversation = store.setActiveConversation;
  const markAsRead = store.markAsRead;
  const { typingUsers, emitTyping } = useSocket();

  const [newMessage, setNewMessage] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [convMenuId, setConvMenuId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ otherUserId: string; name: string } | null>(null);
  const [blockConfirm, setBlockConfirm] = useState<{ otherUserId: string; name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDescription, setReportDescription] = useState("");
  const [permissionDialog, setPermissionDialog] = useState<{ targetUserId: string; targetName: string } | null>(null);
  const [permissionPartnerId, setPermissionPartnerId] = useState<string | null>(null);
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [chatPermRequests, setChatPermRequests] = useState<any[]>([]);
  const [chatPermLoading, setChatPermLoading] = useState<string | null>(null);
  const [sentPermStatus, setSentPermStatus] = useState<any[]>([]);
  const [urlName, setUrlName] = useState<string | null>(null);
  const [urlUsername, setUrlUsername] = useState<string | null>(null);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [serverBusy, setServerBusy] = useState(false);
  const [busyCountdown, setBusyCountdown] = useState(0);
  const busyRetryDataRef = useRef<{ type: "text" | "image" | "file"; conversationId: string; content?: string; replyToId?: string | null; file?: File | null; caption?: string } | null>(null);
  const busyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [mobileKeyboardOpen, setMobileKeyboardOpen] = useState(false);
  const [swipeMsgId, setSwipeMsgId] = useState<string | null>(null);
  const [highlightMsgId, setHighlightMsgId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const convMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchMovedRef = useRef(false);

  // Handle incoming query params
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId) {
      setMobileThreadOpen(true);
      setActiveConversation(userId);
      markAsRead(userId);
      setUrlName(searchParams.get("name"));
      setUrlUsername(searchParams.get("username"));
      // Clean up URL so refresh doesn't re-trigger
      router.replace("/messages", undefined);
    }
    setUrlParamsProcessed(true);
  }, [searchParams, setActiveConversation, router, markAsRead]);

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 30000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      // Fetch pending permission requests where this chat partner is the partner (incoming)
      conversationPermissionService.getReceivedPermissions("pending").then(({ data }) => {
        const relevant = (data.permissions || []).filter((p: any) => p.requesterId === activeConversation);
        setChatPermRequests(relevant);
      }).catch(() => setChatPermRequests([]));
      // Fetch sent permission requests to this partner (outgoing status)
      conversationPermissionService.getSentPermissions().then(({ data }) => {
        const relevant = (data.permissions || []).filter((p: any) => p.partnerId === activeConversation);
        setSentPermStatus(relevant);
      }).catch(() => setSentPermStatus([]));
    } else {
      setChatPermRequests([]);
      setSentPermStatus([]);
    }
  }, [activeConversation, fetchMessages]);

  const prevMsgIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (messages.length === 0) {
      isFirstLoadRef.current = true;
      prevMsgIdsRef.current = new Set();
      return;
    }
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevMsgIdsRef.current = new Set(messages.map((m) => m.id));
      return;
    }
    const prevIds = prevMsgIdsRef.current;
    for (const msg of messages) {
      if (!prevIds.has(msg.id) && msg.senderId !== myId && !msg.id?.startsWith("temp-")) {
        playMessageSound("receive");
        break;
      }
    }
    prevMsgIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages, myId, playMessageSound]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mobile keyboard — keep header + input visible, only messages scroll
  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      const root = document.getElementById("messages-root");
      if (!root || !vv) return;
      if (vv.height < window.innerHeight) {
        setMobileKeyboardOpen(true);
        root.style.height = `${vv.height}px`;
        document.body.style.overflow = "hidden";
      } else {
        setMobileKeyboardOpen(false);
        root.style.height = "";
        document.body.style.overflow = "";
      }
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMsgId(null);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (convMenuRef.current && !convMenuRef.current.contains(e.target as Node)) {
        setConvMenuId(null);
      } else if (!convMenuRef.current) {
        setConvMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startBusyCountdown = useCallback((retryAfter: number, retryData: { type: "text" | "image" | "file"; conversationId: string; content?: string; replyToId?: string | null; file?: File | null; caption?: string }) => {
    busyRetryDataRef.current = retryData;
    setServerBusy(true);
    setBusyCountdown(retryAfter);

    if (busyTimerRef.current) clearInterval(busyTimerRef.current);
    busyTimerRef.current = setInterval(() => {
      setBusyCountdown((prev) => {
        if (prev <= 1) {
          if (busyTimerRef.current) clearInterval(busyTimerRef.current);
          setServerBusy(false);
          // Auto-retry: restore the data and trigger send
          const data = busyRetryDataRef.current;
          busyRetryDataRef.current = null;
          if (data) {
            if (data.type === "text" && data.content) {
              setNewMessage(data.content);
              if (data.replyToId) {
                // replyTo will be set by the caller via state — best-effort
              }
            } else if (data.type === "image" && data.file) {
              setImagePreview(data.file);
              if (data.caption) setCaption(data.caption);
            } else if (data.type === "file" && data.file) {
              setFilePreview(data.file);
              if (data.caption) setCaption(data.caption);
            }
            // Trigger send on next tick after state updates
            setTimeout(() => handleSend(), 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSend = useCallback(async () => {
    if ((!newMessage.trim() && !imagePreview && !filePreview) || !activeConversation) return;
    if (blockedUsers.includes(activeConversation)) return;
    if (filePreview) {
      const tempId = `temp-${Date.now()}`;
      const cap = (newMessage || caption).trim();
      const store = useMessageStore.getState();
      const fileToSend = filePreview;

      setFilePreview(null);
      setCaption("");
      setNewMessage("");
      store.addMessage({
        id: tempId,
        senderId: myId || activeConversation,
        receiverId: activeConversation,
        content: `FILE:pending|${fileToSend.name}|${fileToSend.size}${cap ? `|${cap}` : ""}`,
        createdAt: new Date().toISOString(),
        readAt: null,
      } as any);

      setUploading(true);
      setUploadProgress(0);
      try {
        const { messageService: svc } = await import("@/services/messages");
        const res = await svc.sendFile(activeConversation, fileToSend, cap || undefined, setUploadProgress);
        const msg = res.data.message;
        store.removeMessage(tempId);
        store.addMessage(msg);
      } catch (e: any) {
        store.removeMessage(tempId);
        if (e?.response?.status === 503 && e?.response?.data?.code === "SERVER_BUSY") {
          const retryAfter = e.response.data.retryAfter || 3;
          setUploading(false);
          setUploadProgress(0);
          startBusyCountdown(retryAfter, { type: "file", conversationId: activeConversation, file: fileToSend, caption: cap });
          return;
        }
        console.error("Send file error:", e);
        playMessageSound("error");
        const errMsg = e?.response?.data?.error || "Failed to send file. Please try again.";
        setToastError(true);
        setToast(errMsg);
        setTimeout(() => { setToast(null); setToastError(false); }, 5000);
      }
      setUploadProgress(0);
      setUploading(false);
      await fetchConversations();
      return;
    }
    if (imagePreview) {
      const localUrl = URL.createObjectURL(imagePreview);
      const tempId = `temp-${Date.now()}`;
      const cap = (newMessage || caption).trim();
      const capSuffix = cap ? `|${cap}` : "";
      const store = useMessageStore.getState();
      const imageToSend = imagePreview;

      // Close preview, show optimistic message immediately in chat
      setImagePreview(null);
      setCaption("");
      setNewMessage("");
      store.addMessage({
        id: tempId,
        senderId: myId || activeConversation,
        receiverId: activeConversation,
        content: `IMG:${localUrl}${capSuffix}`,
        createdAt: new Date().toISOString(),
        readAt: null,
      } as any);

      setUploading(true);
      setUploadProgress(0);
      try {
        const { messageService: svc } = await import("@/services/messages");
        const res = await svc.sendImage(activeConversation, imageToSend, cap || undefined, setUploadProgress);
        const msg = res.data.message;
        if (cap) {
          if (msg.content?.startsWith("IMG:")) {
            msg.content = `IMG:${msg.content.slice(4)}|${cap}`;
          } else if (msg.imageUrl) {
            msg.content = `IMG:${msg.imageUrl}|${cap}`;
          } else {
            msg.content = cap;
          }
        } else if (!msg.content && msg.imageUrl) {
          msg.content = `IMG:${msg.imageUrl}`;
        }
        store.removeMessage(tempId);
        store.addMessage(msg);
      } catch (e: any) {
        store.removeMessage(tempId);
        if (e?.response?.status === 503 && e?.response?.data?.code === "SERVER_BUSY") {
          URL.revokeObjectURL(localUrl);
          const retryAfter = e.response.data.retryAfter || 3;
          setUploading(false);
          setUploadProgress(0);
          startBusyCountdown(retryAfter, { type: "image", conversationId: activeConversation, file: imageToSend, caption: cap });
          return;
        }
        console.error("Send image error:", e);
        playMessageSound("error");
        const errMsg = e?.response?.data?.error || t('messages.sendImageFailed');
        setToastError(true);
        setToast(errMsg);
        setTimeout(() => { setToast(null); setToastError(false); }, 5000);
      }
      URL.revokeObjectURL(localUrl);
      setUploadProgress(0);
      setUploading(false);
      await fetchConversations();
      return;
    }
    const textToSend = newMessage.trim();
    const replyToId = replyTo?.id;
    try {
      playMessageSound("send");
      await sendMessage(activeConversation, textToSend, replyToId);
    } catch (e: any) {
      if (e?.response?.status === 503 && e?.response?.data?.code === "SERVER_BUSY") {
        const retryAfter = e.response.data.retryAfter || 3;
        startBusyCountdown(retryAfter, { type: "text", conversationId: activeConversation, content: textToSend, replyToId });
        return;
      }
      playMessageSound("error");
      const errMsg = e?.response?.data?.error;
      if (errMsg) {
        if (errMsg.includes("already have an active conversation")) {
          const activePartner = conversations.find(c => c.id !== activeConversation);
          if (activePartner) {
            setPermissionPartnerId(activePartner.id);
            setPermissionDialog({
              targetUserId: activeConversation,
              targetName: activeConv?.name || urlName || t('messages.userFallback'),
            });
            return;
          }
        }
        setToastError(true);
        setToast(errMsg);
        setTimeout(() => { setToast(null); setToastError(false); }, 5000);
      }
      return;
    }
    setNewMessage("");
    setReplyTo(null);
    emitTyping(activeConversation, false);
    await fetchConversations();
  }, [newMessage, activeConversation, replyTo, sendMessage, fetchConversations, emitTyping, imagePreview, filePreview, caption, blockedUsers, playMessageSound, t, startBusyCountdown]);

  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value);
    if (!activeConversation) return;
    emitTyping(activeConversation, value.length > 0);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTyping(activeConversation, false);
    }, 3000);
  }, [activeConversation, emitTyping]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File size must be under 20 MB");
      e.target.value = "";
      return;
    }
    if (file.type.startsWith("image/")) {
      setImagePreview(file);
    } else {
      setFilePreview(file);
    }
  }, []);

  const handleDelete = useCallback(async (msgId: string, delFor: "me" | "both") => {
    await deleteMessage(msgId, delFor);
    setMenuMsgId(null);
  }, [deleteMessage]);

  const handleMsgTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchMovedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        setMenuMsgId(msg.id);
      }
    }, 600);
  }, []);

  const handleMsgTouchMove = useCallback((e: React.TouchEvent, msg: Message) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchMovedRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
    // Swipe left detection
    if (dx < -60 && Math.abs(dy) < 40) {
      setSwipeMsgId(msg.id);
      setReplyTo(msg);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleMsgTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setTimeout(() => setSwipeMsgId(null), 300);
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightMsgId(msgId);
      setTimeout(() => setHighlightMsgId(null), 2000);
    }
  }, []);

  const handleReport = useCallback(async () => {
    if (!activeConversation || !reportReason) return;
    setReportSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportedUserId: activeConversation,
            reason: reportReason,
            description: reportDescription,
          }),
        }
      );
      if (!res.ok) throw new Error(t('messages.submitReportError'));
      setShowReportDialog(false);
      setReportDescription("");
      setReportReason("inappropriate");
      alert(t('messages.reported'));
    } catch {
      alert(t('messages.reportFailed'));
    } finally {
      setReportSubmitting(false);
    }
  }, [activeConversation, reportReason, reportDescription]);

  const activeConv = conversations.find((c) => c.id === activeConversation);
  const showThread = !!activeConversation && urlParamsProcessed;

  // Chat theme based on current user's membership
  const userPlan = user?.membershipPlan;
  const isGoldChat = userPlan === "gold" || userPlan === "platinum";
  const isSoftChat = !userPlan || userPlan === "free" || userPlan === "normal";
  // Premium Gradient is the default fallback

  // === THEME: Backgrounds ===
  const themeBg = isGoldChat
    ? "bg-gradient-to-br from-black via-charcoal-900 to-amber-950/50"
    : isSoftChat
    ? "bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 dark:from-charcoal-900 dark:via-rose-950/30 dark:to-charcoal-800"
    : "bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/20 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-amber-950/30";

  // Bokeh overlay style
  const bokehStyle = isGoldChat
    ? { backgroundImage: `radial-gradient(circle at 15% 20%, rgba(251,191,36,0.25) 3px, transparent 3px), radial-gradient(circle at 85% 60%, rgba(245,158,11,0.2) 2px, transparent 2px), radial-gradient(circle at 50% 80%, rgba(252,211,77,0.15) 2.5px, transparent 2.5px), radial-gradient(circle at 70% 30%, rgba(251,191,36,0.12) 1.5px, transparent 1.5px), radial-gradient(circle at 30% 70%, rgba(245,158,11,0.1) 2px, transparent 2px)`, backgroundSize: "80px 80px" }
    : isSoftChat
    ? { backgroundImage: `radial-gradient(circle at 20% 30%, rgba(251,207,232,0.5) 2px, transparent 2px), radial-gradient(circle at 80% 70%, rgba(252,165,165,0.4) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(254,215,170,0.35) 1.5px, transparent 1.5px), radial-gradient(circle at 65% 25%, rgba(251,207,232,0.3) 1px, transparent 1px), radial-gradient(circle at 10% 80%, rgba(252,165,165,0.25) 2px, transparent 2px)`, backgroundSize: "55px 55px" }
    : { backgroundImage: `radial-gradient(circle at 20% 30%, rgba(251,191,36,0.12) 2px, transparent 2px), radial-gradient(circle at 80% 70%, rgba(245,158,11,0.1) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(252,211,77,0.08) 1.5px, transparent 1.5px)`, backgroundSize: "70px 70px" };

  const bokehClass = isGoldChat ? "opacity-40" : isSoftChat ? "opacity-25 dark:opacity-15" : "opacity-20";

  // === THEME: Messages container ===
  const themeMessagesBg = isGoldChat
    ? ""
    : isSoftChat
    ? ""
    : "";

  // === THEME: Own (sender) bubble ===
  const ownBubble = isGoldChat
    ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-charcoal-900 rounded-br-md shadow-lg shadow-amber-500/40 backdrop-blur-md border border-amber-300/50 hover:shadow-amber-400/50"
    : isSoftChat
    ? "bg-gradient-to-br from-amber-300/90 to-yellow-400/85 text-charcoal-900 rounded-br-md shadow-md shadow-amber-200/40 backdrop-blur-md border border-amber-200/40 hover:shadow-amber-300/50"
    : "bg-gradient-to-br from-amber-200/90 to-yellow-300/85 text-charcoal-900 rounded-br-md shadow-md shadow-amber-100/40 backdrop-blur-md border border-amber-200/30 hover:shadow-amber-200/50";

  // === THEME: Other (receiver) bubble ===
  const otherBubble = isGoldChat
    ? "bg-white/90 dark:bg-charcoal-100/25 text-charcoal-900 dark:text-white rounded-bl-md shadow-sm border border-white/40 dark:border-amber-700/30 backdrop-blur-md hover:shadow-md"
    : isSoftChat
    ? "bg-white/85 dark:bg-charcoal-800/70 text-charcoal-900 dark:text-white rounded-bl-md shadow-sm border border-rose-200/50 dark:border-rose-800/30 backdrop-blur-md hover:shadow-md"
    : "bg-white/85 dark:bg-charcoal-800/70 text-charcoal-900 dark:text-white rounded-bl-md shadow-sm border border-amber-100/50 dark:border-charcoal-700/50 backdrop-blur-md hover:shadow-md";

  // === THEME: Typing bubble ===
  const typingBubble = isGoldChat
    ? "bg-white/90 dark:bg-charcoal-100/25 border border-white/40 dark:border-amber-700/30"
    : isSoftChat
    ? "bg-white/85 dark:bg-charcoal-800/70 border border-rose-200/50 dark:border-rose-800/30"
    : "bg-white/85 dark:bg-charcoal-800/70 border border-amber-100/50 dark:border-charcoal-700/50";

  const typingDot = isGoldChat ? "bg-amber-500/80" : isSoftChat ? "bg-rose-400/70" : "bg-amber-400/70";

  // === THEME: Header ===
  const headerBg = isGoldChat
    ? "bg-black/50 border-amber-800/30"
    : isSoftChat
    ? "bg-white/50 dark:bg-charcoal-900/50 border-rose-200/40 dark:border-rose-800/20"
    : "bg-white/50 dark:bg-charcoal-900/50 border-amber-100/40 dark:border-charcoal-700/40";

  // === THEME: Input bar ===
  const inputBg = isGoldChat
    ? "bg-black/50 border-amber-800/30"
    : isSoftChat
    ? "bg-white/50 dark:bg-charcoal-900/50 border-rose-200/40 dark:border-rose-800/20"
    : "bg-white/50 dark:bg-charcoal-900/50 border-amber-100/40 dark:border-charcoal-700/40";

  // === THEME: Input field ===
  const inputField = isGoldChat
    ? "bg-white/10 border-amber-700/40 text-white placeholder-amber-200/50 font-medium"
    : isSoftChat
    ? "bg-white/60 dark:bg-charcoal-800/60 border-rose-200/50 dark:border-rose-800/40 text-charcoal-900 dark:text-white placeholder-charcoal-500 font-medium"
    : "bg-white/60 dark:bg-charcoal-800/60 border-amber-200/50 dark:border-charcoal-700/50 text-charcoal-900 dark:text-white placeholder-charcoal-500 font-medium";

  // === THEME: Send button ===
  const sendBtn = isGoldChat
    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-charcoal-900 shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-yellow-400"
    : isSoftChat
    ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-400/30 hover:from-rose-300 hover:to-pink-400"
    : "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30 hover:from-amber-300 hover:to-yellow-400";

  // === THEME: Full-width bottom bar ===
  const bottomBarBg = isGoldChat
    ? "bg-gradient-to-r from-black via-charcoal-900 to-black border-t border-amber-700/40"
    : isSoftChat
    ? "bg-gradient-to-r from-rose-100 via-pink-50 to-amber-50 dark:from-charcoal-900 dark:via-rose-950/50 dark:to-charcoal-800 border-t border-rose-300/50 dark:border-rose-800/40"
    : "bg-gradient-to-r from-white via-amber-50 to-yellow-50 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-amber-950/50 border-t border-amber-200/50 dark:border-charcoal-700/50";

  const bottomBarInner = isGoldChat
    ? "bg-white/10 border-amber-700/30"
    : isSoftChat
    ? "bg-white/50 dark:bg-charcoal-800/50 border-rose-200/40 dark:border-rose-800/30"
    : "bg-white/50 dark:bg-charcoal-800/50 border-amber-200/40 dark:border-charcoal-700/40";

  return (
    <div id="messages-root" className="h-dvh flex flex-col bg-blur-image overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex min-h-0 lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="flex flex-1 min-h-0">

          {/* Conversation List */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-charcoal-100/50 dark:border-charcoal-700 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur flex flex-col ${mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            <div className="p-3 lg:p-4 border-b border-charcoal-100/50 dark:border-charcoal-700">
              <h1 className="text-lg lg:text-xl font-display font-bold text-charcoal-900 dark:text-white">{t('messages.title')}</h1>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <Input placeholder={t('messages.search')} className="pl-9 text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
              {isLoading && conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-400">{t('common.loading')}</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-400">{t('messages.noConversations')}</div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => { setActiveConversation(conv.id); setMobileThreadOpen(true); markAsRead(conv.id); }}
                      className={`w-full text-left p-3 lg:p-4 hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50 transition-colors ${activeConversation === conv.id ? "bg-accent/5 dark:bg-accent/10" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar
                            size="sm"
                            firstName={conv.name?.split(" ")[0] || conv.name || ""}
                            lastName={conv.name?.split(" ").slice(1).join(" ") || ""}
                            src={mediaUrl(conv.avatar)}
                            membershipPlan={conv.membershipPlan || null}
                            isVerified={conv.isVerified}
                            className="shrink-0"
                          />
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none bg-red-500 text-white shadow-md border-2 border-white dark:border-charcoal-900">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-charcoal-900 dark:text-white truncate">{conv.name || t('messages.userFallback')}</span>
                            <span className="text-xs text-charcoal-400 shrink-0">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}</span>
                          </div>
                          {conv.username && <p className="text-[11px] text-accent font-medium truncate">@{conv.username}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate">{conv.lastMessage || ""}</p>
                            {blockedUsers.includes(conv.id) && <span className="text-[10px] text-red-500 font-medium shrink-0">Blocked</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConvMenuId(convMenuId === conv.id ? null : conv.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-charcoal-200/80 dark:hover:bg-charcoal-700/80"
                    >
                      <MoreVertical className="w-4 h-4 text-charcoal-500 dark:text-charcoal-400" />
                    </button>
                    {convMenuId === conv.id && (
                      <div ref={convMenuRef} className="absolute right-2 top-12 z-50 bg-white dark:bg-charcoal-800 rounded-2xl shadow-2xl border-2 border-charcoal-300 dark:border-charcoal-600 py-1.5 min-w-[180px] overflow-hidden">
                        <button onClick={() => {
                          setConvMenuId(null);
                          setDeleteConfirm({ otherUserId: conv.id, name: conv.name || t('messages.thisUser') });
                        }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4 shrink-0" /> {t('common.delete')}
                        </button>
                        <div className="border-t border-charcoal-100 dark:border-charcoal-700/60 my-1" />
                        {blockedUsers.includes(conv.id) ? (
                          <button onClick={() => {
                            setConvMenuId(null);
                            unblockUser(conv.id);
                          }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700/50 transition-colors">
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.unblock')}
                          </button>
                        ) : (
                          <button onClick={() => {
                            setConvMenuId(null);
                            setBlockConfirm({ otherUserId: conv.id, name: conv.name || t('messages.thisUser') });
                          }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.blockUser')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 flex flex-col min-h-0 ${themeBg} relative ${!mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            {/* Decorative bokeh overlay */}
            <div className={`absolute inset-0 pointer-events-none ${bokehClass}`} style={bokehStyle} />
            {showThread ? (
              <>
                {/* Thread Header */}
                <div className={`px-2 lg:px-4 ${mobileKeyboardOpen ? "py-1.5" : "py-2.5 lg:py-3"} border-b ${headerBg} backdrop-blur flex items-center justify-between shrink-0 z-10`}>
                  <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                    <button onClick={() => { setMobileThreadOpen(false); setActiveConversation(null); }} className="lg:hidden p-1 -ml-1">
                      <ChevronLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
                    </button>
                    <button onClick={() => { if (activeConversation) router.push(`/user/${activeConversation}`); }} className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0 text-left">
                      <Avatar size="sm" firstName={(activeConv?.name || urlName || "")?.split(" ")[0] || ""} lastName={(activeConv?.name || urlName || "")?.split(" ").slice(1).join(" ") || ""} src={mediaUrl(activeConv?.avatar)} status={activeConv?.isOnline ? "online" : "offline"} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${mobileKeyboardOpen ? "text-xs" : "text-sm"} ${isGoldChat ? "text-white" : "text-charcoal-900 dark:text-white"} hover:underline truncate`}>{activeConv?.name || urlName || t('messages.userFallback')}</span>
                          {activeConv?.isVerified && (
                            <span className={`shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full ${isGoldChat ? "bg-amber-400/20" : "bg-blue-500/15"}`}>
                              <svg className={`w-2.5 h-2.5 ${isGoldChat ? "text-amber-400" : "text-blue-500"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          {activeConv?.membershipPlan === "platinum" && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] ring-1 ring-purple-300/50">
                              <Gem className="w-2.5 h-2.5 fill-white/30" />
                              Platinum
                            </span>
                          )}
                          {activeConv?.membershipPlan === "gold" && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-charcoal-900 shadow-[0_0_10px_rgba(251,191,36,0.5)] ring-1 ring-yellow-300/50">
                              <Crown className="w-2.5 h-2.5 fill-charcoal-900/20" />
                              Gold
                            </span>
                          )}
                          {(!activeConv?.membershipPlan) && (
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ring-1 ${isGoldChat ? "bg-white/10 text-amber-200/60 ring-white/10" : "bg-charcoal-50 dark:bg-charcoal-800/50 text-charcoal-400 dark:text-charcoal-500 ring-charcoal-200/50 dark:ring-charcoal-700/50"}`}>
                              <Sparkles className="w-2.5 h-2.5" />
                              Free
                            </span>
                          )}
                        </div>
                        {!mobileKeyboardOpen && (activeConv?.username || urlUsername ? <p className={`text-[11px] font-medium truncate ${isGoldChat ? "text-amber-400" : "text-accent"}`}>@{activeConv?.username || urlUsername}</p> : null)}
                        {activeConv?.isOnline ? (
                          <p className={`${mobileKeyboardOpen ? "text-[10px]" : "text-xs"} text-green-500`}>{t('messages.online')}</p>
                        ) : (
                          <p className={`${mobileKeyboardOpen ? "text-[10px]" : "text-xs"} ${isGoldChat ? "text-amber-200/50" : "text-charcoal-400"}`}>{!mobileKeyboardOpen ? formatLastSeen(activeConv?.lastLoginAt) : ""}</p>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 relative">
                    <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className={`p-2 rounded-full transition-colors ${isGoldChat ? "hover:bg-amber-900/30" : "hover:bg-charcoal-100 dark:hover:bg-charcoal-800"}`}><MoreVertical className={`w-4 h-4 ${isGoldChat ? "text-amber-400" : "text-charcoal-500 dark:text-charcoal-400"}`} /></button>
                    {showHeaderMenu && (
                      <div ref={headerMenuRef} className={`absolute right-0 top-full mt-1 z-50 rounded-2xl shadow-2xl border-2 py-1.5 min-w-[190px] overflow-hidden ${isGoldChat ? "bg-black border-amber-600/50" : "bg-white dark:bg-charcoal-800 border-charcoal-300 dark:border-charcoal-600"}`}>
                        <button onClick={() => { setShowHeaderMenu(false); setShowReportDialog(true); }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-red-400 hover:bg-red-500/15" : "text-red-600 dark:text-red-400 hover:bg-red-500/10"}`}>
                          <Flag className="w-4 h-4 shrink-0" /> {t('messages.reportUser')}
                        </button>
                        {blockedUsers.includes(activeConversation!) ? (
                          <button onClick={() => {
                            setShowHeaderMenu(false);
                            unblockUser(activeConversation!);
                          }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-amber-200/80 hover:bg-amber-900/40" : "text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700/50"}`}>
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.unblock')}
                          </button>
                        ) : (
                          <button onClick={() => {
                            setShowHeaderMenu(false);
                            setBlockConfirm({ otherUserId: activeConversation!, name: activeConv?.name || urlName || "this user" });
                          }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-red-400 hover:bg-red-500/15" : "text-red-600 dark:text-red-400 hover:bg-red-500/10"}`}>
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.blockUser')}
                          </button>
                        )}
                        <div className={`border-t my-1 ${isGoldChat ? "border-amber-800/30" : "border-charcoal-100 dark:border-charcoal-700/60"}`} />
                        <button onClick={() => {
                          setShowHeaderMenu(false);
                          setDeleteConfirm({ otherUserId: activeConversation!, name: activeConv?.name || urlName || "this user" });
                        }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-red-400 hover:bg-red-500/15" : "text-red-600 dark:text-red-400 hover:bg-red-500/10"}`}>
                          <Trash2 className="w-4 h-4 shrink-0" /> {t('messages.deleteConversation')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Context Banner */}
                {(matchReason || activeConv?.compatibilityReason) && !mobileKeyboardOpen && (
                  <div className="px-3 lg:px-4 py-2 border-b border-charcoal-100/50 dark:border-charcoal-700 bg-accent/5 dark:bg-accent/10 shrink-0">
                    <p className="text-xs text-accent font-medium text-center flex items-center justify-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      {matchReason || activeConv?.compatibilityReason}
                    </p>
                  </div>
                )}

                {/* Blocked Banner */}
                {activeConversation && blockedUsers.includes(activeConversation) && (
                  <div className="px-3 lg:px-4 py-2.5 border-b border-charcoal-100/50 dark:border-charcoal-700 bg-red-50/80 dark:bg-red-900/10 shrink-0">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <ShieldOff className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-red-600 dark:text-red-400 font-medium">{t('messages.blockedBanner')}</span>
                    </div>
                  </div>
                )}

                {/* In-chat permission requests (incoming — partner wants to talk to someone else) */}
                {activeConversation && chatPermRequests.length > 0 && (
                  <div className="px-3 lg:px-4 py-3 border-b border-amber-200/50 dark:border-amber-800/30 bg-amber-50/90 dark:bg-amber-900/15 shrink-0 space-y-2">
                    {chatPermRequests.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Permission Request
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-400/80 truncate">
                            {perm.requester?.firstName} wants to talk to {perm.targetUser?.firstName} {perm.targetUser?.lastName}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={async () => {
                              setChatPermLoading(perm.id);
                              try {
                                await conversationPermissionService.respondToPermission(perm.id, "approved");
                                setChatPermRequests(prev => prev.filter(p => p.id !== perm.id));
                                setToastError(false);
                                setToast("Permission granted. They can now start a new conversation.");
                                setTimeout(() => setToast(null), 4000);
                              } catch {
                                setToastError(true);
                                setToast("Failed to respond. Try again.");
                                setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                              } finally {
                                setChatPermLoading(null);
                              }
                            }}
                            disabled={chatPermLoading === perm.id}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={async () => {
                              setChatPermLoading(perm.id);
                              try {
                                await conversationPermissionService.respondToPermission(perm.id, "denied");
                                setChatPermRequests(prev => prev.filter(p => p.id !== perm.id));
                                setToastError(false);
                                setToast("Permission denied.");
                                setTimeout(() => setToast(null), 4000);
                              } catch {
                                setToastError(true);
                                setToast("Failed to respond. Try again.");
                                setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                              } finally {
                                setChatPermLoading(null);
                              }
                            }}
                            disabled={chatPermLoading === perm.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sent permission status (outgoing — you asked this partner to talk to someone else) */}
                {activeConversation && sentPermStatus.length > 0 && (
                  <div className="px-3 lg:px-4 py-3 border-b border-charcoal-100/50 dark:border-charcoal-700/50 bg-charcoal-50/80 dark:bg-charcoal-800/30 shrink-0 space-y-2">
                    {sentPermStatus.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          perm.status === "approved" ? "bg-green-100 dark:bg-green-500/20" :
                          perm.status === "denied" ? "bg-red-100 dark:bg-red-500/20" :
                          "bg-amber-100 dark:bg-amber-500/20"
                        }`}>
                          {perm.status === "approved" ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                           perm.status === "denied" ? <X className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                           <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-charcoal-800 dark:text-charcoal-200">
                            {perm.status === "pending" ? "Permission Pending" :
                             perm.status === "approved" ? "Permission Approved" : "Permission Denied"}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 truncate">
                            {perm.status === "pending" ? `Waiting for ${perm.partner?.firstName || "partner"} to approve your request to talk to ${perm.targetUser?.firstName} ${perm.targetUser?.lastName}` :
                             perm.status === "approved" ? `${perm.partner?.firstName || "Partner"} approved — you can now talk to ${perm.targetUser?.firstName} ${perm.targetUser?.lastName}` :
                             `${perm.partner?.firstName || "Partner"} denied your request to talk to ${perm.targetUser?.firstName} ${perm.targetUser?.lastName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto min-h-0 p-3 lg:p-4 space-y-2 lg:space-y-3 z-10">
                  {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-charcoal-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center p-4">
                      <div>
                        <h3 className="text-base lg:text-lg font-display font-semibold text-charcoal-900 dark:text-white">{t('messages.sayHello')}</h3>
                        <p className="text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">{t('messages.sendFirst')}</p>
                      </div>
                    </div>
                  ) : (
                    [...messages].reverse().map((msg) => {
                      const otherId = activeConversation;
                      const isOwn = otherId ? msg.senderId !== otherId : true;
                      const otherAvatar = mediaUrl(activeConv?.avatar);
                      const myAvatar = mediaUrl(user?.photos?.[0]);
                      const showAvatar = isOwn ? myAvatar : otherAvatar;
                      const otherName = activeConv?.name || urlName || "User";
                      const senderInitials = isOwn
                        ? [user?.firstName, user?.lastName].filter(Boolean).map((n) => n?.[0]).join("")
                        : otherName.split(" ").map((n) => n[0]).join("") || "U";
                      return (
                        <div
                          key={msg.id}
                          ref={(el) => { messageRefs.current[msg.id] = el; }}
                          className={`relative group flex items-end gap-1.5 mb-2 flex-row rounded-2xl transition-all duration-500 ${isOwn ? "justify-end flex-row-reverse" : "justify-start"} ${highlightMsgId === msg.id ? "bg-amber-400/20 dark:bg-amber-400/10 ring-2 ring-amber-400/50" : ""}`}
                          onTouchStart={(e) => handleMsgTouchStart(e, msg)}
                          onTouchMove={(e) => handleMsgTouchMove(e, msg)}
                          onTouchEnd={handleMsgTouchEnd}
                        >
                          {/* 3-dots menu button - left for other, right for own (Telegram style) */}
                          <button
                            onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                            className={`shrink-0 self-center p-1.5 rounded-full transition-all ${menuMsgId === msg.id ? "opacity-100" : "opacity-40 hover:opacity-100"} ${isGoldChat ? "hover:bg-amber-900/40" : "hover:bg-charcoal-100 dark:hover:bg-charcoal-800"}`}
                            title="More"
                          >
                            <MoreVertical className={`w-4 h-4 ${isGoldChat ? "text-amber-400/70" : "text-charcoal-400 dark:text-charcoal-500"}`} />
                          </button>

                          {/* Context menu */}
                          {menuMsgId === msg.id && (
                            <div ref={menuRef} className={`absolute top-8 z-50 rounded-2xl shadow-2xl border-2 py-1.5 min-w-[175px] overflow-hidden ${isGoldChat ? "bg-black border-amber-600/50" : "bg-white dark:bg-charcoal-800 border-charcoal-300 dark:border-charcoal-600"} ${isOwn ? "right-8" : "left-8"}`}>
                              <button onClick={() => { setReplyTo(msg); setMenuMsgId(null); }} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-amber-200/80 hover:bg-amber-900/40" : "text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700/50"}`}>
                                <Reply className="w-4 h-4 shrink-0" /> Reply
                              </button>
                              <button onClick={() => handleDelete(msg.id, "me")} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-amber-200/80 hover:bg-amber-900/40" : "text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700/50"}`}>
                                <Trash2 className="w-4 h-4 shrink-0" /> Delete for me
                              </button>
                              {isOwn && (
                                <button onClick={() => handleDelete(msg.id, "both")} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${isGoldChat ? "text-red-400 hover:bg-red-500/15" : "text-red-600 dark:text-red-400 hover:bg-red-500/10"}`}>
                                  <Trash2 className="w-4 h-4 shrink-0" /> Delete for everyone
                                </button>
                              )}
                            </div>
                          )}

                          {/* Swipe-left reply indicator */}
                          {swipeMsgId === msg.id && (
                            <div className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${isOwn ? "right-10" : "left-10"}`}>
                              <div className={`flex items-center justify-center w-9 h-9 rounded-full ${isGoldChat ? "bg-amber-500/80" : isSoftChat ? "bg-rose-400/80" : "bg-amber-400/80"} shadow-lg`}>
                                <Reply className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%] lg:max-w-[55%] transition-transform duration-200 ${swipeMsgId === msg.id ? (isOwn ? "translate-x-8" : "-translate-x-8") : ""}`}
                          >
                            <div className={`rounded-3xl text-sm overflow-hidden transition-all hover:shadow-lg ${isOwn ? ownBubble : otherBubble}`}>
                              {msg.replyTo && (
                                <div
                                  onClick={() => msg.replyTo?.id && scrollToMessage(msg.replyTo.id)}
                                  className={`px-3 pt-2 pb-1.5 cursor-pointer rounded-t-2xl transition-colors hover:brightness-95 ${isOwn ? "bg-black/10 border-l-2 border-charcoal-900/40" : isGoldChat ? "bg-amber-900/20 border-l-2 border-amber-400/60" : "bg-black/5 dark:bg-white/10 border-l-2 border-accent/60"}`}
                                >
                                  <p className={`text-xs font-bold ${isOwn ? "text-charcoal-900" : isGoldChat ? "text-amber-400" : "text-accent"}`}>
                                    {msg.replyTo.senderId === myId ? t('messages.you') : (msg.replyTo.sender?.firstName || "User")}
                                  </p>
                                  <p className={`text-xs truncate font-medium ${isOwn ? "text-charcoal-800/80" : "text-charcoal-600 dark:text-charcoal-300"}`}>
                                    {msg.replyTo.content || ""}
                                  </p>
                                </div>
                              )}
                              {(() => {
                                const imgSrc = msg.content?.startsWith("IMG:") ? msg.content.split("|")[0].slice(4) : msg.imageUrl || null;
                                const capText = msg.content?.startsWith("IMG:") && msg.content.includes("|") ? msg.content.split("|")[1] : null;
                                 const isPending = msg.id?.startsWith("temp-");
                                 const fileMatch = msg.content?.startsWith("FILE:") ? msg.content.slice(5).split("|") : null;
                                 const fileUrl = fileMatch?.[0];
                                 const fileName = fileMatch?.[1] || "File";
                                 const fileSize = fileMatch?.[2] ? parseInt(fileMatch[2]) : 0;
                                 const fileCap = fileMatch?.[3];
                                 const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
                                 const fileIcon = fileExt === "pdf" ? "📕" : fileExt === "doc" || fileExt === "docx" ? "📘" : fileExt === "xls" || fileExt === "xlsx" ? "📗" : fileExt === "ppt" || fileExt === "pptx" ? "📙" : fileExt === "zip" ? "🗜️" : "📄";
                                 return fileMatch ? (
                                   <div className="max-w-[240px]">
                                     <a
                                       href={fileUrl && fileUrl !== "pending" ? mediaUrl(fileUrl) : undefined}
                                       download={fileName}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isPending ? "opacity-60 pointer-events-none" : isGoldChat ? "hover:bg-amber-900/30" : "hover:bg-black/5 dark:hover:bg-white/5"} ${isOwn ? "" : ""}`}
                                     >
                                       <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xl ${isOwn ? "bg-charcoal-900/10" : isGoldChat ? "bg-amber-900/40" : "bg-charcoal-100 dark:bg-charcoal-700"}`}>
                                         {fileIcon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <p className={`text-sm font-semibold truncate ${isOwn ? "text-charcoal-900" : isGoldChat ? "text-white" : "text-charcoal-900 dark:text-white"}`}>{fileName}</p>
                                         <p className={`text-[10px] ${isOwn ? "text-charcoal-700/60" : isGoldChat ? "text-amber-200/50" : "text-charcoal-400"}`}>
                                           {fileSize > 0 ? `${(fileSize / 1024).toFixed(1)} KB` : ""}
                                         </p>
                                       </div>
                                       {!isPending && (
                                         <Download className={`w-4 h-4 shrink-0 ${isOwn ? "text-charcoal-700/60" : isGoldChat ? "text-amber-400" : "text-charcoal-400"}`} />
                                       )}
                                     </a>
                                     {fileCap && <p className={`px-3 pt-1 pb-1 text-sm break-words whitespace-pre-wrap ${isPending ? "opacity-60" : ""}`}>{fileCap}</p>}
                                     {isPending && (
                                       <div className="flex items-center justify-center py-1">
                                         <div className="bg-black/50 text-white text-[11px] font-medium px-3 py-1 rounded-full">{t('messages.sending')}</div>
                                       </div>
                                     )}
                                   </div>
                                ) : imgSrc ? (
                                   <div className="max-w-[200px] relative">
                                     <div className={`px-2 pt-2 ${isPending ? "opacity-60" : ""}`}>
                                        <img src={mediaUrl(imgSrc)} alt="Shared image" className="w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity pointer-events-auto" loading="lazy" onClick={() => setPreviewImage(mediaUrl(imgSrc) || null)} />
                                     </div>
                                     {capText && <p className={`px-3 pt-1 pb-1 text-sm break-words whitespace-pre-wrap ${isPending ? "opacity-60" : ""}`}>{capText}</p>}
                                     {isPending && (
                                       <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="bg-black/50 text-white text-[11px] font-medium px-3 py-1 rounded-full">{t('messages.sending')}</div>
                                       </div>
                                     )}
                                   </div>
                                ) : msg.content ? (
                                  <p className="px-4 pt-2.5 pb-1 leading-relaxed font-medium">{msg.content}</p>
                                ) : null;
                              })()}
                              <div className="flex items-center justify-end gap-1.5 px-4 pb-2">
                                <p className={`text-xs font-semibold ${isOwn ? (isGoldChat ? "text-charcoal-800" : isSoftChat ? "text-charcoal-800" : "text-charcoal-800") : "text-charcoal-600 dark:text-charcoal-300"}`}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </p>
                                {isOwn && (
                                  msg.readAt ? (
                                    <CheckCheck className={`w-4 h-4 ${isGoldChat ? "text-blue-700" : isSoftChat ? "text-blue-600" : "text-blue-600"}`} />
                                  ) : msg.deliveredAt ? (
                                    <CheckCheck className={`w-4 h-4 ${isGoldChat ? "text-charcoal-700" : isSoftChat ? "text-charcoal-700" : "text-charcoal-700"}`} />
                                  ) : (
                                    <Check className={`w-4 h-4 ${isGoldChat ? "text-charcoal-600" : isSoftChat ? "text-charcoal-600" : "text-charcoal-600"}`} />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Typing Indicator */}
                  {activeConversation && typingUsers[activeConversation] && (
                    <div className="flex items-end gap-2 text-xs text-charcoal-400 dark:text-charcoal-500">
                      <div className={`flex gap-1 items-center px-4 py-3 rounded-3xl rounded-bl-md backdrop-blur-md shadow-sm ${typingBubble}`}>
                        <span className={`w-2 h-2 rounded-full ${typingDot} animate-bounce`} style={{ animationDelay: "0ms" }} />
                        <span className={`w-2 h-2 rounded-full ${typingDot} animate-bounce`} style={{ animationDelay: "150ms" }} />
                        <span className={`w-2 h-2 rounded-full ${typingDot} animate-bounce`} style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="pb-1">{t('messages.isTyping', { user: activeConv?.name || "User" })}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply bar - moved to bottom bar below */}

                {/* Bottom Message Bar - inside chat section */}
                {activeConversation && !blockedUsers.includes(activeConversation) ? (
                  <div className={`shrink-0 z-10 ${bottomBarBg} backdrop-blur-xl`}>
                    <div className="px-3 lg:px-4 py-3">
                      {/* Reply bar */}
                      {replyTo && (
                        <div
                          onClick={() => replyTo.id && scrollToMessage(replyTo.id)}
                          className={`mb-2 px-3 py-2 rounded-xl backdrop-blur flex items-center gap-3 cursor-pointer hover:brightness-95 transition-all ${bottomBarInner} border`}
                        >
                          <Reply className={`w-4 h-4 shrink-0 ${isGoldChat ? "text-amber-400" : "text-accent"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${isGoldChat ? "text-amber-400" : "text-accent"}`}>
                              {replyTo.senderId === myId ? t('messages.you') : (activeConv?.name || urlName || "User")}
                            </p>
                            <p className={`text-xs truncate font-medium ${isGoldChat ? "text-amber-200/70" : "text-charcoal-600 dark:text-charcoal-300"}`}>{replyTo.content || ""}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setReplyTo(null); }} className={`p-1 rounded-full transition-colors ${isGoldChat ? "hover:bg-amber-900/30" : "hover:bg-charcoal-200 dark:hover:bg-charcoal-700"}`}>
                            <X className={`w-4 h-4 ${isGoldChat ? "text-amber-400" : "text-charcoal-400"}`} />
                          </button>
                        </div>
                      )}
                      {/* Image preview */}
                      {imagePreview && (
                        <div className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 border ${bottomBarInner}`}>
                          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-charcoal-200 dark:bg-charcoal-700">
                            <img src={URL.createObjectURL(imagePreview)} alt="preview" className="w-full h-full object-cover pointer-events-auto" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${isGoldChat ? "text-amber-200/60" : "text-charcoal-500 dark:text-charcoal-400"}`}>{imagePreview.name}</p>
                            {uploading && (
                              <div className="w-full h-1 bg-charcoal-200 dark:bg-charcoal-700 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button type="button" onClick={() => handleSend()} className={`p-1.5 rounded-lg transition-colors shrink-0 ${sendBtn}`}>
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => { setImagePreview(null); setCaption(""); setUploadProgress(0); }} className={`p-1 rounded-full transition-colors shrink-0 ${isGoldChat ? "hover:bg-amber-900/30" : "hover:bg-charcoal-200 dark:hover:bg-charcoal-700"}`}>
                            <X className={`w-4 h-4 ${isGoldChat ? "text-amber-400" : "text-charcoal-400"}`} />
                          </button>
                        </div>
                      )}
                      {/* File preview */}
                      {filePreview && (
                        <div className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 border ${bottomBarInner}`}>
                          <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center ${isGoldChat ? "bg-amber-900/40" : "bg-charcoal-200 dark:bg-charcoal-700"}`}>
                            <Paperclip className={`w-5 h-5 ${isGoldChat ? "text-amber-400" : "text-charcoal-500 dark:text-charcoal-400"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate font-medium ${isGoldChat ? "text-amber-200/80" : "text-charcoal-700 dark:text-charcoal-300"}`}>{filePreview.name}</p>
                            <p className={`text-[10px] ${isGoldChat ? "text-amber-200/50" : "text-charcoal-400"}`}>{(filePreview.size / 1024).toFixed(1)} KB</p>
                            {uploading && (
                              <div className="w-full h-1 bg-charcoal-200 dark:bg-charcoal-700 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button type="button" onClick={() => handleSend()} className={`p-1.5 rounded-lg transition-colors shrink-0 ${sendBtn}`}>
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => { setFilePreview(null); setCaption(""); setUploadProgress(0); }} className={`p-1 rounded-full transition-colors shrink-0 ${isGoldChat ? "hover:bg-amber-900/30" : "hover:bg-charcoal-200 dark:hover:bg-charcoal-700"}`}>
                            <X className={`w-4 h-4 ${isGoldChat ? "text-amber-400" : "text-charcoal-400"}`} />
                          </button>
                        </div>
                      )}
                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-200 dark:border-charcoal-700 p-3 max-h-[40vh] overflow-y-auto w-[90vw] max-w-md">
                          <div className="grid grid-cols-7 gap-1">
                            {["😊","🥰","😍","❤️","💕","😘","😇","🤲","🌙","⭐","🌸","🌹","💐","🕌","🤝","💍","🎉","🥺","😌","💭","✨","🙏","😁","😂","🤗","😎","🥹","😅","😳","🤔","😢","😭","👍","👋","🫂"].map((emoji, idx) => (
                              <button
                                key={`emoji-${idx}`}
                                type="button"
                                onClick={() => {
                                  setNewMessage((prev) => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-700 rounded-lg text-lg transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Main input row */}
                      {serverBusy && (
                        <div className="flex items-center justify-center gap-2 py-2 px-4 mb-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-sm font-medium">
                          <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
                          Server busy — retrying in {busyCountdown}s…
                        </div>
                      )}
                      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                        {/* Emoji icon - far left */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          disabled={serverBusy}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0 disabled:opacity-40 disabled:hover:scale-100 ${isGoldChat ? "hover:bg-amber-900/40" : "hover:bg-charcoal-100 dark:hover:bg-charcoal-800"}`}
                        >
                          <Smile className={`w-6 h-6 ${isGoldChat ? "text-amber-400" : isSoftChat ? "text-rose-500" : "text-amber-600"}`} />
                        </button>
                        {/* File attachment icon - next to emoji */}
                        <label className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0 cursor-pointer ${serverBusy ? "opacity-40 pointer-events-none" : isGoldChat ? "hover:bg-amber-900/40" : "hover:bg-charcoal-100 dark:hover:bg-charcoal-800"}`}>
                          <Paperclip className={`w-6 h-6 ${isGoldChat ? "text-amber-400" : isSoftChat ? "text-rose-500" : "text-amber-600"}`} />
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" className="hidden" onChange={handleImageSelect} disabled={serverBusy} />
                        </label>
                        {/* Input field - center */}
                        <input
                          value={newMessage}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder={serverBusy ? "Server busy — please wait…" : "Type a message…"}
                          disabled={uploading || serverBusy}
                          className={`flex-1 h-12 rounded-full px-5 text-base font-semibold border-2 outline-none transition-all focus:ring-2 focus:ring-amber-400/40 ${inputField}`}
                        />
                        {/* Send button - far right */}
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && !imagePreview) || uploading || serverBusy}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 shrink-0 ${serverBusy ? "bg-amber-400/50" : sendBtn}`}
                        >
                          {serverBusy ? (
                            <span className="text-xs font-bold text-white">{busyCountdown}s</span>
                          ) : uploading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-6 h-6" />
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : activeConversation && blockedUsers.includes(activeConversation) ? (
                  <div className={`shrink-0 z-10 ${bottomBarBg} backdrop-blur-xl`}>
                    <div className="px-3 lg:px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-charcoal-500 dark:text-charcoal-400">
                        <ShieldOff className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{t('messages.youBlocked')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => unblockUser(activeConversation)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                      >
                        {t('messages.unblock')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 z-10">
                <div className="text-center">
                  <h3 className="text-lg font-display font-semibold text-charcoal-900 dark:text-white">{t('messages.title')}</h3>
                  <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">{t('messages.selectConversation') || "Select a conversation to start chatting"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowReportDialog(false)}>
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-200 dark:border-charcoal-700 p-5 mx-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold text-charcoal-900 dark:text-white mb-4">{t('messages.reportUser')}</h3>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-3">{t('messages.reportReason', { user: activeConv?.name || urlName || "this user" })}</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full text-sm bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-900 dark:text-white mb-3"
            >
              <option value="inappropriate">{t('messages.reportInappropriate')}</option>
              <option value="harassment">{t('messages.reportHarassment')}</option>
              <option value="fake_profile">{t('messages.reportFake')}</option>
              <option value="spam">{t('messages.reportSpam')}</option>
              <option value="other">{t('messages.reportOther')}</option>
            </select>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder={t('messages.reportDetails')}
              rows={3}
              className="w-full text-sm bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-lg px-3 py-2 text-charcoal-900 dark:text-white placeholder-charcoal-400 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowReportDialog(false); setReportDescription(""); setReportReason("inappropriate"); }}
                className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReport}
                disabled={reportSubmitting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {reportSubmitting ? t('messages.submitting') : t('messages.submitReport')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request Dialog */}
      {permissionDialog && permissionPartnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPermissionDialog(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100/50 dark:border-charcoal-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-display font-semibold text-charcoal-900 dark:text-white mb-2">Permission Required</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                You have an active conversation. To start talking to <span className="font-semibold text-charcoal-700 dark:text-charcoal-300">{permissionDialog.targetName}</span>, you need permission from your current partner.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setPermissionSubmitting(true);
                  try {
                    await conversationPermissionService.requestPermission(
                      permissionPartnerId,
                      permissionDialog.targetUserId,
                      "I'd like to start a conversation with someone new."
                    );
                    setToastError(false);
                    setToast("Permission request sent! You'll be notified when your partner responds.");
                    setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                    setPermissionDialog(null);
                  } catch (err: any) {
                    const msg = err?.response?.data?.error || "Failed to send permission request";
                    setToastError(true);
                    setToast(msg);
                    setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                  } finally {
                    setPermissionSubmitting(false);
                  }
                }}
                disabled={permissionSubmitting}
                className="w-full px-4 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent-dark disabled:opacity-50 transition-colors"
              >
                {permissionSubmitting ? "Sending..." : "Request Permission from Partner"}
              </button>
              <button
                onClick={() => setPermissionDialog(null)}
                className="w-full px-4 py-2.5 text-sm font-medium text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100/50 dark:border-charcoal-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t('messages.deleteConversation')}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">
                {t('messages.deleteConfirm', { name: deleteConfirm.name })}
              </p>
              <p className="text-xs text-charcoal-400 mb-6">{t('messages.deleteWarning')}</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    try {
                      await deleteConversation(deleteConfirm.otherUserId, "me");
                      setDeleteConfirm(null);
                      setToastError(false);
                      setToast(t('messages.deleted', { name: deleteConfirm.name }));
                      setTimeout(() => { setToast(null); setToastError(false); }, 1200);
                    } catch (e: any) {
                      alert(e?.response?.data?.error || e?.message || "Failed to delete conversation");
                      setDeleteConfirm(null);
                    }
                  }}
                >
                  {t('messages.yesDelete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {blockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setBlockConfirm(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border border-charcoal-100/50 dark:border-charcoal-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <ShieldOff className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{t('messages.blockUser')}</h3>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-1">
                {t('messages.blockConfirm', { name: blockConfirm.name })}
              </p>
              <p className="text-xs text-charcoal-400 mb-6">{t('messages.blockWarning')}</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => setBlockConfirm(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    try {
                      await blockUser(blockConfirm.otherUserId);
                      setBlockConfirm(null);
                    } catch {
                      alert(t('messages.blockFailed'));
                      setBlockConfirm(null);
                    }
                  }}
                >
                  {t('messages.blockUser')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Toast */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-300 ${
          toast ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={`bg-white dark:bg-charcoal-800 rounded-2xl shadow-elevated border ${toastError ? "border-red-200 dark:border-red-900" : "border-charcoal-100/50 dark:border-charcoal-700"} px-6 py-4 transform transition-all duration-300 ${
          toast ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toastError ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}`}>
              {toastError ? (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m6-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium text-charcoal-900 dark:text-white max-w-xs">{toast}</p>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors z-10" onClick={() => setPreviewImage(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen text-charcoal-500">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}