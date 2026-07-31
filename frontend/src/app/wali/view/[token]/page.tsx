"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Heart, ShieldCheck, Eye, Lock } from "lucide-react";
import { waliService } from "@/services/wali";
import { mediaUrl } from "@/lib/utils";

interface WaliData {
  waliName: string;
  relationship: string;
  partnership: { status: string; createdAt: string };
  userA: { id: string; firstName: string; lastName: string; photo: string | null };
  userB: { id: string; firstName: string; lastName: string; photo: string | null };
  expiresAt: string;
}

interface WaliMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
}

export default function WaliViewerPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waliData, setWaliData] = useState<WaliData | null>(null);
  const [messages, setMessages] = useState<WaliMessage[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadMessages = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      const { data } = await waliService.getMessages(token, pageNum, 50);
      if (append) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg) setError(msg);
    } finally {
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await waliService.verifyToken(token);
        setWaliData(data);
        await loadMessages(1, false);
      } catch (err: any) {
        const msg = err?.response?.data?.error || "This invitation is no longer valid.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, loadMessages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Eye className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <p className="text-sm text-[#8B8B8B]">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !waliData) {
    return (
      <div className="min-h-screen bg-[#0c0a1a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-[#8B8B8B]">{error || "This invitation is no longer valid."}</p>
        </div>
      </div>
    );
  }

  const userAId = waliData.userA.id;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#0c0a1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#181818] border-b border-[#2D2D2D] px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-white">Wali Read-Only View</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
              <span className="text-xs text-[#D4AF37] font-medium">Exclusive Marriage Process</span>
            </div>
          </div>
          {/* Partner info */}
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {waliData.userA.photo ? (
                <img src={mediaUrl(waliData.userA.photo)} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  {waliData.userA.firstName[0]}
                </div>
              )}
              <span className="text-xs font-medium text-white">
                {waliData.userA.firstName} {waliData.userA.lastName}
              </span>
            </div>
            <span className="text-[#8B8B8B] text-xs">&</span>
            <div className="flex items-center gap-2">
              {waliData.userB.photo ? (
                <img src={mediaUrl(waliData.userB.photo)} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  {waliData.userB.firstName[0]}
                </div>
              )}
              <span className="text-xs font-medium text-white">
                {waliData.userB.firstName} {waliData.userB.lastName}
              </span>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#8B8B8B] mt-2">
            You are viewing as <span className="text-[#D4AF37] font-medium">{waliData.waliName}</span> ({waliData.relationship}) — Read Only
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Load more */}
          {hasMore && (
            <div className="text-center mb-4">
              <button
                onClick={() => loadMessages(page + 1, true)}
                disabled={loadingMore}
                className="text-xs text-[#D4AF37] hover:text-[#F2D675] font-medium transition-colors"
              >
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#8B8B8B]">No messages in this conversation yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isFromUserA = msg.senderId === userAId;
                const senderName = isFromUserA
                  ? waliData.userA.firstName
                  : waliData.userB.firstName;
                const isLeft = !isFromUserA;

                // Parse message content
                let displayContent = msg.content;
                let isImage = false;
                let isFile = false;
                let imageUrl = "";
                let fileName = "";
                let fileSize = "";

                if (msg.content.startsWith("IMG:")) {
                  isImage = true;
                  const parts = msg.content.split("|");
                  imageUrl = parts[0].replace("IMG:", "");
                  displayContent = parts[1] || "";
                } else if (msg.content.startsWith("FILE:")) {
                  isFile = true;
                  const parts = msg.content.split("|");
                  fileName = parts[1] || "File";
                  fileSize = parts[2] || "";
                  displayContent = parts[3] || "";
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                      isLeft
                        ? "bg-[#222222] border border-[#2D2D2D]"
                        : "bg-[#D4AF37]/10 border border-[#D4AF37]/20"
                    }`}>
                      <p className={`text-[10px] font-bold mb-0.5 ${
                        isLeft ? "text-[#C8C8C8]" : "text-[#D4AF37]"
                      }`}>
                        {senderName}
                      </p>
                      {isImage ? (
                        <div>
                          <img
                            src={mediaUrl(imageUrl)}
                            alt=""
                            className="rounded-lg max-w-full max-h-60 object-cover"
                          />
                          {displayContent && (
                            <p className="text-sm text-white mt-1">{displayContent}</p>
                          )}
                        </div>
                      ) : isFile ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#D4AF37]">📎 {fileName}</span>
                          {fileSize && <span className="text-[10px] text-[#8B8B8B]">({fileSize} bytes)</span>}
                        </div>
                      ) : (
                        <p className="text-sm text-white whitespace-pre-wrap break-words">{displayContent}</p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-[#8B8B8B]">{formatDate(msg.createdAt)}</span>
                        {msg.isEdited && <span className="text-[9px] text-[#8B8B8B] italic">edited</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Read-only footer */}
      <div className="bg-[#181818] border-t border-[#2D2D2D] px-4 py-2.5 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#8B8B8B]" />
          <span className="text-[10px] text-[#8B8B8B]">
            Read-only access — You can view messages but cannot send, reply, or interact.
          </span>
        </div>
      </div>
    </div>
  );
}
