"use client";

import { useState, useEffect } from "react";
import { Heart, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { marriageSuccessService } from "@/services/marriageSuccess";
import { useI18n } from "@/context/I18nContext";
import { mediaUrl } from "@/lib/utils";
import { IslamicPatternBackground } from "@/components/common";

type Story = {
  id: string;
  weddingPhotos: string[];
  engagementPhotos: string[];
  ringPhotos: string[];
  successStory: string;
  createdAt: string;
  initiator: { firstName: string; lastName: string };
  partner: { firstName: string; lastName: string };
};

export default function SuccessStoriesPage() {
  const { t } = useI18n();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    marriageSuccessService.getPublishedStories(page, 12).then(({ data }) => {
      setStories(data.stories || []);
      setTotalPages(data.totalPages || 1);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0a1a] via-[#151028] to-[#1a0f2e] relative">
      <IslamicPatternBackground className="opacity-[0.03]">{null}</IslamicPatternBackground>

      <div className="relative z-10 max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-purple-500 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t("marriageSuccess.storiesTitle")}</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">{t("marriageSuccess.storiesSubtitle")}</p>
        </div>

        {/* Stories grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t("marriageSuccess.noStoriesYet")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => {
              const photo = story.weddingPhotos?.[0] || story.engagementPhotos?.[0] || story.ringPhotos?.[0];
              return (
                <div key={story.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/30 transition-colors group">
                  {/* Photo */}
                  {photo && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={mediaUrl(photo)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-white text-sm font-medium">
                          {story.initiator?.firstName} & {story.partner?.firstName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Story */}
                  <div className="p-4">
                    {story.successStory && (
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 mb-3">
                        "{story.successStory}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(story.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-sm text-gray-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
