"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/layout";
import { Button, IslamicPatternBackground } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Send, MessageCircle, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Complaint {
  id: string;
  subject: string;
  description: string;
  adminResponse: string | null;
  status: string;
  createdAt: string;
  admin: { firstName: string; lastName: string } | null;
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/complaints/me");
      setComplaints(data.complaints || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [complaints]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post("/complaints", { subject: message.slice(0, 100), description: message });
      toast.success("Message sent to admin");
      setMessage("");
      await fetchComplaints();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const caseClosed = user?.isActive === false && complaints.some((c) => c.status === "resolved");

  return (
    <IslamicPatternBackground>
      <DashboardSidebar />
      <div className="lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
          <div className="border-b border-charcoal-100/50 dark:border-charcoal-700 bg-white/50 dark:bg-charcoal-900/50 backdrop-blur px-4 lg:px-6 py-3">
            <h1 className="text-lg font-display font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-accent" />
              Help & Support
            </h1>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Chat with admins.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {loading && complaints.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal-400 text-sm">Loading...</div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-charcoal-400">
                <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">No messages yet. Send a message to admins.</p>
              </div>
            ) : (
              [...complaints].reverse().map((c) => (
                <div key={c.id} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] lg:max-w-[65%] bg-accent text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                      <p className="text-sm">{c.description}</p>
                      <p className="text-[10px] text-white/70 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {c.adminResponse && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] lg:max-w-[65%] bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <UserIcon className="w-3 h-3 text-charcoal-400" />
                          <span className="text-[11px] font-semibold text-charcoal-500 dark:text-charcoal-400">
                            {c.admin ? `${c.admin.firstName} ${c.admin.lastName}` : "Admin"}
                          </span>
                          {c.status === "resolved" && (
                            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Resolved</span>
                          )}
                        </div>
                        <p className="text-sm">{c.adminResponse}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-charcoal-100/50 dark:border-charcoal-700 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur p-4">
            {caseClosed ? (
              <p className="text-center text-sm text-green-600 dark:text-green-400">Your case has been reviewed and closed. Please wait for your account status to be updated.</p>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button type="submit" disabled={sending || !message.trim()} className="shrink-0 rounded-xl px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </IslamicPatternBackground>
  );
}
