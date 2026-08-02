import { create } from "zustand";
import type { Message } from "@/types";
import { messageService } from "@/services/messages";

interface Conversation {
  id: string;
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
  membershipPlan?: "gold" | "platinum" | null;
  isVerified?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
  lastLoginAt?: string;
  compatibilityReason?: string;
}

interface MessageState {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  matchReason: string | null;
  blockedUsers: string[];
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyToId?: string | null) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteFor?: "me" | "both") => Promise<void>;
  deleteConversation: (otherUserId: string, deleteFor?: "me" | "both") => Promise<void>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  updateMessage: (message: Message) => void;
  setMessageRead: (messageId: string) => void;
  setMessageReaction: (messageId: string, reaction: string, reactionBy: string) => void;
  loadOlderMessages: (conversationId: string) => Promise<boolean>;
  hasMoreMessages: boolean;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  matchReason: null,
  blockedUsers: [],
  hasMoreMessages: true,
  fetchConversations: async () => {
    try {
      const { data } = await messageService.getConversations();
      const raw = data.conversations || [];
      const mapped: Conversation[] = raw.map((c: any) => ({
        id: c.user?.id || c.id,
        userId: c.user?.id || c.userId,
        name: [c.user?.firstName, c.user?.lastName].filter(Boolean).join(" ") || c.name || "User",
        username: c.user?.username || c.username,
        avatar: c.user?.profile?.photos?.[0] || c.avatar,
        membershipPlan: c.user?.membershipPlan || c.membershipPlan || null,
        isVerified: c.user?.isVerified || c.isVerified || false,
        lastMessage: c.lastMessage?.content || c.lastMessage || "",
        lastMessageAt: c.lastMessage?.createdAt || c.lastMessageAt || "",
        unreadCount: c.unreadCount || 0,
        isOnline: c.isOnline || false,
        lastLoginAt: c.user?.lastLoginAt || undefined,
        compatibilityReason: c.compatibilityReason || undefined,
      }));
      set({ conversations: mapped });
    } catch { set({ error: "Failed to load conversations" }); }
  },
  fetchMessages: async (conversationId) => {
    const currentId = get().activeConversation;
    if (currentId !== conversationId) return;
    set({ isLoading: true, error: null, hasMoreMessages: true });
    try {
      const { data } = await messageService.getMessages(conversationId, undefined, 50);
      if (get().activeConversation !== conversationId) return;
      const msgs = data.messages || [];
      set({ messages: msgs, matchReason: data.matchReason || null, isLoading: false, hasMoreMessages: msgs.length >= 50 });
    } catch { set({ error: "Failed to load messages", isLoading: false }); }
  },
  sendMessage: async (conversationId, content, replyToId) => {
    try {
      const { data } = await messageService.sendMessage(conversationId, content, replyToId);
      const msg = data.message || data;
      set((s) => ({ messages: [...s.messages, msg] }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to send message";
      set({ error: msg });
      throw err;
    }
  },
  editMessage: async (messageId, content) => {
    try {
      const { data } = await messageService.editMessage(messageId, content);
      const updated = data.updatedMessage || data;
      set((s) => ({ messages: s.messages.map((m) => m.id === messageId ? { ...m, ...updated } : m) }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to edit message";
      set({ error: msg });
      throw err;
    }
  },
  deleteMessage: async (messageId, deleteFor = "me") => {
    try {
      await messageService.deleteMessage(messageId, deleteFor);
      set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) }));
    } catch { /* ignore */ }
  },
  deleteConversation: async (otherUserId, deleteFor = "me") => {
    try {
      await messageService.deleteConversation(otherUserId, deleteFor);
      set((s) => ({
        messages: [],
        conversations: s.conversations.filter((c) => c.id !== otherUserId),
        activeConversation: s.activeConversation === otherUserId ? null : s.activeConversation,
      }));
    } catch (err) {
      console.error("Delete conversation failed:", err);
    }
  },
  blockUser: async (blockedUserId) => {
    set((s) => ({
      blockedUsers: s.blockedUsers.includes(blockedUserId) ? s.blockedUsers : [...s.blockedUsers, blockedUserId],
    }));
    try {
      await messageService.blockUser(blockedUserId);
    } catch (err) {
      console.error("Block user failed:", err);
    }
  },
  unblockUser: async (blockedUserId) => {
    set((s) => ({
      blockedUsers: s.blockedUsers.filter((id) => id !== blockedUserId),
    }));
    try {
      await messageService.unblockUser(blockedUserId);
    } catch (err) {
      console.error("Unblock user failed:", err);
    }
  },
  setActiveConversation: (id) => set({ activeConversation: id, matchReason: null }),
  addMessage: (message) =>
    set((s) => {
      if (s.messages.some((m) => m.id === message.id)) return s;
      return { messages: [...s.messages, message] };
    }),
  removeMessage: (messageId) =>
    set((s) => ({
      messages: messageId === "all" ? [] : s.messages.filter((m) => m.id !== messageId),
    })),
  updateMessage: (message) =>
    set((s) => ({
      messages: s.messages.map((m) => m.id === message.id ? { ...m, ...message } : m),
    })),
  setMessageRead: (messageId) =>
    set((s) => ({
      messages: s.messages.map((m) => m.id === messageId ? { ...m, readAt: new Date().toISOString(), isRead: true } as any : m),
    })),
  setMessageReaction: (messageId, reaction, reactionBy) =>
    set((s) => ({
      messages: s.messages.map((m) => m.id === messageId ? { ...m, reaction, reactionBy } as any : m),
    })),
  loadOlderMessages: async (conversationId) => {
    const state = get();
    if (!state.hasMoreMessages || state.messages.length === 0) return false;
    const oldest = state.messages[0];
    if (!oldest?.createdAt) return false;
    try {
      const { data } = await messageService.getMessages(conversationId, oldest.createdAt, 50);
      const olderMsgs = data.messages || [];
      if (olderMsgs.length === 0) {
        set({ hasMoreMessages: false });
        return false;
      }
      set((s) => ({
        messages: [...olderMsgs, ...s.messages],
        hasMoreMessages: olderMsgs.length >= 50,
      }));
      return true;
    } catch {
      return false;
    }
  },
  markAsRead: async (conversationId) => {
    try {
      await messageService.markAsRead(conversationId);
      set((s) => ({
        conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c),
      }));
    } catch { /* ignore */ }
  },
}));