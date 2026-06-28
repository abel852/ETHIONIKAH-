import { create } from "zustand";
import type { Message } from "@/types";
import { messageService } from "@/services/messages";

interface Conversation {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
}

interface MessageState {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  fetchConversations: async () => {
    try {
      const { data } = await messageService.getConversations();
      set({ conversations: data.conversations || [] });
    } catch { set({ error: "Failed to load conversations" }); }
  },
  fetchMessages: async (conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await messageService.getMessages(conversationId);
      set({ messages: data.messages || [], isLoading: false });
    } catch { set({ error: "Failed to load messages", isLoading: false }); }
  },
  sendMessage: async (conversationId, content) => {
    try {
      const { data } = await messageService.sendMessage(conversationId, content);
      set((s) => ({ messages: [...s.messages, data] }));
    } catch { set({ error: "Failed to send message" }); }
  },
  setActiveConversation: (id) => set({ activeConversation: id }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] }),
  ),
  markAsRead: async (conversationId) => {
    try {
      await messageService.markAsRead(conversationId);
      set((s) => ({
        conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c),
      }));
    } catch { /* ignore */ }
  },
}));
