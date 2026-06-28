"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Send, Phone, Video, MoreVertical, ChevronLeft } from "lucide-react";
import { DashboardSidebar } from "@/components/layout";
import { Input, Button, Avatar } from "@/components/common";
import { useMessageStore } from "@/store/messages";

export default function MessagesPage() {
  const { conversations, messages, activeConversation, isLoading, fetchConversations, fetchMessages, sendMessage, setActiveConversation } = useMessageStore();
  const [newMessage, setNewMessage] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    await sendMessage(activeConversation, newMessage.trim());
    setNewMessage("");
  };

  const activeConv = conversations.find((c) => c.id === activeConversation);

  return (
    <div className="min-h-screen bg-blur-image">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
          {/* Conversation List */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-charcoal-100/50 dark:border-charcoal-700 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur flex flex-col ${mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            <div className="p-3 lg:p-4 border-b border-charcoal-100/50 dark:border-charcoal-700">
              <h1 className="text-lg lg:text-xl font-display font-bold text-charcoal-900 dark:text-white">Messages</h1>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <Input placeholder="Search conversations..." className="pl-9 text-sm" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-charcoal-100/50 dark:divide-charcoal-700/50">
              {isLoading && conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-400">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-400">No conversations yet</div>
              ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversation(conv.id); setMobileThreadOpen(true); }}
                  className={`w-full text-left p-3 lg:p-4 hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50 transition-colors ${activeConversation === conv.id ? "bg-accent/5 dark:bg-accent/10" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      firstName={conv.name.split(" ")[0] || conv.name}
                      lastName={conv.name.split(" ").slice(1).join(" ") || ""}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-charcoal-900 dark:text-white truncate">{conv.name}</span>
                        <span className="text-xs text-charcoal-400 shrink-0">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 flex flex-col bg-white/40 dark:bg-charcoal-900/40 ${!mobileThreadOpen ? "hidden lg:flex" : "flex"}`}>
            {activeConversation && activeConv ? (
              <>
                {/* Thread Header */}
                <div className="px-3 lg:px-4 py-2.5 lg:py-3 border-b border-charcoal-100/50 dark:border-charcoal-700 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMobileThreadOpen(false)} className="lg:hidden p-1 -ml-1">
                      <ChevronLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-300" />
                    </button>
                    <Avatar
                      size="sm"
                      firstName={activeConv.name.split(" ")[0] || activeConv.name}
                      lastName={activeConv.name.split(" ").slice(1).join(" ") || ""}
                    />
                    <div>
                      <span className="font-medium text-sm text-charcoal-900 dark:text-white">{activeConv.name}</span>
                      <p className="text-xs text-charcoal-400">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-full transition-colors"><Phone className="w-4 h-4 text-charcoal-500" /></button>
                    <button className="p-2 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-full transition-colors"><Video className="w-4 h-4 text-charcoal-500" /></button>
                    <button className="p-2 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-full transition-colors"><MoreVertical className="w-4 h-4 text-charcoal-500" /></button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId !== activeConv.userId;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[75%] lg:max-w-[60%] px-3 lg:px-4 py-2 rounded-2xl text-sm ${
                          isOwn
                            ? "bg-accent text-white rounded-br-md"
                            : "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white rounded-bl-md shadow-sm border border-charcoal-100/50 dark:border-charcoal-700"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-charcoal-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="p-3 lg:p-4 border-t border-charcoal-100/50 dark:border-charcoal-700 bg-white/60 dark:bg-charcoal-900/60 backdrop-blur shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 text-sm"
                    />
                    <Button type="submit" variant="primary" size="sm" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-4">
                <div>
                  <h3 className="text-base lg:text-lg font-display font-semibold text-charcoal-900 dark:text-white">Your Messages</h3>
                  <p className="text-xs lg:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
