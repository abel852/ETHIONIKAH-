"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface IslamicPatternBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "full" | "subtle";
  showBismillah?: boolean;
}

export function IslamicPatternBackground({
  children,
  className = "",
  variant = "full",
  showBismillah = false,
}: IslamicPatternBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${variant === "full" ? "bg-blur-image" : ""} ${className}`}>
      {/* Decorative top gradient bar — pink to gold */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-300/40 via-accent/40 to-orange-300/40 pointer-events-none z-0" />

      {/* Floating romantic orbs — pink, peach, gold */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-pink-200/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 15, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-orange-200/15 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -12, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-amber-200/15 blur-3xl pointer-events-none"
      />

      {/* Floating heart motifs */}
      <motion.div
        animate={{ y: [0, -25, 0], rotate: [0, 8, 0], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-20 pointer-events-none"
      >
        <Heart className="w-8 h-8 text-pink-300 fill-pink-200/30" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 18, 0], rotate: [0, -6, 0], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-40 right-16 pointer-events-none"
      >
        <Heart className="w-6 h-6 text-amber-400 fill-amber-200/20" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0], opacity: [0.05, 0.10, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-1/3 right-24 pointer-events-none"
      >
        <Heart className="w-5 h-5 text-rose-300 fill-rose-200/20" />
      </motion.div>

      {/* Optional Bismillah header */}
      {showBismillah && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none z-0"
        >
          <p className="text-xs text-accent/40 font-display tracking-wide select-none">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Decorative bottom gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300/30 via-accent/30 to-pink-300/30 pointer-events-none z-0" />
    </div>
  );
}
