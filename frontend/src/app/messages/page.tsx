"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Send, MoreVertical, ChevronLeft, ChevronRight, Reply, X, Trash2, Check, CheckCheck, Flag, Shield, ShieldOff, Paperclip, Smile, Heart, Crown, Gem, Sparkles, FileText, Download, Pencil, UserCheck, Lock, Mic, MessageCircle, Compass, User, BookOpen } from "lucide-react";
import { Input, Button, Avatar, IslamicPatternBackground } from "@/components/common";
import { useMessageStore } from "@/store/messages";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl, formatLastSeen } from "@/lib/utils";
import { conversationPermissionService } from "@/services/conversationPermission";
import { conversationRequestService } from "@/services/conversationRequest";
import { exclusivePartnershipService } from "@/services/exclusivePartnership";
import { waliService } from "@/services/wali";
import { authService } from "@/services/auth";
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
  const editMessage = store.editMessage;
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
  const [incomingConvRequests, setIncomingConvRequests] = useState<any[]>([]);
  const [partnership, setPartnership] = useState<any>(null);
  const [myPartnership, setMyPartnership] = useState<any>(null);
  const [partnershipStatus, setPartnershipStatus] = useState<any>(null);
  const [showPartnershipDialog, setShowPartnershipDialog] = useState(false);
  const [partnershipMessage, setPartnershipMessage] = useState("");
  const [partnershipSubmitting, setPartnershipSubmitting] = useState(false);
  const [showEndPartnershipConfirm, setShowEndPartnershipConfirm] = useState(false);
  const [endPartnershipSubmitting, setEndPartnershipSubmitting] = useState(false);
  const [showWaliDialog, setShowWaliDialog] = useState(false);
  const [waliDialogStep, setWaliDialogStep] = useState<1 | 2>(1);
  const [waliName, setWaliName] = useState("");
  const [waliRelationship, setWaliRelationship] = useState("");
  const [waliEmail, setWaliEmail] = useState("");
  const [waliSubmitting, setWaliSubmitting] = useState(false);
  const [waliStatus, setWaliStatus] = useState<any>(null);
  const [showRevokeWaliConfirm, setShowRevokeWaliConfirm] = useState(false);
  const [revokeWaliSubmitting, setRevokeWaliSubmitting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVerifying, setPasswordVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [urlName, setUrlName] = useState<string | null>(null);
  const [urlUsername, setUrlUsername] = useState<string | null>(null);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
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
  const [showShieldDetails, setShowShieldDetails] = useState(false);
  const [showWaliDetails, setShowWaliDetails] = useState(false);
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

  // Fetch the user's global active exclusive partnership (not per-conversation)
  useEffect(() => {
    exclusivePartnershipService.getMine().then(({ data }) => {
      setMyPartnership(data.partnership || null);
    }).catch(() => setMyPartnership(null));
  }, []);

  useEffect(() => {
    if (activeConversation) {
      try {
        const savedDraft = localStorage.getItem(`draft:${activeConversation}`);
        setNewMessage(savedDraft || "");
      } catch { setNewMessage(""); }
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
      // Fetch incoming conversation requests from this user
      conversationRequestService.getReceived("pending").then(({ data }) => {
        const relevant = (data.requests || []).filter((r: any) => r.requesterId === activeConversation);
        setIncomingConvRequests(relevant);
      }).catch(() => setIncomingConvRequests([]));
      // Fetch partnership status with this user
      exclusivePartnershipService.checkStatus(activeConversation).then(({ data }) => {
        setPartnershipStatus(data);
        setPartnership(data.partnership);
        // Fetch wali status if partnership is active
        if (data.partnership?.id) {
          waliService.getStatus(data.partnership.id).then(({ data: wData }) => {
            setWaliStatus(wData.invitation);
          }).catch(() => setWaliStatus(null));
        } else {
          setWaliStatus(null);
        }
      }).catch(() => { setPartnershipStatus(null); setPartnership(null); setWaliStatus(null); });
    } else {
      setChatPermRequests([]);
      setSentPermStatus([]);
      setIncomingConvRequests([]);
      setPartnership(null);
      setPartnershipStatus(null);
      setWaliStatus(null);
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

  // Mobile keyboard — use Visual Viewport API to detect keyboard and auto-scroll
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardOpen = vv.height < window.innerHeight - 120;
      setMobileKeyboardOpen(keyboardOpen);

      // Debounced auto-scroll to latest message after keyboard animation
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 250);
    };

    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      if (scrollTimer) clearTimeout(scrollTimer);
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
        const errMsg = e?.response?.data?.error || "Failed to send file. Please try again.";
        // Silently drop when the receiver blocked the sender — never reveal it
        if (errMsg.includes("cannot message this user")) {
          setUploadProgress(0);
          setUploading(false);
          return;
        }
        playMessageSound("error");
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
        const errMsg = e?.response?.data?.error || t('messages.sendImageFailed');
        // Silently drop when the receiver blocked the sender — never reveal it
        if (errMsg.includes("cannot message this user")) {
          URL.revokeObjectURL(localUrl);
          setUploadProgress(0);
          setUploading(false);
          return;
        }
        playMessageSound("error");
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
      const errMsg = e?.response?.data?.error;
      // Silently drop when the receiver blocked the sender — never reveal it
      if (errMsg?.includes("cannot message this user")) {
        setNewMessage("");
        setReplyTo(null);
        return;
      }
      playMessageSound("error");
      if (errMsg) {
        if (errMsg.includes("Exclusive Marriage Process") || errMsg.includes("exclusive partner")) {
          // Show permission dialog — user needs to request permission from their exclusive partner
          if (myPartnership) {
            const partnerId = myPartnership.userAId === myId ? myPartnership.userBId : myPartnership.userAId;
            setPermissionPartnerId(partnerId);
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
    if (activeConversation) {
      try { localStorage.removeItem(`draft:${activeConversation}`); } catch {}
    }
    emitTyping(activeConversation, false);
    await fetchConversations();
  }, [newMessage, activeConversation, replyTo, sendMessage, fetchConversations, emitTyping, imagePreview, filePreview, caption, blockedUsers, playMessageSound, t, startBusyCountdown, myPartnership]);

  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value);
    if (!activeConversation) return;
    try {
      if (value) {
        localStorage.setItem(`draft:${activeConversation}`, value);
      } else {
        localStorage.removeItem(`draft:${activeConversation}`);
      }
    } catch {}
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

  const handleEditClick = useCallback((msg: Message) => {
    const rawContent = msg.content?.startsWith("IMG:") || msg.content?.startsWith("FILE:") ? "" : (msg.content || "");
    setEditingMsgId(msg.id);
    setEditText(rawContent);
    setMenuMsgId(null);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingMsgId || !editText.trim()) return;
    try {
      await editMessage(editingMsgId, editText.trim());
      setEditingMsgId(null);
      setEditText("");
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || "Failed to edit message";
      setToastError(true);
      setToast(errMsg);
      setTimeout(() => { setToast(null); setToastError(false); }, 5000);
    }
  }, [editingMsgId, editText, editMessage]);

  const handleEditCancel = useCallback(() => {
    setEditingMsgId(null);
    setEditText("");
  }, []);

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

  // === PREMIUM DARK MODE THEME ===
  const isGoldChat = true;
  const isSoftChat = false;
  const themeBg = "bg-transparent";

  // Subtle Islamic geometric pattern overlay (2-3% opacity)
  const islamicPatternStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.6'%3E%3Cpath d='M40 0 L50 30 L80 40 L50 50 L40 80 L30 50 L0 40 L30 30 Z'/%3E%3Cpath d='M40 15 L47 33 L65 40 L47 47 L40 65 L33 47 L15 40 L33 33 Z'/%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: "80px 80px",
    backgroundRepeat: "repeat",
  };

  // Sent bubble: gradient green, 24px radius
  const ownBubble = "bg-gradient-to-br from-[#0F766E] to-[#10B981] text-white rounded-[24px] rounded-br-[8px] shadow-lg shadow-emerald-900/20";

  // Received bubble: dark gray, 24px radius, soft shadow
  const otherBubble = "bg-[#2B2B35] text-white rounded-[24px] rounded-bl-[8px] shadow-md shadow-black/20 border border-[#2D2D2D]/50";

  // Typing bubble
  const typingBubble = "bg-[#2B2B35] border border-[#2D2D2D]/50 rounded-[24px] rounded-bl-[8px]";
  const typingDot = "bg-[#D4AF37]";

  // Header: frosted glass, compact
  const headerBg = "bg-[#111827]/80 border-[#1F1F28]";

  // Input bar: floating glassmorphism
  const inputBg = "bg-[#111827]/60 border-[#1F1F28]";
  const inputField = "bg-transparent text-white placeholder-[#8B8B8B] font-medium";

  // Send button: gold circular with soft glow
  const sendBtn = "bg-gradient-to-br from-[#D4AF37] to-[#F2D675] text-black shadow-lg shadow-[#D4AF37]/30 hover:from-[#F2D675] hover:to-[#D4AF37]";

  // Bottom bar
  const bottomBarBg = "bg-[#111827]/80 border-t border-[#1F1F28]";
  const bottomBarInner = "bg-[#1A1A24] border-[#2D2D2D]";

  return (
    <div id="messages-root" className="relative z-10 h-dvh flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0 min-w-0 lg:pl-64 pt-0 lg:pt-0">
        <div className="flex flex-1 min-h-0 min-w-0">

          {/* Conversation List — with IslamicPatternBackground */}
          <IslamicPatternBackground>
          <div className={`w-full lg:w-80 xl:w-96 border-r border-[#2D2D2D] bg-[#181818]/40 backdrop-blur-sm flex flex-col min-w-0 ${mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-[#2D2D2D]">
              <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">{t('messages.title')}</h1>
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
                <input
                  placeholder={t('messages.search')}
                  className="w-full pl-9 pr-4 h-10 rounded-xl bg-[#222222] border border-[#2D2D2D] text-sm text-white placeholder-[#8B8B8B] outline-none focus:border-[#D4AF37]/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading && conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#8B8B8B]">{t('common.loading')}</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#8B8B8B]">{t('messages.noConversations')}</div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => { setActiveConversation(conv.id); setMobileThreadOpen(true); markAsRead(conv.id); }}
                      className={`w-full text-left p-3 lg:p-4 transition-colors ${activeConversation === conv.id ? "bg-[#222222]" : "hover:bg-[#1E1E1E]"}`}
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
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none bg-[#D4AF37] text-black shadow-md border-2 border-[#181818]">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-white truncate">{conv.name || t('messages.userFallback')}</span>
                            <span className="text-xs text-[#8B8B8B] shrink-0">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}</span>
                          </div>
                          {conv.username && <p className="text-[11px] text-[#D4AF37] font-medium truncate">@{conv.username}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-[#C8C8C8] truncate">{conv.lastMessage || ""}</p>
                            {blockedUsers.includes(conv.id) && <span className="text-[10px] text-red-500 font-medium shrink-0">Blocked</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConvMenuId(convMenuId === conv.id ? null : conv.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-[#2D2D2D]"
                    >
                      <MoreVertical className="w-4 h-4 text-[#8B8B8B]" />
                    </button>
                    {convMenuId === conv.id && (
                      <div ref={convMenuRef} className="absolute right-2 top-12 z-50 bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] py-1.5 min-w-[180px] overflow-hidden">
                        <button onClick={() => {
                          setConvMenuId(null);
                          setDeleteConfirm({ otherUserId: conv.id, name: conv.name || t('messages.thisUser') });
                        }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4 shrink-0" /> {t('common.delete')}
                        </button>
                        <div className="border-t border-[#2D2D2D] my-1" />
                        {blockedUsers.includes(conv.id) ? (
                          <button onClick={() => {
                            setConvMenuId(null);
                            unblockUser(conv.id);
                          }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C8C8C8] hover:bg-[#2D2D2D] transition-colors">
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.unblock')}
                          </button>
                        ) : (
                          <button onClick={() => {
                            setConvMenuId(null);
                            setBlockConfirm({ otherUserId: conv.id, name: conv.name || t('messages.thisUser') });
                          }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
          </IslamicPatternBackground>

          {/* Message Thread — solid #111827 background */}
          <div className={`flex-1 flex flex-col min-h-0 min-w-0 bg-[#111827] relative overflow-x-hidden ${!mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            {/* Subtle Islamic geometric pattern overlay (2-3% opacity) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={islamicPatternStyle} />
            {showThread ? (
              <>
                {/* Thread Header — Compact Frosted Glass */}
                <div className={`px-3 lg:px-4 ${mobileKeyboardOpen ? "py-1" : "py-2"} border-b ${headerBg} backdrop-blur-xl flex items-center justify-between shrink-0 z-30`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button onClick={() => { setMobileThreadOpen(false); setActiveConversation(null); }} className="lg:hidden p-1 -ml-1 rounded-full hover:bg-[#2D2D2D] transition-colors">
                      <ChevronLeft className="w-5 h-5 text-[#D4AF37]" />
                    </button>
                    <button onClick={() => { if (activeConversation) router.push(`/user/${activeConversation}`); }} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <div className="relative shrink-0">
                        <Avatar size="sm" firstName={(activeConv?.name || urlName || "")?.split(" ")[0] || ""} lastName={(activeConv?.name || urlName || "")?.split(" ").slice(1).join(" ") || ""} src={mediaUrl(activeConv?.avatar)} status={activeConv?.isOnline ? "online" : "offline"} />
                        {activeConv?.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#111827]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${mobileKeyboardOpen ? "text-xs" : "text-sm"} text-white truncate`}>{activeConv?.name || urlName || t('messages.userFallback')}</span>
                          {activeConv?.isVerified && (
                            <span className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#D4AF37]/20">
                              <svg className="w-2.5 h-2.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          {activeConv?.membershipPlan === "platinum" && (
                            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)] ring-1 ring-purple-300/50">
                              <Gem className="w-2.5 h-2.5 fill-white/30" />
                            </span>
                          )}
                          {activeConv?.membershipPlan === "gold" && (
                            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-black shadow-[0_0_8px_rgba(212,175,55,0.4)] ring-1 ring-[#F2D675]/50">
                              <Crown className="w-2.5 h-2.5 fill-black/20" />
                            </span>
                          )}
                        </div>
                        {activeConv?.isOnline ? (
                          <p className={`${mobileKeyboardOpen ? "text-[10px]" : "text-xs"} text-[#22C55E]`}>{t('messages.online')}</p>
                        ) : (
                          <p className={`${mobileKeyboardOpen ? "text-[10px]" : "text-xs"} text-[#8B8B8B]`}>{!mobileKeyboardOpen ? formatLastSeen(activeConv?.lastLoginAt) : ""}</p>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 relative">
                    <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-1.5 rounded-full hover:bg-[#2D2D2D] transition-colors">
                      <MoreVertical className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                    {showHeaderMenu && (
                      <div ref={headerMenuRef} className="absolute right-0 top-full mt-1 z-50 rounded-2xl shadow-2xl border border-[#2D2D2D] py-1.5 min-w-[190px] overflow-hidden bg-[#1A1A24]">
                        <button onClick={() => { setShowHeaderMenu(false); setShowReportDialog(true); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors">
                          <Flag className="w-4 h-4 shrink-0" /> {t('messages.reportUser')}
                        </button>
                        {blockedUsers.includes(activeConversation!) ? (
                          <button onClick={() => { setShowHeaderMenu(false); unblockUser(activeConversation!); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C8C8C8] hover:bg-[#2D2D2D] transition-colors">
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.unblock')}
                          </button>
                        ) : (
                          <button onClick={() => { setShowHeaderMenu(false); setBlockConfirm({ otherUserId: activeConversation!, name: activeConv?.name || urlName || "this user" }); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors">
                            <ShieldOff className="w-4 h-4 shrink-0" /> {t('messages.blockUser')}
                          </button>
                        )}
                        <div className="border-t border-[#2D2D2D] my-1" />
                        <button onClick={() => { setShowHeaderMenu(false); setDeleteConfirm({ otherUserId: activeConversation!, name: activeConv?.name || urlName || "this user" }); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors">
                          <Trash2 className="w-4 h-4 shrink-0" /> {t('messages.deleteConversation')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* === COMPACT STATUS BAR — One line, 3 sections, expandable === */}
                {activeConversation && !mobileKeyboardOpen && (
                  <div className="shrink-0 z-20 px-2 lg:px-3 pt-2">
                    <div className="flex items-stretch h-[48px] lg:h-[50px] rounded-[18px] bg-[#1A1A24] border border-[#2D2D2D]/60 overflow-hidden">
                      {/* Section 1: Shield — expandable for approval details */}
                      {(chatPermRequests.length > 0 || sentPermStatus.length > 0 || incomingConvRequests.length > 0 || blockedUsers.includes(activeConversation)) ? (
                        <button
                          onClick={() => { setShowShieldDetails(!showShieldDetails); setShowWaliDetails(false); }}
                          className="flex items-center gap-1.5 px-3 lg:px-4 hover:bg-[#222222] transition-colors shrink-0"
                        >
                          <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <ChevronRight className={`w-3.5 h-3.5 text-[#8B8B8B] transition-transform ${showShieldDetails ? "rotate-90" : ""}`} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 lg:px-4 shrink-0">
                          <Shield className="w-4 h-4 text-[#D4AF37]/40 shrink-0" />
                          <ChevronRight className="w-3.5 h-3.5 text-[#8B8B8B]/40 shrink-0" />
                        </div>
                      )}
                      {/* Divider */}
                      <div className="w-px bg-[#2D2D2D]/60 my-2" />

                      {/* Section 2: Marriage Process — center */}
                      <div className="flex-1 flex items-center justify-center min-w-0">
                        {partnership?.status === "active" ? (
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37] shrink-0" />
                            <span className="text-xs font-medium text-[#D4AF37] truncate">Marriage Process</span>
                            {partnership && (
                              <button
                                onClick={() => setShowEndPartnershipConfirm(true)}
                                className="text-[10px] text-red-400/60 hover:text-red-400 font-medium transition-colors ml-1 shrink-0"
                              >
                                End
                              </button>
                            )}
                          </div>
                        ) : partnershipStatus?.receivedRequest?.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-xs font-medium text-[#D4AF37]">Marriage Process</span>
                            <button
                              onClick={async () => {
                                try {
                                  await exclusivePartnershipService.respondToRequest(partnershipStatus.receivedRequest.id, "accepted");
                                  setToastError(false);
                                  setToast("Partnership accepted!");
                                  setTimeout(() => setToast(null), 4000);
                                  exclusivePartnershipService.checkStatus(activeConversation).then(({ data }) => {
                                    setPartnershipStatus(data);
                                    setPartnership(data.partnership);
                                  });
                                } catch {
                                  setToastError(true);
                                  setToast("Failed to accept.");
                                  setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-green-500 text-white text-[10px] font-medium hover:bg-green-600 transition-colors shrink-0"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await exclusivePartnershipService.respondToRequest(partnershipStatus.receivedRequest.id, "declined");
                                  setToastError(false);
                                  setToast("Partnership request declined.");
                                  setTimeout(() => setToast(null), 4000);
                                  exclusivePartnershipService.checkStatus(activeConversation).then(({ data }) => {
                                    setPartnershipStatus(data);
                                    setPartnership(data.partnership);
                                  });
                                } catch {
                                  setToastError(true);
                                  setToast("Failed to decline.");
                                  setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 transition-colors shrink-0"
                            >
                              Decline
                            </button>
                          </div>
                        ) : partnershipStatus?.sentRequest?.status === "pending" ? (
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-[#D4AF37]/50 shrink-0" />
                            <span className="text-xs font-medium text-[#8B8B8B] truncate">Request Sent</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowPartnershipDialog(true)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                          >
                            <Heart className="w-3.5 h-3.5 text-[#D4AF37]/60 shrink-0" />
                            <span className="text-xs font-medium text-[#D4AF37]/80">Marriage Process</span>
                          </button>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="w-px bg-[#2D2D2D]/60 my-2" />

                      {/* Section 3: Wali — right, expandable */}
                      <button
                        onClick={() => { setShowWaliDetails(!showWaliDetails); setShowShieldDetails(false); }}
                        className="flex items-center gap-1.5 px-3 lg:px-4 hover:bg-[#222222] transition-colors shrink-0"
                      >
                        <UserCheck className={`w-4 h-4 shrink-0 ${waliStatus?.status === "active" ? "text-[#D4AF37]" : "text-[#8B8B8B]"}`} />
                        <span className="text-xs font-medium text-[#D1D5DB] hidden sm:inline truncate max-w-[100px]">
                          {waliStatus?.status === "active" ? `Wali: ${waliStatus.waliName} (Active)` :
                           waliStatus?.status === "pending_approval" ? "Wali: Pending" :
                           partnership?.status === "active" ? "Wali: None" : "Wali: —"}
                        </span>
                        <span className="text-xs font-medium text-[#D1D5DB] sm:hidden">Wali</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-[#8B8B8B] transition-transform shrink-0 ${showWaliDetails ? "rotate-90" : ""}`} />
                      </button>
                    </div>

                    {/* Shield expanded panel */}
                    {showShieldDetails && (
                      <div className="mt-1.5 rounded-[18px] bg-[#1A1A24] border border-[#2D2D2D]/60 p-3 space-y-2.5 z-30">
                        {/* Blocked */}
                        {blockedUsers.includes(activeConversation) && (
                          <div className="flex items-center gap-2 text-xs">
                            <ShieldOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="text-red-400 font-medium">{t('messages.blockedBanner')}</span>
                            <button onClick={() => unblockUser(activeConversation)} className="ml-auto text-[10px] text-red-400 hover:text-red-500 font-medium shrink-0">Unblock</button>
                          </div>
                        )}
                        {/* Incoming conversation requests */}
                        {incomingConvRequests.map((req) => (
                          <div key={req.id} className="flex items-center gap-2">
                            <Send className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-xs text-[#C8C8C8] truncate flex-1">{req.requester?.firstName} wants to chat</span>
                            <button
                              onClick={async () => {
                                try {
                                  await conversationRequestService.respond(req.id, "accepted");
                                  setIncomingConvRequests(prev => prev.filter(r => r.id !== req.id));
                                  setToastError(false); setToast("Request accepted!"); setTimeout(() => setToast(null), 4000);
                                } catch { setToastError(true); setToast("Failed."); setTimeout(() => { setToast(null); setToastError(false); }, 4000); }
                              }}
                              className="px-2 py-0.5 rounded-md bg-green-500 text-white text-[10px] font-medium hover:bg-green-600 shrink-0"
                            >Accept</button>
                            <button
                              onClick={async () => {
                                try {
                                  await conversationRequestService.respond(req.id, "declined");
                                  setIncomingConvRequests(prev => prev.filter(r => r.id !== req.id));
                                  setToastError(false); setToast("Declined."); setTimeout(() => setToast(null), 4000);
                                } catch { setToastError(true); setToast("Failed."); setTimeout(() => { setToast(null); setToastError(false); }, 4000); }
                              }}
                              className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 shrink-0"
                            >Decline</button>
                          </div>
                        ))}
                        {/* Incoming permission requests */}
                        {chatPermRequests.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-xs text-[#C8C8C8] truncate flex-1">{perm.requester?.firstName} → {perm.targetUser?.firstName}</span>
                            <button
                              onClick={async () => {
                                setChatPermLoading(perm.id);
                                try {
                                  await conversationPermissionService.respondToPermission(perm.id, "approved");
                                  setChatPermRequests(prev => prev.filter(p => p.id !== perm.id));
                                  setToastError(false); setToast("Permission granted."); setTimeout(() => setToast(null), 4000);
                                } catch { setToastError(true); setToast("Failed."); setTimeout(() => { setToast(null); setToastError(false); }, 4000); }
                                finally { setChatPermLoading(null); }
                              }}
                              disabled={chatPermLoading === perm.id}
                              className="px-2 py-0.5 rounded-md bg-green-500 text-white text-[10px] font-medium hover:bg-green-600 disabled:opacity-50 shrink-0"
                            >Accept</button>
                            <button
                              onClick={async () => {
                                setChatPermLoading(perm.id);
                                try {
                                  await conversationPermissionService.respondToPermission(perm.id, "denied");
                                  setChatPermRequests(prev => prev.filter(p => p.id !== perm.id));
                                  setToastError(false); setToast("Permission denied."); setTimeout(() => setToast(null), 4000);
                                } catch { setToastError(true); setToast("Failed."); setTimeout(() => { setToast(null); setToastError(false); }, 4000); }
                                finally { setChatPermLoading(null); }
                              }}
                              disabled={chatPermLoading === perm.id}
                              className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 disabled:opacity-50 shrink-0"
                            >Reject</button>
                          </div>
                        ))}
                        {/* Sent permission status */}
                        {sentPermStatus.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            {perm.status === "approved" ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> :
                             perm.status === "denied" ? <X className="w-3.5 h-3.5 text-red-400 shrink-0" /> :
                             <Shield className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                            <span className="text-xs text-[#C8C8C8] truncate flex-1">
                              {perm.status === "pending" ? `Pending: ${perm.targetUser?.firstName}` :
                               perm.status === "approved" ? `Approved: ${perm.targetUser?.firstName}` :
                               `Denied: ${perm.targetUser?.firstName}`}
                            </span>
                          </div>
                        ))}
                        {/* Match reason */}
                        {(matchReason || activeConv?.compatibilityReason) && (
                          <div className="flex items-center gap-2 text-xs">
                            <Heart className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-[#D4AF37] truncate">{matchReason || activeConv?.compatibilityReason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wali expanded panel */}
                    {showWaliDetails && (
                      <div className="mt-1.5 rounded-[18px] bg-[#1A1A24] border border-[#2D2D2D]/60 p-3 space-y-2 z-30">
                        {partnership?.status === "active" ? (
                          <>
                            {waliStatus?.status === "active" ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                <span className="text-xs text-[#D1D5DB]">{waliStatus.waliName} ({waliStatus.relationship})</span>
                                <button
                                  onClick={() => setShowRevokeWaliConfirm(true)}
                                  className="ml-auto text-[10px] text-red-400 hover:text-red-500 font-medium shrink-0"
                                >Remove</button>
                              </div>
                            ) : waliStatus?.status === "pending_approval" ? (
                              waliStatus.createdById === myId ? (
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-3.5 h-3.5 text-[#8B8B8B] shrink-0" />
                                  <span className="text-xs text-[#8B8B8B]">{waliStatus.waliName} — awaiting partner approval</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                  <span className="text-xs text-[#C8C8C8] truncate flex-1">{waliStatus.waliName} — approve?</span>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await waliService.approve(partnership.id);
                                        setToastError(false); setToast("Wali approved."); setTimeout(() => setToast(null), 4000);
                                        waliService.getStatus(partnership.id).then(({ data }) => setWaliStatus(data.invitation)).catch(() => {});
                                      } catch (err: any) {
                                        setToastError(true); setToast(err?.response?.data?.error || "Failed"); setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-green-500 text-white text-[10px] font-medium hover:bg-green-600 shrink-0"
                                  >Approve</button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await waliService.decline(partnership.id);
                                        setToastError(false); setToast("Wali declined."); setTimeout(() => setToast(null), 4000);
                                        waliService.getStatus(partnership.id).then(({ data }) => setWaliStatus(data.invitation)).catch(() => {});
                                      } catch (err: any) {
                                        setToastError(true); setToast(err?.response?.data?.error || "Failed"); setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 shrink-0"
                                  >Decline</button>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() => { setWaliDialogStep(1); setWaliName(""); setWaliRelationship(""); setWaliEmail(""); setPasswordError(""); setConfirmPassword(""); setShowWaliDialog(true); }}
                                className="flex items-center gap-2 text-xs text-[#D4AF37] hover:text-[#F2D675] font-medium transition-colors w-full"
                              >
                                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                Invite Wali
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-[#8B8B8B]">Start a Marriage Process to invite a Wali.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-3 lg:p-4 space-y-2 lg:space-y-3 z-10">
                  {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-[#8B8B8B]">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      {/* Empty state illustration: two chat bubbles with gold glow */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 blur-3xl bg-[#D4AF37]/10 rounded-full" />
                        <div className="relative flex flex-col gap-2">
                          <div className="w-16 h-16 rounded-2xl rounded-br-md bg-[#222222] border border-[#2D2D2D] flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a.75.75 0 01.722-.102 9.75 9.75 0 005.46.484c2.026-.384 3.542-2.084 3.542-4.146V6.75c0-1.6-1.123-2.994-2.707-3.227A24.5 24.5 0 0012 3c-2.392 0-4.744.175-7.043.523C3.373 3.756 2.25 5.15 2.25 6.75v6.01z" />
                            </svg>
                          </div>
                          <div className="w-16 h-16 rounded-2xl rounded-bl-md bg-gradient-to-br from-[#D4AF37] to-[#F2D675] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 self-end">
                            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a.75.75 0 01.722-.102 9.75 9.75 0 005.46.484c2.026-.384 3.542-2.084 3.542-4.146V6.75c0-1.6-1.123-2.994-2.707-3.227A24.5 24.5 0 0012 3c-2.392 0-4.744.175-7.043.523C3.373 3.756 2.25 5.15 2.25 6.75v6.01z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">Start your conversation 👋</h3>
                      <p className="text-sm text-[#8B8B8B] mt-1.5 max-w-xs">Send a respectful greeting and begin getting to know each other.</p>
                      {/* Quick Reply Chips */}
                      <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-sm">
                        {[
                          { emoji: "👋", text: "Assalamu Alaikum" },
                          { emoji: "❤️", text: "Hello" },
                          { emoji: "🤍", text: "Nice to meet you" },
                          { emoji: "😊", text: "How are you?" },
                        ].map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => { setNewMessage(`${chip.emoji} ${chip.text}`); }}
                            className="px-4 py-2 rounded-full border border-[#D4AF37]/40 bg-transparent text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all hover:scale-105 active:scale-95"
                          >
                            {chip.emoji} {chip.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    [...messages].map((msg) => {
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
                          className={`relative group flex items-end mb-2 px-6 rounded-2xl transition-all duration-500 ${isOwn ? "justify-end" : "justify-start"} ${highlightMsgId === msg.id ? "bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/30" : ""}`}
                          onTouchStart={(e) => handleMsgTouchStart(e, msg)}
                          onTouchMove={(e) => handleMsgTouchMove(e, msg)}
                          onTouchEnd={handleMsgTouchEnd}
                        >
                          {/* 3-dots menu button - absolutely positioned so it doesn't affect alignment */}
                          <button
                            onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                            className={`absolute top-1/2 -translate-y-1/2 z-30 shrink-0 p-1.5 rounded-full transition-all ${menuMsgId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100"} ${isOwn ? "right-0" : "left-0"} hover:bg-[#2D2D2D]`}
                            title="More"
                          >
                            <MoreVertical className="w-4 h-4 text-[#8B8B8B]" />
                          </button>

                          {/* Context menu */}
                          {menuMsgId === msg.id && (
                            <div ref={menuRef} className={`absolute top-8 z-50 rounded-2xl shadow-2xl border border-[#2D2D2D] py-1.5 min-w-[175px] overflow-hidden bg-[#222222] ${isOwn ? "right-6" : "left-6"}`}>
                              <button onClick={() => { setReplyTo(msg); setMenuMsgId(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C8C8C8] hover:bg-[#2D2D2D] transition-colors">
                                <Reply className="w-4 h-4 shrink-0" /> Reply
                              </button>
                              {isOwn && !msg.content?.startsWith("IMG:") && !msg.content?.startsWith("FILE:") && (
                                <button onClick={() => handleEditClick(msg)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C8C8C8] hover:bg-[#2D2D2D] transition-colors">
                                  <Pencil className="w-4 h-4 shrink-0" /> Edit
                                </button>
                              )}
                              <button onClick={() => handleDelete(msg.id, "me")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C8C8C8] hover:bg-[#2D2D2D] transition-colors">
                                <Trash2 className="w-4 h-4 shrink-0" /> Delete for me
                              </button>
                              {isOwn && (
                                <button onClick={() => handleDelete(msg.id, "both")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors">
                                  <Trash2 className="w-4 h-4 shrink-0" /> Delete for everyone
                                </button>
                              )}
                            </div>
                          )}

                          {/* Swipe-left reply indicator */}
                          {swipeMsgId === msg.id && (
                            <div className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${isOwn ? "right-10" : "left-10"}`}>
                              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D4AF37]/80 shadow-lg">
                                <Reply className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%] lg:max-w-[55%] transition-transform duration-200 ${swipeMsgId === msg.id ? (isOwn ? "translate-x-8" : "-translate-x-8") : ""}`}
                          >
                            <div className={`overflow-hidden transition-all hover:shadow-lg ${isOwn ? ownBubble : otherBubble}`} style={{ fontSize: "clamp(0.75rem, 3.5vw, 0.875rem)" }}>
                              {msg.replyTo && (
                                <div
                                  onClick={() => msg.replyTo?.id && scrollToMessage(msg.replyTo.id)}
                                  className={`px-3 pt-2 pb-1.5 cursor-pointer rounded-t-2xl transition-colors hover:brightness-95 ${isOwn ? "bg-black/10 border-l-2 border-black/40" : "bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]/60"}`}
                                >
                                  <p className={`text-xs font-bold ${isOwn ? "text-black" : "text-[#D4AF37]"}`}>
                                    {msg.replyTo.senderId === myId ? t('messages.you') : (msg.replyTo.sender?.firstName || "User")}
                                  </p>
                                  <p className={`text-xs truncate font-medium ${isOwn ? "text-black/70" : "text-[#C8C8C8]"}`}>{msg.replyTo.content || ""}</p>
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
                                       className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isPending ? "opacity-60 pointer-events-none" : "hover:bg-black/10"}`}
                                     >
                                       <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xl ${isOwn ? "bg-black/10" : "bg-[#0F0F10]"}`}>
                                         {fileIcon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <p className={`text-sm font-semibold truncate ${isOwn ? "text-black" : "text-white"}`}>{fileName}</p>
                                         <p className={`text-[10px] ${isOwn ? "text-black/60" : "text-[#8B8B8B]"}`}>
                                           {fileSize > 0 ? `${(fileSize / 1024).toFixed(1)} KB` : ""}
                                         </p>
                                       </div>
                                       {!isPending && (
                                         <Download className={`w-4 h-4 shrink-0 ${isOwn ? "text-black/60" : "text-[#D4AF37]"}`} />
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
                                  editingMsgId === msg.id ? (
                                    <div className="px-3 pt-2.5 pb-2 min-w-[200px]">
                                      <textarea
                                        autoFocus
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                                          if (e.key === "Escape") handleEditCancel();
                                        }}
                                        className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none border-2 bg-black/20 text-white border-[#D4AF37]/50 focus:border-[#D4AF37]"
                                        rows={2}
                                      />
                                      <div className="flex items-center justify-end gap-2 mt-1.5">
                                        <button onClick={handleEditCancel} className="text-xs px-2.5 py-1 rounded-lg text-[#C8C8C8] hover:bg-[#2D2D2D]">
                                          Cancel
                                        </button>
                                        <button onClick={handleEditSubmit} className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-[#D4AF37] text-black hover:bg-[#F2D675]">
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="px-4 pt-2.5 pb-1 leading-relaxed font-medium break-words whitespace-pre-wrap">{msg.content}</p>
                                  )
                                ) : null;
                              })()}
                              <div className="flex items-center justify-end gap-1.5 px-4 pb-2">
                                {msg.isEdited && (
                                  <span className={`text-[10px] italic ${isOwn ? "text-black/50" : "text-[#8B8B8B]"}`}>edited</span>
                                )}
                                <p className="font-semibold" style={{ fontSize: "clamp(0.625rem, 2.5vw, 0.75rem)", color: isOwn ? "#D1D5DB" : "#8B8B8B" }}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </p>
                                {isOwn && (
                                  msg.readAt ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  ) : msg.deliveredAt ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-white/50" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-white/40" />
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
                    <div className="flex items-end gap-2 text-xs text-[#8B8B8B]">
                      <div className={`flex gap-1 items-center px-4 py-3 shadow-sm ${typingBubble}`}>
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

                {/* Bottom Message Bar — Floating Glassmorphism */}
                {activeConversation && !blockedUsers.includes(activeConversation) ? (
                  <div className={`shrink-0 z-10 ${bottomBarBg} w-full min-w-0`} style={{ paddingBottom: mobileKeyboardOpen ? "0px" : "env(safe-area-inset-bottom, 0px)" }}>
                    <div className="px-1.5 sm:px-3 lg:px-4 py-2 sm:py-3">
                      {/* Reply bar */}
                      {replyTo && (
                        <div
                          onClick={() => replyTo.id && scrollToMessage(replyTo.id)}
                          className={`mb-2 px-3 py-2 rounded-xl flex items-center gap-3 cursor-pointer hover:brightness-95 transition-all ${bottomBarInner} border`}
                        >
                          <Reply className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#D4AF37]">
                              {replyTo.senderId === myId ? t('messages.you') : (activeConv?.name || urlName || "User")}
                            </p>
                            <p className="text-xs truncate font-medium text-[#C8C8C8]">{replyTo.content || ""}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setReplyTo(null); }} className="p-1 rounded-full transition-colors hover:bg-[#2D2D2D]">
                            <X className="w-4 h-4 text-[#8B8B8B]" />
                          </button>
                        </div>
                      )}
                      {/* Image preview */}
                      {imagePreview && (
                        <div className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 border ${bottomBarInner}`}>
                          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#0F0F10]">
                            <img src={URL.createObjectURL(imagePreview)} alt="preview" className="w-full h-full object-cover pointer-events-auto" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate text-[#C8C8C8]">{imagePreview.name}</p>
                            {uploading && (
                              <div className="w-full h-1 bg-[#2D2D2D] rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button type="button" onClick={() => handleSend()} className={`p-1.5 rounded-lg transition-colors shrink-0 ${sendBtn}`}>
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => { setImagePreview(null); setCaption(""); setUploadProgress(0); }} className="p-1 rounded-full transition-colors shrink-0 hover:bg-[#2D2D2D]">
                            <X className="w-4 h-4 text-[#8B8B8B]" />
                          </button>
                        </div>
                      )}
                      {/* File preview */}
                      {filePreview && (
                        <div className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 border ${bottomBarInner}`}>
                          <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center bg-[#0F0F10]">
                            <Paperclip className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate font-medium text-[#C8C8C8]">{filePreview.name}</p>
                            <p className="text-[10px] text-[#8B8B8B]">{(filePreview.size / 1024).toFixed(1)} KB</p>
                            {uploading && (
                              <div className="w-full h-1 bg-[#2D2D2D] rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button type="button" onClick={() => handleSend()} className={`p-1.5 rounded-lg transition-colors shrink-0 ${sendBtn}`}>
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => { setFilePreview(null); setCaption(""); setUploadProgress(0); }} className="p-1 rounded-full transition-colors shrink-0 hover:bg-[#2D2D2D]">
                            <X className="w-4 h-4 text-[#8B8B8B]" />
                          </button>
                        </div>
                      )}
                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A24] rounded-[20px] shadow-2xl border border-[#2D2D2D] p-3 max-h-[40vh] overflow-y-auto w-[90vw] max-w-md">
                          <div className="grid grid-cols-7 gap-1">
                            {["😊","🥰","😍","❤️","💕","😘","😇","🤲","🌙","⭐","🌸","🌹","💐","🕌","🤝","💍","🎉","🥺","😌","💭","✨","🙏","😁","😂","🤗","😎","🥹","😅","😳","🤔","😢","😭","👍","👋","🫂"].map((emoji, idx) => (
                              <button
                                key={`emoji-${idx}`}
                                type="button"
                                onClick={() => {
                                  setNewMessage((prev) => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-[#2D2D2D] rounded-lg text-lg transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Server busy indicator */}
                      {serverBusy && (
                        <div className="flex items-center justify-center gap-2 py-2 px-4 mb-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium">
                          <span className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                          Server busy — retrying in {busyCountdown}s…
                        </div>
                      )}
                      {/* Floating input bar — premium pill, 60px, gold send with glow */}
                      <div className="relative">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full bg-[#D4AF37]/20 blur-xl pointer-events-none" />
                      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-1.5 h-[60px] rounded-[30px] bg-[#1A1A24] border border-[#2D2D2D]/60 shadow-lg shadow-black/30 px-2.5 w-full box-border overflow-hidden">
                        {/* Emoji button */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          disabled={serverBusy}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0 disabled:opacity-40 disabled:hover:scale-100 hover:bg-[#2D2D2D]"
                        >
                          <Smile className="w-5 h-5 text-[#D4AF37]" />
                        </button>
                        {/* Attachment button */}
                        <label className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0 cursor-pointer ${serverBusy ? "opacity-40 pointer-events-none" : "hover:bg-[#2D2D2D]"}`}>
                          <Paperclip className="w-5 h-5 text-[#D4AF37]" />
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" className="hidden" onChange={handleImageSelect} disabled={serverBusy} />
                        </label>
                        {/* Input field */}
                        <input
                          value={newMessage}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder={serverBusy ? "Busy…" : "Message…"}
                          disabled={uploading || serverBusy}
                          className="flex-1 min-w-0 h-10 bg-white/15 rounded-full text-sm font-medium text-white placeholder-[#8B8B8B] outline-none border-none px-4"
                        />
                        {/* Send button — gold circular with soft glow */}
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && !imagePreview) || uploading || serverBusy}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 shrink-0 shadow-lg shadow-[#D4AF37]/30 ${serverBusy ? "bg-[#D4AF37]/50" : sendBtn}`}
                        >
                          {serverBusy ? (
                            <span className="text-[10px] font-bold text-white">{busyCountdown}s</span>
                          ) : uploading ? (
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </form>
                      </div>
                    </div>
                  </div>
                ) : activeConversation && blockedUsers.includes(activeConversation) ? (
                  <div className={`shrink-0 z-10 ${bottomBarBg}`}>
                    <div className="px-3 lg:px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#8B8B8B]">
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
                  <h3 className="text-lg font-bold text-white">{t('messages.title')}</h3>
                  <p className="text-sm text-[#8B8B8B] mt-1">{t('messages.selectConversation') || "Select a conversation to start chatting"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation — inside h-dvh flex column, animated slide/fade when keyboard opens */}
      <nav
        className="lg:hidden shrink-0 z-40 px-4 pt-2 overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: mobileKeyboardOpen ? "0px" : "100px",
          opacity: mobileKeyboardOpen ? "0" : "1",
          transform: mobileKeyboardOpen ? "translateY(100%)" : "translateY(0)",
          paddingBottom: mobileKeyboardOpen ? "0px" : "calc(env(safe-area-inset-bottom,0px) + 8px)",
        }}
      >
        <div className="mx-auto max-w-sm flex items-center justify-around rounded-[22px] bg-[#111827]/80 backdrop-blur-xl border border-[#2D2D2D]/60 shadow-lg shadow-black/30 px-2 py-2">
          <a href="/matches" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors hover:bg-[#2D2D2D]/40">
            <Heart className="w-5 h-5 text-[#8B8B8B]" />
            <span className="text-[10px] font-medium text-[#8B8B8B]">Matches</span>
          </a>
          <a href="/liked-interest" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors hover:bg-[#2D2D2D]/40">
            <Sparkles className="w-5 h-5 text-[#8B8B8B]" />
            <span className="text-[10px] font-medium text-[#8B8B8B]">Liked</span>
          </a>
          <a href="/messages" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors">
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-bold text-[#D4AF37]">Messages</span>
            <span className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[#D4AF37]" />
          </a>
          <a href="/books" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors hover:bg-[#2D2D2D]/40">
            <BookOpen className="w-5 h-5 text-[#8B8B8B]" />
            <span className="text-[10px] font-medium text-[#8B8B8B]">Books</span>
          </a>
          <a href="/profile" className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors hover:bg-[#2D2D2D]/40">
            <User className="w-5 h-5 text-[#8B8B8B]" />
            <span className="text-[10px] font-medium text-[#8B8B8B]">Profile</span>
          </a>
        </div>
      </nav>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowReportDialog(false)}>
          <div className="bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-5 mx-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{t('messages.reportUser')}</h3>
            <p className="text-xs text-[#8B8B8B] mb-3">{t('messages.reportReason', { user: activeConv?.name || urlName || "this user" })}</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full text-sm bg-[#0F0F10] border border-[#2D2D2D] rounded-lg px-3 py-2 text-white mb-3 outline-none focus:border-[#D4AF37]/40"
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
              className="w-full text-sm bg-[#0F0F10] border border-[#2D2D2D] rounded-lg px-3 py-2 text-white placeholder-[#8B8B8B] resize-none mb-4 outline-none focus:border-[#D4AF37]/40"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowReportDialog(false); setReportDescription(""); setReportReason("inappropriate"); }}
                className="px-4 py-2 text-sm font-medium text-[#C8C8C8] hover:bg-[#2D2D2D] rounded-lg transition-colors"
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
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Permission Required</h3>
              <p className="text-sm text-[#8B8B8B]">
                You are in an Exclusive Marriage Process. To start talking to <span className="font-semibold text-[#D4AF37]">{permissionDialog.targetName}</span>, you need permission from your exclusive partner{myPartnership ? ` (${myPartnership.userAId === myId ? myPartnership.userB?.firstName : myPartnership.userA?.firstName})` : ""}.
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
                className="w-full px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black rounded-xl hover:from-[#F2D675] hover:to-[#D4AF37] disabled:opacity-50 transition-all"
              >
                {permissionSubmitting ? "Sending..." : "Request Permission from Partner"}
              </button>
              <button
                onClick={() => setPermissionDialog(null)}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#C8C8C8] hover:bg-[#2D2D2D] rounded-xl transition-colors"
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
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('messages.deleteConversation')}</h3>
              <p className="text-sm text-[#8B8B8B] mb-1">
                {t('messages.deleteConfirm', { name: deleteConfirm.name })}
              </p>
              <p className="text-xs text-[#8B8B8B] mb-6">{t('messages.deleteWarning')}</p>
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
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <ShieldOff className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('messages.blockUser')}</h3>
              <p className="text-sm text-[#8B8B8B] mb-1">
                {t('messages.blockConfirm', { name: blockConfirm.name })}
              </p>
              <p className="text-xs text-[#8B8B8B] mb-6">{t('messages.blockWarning')}</p>
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

      {/* Exclusive Partnership Request Dialog */}
      {showPartnershipDialog && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPartnershipDialog(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Exclusive Marriage Process</h3>
              <p className="text-sm text-[#8B8B8B]">
                Request to continue the marriage process exclusively with <span className="font-semibold text-[#D4AF37]">{activeConv?.name || urlName}</span>. This means you both commit to focusing on each other.
              </p>
            </div>
            <textarea
              value={partnershipMessage}
              onChange={(e) => setPartnershipMessage(e.target.value)}
              placeholder="Add an optional message..."
              rows={3}
              className="w-full text-sm bg-[#0F0F10] border border-[#2D2D2D] rounded-lg px-3 py-2 text-white placeholder-[#8B8B8B] resize-none mb-4 outline-none focus:border-[#D4AF37]/40"
            />
            <div className="mb-4">
              <label className="text-xs text-[#8B8B8B] mb-1 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Enter your password to confirm
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e: any) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                placeholder="Your password"
                className="bg-[#181818] border-[#2D2D2D] text-white"
              />
              {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowPartnershipDialog(false); setPartnershipMessage(""); setConfirmPassword(""); setPasswordError(""); }}
                className="px-4 py-2 text-sm font-medium text-[#C8C8C8] hover:bg-[#2D2D2D] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!confirmPassword.trim()) { setPasswordError("Password is required"); return; }
                  setPasswordVerifying(true);
                  try {
                    await authService.verifyPassword(confirmPassword);
                    setPartnershipSubmitting(true);
                    await exclusivePartnershipService.request(activeConversation, partnershipMessage || undefined);
                    setToastError(false);
                    setToast("Exclusive partnership request sent!");
                    setTimeout(() => setToast(null), 4000);
                    setShowPartnershipDialog(false);
                    setPartnershipMessage("");
                    setConfirmPassword("");
                    exclusivePartnershipService.checkStatus(activeConversation).then(({ data }) => {
                      setPartnershipStatus(data);
                      setPartnership(data.partnership);
                    });
                  } catch (err: any) {
                    if (err?.response?.status === 401) {
                      setPasswordError("Invalid password");
                    } else {
                      setToastError(true);
                      setToast(err?.response?.data?.error || "Failed to send request");
                      setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                    }
                  } finally {
                    setPasswordVerifying(false);
                    setPartnershipSubmitting(false);
                  }
                }}
                disabled={partnershipSubmitting || passwordVerifying}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black rounded-lg hover:from-[#F2D675] hover:to-[#D4AF37] disabled:opacity-50 transition-all"
              >
                {partnershipSubmitting || passwordVerifying ? "Verifying..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Partnership Confirmation */}
      {showEndPartnershipConfirm && partnership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEndPartnershipConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">End Exclusive Partnership?</h3>
              <p className="text-sm text-[#8B8B8B] mb-4">
                This will end the exclusive marriage process with {activeConv?.name || urlName}. You will both be free to start new conversations.
              </p>
              <div className="mb-4">
                <label className="text-xs text-[#8B8B8B] mb-1 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Enter your password to confirm
                </label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e: any) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Your password"
                  className="bg-[#181818] border-[#2D2D2D] text-white"
                />
                {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => { setShowEndPartnershipConfirm(false); setConfirmPassword(""); setPasswordError(""); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    if (!confirmPassword.trim()) { setPasswordError("Password is required"); return; }
                    setPasswordVerifying(true);
                    try {
                      await authService.verifyPassword(confirmPassword);
                      setEndPartnershipSubmitting(true);
                      await exclusivePartnershipService.end(partnership.id);
                      setToastError(false);
                      setToast("Exclusive partnership ended.");
                      setTimeout(() => setToast(null), 4000);
                      setShowEndPartnershipConfirm(false);
                      setPartnership(null);
                      setPartnershipStatus(null);
                      setConfirmPassword("");
                    } catch (err: any) {
                      if (err?.response?.status === 401) {
                        setPasswordError("Invalid password");
                      } else {
                        setToastError(true);
                        setToast(err?.response?.data?.error || "Failed to end partnership");
                        setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                      }
                    } finally {
                      setPasswordVerifying(false);
                      setEndPartnershipSubmitting(false);
                    }
                  }}
                  disabled={endPartnershipSubmitting || passwordVerifying}
                >
                  {endPartnershipSubmitting || passwordVerifying ? "Verifying..." : "End Partnership"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Wali Dialog */}
      {showWaliDialog && partnership?.status === "active" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWaliDialog(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Invite Wali</h3>
              <p className="text-sm text-[#8B8B8B]">
                Invite a Wali (guardian) to observe your conversation in read-only mode. The Wali will receive a secure link via email — no account needed.
              </p>
            </div>
            <div className="space-y-3">
              {/* Step 1: Wali details */}
              {waliDialogStep === 1 && (
                <>
                  <div>
                    <label className="text-xs text-[#8B8B8B] mb-1 block">Wali Full Name</label>
                    <Input
                      value={waliName}
                      onChange={(e: any) => setWaliName(e.target.value)}
                      placeholder="e.g. Abu Ahmed"
                      className="bg-[#181818] border-[#2D2D2D] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8B8B8B] mb-1 block">Relationship</label>
                    <Input
                      value={waliRelationship}
                      onChange={(e: any) => setWaliRelationship(e.target.value)}
                      placeholder="e.g. Father, Brother, Uncle"
                      className="bg-[#181818] border-[#2D2D2D] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8B8B8B] mb-1 block">Email Address</label>
                    <Input
                      type="email"
                      value={waliEmail}
                      onChange={(e: any) => setWaliEmail(e.target.value)}
                      placeholder="wali@example.com"
                      className="bg-[#181818] border-[#2D2D2D] text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!waliName.trim() || !waliRelationship.trim() || !waliEmail.trim()) {
                        setToastError(true);
                        setToast("All fields are required.");
                        setTimeout(() => { setToast(null); setToastError(false); }, 4000);
                        return;
                      }
                      setPasswordError("");
                      setWaliDialogStep(2);
                    }}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black rounded-xl hover:from-[#F2D675] hover:to-[#D4AF37] transition-all"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => { setShowWaliDialog(false); setWaliName(""); setWaliRelationship(""); setWaliEmail(""); }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-[#C8C8C8] hover:bg-[#2D2D2D] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Step 2: Password confirmation */}
              {waliDialogStep === 2 && (
                <>
                  <div className="bg-[#181818] rounded-lg p-3 space-y-1">
                    <p className="text-xs text-[#8B8B8B]">Wali: <span className="text-white font-medium">{waliName}</span></p>
                    <p className="text-xs text-[#8B8B8B]">Relationship: <span className="text-white font-medium">{waliRelationship}</span></p>
                    <p className="text-xs text-[#8B8B8B]">Email: <span className="text-white font-medium">{waliEmail}</span></p>
                  </div>
                  <div>
                    <label className="text-xs text-[#8B8B8B] mb-1 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Enter your password to confirm
                    </label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e: any) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                      placeholder="Your password"
                      className="bg-[#181818] border-[#2D2D2D] text-white"
                      autoFocus
                    />
                    {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirmPassword.trim()) { setPasswordError("Password is required"); return; }
                      setPasswordVerifying(true);
                      try {
                        await authService.verifyPassword(confirmPassword);
                        setWaliSubmitting(true);
                        await waliService.invite(partnership.id, waliName, waliRelationship, waliEmail);
                        setToastError(false);
                        setToast("Wali invitation sent! Waiting for your partner's approval before the email is sent.");
                        setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                        setShowWaliDialog(false);
                        setWaliDialogStep(1);
                        setWaliName(""); setWaliRelationship(""); setWaliEmail(""); setConfirmPassword("");
                        waliService.getStatus(partnership.id).then(({ data }) => {
                          setWaliStatus(data.invitation);
                        }).catch(() => {});
                      } catch (err: any) {
                        if (err?.response?.status === 401) {
                          setPasswordError("Invalid password");
                        } else {
                          setToastError(true);
                          setToast(err?.response?.data?.error || "Failed to send Wali invitation");
                          setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                        }
                      } finally {
                        setPasswordVerifying(false);
                        setWaliSubmitting(false);
                      }
                    }}
                    disabled={waliSubmitting || passwordVerifying}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#D4AF37] to-[#F2D675] text-black rounded-xl hover:from-[#F2D675] hover:to-[#D4AF37] disabled:opacity-50 transition-all"
                  >
                    {waliSubmitting || passwordVerifying ? "Verifying..." : "Send Invitation"}
                  </button>
                  <button
                    onClick={() => { setWaliDialogStep(1); setPasswordError(""); setConfirmPassword(""); }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-[#C8C8C8] hover:bg-[#2D2D2D] rounded-xl transition-colors"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revoke Wali Confirmation */}
      {showRevokeWaliConfirm && partnership?.status === "active" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRevokeWaliConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#222222] rounded-2xl shadow-2xl border border-[#2D2D2D] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Remove Wali Access?</h3>
              <p className="text-sm text-[#8B8B8B] mb-6">
                {waliStatus?.waliName ? `${waliStatus.waliName} (${waliStatus.relationship})` : "The Wali"} will immediately lose access to your conversation and will see "This invitation is no longer valid."
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => setShowRevokeWaliConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={async () => {
                    setRevokeWaliSubmitting(true);
                    try {
                      await waliService.revoke(partnership.id);
                      setToastError(false);
                      setToast("Wali access revoked.");
                      setTimeout(() => setToast(null), 4000);
                      setShowRevokeWaliConfirm(false);
                      setWaliStatus(null);
                    } catch (err: any) {
                      setToastError(true);
                      setToast(err?.response?.data?.error || "Failed to revoke Wali access");
                      setTimeout(() => { setToast(null); setToastError(false); }, 5000);
                    } finally {
                      setRevokeWaliSubmitting(false);
                    }
                  }}
                  disabled={revokeWaliSubmitting}
                >
                  {revokeWaliSubmitting ? "Revoking..." : "Revoke Access"}
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
        <div className={`bg-[#222222] rounded-2xl shadow-2xl border ${toastError ? "border-red-900" : "border-[#2D2D2D]"} px-6 py-4 transform transition-all duration-300 ${
          toast ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toastError ? "bg-red-900/20" : "bg-[#D4AF37]/10"}`}>
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
            <p className="text-sm font-medium text-white max-w-xs">{toast}</p>
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
      <div className="flex items-center justify-center min-h-screen text-[#8B8B8B]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}