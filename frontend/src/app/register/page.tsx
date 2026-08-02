"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Check, Calendar, 
  Briefcase, GraduationCap, MapPin, Heart, BookOpen, Building2, Baby, 
  Users, Globe, Cigarette, Dumbbell, Home, Sparkles, Upload, ChevronLeft,
  ChevronRight, Shield, AlertTriangle, Download, X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button, Input, WordSuggest } from "@/components/common";
import { authService } from "@/services/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useI18n, type Lang } from "@/context/I18nContext";
const steps = [
  "Account",
  "Basic Info",
  "Religious",
  "Education",
  "Intentions",
  "Family",
  "Lifestyle",
  "Personality",
  "Preferences",
  "Health"
];
const stepScenes = [
  { gradient: "from-rose-950 via-pink-900 to-amber-950", accent: "#f43f5e", accent2: "#fbbf24", icon: Heart, scene: "account", caption: "Begin your journey to a blessed union" },
  { gradient: "from-amber-950 via-orange-950 to-stone-950", accent: "#f59e0b", accent2: "#fde68a", icon: User, scene: "profile", caption: "Tell us who you are — every detail matters" },
  { gradient: "from-emerald-950 via-teal-900 to-green-950", accent: "#10b981", accent2: "#34d399", icon: BookOpen, scene: "religious", caption: "Faith is the foundation of a lasting marriage" },
  { gradient: "from-blue-950 via-indigo-900 to-purple-950", accent: "#3b82f6", accent2: "#818cf8", icon: GraduationCap, scene: "education", caption: "Knowledge shapes the life you will build" },
  { gradient: "from-purple-950 via-fuchsia-900 to-pink-950", accent: "#a855f7", accent2: "#e879f9", icon: Sparkles, scene: "intentions", caption: "A sincere intention opens doors to barakah" },
  { gradient: "from-teal-950 via-cyan-900 to-blue-950", accent: "#06b6d4", accent2: "#22d3ee", icon: Users, scene: "family", caption: "Family is where love grows roots" },
  { gradient: "from-orange-950 via-amber-900 to-yellow-950", accent: "#f97316", accent2: "#fbbf24", icon: Home, scene: "lifestyle", caption: "Daily habits shape the home you share" },
  { gradient: "from-pink-950 via-rose-900 to-red-950", accent: "#ec4899", accent2: "#f472b6", icon: Heart, scene: "personality", caption: "Let your unique character shine through" },
  { gradient: "from-indigo-950 via-blue-900 to-cyan-950", accent: "#6366f1", accent2: "#38bdf8", icon: Globe, scene: "preferences", caption: "Describe the one your heart is seeking" },
  { gradient: "from-green-950 via-emerald-900 to-teal-950", accent: "#22c55e", accent2: "#4ade80", icon: Shield, scene: "health", caption: "Honesty today builds trust for a lifetime" },
];
function _StepIllustrationOld({ scene, a, a2 }: { scene: string; a: string; a2: string }) {
  const gid = `g-${scene}`;
  const art: Record<string, ReactNode> = {
    account: (<>
      <defs>
        <linearGradient id={`${gid}-env`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.9" />
          <stop offset="100%" stopColor={a} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.15,1], opacity: [0.06,0.12,0.06] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-6,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="40" y="60" width="120" height="80" rx="10" fill={`url(#${gid}-env)`} stroke={a2} strokeWidth="2" />
        <path d="M40 70 L100 108 L160 70" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <motion.rect x="56" y="48" width="88" height="56" rx="6" fill="#fff" opacity="0.9"
          animate={{ y: [48,40,48] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.line x1="68" y1="62" x2="132" y2="62" stroke={a} strokeWidth="2.5" strokeLinecap="round"
          animate={{ opacity: [0.3,0.8,0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.line x1="68" y1="72" x2="120" y2="72" stroke={a} strokeWidth="2" strokeLinecap="round" opacity="0.5"
          animate={{ opacity: [0.2,0.6,0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        <motion.line x1="68" y1="82" x2="126" y2="82" stroke={a} strokeWidth="2" strokeLinecap="round" opacity="0.4"
          animate={{ opacity: [0.15,0.5,0.15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
        <motion.circle cx="100" cy="100" r="12" fill={a} stroke={a2} strokeWidth="2"
          animate={{ scale: [1,1.1,1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">EN</text>
      </motion.g>
      {[{x:50,y:40,d:0},{x:150,y:50,d:1},{x:160,y:130,d:0.5}].map((h,i)=>(
        <motion.g key={i} animate={{ y: [0,-12,0], opacity: [0.3,0.7,0.3] }} transition={{ duration: 3+i, repeat: Infinity, delay: h.d }}>
          <path d={`M${h.x} ${h.y} c-3-5-11-4-11 2 0 5 7 9 11 13 4-4 11-8 11-13 0-6-8-7-11-2z`} fill={a2} />
        </motion.g>
      ))}
      {[{x:30,y:90,d:0},{x:170,y:80,d:0.8}].map((s,i)=>(
        <motion.g key={i} animate={{ scale: [0,1,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y-6} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={a2} />
        </motion.g>
      ))}
    </>),
    profile: (<>
      <defs>
        <radialGradient id={`${gid}-avatar`} cx="0.5" cy="0.3">
          <stop offset="0%" stopColor={a2} />
          <stop offset="100%" stopColor={a} />
        </radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-5,0], rotate: [0,0.5,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}>
        <rect x="38" y="52" width="124" height="96" rx="12" fill="#fff" opacity="0.9" stroke={a2} strokeWidth="2" />
        <rect x="38" y="52" width="124" height="20" rx="12" fill={a} opacity="0.8" />
        <rect x="38" y="64" width="124" height="8" fill={a} opacity="0.8" />
        <circle cx="50" cy="62" r="4" fill={a2} />
        <text x="60" y="66" fontSize="8" fill="#fff" fontWeight="bold">ID CARD</text>
        <motion.circle cx="72" cy="96" r="18" fill={`url(#${gid}-avatar)`} stroke={a2} strokeWidth="2"
          animate={{ scale: [1,1.05,1] }} transition={{ duration: 3, repeat: Infinity }} />
        <circle cx="72" cy="91" r="6" fill="#fff" opacity="0.9" />
        <path d="M62 104 a10 10 0 0 1 20 0" fill="#fff" opacity="0.9" />
        {[0,1,2].map(i => (
          <motion.rect key={i} x="100" y={84+i*14} width={50-i*8} height="6" rx="3" fill={a}
            animate={{ opacity: [0.3,0.7,0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: i*0.3 }} />
        ))}
        <path d="M148 138 l8-8 v8z" fill={a2} opacity="0.5" />
      </motion.g>
      {[{x:30,y:70,d:0},{x:170,y:120,d:1}].map((s,i)=>(
        <motion.circle key={i} cx={s.x} cy={s.y} r="3" fill={a2}
          animate={{ scale: [0,1.5,0], opacity: [0,0.8,0] }} transition={{ duration: 2, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }} />
      ))}
    </>),
    religious: (<>
      <defs>
        <linearGradient id={`${gid}-book`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.8" />
          <stop offset="100%" stopColor={a} stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`${gid}-moon`} cx="0.3" cy="0.3">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor={a2} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <motion.g animate={{ y: [0,-5,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <motion.circle cx="140" cy="50" r="18" fill={a2} opacity="0.15"
          animate={{ scale: [1,1.3,1] }} transition={{ duration: 3, repeat: Infinity }} />
        <path d="M140 36 a14 14 0 1 0 10 24 11 11 0 1 1 -10 -24z" fill={`url(#${gid}-moon)`} />
      </motion.g>
      {[{x:50,y:50,d:0},{x:30,y:90,d:0.5},{x:165,y:90,d:0.3}].map((s,i)=>(
        <motion.g key={i} animate={{ opacity: [0.3,1,0.3], scale: [0.8,1.2,0.8] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y-5} l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5-3 l-3-1.5 l3-1.5z`} fill={a2} />
        </motion.g>
      ))}
      <motion.g animate={{ y: [0,-3,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="100" cy="148" rx="55" ry="6" fill={a} opacity="0.15" />
        <path d="M100 78 L44 86 L44 140 L100 148 Z" fill={`url(#${gid}-book)`} stroke={a2} strokeWidth="2" />
        <path d="M100 78 L156 86 L156 140 L100 148 Z" fill={`url(#${gid}-book)`} stroke={a2} strokeWidth="2" />
        <path d="M100 78 L100 148" stroke={a2} strokeWidth="2.5" />
        {[0,1,2,3].map(i => (
          <motion.line key={`l${i}`} x1="52" y1={94+i*12} x2="94" y2={98+i*12} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
            animate={{ opacity: [0.2,0.6,0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.2 }} />
        ))}
        {[0,1,2,3].map(i => (
          <motion.line key={`r${i}`} x1="106" y1={98+i*12} x2="148" y2={94+i*12} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
            animate={{ opacity: [0.2,0.6,0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.2 + 0.5 }} />
        ))}
      </motion.g>
      <motion.g animate={{ rotate: [0,2,0,-2,0] }} transition={{ duration: 6, repeat: Infinity }} style={{ transformOrigin: "100px 155px" }}>
        {[...Array(7)].map((_,i)=>{
          const angle = -50 + i*16;
          const rad = angle * Math.PI / 180;
          const x = 100 + Math.cos(rad) * 28;
          const y = 155 + Math.sin(rad) * 12;
          return <motion.circle key={i} cx={x} cy={y} r="3" fill={a2}
            animate={{ opacity: [0.4,0.9,0.4] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.15 }} />;
        })}
      </motion.g>
    </>),
    education: (<>
      <defs>
        <linearGradient id={`${gid}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.9" />
          <stop offset="100%" stopColor={a} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-8,0], rotate: [-3,3,-3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "40px 60px" }}>
        <rect x="28" y="52" width="28" height="20" rx="2" fill={a} opacity="0.6" stroke={a2} strokeWidth="1.5" />
        <line x1="28" y1="62" x2="56" y2="62" stroke="#fff" strokeWidth="1" opacity="0.4" />
      </motion.g>
      <motion.g animate={{ y: [0,6,0], rotate: [3,-3,3] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "160px 70px" }}>
        <rect x="148" y="62" width="26" height="18" rx="2" fill={a2} opacity="0.5" stroke={a2} strokeWidth="1.5" />
        <line x1="148" y1="71" x2="174" y2="71" stroke="#fff" strokeWidth="1" opacity="0.4" />
      </motion.g>
      <motion.g animate={{ y: [0,-6,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M100 56 L160 82 L100 108 L40 82 Z" fill={`url(#${gid}-cap)`} stroke={a2} strokeWidth="2" />
        <path d="M70 92 v14 c0 8 60 8 60 0 V92 L100 108 Z" fill={a} opacity="0.7" stroke={a2} strokeWidth="1.5" />
        <motion.path d="M160 82 v20" stroke={a2} strokeWidth="2.5" strokeLinecap="round"
          animate={{ pathLength: [0.8,1,0.8] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="160" cy="106" r="5" fill={a2}
          animate={{ y: [0,4,0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
          <rect x="76" y="128" width="48" height="22" rx="4" fill="#fff" opacity="0.85" stroke={a2} strokeWidth="2" />
          <line x1="82" y1="136" x2="118" y2="136" stroke={a} strokeWidth="1.5" opacity="0.5" />
          <line x1="82" y1="142" x2="112" y2="142" stroke={a} strokeWidth="1.5" opacity="0.4" />
          <path d="M100 128 v-6" stroke={a2} strokeWidth="3" strokeLinecap="round" />
          <path d="M96 122 l4 4 l4-4" fill="none" stroke={a2} strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </motion.g>
      {[{x:50,y:110,d:0},{x:155,y:130,d:0.8}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={a2}
          animate={{ scale: [0,1.2,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    intentions: (<>
      <defs>
        <linearGradient id={`${gid}-ring1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.9" />
          <stop offset="100%" stopColor={a2} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${gid}-ring2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} stopOpacity="0.9" />
          <stop offset="100%" stopColor={a} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${gid}-heart`} cx="0.5" cy="0.3">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor={a2} />
          <stop offset="100%" stopColor={a} />
        </radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="55" fill={a2} opacity="0.1"
        animate={{ scale: [1,1.2,1], opacity: [0.08,0.15,0.08] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="82" cy="110" rx="28" ry="30" fill="none" stroke={`url(#${gid}-ring1)`} strokeWidth="8" />
        <ellipse cx="82" cy="110" rx="28" ry="30" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
        <motion.path d="M82 82 l6-4 l6 4 l-6 10z" fill={a2} stroke="#fff" strokeWidth="1"
          animate={{ scale: [1,1.15,1] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transformOrigin: "82px 85px" }} />
      </motion.g>
      <motion.g animate={{ y: [0,4,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <ellipse cx="118" cy="110" rx="28" ry="30" fill="none" stroke={`url(#${gid}-ring2)`} strokeWidth="8" />
        <ellipse cx="118" cy="110" rx="28" ry="30" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
      </motion.g>
      <motion.path d="M100 72 c-8-13-28-10-28 5 0 13 18 23 28 33 10-10 28-20 28-33 0-15-20-18-28-5z"
        fill={`url(#${gid}-heart)`} stroke="#fff" strokeWidth="1.5"
        animate={{ scale: [1,1.15,1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 90px" }} />
      {[{x:50,y:70,d:0},{x:150,y:70,d:0.6},{x:100,y:50,d:0.3},{x:60,y:140,d:0.9}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={a2}
          animate={{ scale: [0,1.3,0], opacity: [0,1,0] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y+2}px` }} />
      ))}
    </>),
    family: (<>
      <defs>
        <linearGradient id={`${gid}-house`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.8" />
          <stop offset="100%" stopColor={a} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ rotate: [-1,1,-1] }} transition={{ duration: 5, repeat: Infinity }} style={{ transformOrigin: "40px 120px" }}>
        <rect x="36" y="110" width="6" height="30" rx="2" fill={a} opacity="0.6" />
        <motion.circle cx="39" cy="100" r="16" fill={a2} opacity="0.4"
          animate={{ scale: [1,1.08,1] }} transition={{ duration: 3, repeat: Infinity }} />
        <circle cx="33" cy="96" r="8" fill={a2} opacity="0.5" />
        <circle cx="45" cy="96" r="7" fill={a2} opacity="0.5" />
      </motion.g>
      <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M100 48 L156 92 V148 H44 V92 Z" fill={`url(#${gid}-house)`} stroke={a2} strokeWidth="2.5" />
        <path d="M100 48 L100 38 L110 48" fill="none" stroke={a2} strokeWidth="2" strokeLinecap="round" />
        <rect x="88" y="112" width="24" height="36" rx="2" fill={a} opacity="0.5" stroke={a2} strokeWidth="1.5" />
        <motion.circle cx="100" cy="130" r="2.5" fill={a2}
          animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 2, repeat: Infinity }} />
        <rect x="52" y="100" width="20" height="20" rx="2" fill={a2} opacity="0.3" stroke={a2} strokeWidth="1.5" />
        <rect x="128" y="100" width="20" height="20" rx="2" fill={a2} opacity="0.3" stroke={a2} strokeWidth="1.5" />
        <motion.path d="M100 84 c-5-8-18-6-18 3 0 8 12 14 18 20 6-6 18-12 18-20 0-9-13-11-18-3z"
          fill={a2} animate={{ scale: [1,1.12,1] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ transformOrigin: "100px 100px" }} />
      </motion.g>
      {[{x:74,r:9,d:0},{x:126,r:9,d:0.5}].map((f,i)=>(
        <motion.g key={i} animate={{ y: [0,-3,0] }} transition={{ duration: 2.6, repeat: Infinity, delay: f.d }}>
          <circle cx={f.x} cy="140" r={f.r} fill={`${a2}66`} stroke={a2} strokeWidth="2" />
          <path d={`M${f.x-f.r-2} 156 a${f.r+2} ${f.r+2} 0 0 1 ${(f.r+2)*2} 0`} fill="none" stroke={a2} strokeWidth="2" />
        </motion.g>
      ))}
    </>),
    lifestyle: (<>
      <defs>
        <linearGradient id={`${gid}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.9" />
          <stop offset="100%" stopColor={a} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${gid}-cup`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor={a2} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Sun with rotating rays */}
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 70px" }}>
        {[...Array(8)].map((_,i)=>(
          <line key={i} x1="100" y1="40" x2="100" y2="52" stroke={a2} strokeWidth="3" strokeLinecap="round"
            transform={`rotate(${i*45} 100 70)`} />
        ))}
      </motion.g>
      <motion.circle cx="100" cy="70" r="22" fill={`url(#${gid}-sun)`} stroke={a2} strokeWidth="2.5"
        animate={{ scale: [1,1.06,1] }} transition={{ duration: 3, repeat: Infinity }} />
      {/* Coffee cup */}
      <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M74 110 q26 30 52 0" fill="none" stroke={a2} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M100 110 v-22" stroke={a2} strokeWidth="2.5" strokeLinecap="round" />
        <motion.path d="M100 90 q-14-4-16-18 14 2 16 18z" fill={`${a2}66`} stroke={a2} strokeWidth="2"
          animate={{ rotate: [-4,4,-4] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ transformOrigin: "100px 90px" }} />
        {/* Steam */}
        {[0,1].map(i => (
          <motion.path key={i} d={`M${92+i*16} 84 q-4-6 0-12 q4-6 0-12`} fill="none" stroke={a2} strokeWidth="2" strokeLinecap="round" opacity="0.5"
            animate={{ opacity: [0.2,0.6,0.2], y: [0,-6,0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i*0.5 }} />
        ))}
      </motion.g>
      {/* Sparkles */}
      {[{x:40,y:60,d:0},{x:160,y:110,d:0.8}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={a2}
          animate={{ scale: [0,1.2,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    personality: (<>
      <defs>
        <linearGradient id={`${gid}-heart`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.8" />
          <stop offset="100%" stopColor={a} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${gid}-sparkle`} cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor={a2} />
        </radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Large heart */}
      <motion.path d="M100 152 C62 124 44 106 44 84 c0-17 14-27 28-27 11 0 20 6 28 17 8-11 17-17 28-17 14 0 28 10 28 27 0 22-18 40-56 68z"
        fill={`url(#${gid}-heart)`} stroke={a2} strokeWidth="2.5"
        animate={{ scale: [1,1.06,1] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 104px" }} />
      {/* Pulsing sparkles inside heart */}
      {[{x:80,y:92,d:0},{x:118,y:84,d:0.5},{x:100,y:116,d:1}].map((s,i)=>(
        <motion.g key={i} animate={{ scale: [0.8,1.4,0.8], opacity: [0.4,1,0.4] }} transition={{ duration: 2.2, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y-6} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={`url(#${gid}-sparkle)`} />
        </motion.g>
      ))}
      {/* Orbiting dots */}
      {[0,1,2,3,4].map(i => {
        const angle = (i * 72) * Math.PI / 180;
        const x = 100 + Math.cos(angle) * 52;
        const y = 104 + Math.sin(angle) * 52;
        return <motion.circle key={i} cx={x} cy={y} r="3" fill={a2}
          animate={{ opacity: [0.3,0.8,0.3], scale: [0.8,1.2,0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.2 }}
          style={{ transformOrigin: `${x}px ${y}px` }} />;
      })}
    </>),
    preferences: (<>
      <defs>
        <linearGradient id={`${gid}-globe`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.7" />
          <stop offset="100%" stopColor={a} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${gid}-pin`} cx="0.5" cy="0.3">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor={a2} />
        </radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Rotating globe */}
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 104px" }}>
        <circle cx="100" cy="104" r="42" fill={`url(#${gid}-globe)`} stroke={a2} strokeWidth="2.5" />
        <ellipse cx="100" cy="104" rx="18" ry="42" fill="none" stroke={a2} strokeWidth="2" opacity="0.6" />
        <path d="M58 104 h84 M68 82 h64 M68 126 h64" fill="none" stroke={a2} strokeWidth="2" opacity="0.6" />
      </motion.g>
      {/* Location pin */}
      <motion.g animate={{ y: [0,-8,0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
        <motion.path d="M148 48 a14 14 0 1 0 -28 0 c0 11 14 26 14 26s14-15 14-26z" fill={`url(#${gid}-pin)`} stroke={a2} strokeWidth="2"
          animate={{ scale: [1,1.1,1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "134px 48px" }} />
        <circle cx="134" cy="48" r="5" fill={a} />
      </motion.g>
      {/* Sparkles */}
      {[{x:40,y:80,d:0},{x:50,y:140,d:0.6}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill={a2}
          animate={{ scale: [0,1.2,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    health: (<>
      <defs>
        <linearGradient id={`${gid}-shield`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a2} stopOpacity="0.8" />
          <stop offset="100%" stopColor={a} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08"
        animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Shield */}
      <motion.g animate={{ y: [0,-5,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M100 44 l48 19 v36 c0 32-24 49-48 57-24-8-48-25-48-57V63z"
          fill={`url(#${gid}-shield)`} stroke={a2} strokeWidth="2.5" />
        {/* Heartbeat line */}
        <motion.path d="M62 104 h16 l8-17 11 34 9-17 h22" fill="none" stroke={a2} strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0,1,1], opacity: [0.4,1,0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
        {/* Cross symbol */}
        <motion.g animate={{ scale: [1,1.1,1] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transformOrigin: "100px 88px" }}>
          <rect x="96" y="80" width="8" height="20" rx="2" fill="#fff" opacity="0.8" />
          <rect x="90" y="86" width="20" height="8" rx="2" fill="#fff" opacity="0.8" />
        </motion.g>
      </motion.g>
      {/* Floating leaves */}
      {[{x:40,y:60,d:0},{x:160,y:140,d:0.8}].map((s,i)=>(
        <motion.g key={i} animate={{ y: [0,-6,0], rotate: [-5,5,-5] }} transition={{ duration: 3.5, repeat: Infinity, delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y} q-8-4 -8-12 q8 2 8 12z`} fill={a2} opacity="0.5" />
        </motion.g>
      ))}
    </>),
  };
  return (
    <motion.div key={scene}
      className="w-[68%] max-w-[230px] aspect-square"
      animate={{ y: [0,-7,0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
      <svg viewBox="0 0 200 200" className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 18px ${a}66)` }}>
        {art[scene] || art.account}
      </svg>
    </motion.div>
  );
}
function AnimatedStepScene({ step }: { step: number }) {
  const scene = stepScenes[step - 1] || stepScenes[0];
  const a = scene.accent;
  const a2 = scene.accent2;
  const gid = `g-${scene.scene}-${step}`;
  const illustrations: Record<string, ReactNode> = {
    account: (<>
      <defs><linearGradient id={`${gid}-env`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.9" /><stop offset="100%" stopColor={a} stopOpacity="0.7" /></linearGradient></defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08" animate={{ scale: [1,1.15,1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-6,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="40" y="60" width="120" height="80" rx="10" fill={`url(#${gid}-env)`} stroke={a2} strokeWidth="2" />
        <path d="M40 70 L100 108 L160 70" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <motion.rect x="56" y="48" width="88" height="56" rx="6" fill="#fff" opacity="0.9" animate={{ y: [48,40,48] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.line x1="68" y1="62" x2="132" y2="62" stroke={a} strokeWidth="2.5" strokeLinecap="round" animate={{ opacity: [0.3,0.8,0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.line x1="68" y1="72" x2="120" y2="72" stroke={a} strokeWidth="2" strokeLinecap="round" opacity="0.5" animate={{ opacity: [0.2,0.6,0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        <motion.line x1="68" y1="82" x2="126" y2="82" stroke={a} strokeWidth="2" strokeLinecap="round" opacity="0.4" animate={{ opacity: [0.15,0.5,0.15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
        <motion.circle cx="100" cy="100" r="12" fill={a} stroke={a2} strokeWidth="2" animate={{ scale: [1,1.1,1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">EN</text>
      </motion.g>
      {[{x:50,y:40,d:0},{x:150,y:50,d:1},{x:160,y:130,d:0.5}].map((h,i)=>(
        <motion.g key={i} animate={{ y: [0,-12,0], opacity: [0.3,0.7,0.3] }} transition={{ duration: 3+i, repeat: Infinity, delay: h.d }}>
          <path d={`M${h.x} ${h.y} c-3-5-11-4-11 2 0 5 7 9 11 13 4-4 11-8 11-13 0-6-8-7-11-2z`} fill={a2} />
        </motion.g>
      ))}
    </>),
    profile: (<>
      <defs><radialGradient id={`${gid}-av`} cx="0.5" cy="0.3"><stop offset="0%" stopColor={a2} /><stop offset="100%" stopColor={a} /></radialGradient></defs>
      <motion.circle cx="100" cy="100" r="60" fill={a} opacity="0.08" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.g animate={{ y: [0,-5,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="38" y="52" width="124" height="96" rx="12" fill="#fff" opacity="0.9" stroke={a2} strokeWidth="2" />
        <rect x="38" y="52" width="124" height="20" rx="12" fill={a} opacity="0.8" />
        <rect x="38" y="64" width="124" height="8" fill={a} opacity="0.8" />
        <circle cx="50" cy="62" r="4" fill={a2} />
        <text x="60" y="66" fontSize="8" fill="#fff" fontWeight="bold">ID CARD</text>
        <motion.circle cx="72" cy="96" r="18" fill={`url(#${gid}-av)`} stroke={a2} strokeWidth="2" animate={{ scale: [1,1.05,1] }} transition={{ duration: 3, repeat: Infinity }} />
        <circle cx="72" cy="91" r="6" fill="#fff" opacity="0.9" />
        <path d="M62 104 a10 10 0 0 1 20 0" fill="#fff" opacity="0.9" />
        {[0,1,2].map(i => <motion.rect key={i} x="100" y={84+i*14} width={50-i*8} height="6" rx="3" fill={a} animate={{ opacity: [0.3,0.7,0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: i*0.3 }} />)}
      </motion.g>
    </>),
    religious: (<>
      <defs>
        <linearGradient id={`${gid}-pg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.95" /><stop offset="100%" stopColor={a2} stopOpacity="0.6" /></linearGradient>
        <linearGradient id={`${gid}-cv`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.7" /><stop offset="100%" stopColor={a} stopOpacity="0.5" /></linearGradient>
        <radialGradient id={`${gid}-mn`} cx="0.35" cy="0.35"><stop offset="0%" stopColor="#fff" stopOpacity="1" /><stop offset="100%" stopColor={a2} stopOpacity="0.8" /></radialGradient>
        <filter id={`${gid}-glow`}><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {/* Glow halo */}
      <motion.circle cx="100" cy="100" r="62" fill={a2} opacity="0.06" animate={{ scale: [1,1.15,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Crescent moon with glow */}
      <motion.g animate={{ y: [0,-6,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <motion.circle cx="145" cy="48" r="22" fill={a2} opacity="0.12" animate={{ scale: [1,1.35,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "145px 48px" }} />
        <motion.circle cx="145" cy="48" r="16" fill={a2} opacity="0.2" filter={`url(#${gid}-glow)`} animate={{ scale: [1,1.2,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "145px 48px" }} />
        <path d="M145 32 a16 16 0 1 0 11 27 12 12 0 1 1 -11 -27z" fill={`url(#${gid}-mn)`} stroke="#fff" strokeWidth="0.5" opacity="0.9" />
      </motion.g>
      {/* Twinkling stars */}
      {[{x:45,y:45,s:1,d:0},{x:30,y:80,s:0.7,d:0.8},{x:165,y:85,s:0.8,d:0.3},{x:55,y:120,s:0.6,d:1.2}].map((s,i)=>(
        <motion.g key={i} animate={{ opacity: [0.2,1,0.2], scale: [0.6,1.3,0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y-5*s.s} l${1.5*s.s} ${3*s.s} l${3*s.s} ${1.5*s.s} l-${3*s.s} ${1.5*s.s} l-${1.5*s.s} ${3*s.s} l-${1.5*s.s} -${3*s.s} l-${3*s.s} -${1.5*s.s} l${3*s.s} -${1.5*s.s}z`} fill="#fff" />
        </motion.g>
      ))}
      {/* Open book with pages */}
      <motion.g animate={{ y: [0,-3,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        {/* Book shadow */}
        <ellipse cx="100" cy="150" rx="58" ry="5" fill={a} opacity="0.2" />
        {/* Book cover (back) */}
        <path d="M100 76 L40 84 L40 142 L100 150 Z" fill={a} opacity="0.4" stroke={a2} strokeWidth="1.5" />
        <path d="M100 76 L160 84 L160 142 L100 150 Z" fill={a} opacity="0.4" stroke={a2} strokeWidth="1.5" />
        {/* Left page */}
        <path d="M100 80 L46 87 L46 138 L100 146 Z" fill={`url(#${gid}-pg)`} stroke={a2} strokeWidth="1.5" />
        {/* Right page */}
        <path d="M100 80 L154 87 L154 138 L100 146 Z" fill={`url(#${gid}-pg)`} stroke={a2} strokeWidth="1.5" />
        {/* Spine highlight */}
        <path d="M100 80 L100 146" stroke={a2} strokeWidth="2" opacity="0.8" />
        {/* Decorative border on pages */}
        <path d="M52 92 L94 96 M52 100 L94 104 M52 108 L94 112 M52 116 L94 120" stroke={a2} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <path d="M106 96 L148 92 M106 104 L148 100 M106 112 L148 108 M106 120 L148 116" stroke={a2} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        {/* Animated text lines */}
        {[0,1,2,3].map(i => <motion.line key={`l${i}`} x1="54" y1={96+i*10} x2="92" y2={99+i*10} stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" animate={{ opacity: [0.3,0.8,0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.2 }} />)}
        {[0,1,2,3].map(i => <motion.line key={`r${i}`} x1="108" y1={99+i*10} x2="146" y2={96+i*10} stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" animate={{ opacity: [0.3,0.8,0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.2+0.5 }} />)}
        {/* Bookmark ribbon */}
        <motion.path d="M100 80 v-12 l4 4 l4-4 v16" fill={a2} stroke="#fff" strokeWidth="0.5" animate={{ y: [0,-2,0] }} transition={{ duration: 3, repeat: Infinity }} />
      </motion.g>
      {/* Prayer beads at bottom */}
      <motion.g animate={{ rotate: [0,1,0,-1,0] }} transition={{ duration: 6, repeat: Infinity }} style={{ transformOrigin: "100px 158px" }}>
        {[...Array(9)].map((_,i)=>{const ang=(-60+i*15)*Math.PI/180;const x=100+Math.cos(ang)*32;const y=158+Math.sin(ang)*10;return <motion.circle key={i} cx={x} cy={y} r="3.5" fill={a2} stroke="#fff" strokeWidth="0.5" animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.12 }} />;})}
      </motion.g>
    </>),
    education: (<>
      <defs>
        <linearGradient id={`${gid}-cp`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.95" /><stop offset="100%" stopColor={a} stopOpacity="0.7" /></linearGradient>
        <linearGradient id={`${gid}-bk1`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.6" /><stop offset="100%" stopColor={a} stopOpacity="0.3" /></linearGradient>
        <linearGradient id={`${gid}-dp`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="100%" stopColor={a2} stopOpacity="0.5" /></linearGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Floating book left */}
      <motion.g animate={{ y: [0,-8,0], rotate: [-5,5,-5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "38px 58px" }}>
        <rect x="26" y="48" width="28" height="22" rx="2" fill={`url(#${gid}-bk1)`} stroke={a2} strokeWidth="1.5" />
        <line x1="26" y1="59" x2="54" y2="59" stroke="#fff" strokeWidth="0.8" opacity="0.4" />
        <rect x="29" y="51" width="20" height="2" rx="1" fill="#fff" opacity="0.3" />
      </motion.g>
      {/* Floating book right */}
      <motion.g animate={{ y: [0,6,0], rotate: [5,-5,5] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "162px 68px" }}>
        <rect x="148" y="58" width="26" height="20" rx="2" fill={`url(#${gid}-bk1)`} stroke={a2} strokeWidth="1.5" />
        <line x1="148" y1="68" x2="174" y2="68" stroke="#fff" strokeWidth="0.8" opacity="0.4" />
      </motion.g>
      {/* Graduation cap */}
      <motion.g animate={{ y: [0,-6,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        {/* Mortarboard with gradient */}
        <path d="M100 52 L162 80 L100 108 L38 80 Z" fill={`url(#${gid}-cp)`} stroke={a2} strokeWidth="2" />
        {/* Cap top highlight */}
        <path d="M100 52 L162 80 L100 76 L38 80 Z" fill="#fff" opacity="0.15" />
        {/* Cap band */}
        <path d="M72 90 v16 c0 9 56 9 56 0 V90 L100 108 Z" fill={a} opacity="0.6" stroke={a2} strokeWidth="1.5" />
        {/* Tassel string */}
        <motion.path d="M162 80 v22" stroke={a2} strokeWidth="2" strokeLinecap="round" animate={{ pathLength: [0.85,1,0.85] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Tassel knot */}
        <circle cx="162" cy="104" r="3" fill={a2} />
        {/* Tassel strands */}
        {[0,1,2,3,4].map(i=>(
          <motion.line key={i} x1="162" y1="104" x2={162+Math.cos(i*30-60)*5} y2={112+Math.abs(i-2)*2} stroke={a2} strokeWidth="1.5" strokeLinecap="round"
            animate={{ y: [0,3,0] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.1 }} />
        ))}
        {/* Diploma scroll */}
        <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
          <rect x="72" y="126" width="56" height="24" rx="4" fill={`url(#${gid}-dp)`} stroke={a2} strokeWidth="2" />
          <line x1="78" y1="134" x2="122" y2="134" stroke={a} strokeWidth="1.5" opacity="0.5" />
          <line x1="78" y1="140" x2="116" y2="140" stroke={a} strokeWidth="1.5" opacity="0.4" />
          {/* Ribbon seal */}
          <motion.circle cx="100" cy="126" r="6" fill={a2} stroke="#fff" strokeWidth="1" animate={{ scale: [1,1.15,1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ transformOrigin: "100px 126px" }} />
          <path d="M96 130 l4 4 l4-4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      </motion.g>
      {/* Sparkles */}
      {[{x:45,y:100,d:0},{x:158,y:120,d:0.8},{x:100,y:40,d:0.4}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill="#fff" animate={{ scale: [0,1.3,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    intentions: (<>
      <defs>
        <linearGradient id={`${gid}-r1`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="1" /><stop offset="100%" stopColor={a2} stopOpacity="0.4" /></linearGradient>
        <linearGradient id={`${gid}-r2`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={a} stopOpacity="1" /><stop offset="100%" stopColor={a} stopOpacity="0.4" /></linearGradient>
        <radialGradient id={`${gid}-ht`} cx="0.5" cy="0.25"><stop offset="0%" stopColor="#fff" /><stop offset="50%" stopColor={a2} /><stop offset="100%" stopColor={a} /></radialGradient>
        <filter id={`${gid}-glow`}><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      {/* Soft glow */}
      <motion.circle cx="100" cy="95" r="50" fill={a2} opacity="0.08" animate={{ scale: [1,1.2,1] }} transition={{ duration: 3, repeat: Infinity }} />
      {/* Left ring with shine */}
      <motion.g animate={{ y: [0,-5,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="80" cy="115" rx="30" ry="32" fill="none" stroke={`url(#${gid}-r1)`} strokeWidth="7" />
        {/* Ring shine highlight */}
        <ellipse cx="80" cy="115" rx="30" ry="32" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
        {/* Diamond on ring */}
        <motion.g animate={{ scale: [1,1.15,1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ transformOrigin: "80px 83px" }}>
          <path d="M80 78 l8-6 l8 6 l-8 14z" fill={a2} stroke="#fff" strokeWidth="1" />
          <path d="M80 78 l8-6 l-4 10z" fill="#fff" opacity="0.4" />
          <circle cx="80" cy="83" r="2" fill="#fff" opacity="0.8" />
        </motion.g>
      </motion.g>
      {/* Right ring with shine */}
      <motion.g animate={{ y: [0,5,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <ellipse cx="120" cy="115" rx="30" ry="32" fill="none" stroke={`url(#${gid}-r2)`} strokeWidth="7" />
        <ellipse cx="120" cy="115" rx="30" ry="32" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
      </motion.g>
      {/* Glowing heart between rings */}
      <motion.g animate={{ scale: [1,1.15,1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 88px" }}>
        {/* Heart glow */}
        <path d="M100 68 c-9-14-30-11-30 6 0 14 19 25 30 36 11-11 30-22 30-36 0-17-21-20-30-6z" fill={a2} opacity="0.3" filter={`url(#${gid}-glow)`} />
        {/* Heart body */}
        <path d="M100 70 c-9-14-30-11-30 6 0 14 19 25 30 36 11-11 30-22 30-36 0-17-21-20-30-6z" fill={`url(#${gid}-ht)`} stroke="#fff" strokeWidth="1.5" />
        {/* Heart shine */}
        <ellipse cx="88" cy="78" rx="6" ry="4" fill="#fff" opacity="0.5" />
      </motion.g>
      {/* Floating sparkles */}
      {[{x:45,y:65,d:0},{x:155,y:65,d:0.6},{x:100,y:45,d:0.3},{x:55,y:145,d:0.9},{x:145,y:145,d:1.2}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill="#fff" animate={{ scale: [0,1.4,0], opacity: [0,1,0] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y+2}px` }} />
      ))}
    </>),
    family: (<>
      <defs>
        <linearGradient id={`${gid}-hs`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.85" /><stop offset="100%" stopColor={a} stopOpacity="0.5" /></linearGradient>
        <linearGradient id={`${gid}-rf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a} stopOpacity="0.6" /><stop offset="100%" stopColor={a2} stopOpacity="0.3" /></linearGradient>
        <radialGradient id={`${gid}-wm`} cx="0.5" cy="0.4"><stop offset="0%" stopColor={a2} stopOpacity="0.8" /><stop offset="100%" stopColor={a2} stopOpacity="0.2" /></radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Tree on left */}
      <motion.g animate={{ rotate: [-1.5,1.5,-1.5] }} transition={{ duration: 5, repeat: Infinity }} style={{ transformOrigin: "36px 115px" }}>
        <rect x="33" y="105" width="6" height="35" rx="2" fill={a} opacity="0.5" />
        <motion.circle cx="36" cy="95" r="18" fill={`url(#${gid}-wm)`} stroke={a2} strokeWidth="1.5" animate={{ scale: [1,1.08,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "36px 95px" }} />
        <circle cx="28" cy="90" r="9" fill={a2} opacity="0.4" />
        <circle cx="44" cy="90" r="8" fill={a2} opacity="0.4" />
        {/* Small fruits */}
        {[{x:30,y:88,d:0},{x:42,y:94,d:0.5},{x:36,y:100,d:1}].map((f,i)=>(
          <motion.circle key={i} cx={f.x} cy={f.y} r="2" fill={a2} animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 2, repeat: Infinity, delay: f.d }} />
        ))}
      </motion.g>
      {/* House */}
      <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        {/* Roof */}
        <path d="M100 44 L158 88 V92 L100 48 L42 92 V88 Z" fill={`url(#${gid}-rf)`} stroke={a2} strokeWidth="2" />
        {/* House body */}
        <path d="M100 48 L156 90 V148 H44 V90 Z" fill={`url(#${gid}-hs)`} stroke={a2} strokeWidth="2.5" />
        {/* Chimney with smoke */}
        <rect x="128" y="56" width="8" height="16" rx="1" fill={a} opacity="0.5" stroke={a2} strokeWidth="1" />
        {[0,1,2].map(i=>(
          <motion.circle key={i} cx={132} cy={52-i*6} r="2.5" fill="#fff" opacity="0.3"
            animate={{ y: [0,-8,0], opacity: [0,0.4,0] }} transition={{ duration: 3, repeat: Infinity, delay: i*0.8 }} />
        ))}
        {/* Door */}
        <rect x="88" y="112" width="24" height="36" rx="3" fill={a} opacity="0.6" stroke={a2} strokeWidth="1.5" />
        <motion.circle cx="106" cy="130" r="2" fill={a2} animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Windows with warm glow */}
        <motion.rect x="52" y="98" width="20" height="20" rx="2" fill={`url(#${gid}-wm)`} stroke={a2} strokeWidth="1.5" animate={{ opacity: [0.5,0.9,0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <line x1="62" y1="98" x2="62" y2="118" stroke={a2} strokeWidth="1" opacity="0.5" />
        <line x1="52" y1="108" x2="72" y2="108" stroke={a2} strokeWidth="1" opacity="0.5" />
        <motion.rect x="128" y="98" width="20" height="20" rx="2" fill={`url(#${gid}-wm)`} stroke={a2} strokeWidth="1.5" animate={{ opacity: [0.5,0.9,0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
        <line x1="138" y1="98" x2="138" y2="118" stroke={a2} strokeWidth="1" opacity="0.5" />
        <line x1="128" y1="108" x2="148" y2="108" stroke={a2} strokeWidth="1" opacity="0.5" />
        {/* Heart on house */}
        <motion.path d="M100 80 c-4-6-14-5-14 3 0 6 9 11 14 15 5-4 14-9 14-15 0-8-10-9-14-3z" fill={a2} animate={{ scale: [1,1.15,1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ transformOrigin: "100px 90px" }} />
      </motion.g>
      {/* Family figures (parents + child) */}
      {[{x:70,r:10,d:0,c:a2},{x:130,r:10,d:0.5,c:a},{x:100,r:7,d:0.25,c:a2}].map((f,i)=>(
        <motion.g key={i} animate={{ y: [0,-3,0] }} transition={{ duration: 2.6, repeat: Infinity, delay: f.d }}>
          <circle cx={f.x} cy={145-f.r} r={f.r} fill={`${f.c}88`} stroke={f.c} strokeWidth="2" />
          <path d={`M${f.x-f.r-2} 162 a${f.r+2} ${f.r+2} 0 0 1 ${(f.r+2)*2} 0`} fill="none" stroke={f.c} strokeWidth="2.5" />
        </motion.g>
      ))}
    </>),
    lifestyle: (<>
      <defs>
        <linearGradient id={`${gid}-sn`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.95" /><stop offset="100%" stopColor={a} stopOpacity="0.6" /></linearGradient>
        <linearGradient id={`${gid}-cp`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="100%" stopColor={a2} stopOpacity="0.4" /></linearGradient>
        <radialGradient id={`${gid}-glw`} cx="0.5" cy="0.5"><stop offset="0%" stopColor={a2} stopOpacity="0.3" /><stop offset="100%" stopColor={a2} stopOpacity="0" /></radialGradient>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Sun glow */}
      <motion.circle cx="100" cy="66" r="36" fill={`url(#${gid}-glw)`} animate={{ scale: [1,1.2,1] }} transition={{ duration: 4, repeat: Infinity }} style={{ transformOrigin: "100px 66px" }} />
      {/* Sun with rotating rays */}
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 66px" }}>
        {[...Array(12)].map((_,i)=>(
          <line key={i} x1="100" y1="36" x2="100" y2="46" stroke={a2} strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${i*30} 100 66)`} opacity="0.8" />
        ))}
      </motion.g>
      {/* Sun body */}
      <motion.circle cx="100" cy="66" r="20" fill={`url(#${gid}-sn)`} stroke="#fff" strokeWidth="1.5" animate={{ scale: [1,1.06,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "100px 66px" }} />
      {/* Sun face */}
      <circle cx="93" cy="62" r="2" fill={a} opacity="0.6" />
      <circle cx="107" cy="62" r="2" fill={a} opacity="0.6" />
      <path d="M92 70 q8 6 16 0" fill="none" stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Coffee cup with saucer */}
      <motion.g animate={{ y: [0,-4,0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        {/* Saucer */}
        <ellipse cx="100" cy="140" rx="36" ry="5" fill={a} opacity="0.3" />
        {/* Cup body */}
        <path d="M78 108 q22 28 44 0" fill="none" stroke={a2} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M100 108 v-22" stroke={a2} strokeWidth="2.5" strokeLinecap="round" />
        {/* Cup outline */}
        <path d="M82 106 q18 24 36 0 v-2 h-36z" fill={`url(#${gid}-cp)`} stroke={a2} strokeWidth="2" opacity="0.6" />
        {/* Coffee leaf/latte art */}
        <motion.path d="M100 90 q-12-4-14-16 12 2 14 16z" fill={a2} opacity="0.5" stroke={a2} strokeWidth="1.5" animate={{ rotate: [-3,3,-3] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ transformOrigin: "100px 90px" }} />
        <motion.path d="M100 90 q12-4 14-16 -12 2 -14 16z" fill={`${a2}88`} opacity="0.4" stroke={a2} strokeWidth="1.5" animate={{ rotate: [3,-3,3] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ transformOrigin: "100px 90px" }} />
        {/* Steam */}
        {[0,1,2].map(i => (
          <motion.path key={i} d={`M${92+i*8} 82 q-4-7 0-14 q4-7 0-14`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.4"
            animate={{ opacity: [0.1,0.5,0.1], y: [0,-8,0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i*0.5 }} />
        ))}
      </motion.g>
      {/* Sparkles */}
      {[{x:40,y:55,d:0},{x:160,y:100,d:0.8},{x:50,y:130,d:0.4}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill="#fff" animate={{ scale: [0,1.2,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    personality: (<>
      <defs>
        <linearGradient id={`${gid}-ht`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.9" /><stop offset="100%" stopColor={a} stopOpacity="0.4" /></linearGradient>
        <radialGradient id={`${gid}-sp`} cx="0.5" cy="0.5"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor={a2} /></radialGradient>
        <filter id={`${gid}-glow`}><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Heart glow */}
      <motion.path d="M100 152 C62 124 44 106 44 84 c0-17 14-27 28-27 11 0 20 6 28 17 8-11 17-17 28-17 14 0 28 10 28 27 0 22-18 40-56 68z" fill={a2} opacity="0.15" filter={`url(#${gid}-glow)`} animate={{ scale: [1,1.08,1] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 104px" }} />
      {/* Large heart body */}
      <motion.path d="M100 152 C62 124 44 106 44 84 c0-17 14-27 28-27 11 0 20 6 28 17 8-11 17-17 28-17 14 0 28 10 28 27 0 22-18 40-56 68z" fill={`url(#${gid}-ht)`} stroke={a2} strokeWidth="2.5" animate={{ scale: [1,1.06,1] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "100px 104px" }} />
      {/* Heart shine */}
      <ellipse cx="72" cy="78" rx="8" ry="5" fill="#fff" opacity="0.4" transform="rotate(-25 72 78)" />
      {/* Pulsing inner sparkles */}
      {[{x:80,y:92,d:0,s:1},{x:118,y:84,d:0.5,s:0.8},{x:100,y:116,d:1,s:1.2}].map((s,i)=>(
        <motion.g key={i} animate={{ scale: [0.8,1.5,0.8], opacity: [0.5,1,0.5] }} transition={{ duration: 2.2, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y-6*s.s} l${2*s.s} ${4*s.s} l${4*s.s} ${2*s.s} l-${4*s.s} ${2*s.s} l-${2*s.s} ${4*s.s} l-${2*s.s} -${4*s.s} l-${4*s.s} -${2*s.s} l${4*s.s} -${2*s.s}z`} fill={`url(#${gid}-sp)`} />
        </motion.g>
      ))}
      {/* Orbiting dots */}
      {[0,1,2,3,4,5].map(i => {
        const ang = (i * 60) * Math.PI / 180;
        const x = 100 + Math.cos(ang) * 54;
        const y = 104 + Math.sin(ang) * 54;
        return <motion.circle key={i} cx={x} cy={y} r="3.5" fill={a2} stroke="#fff" strokeWidth="0.5" animate={{ opacity: [0.3,0.9,0.3], scale: [0.8,1.3,0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.15 }} style={{ transformOrigin: `${x}px ${y}px` }} />;
      })}
      {/* Floating tiny hearts */}
      {[{x:45,y:60,d:0},{x:155,y:130,d:0.8}].map((h,i)=>(
        <motion.path key={i} d={`M${h.x} ${h.y} c-3-5-10-4-10 2 0 5 7 9 10 12 3-3 10-7 10-12 0-6-7-7-10-2z`} fill={a2} opacity="0.5" animate={{ y: [0,-8,0], opacity: [0.2,0.6,0.2] }} transition={{ duration: 3, repeat: Infinity, delay: h.d }} />
      ))}
    </>),
    preferences: (<>
      <defs>
        <linearGradient id={`${gid}-gl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.8" /><stop offset="100%" stopColor={a} stopOpacity="0.4" /></linearGradient>
        <radialGradient id={`${gid}-pn`} cx="0.5" cy="0.3"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor={a2} /></radialGradient>
        <filter id={`${gid}-glow`}><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Globe glow */}
      <motion.circle cx="100" cy="104" r="46" fill={a2} opacity="0.08" filter={`url(#${gid}-glow)`} animate={{ scale: [1,1.15,1] }} transition={{ duration: 4, repeat: Infinity }} style={{ transformOrigin: "100px 104px" }} />
      {/* Rotating globe */}
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 104px" }}>
        {/* Globe body */}
        <circle cx="100" cy="104" r="40" fill={`url(#${gid}-gl)`} stroke={a2} strokeWidth="2.5" />
        {/* Meridian lines */}
        <ellipse cx="100" cy="104" rx="16" ry="40" fill="none" stroke={a2} strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="100" cy="104" rx="30" ry="40" fill="none" stroke={a2} strokeWidth="1" opacity="0.3" />
        {/* Equator and parallels */}
        <path d="M60 104 h80" fill="none" stroke={a2} strokeWidth="2" opacity="0.6" />
        <path d="M68 84 h64 M68 124 h64" fill="none" stroke={a2} strokeWidth="1.5" opacity="0.4" />
        {/* Continent dots */}
        {[{x:78,y:92,d:0},{x:95,y:88,d:0.3},{x:110,y:100,d:0.6},{x:85,y:115,d:0.9},{x:118,y:118,d:1.2}].map((c,i)=>(
          <motion.circle key={i} cx={c.x} cy={c.y} r="3" fill={a2} animate={{ opacity: [0.4,0.9,0.4] }} transition={{ duration: 2, repeat: Infinity, delay: c.d }} />
        ))}
      </motion.g>
      {/* Globe stand */}
      <path d="M70 148 q30 8 60 0" fill="none" stroke={a2} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <line x1="100" y1="144" x2="100" y2="150" stroke={a2} strokeWidth="2" opacity="0.5" />
      {/* Location pin with bounce */}
      <motion.g animate={{ y: [0,-10,0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
        {/* Pin glow */}
        <motion.circle cx="134" cy="52" r="16" fill={a2} opacity="0.15" animate={{ scale: [1,1.3,1] }} transition={{ duration: 2, repeat: Infinity }} style={{ transformOrigin: "134px 52px" }} />
        {/* Pin body */}
        <motion.path d="M134 38 a14 14 0 1 0 -28 0 c0 12 14 28 14 28s14-16 14-28z" fill={`url(#${gid}-pn)`} stroke={a2} strokeWidth="2" animate={{ scale: [1,1.1,1] }} transition={{ duration: 2, repeat: Infinity }} style={{ transformOrigin: "134px 52px" }} />
        {/* Pin inner circle */}
        <circle cx="134" cy="52" r="5" fill={a} />
        {/* Pin shadow pulse */}
        <motion.ellipse cx="134" cy="72" rx="8" ry="2" fill={a} opacity="0.3" animate={{ rx: [6,10,6], opacity: [0.3,0.1,0.3] }} transition={{ duration: 2.5, repeat: Infinity }} />
      </motion.g>
      {/* Sparkles */}
      {[{x:40,y:80,d:0},{x:50,y:140,d:0.6},{x:165,y:120,d:0.3}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill="#fff" animate={{ scale: [0,1.3,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
    health: (<>
      <defs>
        <linearGradient id={`${gid}-sh`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={a2} stopOpacity="0.9" /><stop offset="100%" stopColor={a} stopOpacity="0.4" /></linearGradient>
        <filter id={`${gid}-glow`}><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <motion.circle cx="100" cy="100" r="62" fill={a} opacity="0.06" animate={{ scale: [1,1.12,1] }} transition={{ duration: 4, repeat: Infinity }} />
      {/* Shield glow */}
      <motion.path d="M100 42 l50 20 v38 c0 34-26 52-50 60-24-8-50-26-50-60V62z" fill={a2} opacity="0.1" filter={`url(#${gid}-glow)`} animate={{ scale: [1,1.06,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ transformOrigin: "100px 100px" }} />
      {/* Shield body */}
      <motion.g animate={{ y: [0,-5,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M100 44 l48 19 v36 c0 32-24 49-48 57-24-8-48-25-48-57V63z" fill={`url(#${gid}-sh)`} stroke={a2} strokeWidth="2.5" />
        {/* Shield inner border */}
        <path d="M100 50 l42 17 v32 c0 28-22 43-42 50-20-7-42-22-42-50V67z" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
        {/* Animated heartbeat line */}
        <motion.path d="M58 104 h14 l6-14 l9 28 l7-14 h12 l5-8 l7 16 h12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1,1], opacity: [0.3,1,0.3] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
        {/* Heartbeat glow line */}
        <motion.path d="M58 104 h14 l6-14 l9 28 l7-14 h12 l5-8 l7 16 h12" fill="none" stroke={a2} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" initial={{ pathLength: 0 }} animate={{ pathLength: [0,1,1] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
        {/* Medical cross */}
        <motion.g animate={{ scale: [1,1.12,1], rotate: [0,5,0] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ transformOrigin: "100px 82px" }}>
          <rect x="95" y="72" width="10" height="22" rx="3" fill="#fff" opacity="0.9" />
          <rect x="89" y="78" width="22" height="10" rx="3" fill="#fff" opacity="0.9" />
          <rect x="95" y="72" width="10" height="22" rx="3" fill={a2} opacity="0.3" />
          <rect x="89" y="78" width="22" height="10" rx="3" fill={a2} opacity="0.3" />
        </motion.g>
      </motion.g>
      {/* Floating leaves with glow */}
      {[{x:38,y:55,d:0,s:1},{x:162,y:60,d:0.5,s:0.8},{x:45,y:145,d:0.8,s:0.7}].map((s,i)=>(
        <motion.g key={i} animate={{ y: [0,-8,0], rotate: [-8,8,-8] }} transition={{ duration: 3.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y} q-${10*s.s} -${5*s.s} -${10*s.s} -${15*s.s} q${10*s.s} ${3*s.s} ${10*s.s} ${15*s.s}z`} fill={a2} opacity="0.5" stroke={a2} strokeWidth="1" />
          <path d={`M${s.x} ${s.y} q-${10*s.s} -${5*s.s} -${10*s.s} -${15*s.s}`} fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        </motion.g>
      ))}
      {/* Sparkles */}
      {[{x:155,y:130,d:0.3},{x:60,y:100,d:0.7}].map((s,i)=>(
        <motion.path key={i} d={`M${s.x} ${s.y} l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z`} fill="#fff" animate={{ scale: [0,1.3,0], rotate: [0,180,360] }} transition={{ duration: 2.5, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y+4}px` }} />
      ))}
    </>),
  };
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${scene.gradient}`}>
      <motion.div className="absolute w-32 h-32 rounded-full blur-2xl"
        style={{ background: a, top: "10%", left: "15%" }}
        animate={{ y: [0,-20,0], x: [0,10,0], opacity: [0.15,0.25,0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-24 h-24 rounded-full blur-2xl"
        style={{ background: a, bottom: "20%", right: "10%" }}
        animate={{ y: [0,15,0], x: [0,-10,0], opacity: [0.1,0.2,0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      <div className="absolute inset-0 flex items-center justify-center">
        {[0,1,2].map(i => (
          <motion.div key={i} className="absolute rounded-full border-2"
            style={{ borderColor: `${a}40` }}
            initial={{ width: 80+i*40, height: 80+i*40, opacity: 0.6 }}
            animate={{ width: [80+i*40,120+i*40,80+i*40], height: [80+i*40,120+i*40,80+i*40], opacity: [0.6,0.2,0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i*0.5 }} />
        ))}
        <svg key={step} viewBox="0 0 200 200" className="w-[68%] max-w-[230px] aspect-square"
          style={{ filter: `drop-shadow(0 0 18px ${a}66)` }}>
          {illustrations[scene.scene] || illustrations.account}
        </svg>
      </div>
    </div>
  );
}
const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "EN", native: "English" },
  { code: "am", label: "አማ", native: "አማርኛ" },
  { code: "ar", label: "ع", native: "العربية" },
];
function LangSwitcher({ dark = false, small = false }: { dark?: boolean; small?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-0.5">
      {LANGS.map((l, i) => (
        <div key={l.code} className="flex items-center">
          {i > 0 && (
            <span className={dark ? "text-white/15" : "text-charcoal-300 dark:text-charcoal-600"}>|</span>
          )}
          <button
            onClick={() => setLang(l.code)}
            className={`${small ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-sm"} font-medium rounded-md transition-all duration-150 ${
              lang === l.code
                ? "text-accent font-bold"
                : dark
                  ? "text-white/50 hover:text-white/80"
                  : "text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white"
            }`}
          >
            {l.label}
          </button>
        </div>
      ))}
    </div>
  );
}
export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string[]>([]);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const LS_DATA = "ethio-nikah-register-data";
  const LS_STEP = "ethio-nikah-register-step";
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const installedHandler = () => {
      setAppInstalled(true);
      setShowInstallBanner(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setAppInstalled(true);
      setShowInstallBanner(false);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem(LS_STEP);
      const savedData = localStorage.getItem(LS_DATA);
      if (savedStep) { const s = parseInt(savedStep); if (s >= 1 && s <= steps.length) setCurrentStep(s); }
      if (savedData) setFormData(JSON.parse(savedData));
    } catch { /* ignore corrupt data */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(formData));
      localStorage.setItem(LS_STEP, currentStep.toString());
    } catch { /* storage full */ }
  }, [formData, currentStep]);
  const updateFormData = (stepData: any) => {
    setFormData((prev: any) => ({ ...prev, ...stepData }));
  };
  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  const touchStartX = useRef(0);
  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: any) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextStep();
      else prevStep();
    }
  };
  const handleSubmit = async (payload?: any): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError([]);
    try {
      const dataToSubmit = payload || formData;
      await authService.register(dataToSubmit);
      localStorage.removeItem(LS_DATA);
      localStorage.removeItem(LS_STEP);
      setRegistered(true);
      return true;
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error === "Email or phone already registered" || data?.error?.includes("already registered")) {
        setSubmitError(["Account already exists. Please login."]);
        localStorage.removeItem(LS_DATA);
        localStorage.removeItem(LS_STEP);
        setTimeout(() => router.push("/login"), 2000);
        return false;
      }
      if (data?.errors && Array.isArray(data.errors)) {
        const msgs = data.errors.map((e: any) => `${e.path?.[0] ? e.path[0] + ": " : ""}${e.message}`);
        setSubmitError(msgs);
      } else if (data?.error) {
        setSubmitError([data.error]);
      } else {
        setSubmitError([t("register.failed")]);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const validate = (step: number, data: any): string | null => {
    switch (step) {
      case 1:
        if (!data.firstName?.trim()) return t("register.step1.errFirstName");
        if (!data.lastName?.trim()) return t("register.step1.errLastName");
        if (!data.email?.trim()) return t("register.step1.errEmail");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return t("register.step1.errEmailInvalid");
        if (!data.phone?.trim()) return t("register.step1.errPhone");
        if (!/^(09\d{8}|\+2519\d{8})$/.test(data.phone.replace(/[\s\-()]/g, ""))) return t("register.step1.errPhoneInvalid");
        if (!data.password) return t("register.step1.errPassword");
        if (data.password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(data.password)) return "Password must include at least one uppercase letter";
        if (!/[a-z]/.test(data.password)) return "Password must include at least one lowercase letter";
        if (!/[0-9]/.test(data.password)) return "Password must include at least one number";
        if (!/[^A-Za-z0-9]/.test(data.password)) return "Password must include at least one symbol (e.g. !@#$%)";
        return null;
      case 2:
        if (!data.gender) return t("register.step2.errGender");
        if (!data.dateOfBirth) return t("register.step2.errDob");
        { const b = new Date(data.dateOfBirth), td = new Date(); let a = td.getFullYear() - b.getFullYear(); const m = td.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && td.getDate() < b.getDate())) a--; if (a < 18) return t("register.step2.errAge"); }
        if (!data.nationality?.trim()) return t("register.step2.errNationality");
        if (data.nationality === "Other" && !data.nationalityOther?.trim()) return t("register.step2.errNationalitySpecify");
        if (!data.country?.trim()) return t("register.step2.errCountry");
        if (data.country === "Other" && !data.countryOther?.trim()) return t("register.step2.errCountrySpecify");
        if (!data.city?.trim()) return t("register.step2.errCity");
        if (data.city === "Other" && !data.cityOther?.trim()) return t("register.step2.errCitySpecify");
        if (!data.maritalStatus) return t("register.step2.errMaritalStatus");
        return null;
      case 3:
        if (!data.religiousCommitment) return t("register.step3.errReligiousCommitment");
        if (!data.prayerHabits) return t("register.step3.errPrayerHabits");
        if (!data.quranReadingFrequency) return t("register.step3.errQuranFrequency");
        return null;
      case 4:
        if (!data.educationLevel) return t("register.step4.errEducation");
        if (!data.occupation?.trim()) return t("register.step4.errOccupation");
        if (!data.employmentStatus) return t("register.step4.errEmployment");
        return null;
      case 5:
        if (!data.reasonForJoining) return t("register.step5.errReason");
        if (!data.desiredMarriageTimeline) return t("register.step5.errTimeline");
        if (!data.childrenPreference) return t("register.step5.errChildren");
        return null;
      case 6:
        if (!data.motherTongue?.trim()) return t("register.step6.errMotherTongue");
        if (!data.familyInvolvement) return t("register.step6.errFamilyInvolvement");
        return null;
      case 7:
        if (!data.smokingHabits) return t("register.step7.errSmoking");
        if (!data.khatUsage) return t("register.step7.errKhat");
        if (!data.exerciseHabits) return t("register.step7.errExercise");
        if (!data.livingPreference) return t("register.step7.errLiving");
        return null;
      case 8:
        if (!data.selfDescription?.trim()) return t("register.step8.errSelfDescription");
        if (!data.interests?.trim()) return t("register.step8.errInterests");
        return null;
      case 9:
        if (!data.preferredAgeMin) return t("register.step9.errAgeMin");
        if (!data.preferredAgeMax) return t("register.step9.errAgeMax");
        if (parseInt(data.preferredAgeMin) < 18) return t("register.step9.errAgeMin18");
        if (parseInt(data.preferredAgeMax) > 120) return t("register.step9.errAgeMax120");
        if (parseInt(data.preferredAgeMax) < parseInt(data.preferredAgeMin)) return t("register.step9.errAgeRange");
        if (!data.preferredMaritalStatus) return t("register.step9.errMaritalStatus");
        if (!data.preferredEducationLevel) return t("register.step9.errEducationLevel");
        if (!data.preferredLocation?.trim()) return t("register.step9.errLocation");
        if (!data.waliInvolvement) return t("register.step9.errWali");
        if (data.gender !== "male" && !data.polygamyPreference) return t("register.step9.errPolygamy");
        if (!data.genderInteraction) return t("register.step9.errGenderInteraction");
        return null;
      case 10:
        if (data.dwarfismStatus === "other" && !data.dwarfismDetails?.trim()) return t("register.step10.errDwarfismDetails");
        return null;
      default: return null;
    }
  };
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
        <div className="max-w-md w-full text-center">
          <Image src="/images/logo.svg" alt="Ethio Nikah" width={80} height={80} className="mx-auto mb-6 rounded-2xl border-2 border-accent ring-2 ring-[#121212]" />
          <div className="signup-card p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">{t("register.congratulations")}</h2>
            <p className="text-[#9CA3AF] mb-6">{t("register.successMessage")}</p>
            <Link href="/login" className="inline-flex items-center justify-center w-full px-6 py-4 signup-btn-gold rounded-2xl font-bold transition-all">
              {t("register.signInNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:overflow-hidden overflow-x-hidden" style={{ backgroundColor: "#121212" }}>
      {/* Desktop left panel */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] lg:shrink-0 flex-col items-center justify-center p-12 overflow-hidden relative bg-[#121212]">
        <div className={`absolute inset-0 bg-gradient-to-br ${stepScenes[currentStep - 1]?.gradient || stepScenes[0].gradient}`} />
        {/* Subtle gold orb */}
        <div className="absolute top-1/4 right-0 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }} />
        {/* Language switcher — top right */}
        <div className="absolute top-6 right-6 z-20">
          <LangSwitcher dark />
        </div>
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <Image src="/images/logo.svg" alt="Ethio Nikah" width={56} height={56} className="rounded-xl border-2 border-accent ring-2 ring-white/20 shadow-xl" />
            <span className="font-display font-bold text-2xl text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
          </Link>
          {/* Animated image frame — portrait, elegant */}
          <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-2xl mb-8">
            <div key={currentStep} className="absolute inset-0">
              <AnimatedStepScene step={currentStep} />
            </div>
            {/* Step icon badge */}
            <div className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-lg">
              {(() => { const SI = stepScenes[currentStep - 1]?.icon || Heart; return <SI className="w-5 h-5 text-white" />; })()}
            </div>
            {/* Step label overlay */}
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Step {currentStep} of {steps.length}</p>
              <p className="text-white text-xl font-display font-semibold drop-shadow-lg">{t("register.sideStep" + currentStep)}</p>
              <p className="text-white/60 text-sm mt-1 leading-snug">{stepScenes[currentStep - 1]?.caption}</p>
            </div>
          </div>
          {/* Minimal progress indicator */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-400 ${i + 1 === currentStep ? "w-8 bg-accent" : i < currentStep ? "w-2 bg-accent/60" : "w-2 bg-white/20"}`} />
            ))}
          </div>
          {/* Quranic quote */}
          <motion.div
            key={`desktop-quote-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <p className="text-white/40 text-sm italic">
              {currentStep <= 2 && "\"And among His signs is that He created for you mates from yourselves\""}
              {currentStep > 2 && currentStep <= 5 && "\"That you may find tranquility in them\""}
              {currentStep > 5 && currentStep <= 8 && "\"And He placed between you affection and mercy\""}
              {currentStep > 8 && "\"Indeed in that are signs for a people who reflect\""}
            </p>
            <p className="text-accent/40 text-xs mt-1.5">— Quran 30:21</p>
          </motion.div>
        </div>
      </div>
      {/* Wave divider between panels */}
      <div className="hidden lg:block w-20 xl:w-24 shrink-0 relative overflow-hidden" style={{ backgroundColor: "#121212" }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 80 1000" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1A1A1A" />
              <stop offset="100%" stopColor="#121212" />
            </linearGradient>
          </defs>
          <path d="M0,0 L40,0 C20,80 60,160 40,240 C20,320 60,400 40,480 C20,560 60,640 40,720 C20,800 60,880 40,960 C30,980 50,990 40,1000 L0,1000 Z" fill="url(#wave-grad)" />
          <path d="M40,0 C20,80 60,160 40,240 C20,320 60,400 40,480 C20,560 60,640 40,720 C20,800 60,880 40,960 C30,980 50,990 40,1000" stroke="#D4AF37" strokeWidth="1" opacity="0.3" fill="none" />
        </svg>
      </div>
      {/* Mobile dark header */}
      <div className="lg:hidden px-4 py-4 flex items-center justify-between" style={{ backgroundColor: "#1A1A1A" }}>
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/images/logo.svg" alt="Ethio Nikah" width={32} height={32} className="rounded-lg border-2 border-accent ring-1 ring-white/10" />
          <span className="font-display font-bold text-sm text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
        </Link>
        <LangSwitcher dark small />
      </div>
      {/* Install App banner — mobile */}
      {showInstallBanner && installPrompt && !appInstalled && (
        <div className="lg:hidden bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border-b border-[#D4AF37]/20 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Install EthioNikah App</p>
              <p className="text-[11px] text-white/50 truncate">Quick access from your home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0c0a1a] bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Install App banner — desktop */}
      {showInstallBanner && installPrompt && !appInstalled && (
        <div className="hidden lg:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl px-4 py-2 items-center justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Download className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <p className="text-sm font-semibold text-white whitespace-nowrap">Install EthioNikah App</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallApp}
              className="px-3 py-1 rounded-lg text-xs font-bold text-[#0c0a1a] bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center px-4 py-6 lg:py-12 lg:overflow-y-auto" style={{ backgroundColor: "#121212" }}>
        <div className="w-full max-w-2xl mx-auto min-w-0">
          <div className="hidden lg:block text-center mb-8">
            <Link href="/" className="hidden lg:inline-flex items-center gap-2 mb-8">
              <Image src="/images/logo.svg" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-[#121212]" />
              <span className="font-display font-bold text-xl text-white [-webkit-text-stroke:0.5px_#D4AF37]">Ethio Nikah</span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-white mb-2">{t("register.title")}</h1>
            <p className="text-[#9CA3AF]">{t("register.step", { current: currentStep, total: steps.length, name: t("register.sideStep" + currentStep) })}</p>
          </div>
          <div className="signup-card p-5 sm:p-7 lg:p-8 min-w-0 overflow-hidden">
            {/* Mobile step title + progress */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-accent font-semibold uppercase tracking-wider">Step {currentStep} of {steps.length}</p>
                <span className="text-xs text-[#6B7280]">{currentStep}/{steps.length}</span>
              </div>
              <h2 className="text-lg font-display font-bold text-white mb-2.5">{t("register.sideStep" + currentStep)}</h2>
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentStep ? "bg-accent" : "bg-[#3A3A3A]"}`} />
                ))}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < currentStep ? "bg-accent" : "bg-[#3A3A3A]"}`} />
                ))}
              </div>
              <span className="text-sm text-[#9CA3AF]">{currentStep}/{steps.length}</span>
            </div>
            {currentStep === 1 && <AccountStep key="step-1" formData={formData} updateFormData={updateFormData} nextStep={nextStep} showPassword={showPassword} setShowPassword={setShowPassword} validate={validate} />}
            {currentStep === 2 && <BasicInfoStep key="step-2" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 3 && <ReligiousStep key="step-3" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 4 && <EducationStep key="step-4" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 5 && <IntentionsStep key="step-5" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 6 && <FamilyStep key="step-6" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 7 && <LifestyleStep key="step-7" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 8 && <PersonalityStep key="step-8" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 9 && <PreferencesStep key="step-9" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} validate={validate} />}
            {currentStep === 10 && <HealthStep key="step-10" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} validate={validate} submitError={submitError} clearSubmitError={() => setSubmitError([])} />}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-[#9CA3AF] text-xs sm:text-sm">
                {t("register.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-accent hover:text-accent-dark font-medium">{t("register.signIn")}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function AccountStep({ formData, updateFormData, nextStep, showPassword, setShowPassword, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === "phone") {
      let v = value.replace(/[^0-9+]/g, "").slice(0, 13);
      const plusCount = (v.match(/\+/g) || []).length;
      if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
      if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
      sanitized = v;
    } else if (name === "email") {
      sanitized = value.replace(/[^a-zA-Z0-9@.]/g, "");
    }
    setLocalData((prev: any) => ({ ...prev, [name]: sanitized }));
  };
  const handleNext = () => {
    const err = validate(1, localData);
    if (err) { setError(err); return; }
    if (!acceptedTerms) { setError(t("register.step1.errTerms")); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div key="step-1" className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step1.title")}</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <div>
          <label className="signup-label">{t("register.step1.fullName")}</label>
          <input name="firstName" type="text" placeholder={t("register.step1.firstNamePlaceholder")} value={localData.firstName || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
        </div>
        <div>
          <label className="signup-label">{t("register.step1.lastName")}</label>
          <input name="lastName" type="text" placeholder={t("register.step1.lastNamePlaceholder")} value={localData.lastName || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step1.email")}</label>
        <input name="email" type="email" placeholder={t("register.step1.emailPlaceholder")} value={localData.email || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div>
        <label className="signup-label">{t("register.step1.phone")}</label>
        <input name="phone" type="tel" placeholder={t("register.step1.phonePlaceholder")} value={localData.phone || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div className="relative">
        <label className="signup-label">{t("register.step1.password")}</label>
        <input name="password" type={showPassword ? "text" : "password"} placeholder={t("register.step1.passwordPlaceholder")} value={localData.password || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[42px] text-[#9CA3AF] hover:text-[#D4AF37] transition-colors">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        {localData.password && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${localData.password.length >= 8 ? "bg-green-900/30 text-green-400" : "bg-[#232323] text-[#6B7280]"}`}>
              8+ chars
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[A-Z]/.test(localData.password) ? "bg-green-900/30 text-green-400" : "bg-[#232323] text-[#6B7280]"}`}>
              Uppercase
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[a-z]/.test(localData.password) ? "bg-green-900/30 text-green-400" : "bg-[#232323] text-[#6B7280]"}`}>
              Lowercase
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[0-9]/.test(localData.password) ? "bg-green-900/30 text-green-400" : "bg-[#232323] text-[#6B7280]"}`}>
              Number
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[^A-Za-z0-9]/.test(localData.password) ? "bg-green-900/30 text-green-400" : "bg-[#232323] text-[#6B7280]"}`}>
              Symbol
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="rounded border-[#3A3A3A] bg-[#232323] text-[#D4AF37] focus:ring-[#D4AF37]/30" />
        <label htmlFor="terms" className="text-sm text-[#D1D5DB]">{t("register.step1.agreeTerms")}</label>
      </div>
      <Button onClick={handleNext} variant="primary" className="w-full" size="lg">
        {t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
function BasicInfoStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const initDob = formData.dateOfBirth ? formData.dateOfBirth.split("-") : [];
  const [localData, setLocalData] = useState({
    ...formData,
    dobDay: initDob[2] || "",
    dobMonth: initDob[1] || "",
    dobYear: initDob[0] || "",
  });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === "waliPhone") {
      let v = value.replace(/[^0-9+]/g, "").slice(0, 13);
      const plusCount = (v.match(/\+/g) || []).length;
      if (plusCount > 1) v = v.replace(/\+/g, "") + "+";
      if (v.includes("+") && !v.startsWith("+")) v = v.replace(/\+/g, "") + "+";
      sanitized = v;
    }
    setLocalData((prev: any) => ({ ...prev, [name]: sanitized }));
  };
  const handleDOB = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => {
      const next = { ...prev, [name]: value };
      if (next.dobDay && next.dobMonth && next.dobYear) {
        next.dateOfBirth = `${next.dobYear}-${next.dobMonth}-${next.dobDay}`;
      }
      return next;
    });
  };
  const handleSelect = (field: string) => (e: any) => {
    setLocalData((prev: any) => ({ ...prev, [field]: e.target.value }));
  };
  const handleOther = (field: string) => (e: any) => {
    setLocalData((prev: any) => ({ ...prev, [field + "Other"]: e.target.value }));
  };
  const handleNext = () => {
    const merged = { ...localData };
    if (merged.nationality === "Other") merged.nationality = merged.nationalityOther?.trim() || "Other";
    if (merged.country === "Other") merged.country = merged.countryOther?.trim() || "Other";
    if (merged.city === "Other") merged.city = merged.cityOther?.trim() || "Other";
    const err = validate(2, merged);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(merged);
    nextStep();
  };
  const sc = "min-w-0 w-full px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none";
  const nationalities = [
    "Afghan", "Albanian", "Algerian", "American", "Angolan", "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
    "Bahraini", "Bangladeshi", "Belarusian", "Belgian", "Beninese", "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British", "Bulgarian", "Burkinabe", "Burundian",
    "Cambodian", "Cameroonian", "Canadian", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech",
    "Danish", "Djiboutian", "Dominican", "Dutch",
    "Ecuadorian", "Egyptian", "Emirati", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian",
    "Finnish", "French",
    "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Guatemalan", "Guinean",
    "Haitian", "Honduran", "Hungarian",
    "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Italian", "Ivorian",
    "Jamaican", "Japanese", "Jordanian",
    "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz",
    "Lao", "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian", "Luxembourgish",
    "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Myanmar",
    "Namibian", "Nepalese", "New Zealander", "Nicaraguan", "Nigerien", "Nigerian", "North Korean", "North Macedonian", "Norwegian",
    "Omani",
    "Pakistani", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Filipino", "Polish", "Portuguese",
    "Qatari",
    "Romanian", "Russian", "Rwandan",
    "Salvadoran", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean", "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish", "Swiss", "Syrian",
    "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian", "Turkish", "Turkmen",
    "Ugandan", "Ukrainian", "Uruguayan", "Uzbek",
    "Venezuelan", "Vietnamese",
    "Yemeni",
    "Zambian", "Zimbabwean"
  ];
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahrain", "Bangladesh", "Belarus", "Belgium", "Benin", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominican Republic",
    "Ecuador", "Egypt", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
    "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guinea-Bissau",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Liberia", "Libya", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];
  const allNat = [...new Set(nationalities)].sort((a, b) => {
    if (a === "Ethiopian") return -1; if (b === "Ethiopian") return 1;
    return a.localeCompare(b);
  });
  const allCountries = [...new Set(countries)].sort((a, b) => {
    if (a === "Ethiopia") return -1; if (b === "Ethiopia") return 1;
    return a.localeCompare(b);
  });
  const cityMap: Record<string, string[]> = {
    "Ethiopia": ["Adama (Nazret)", "Addis Ababa", "Adigrat", "Alamata", "Ambo", "Arba Minch", "Assosa", "Axum", "Bahir Dar", "Bishoftu", "Bonga", "Debre Birhan", "Debre Markos", "Debre Tabor", "Dessie", "Dila", "Dire Dawa", "Gambela", "Gode", "Gondar", "Harar", "Hawassa", "Hosaena", "Jijiga", "Jimma", "Jinka", "Konso", "Korem", "Lalibela", "Maichew", "Mekelle", "Mizan Teferi", "Mojo", "Negele Borana", "Nekemte", "Sawla", "Semera", "Shashamane", "Shire", "Sodo", "Weldiya", "Wolkite", "Yabelo"],
    "Eritrea": ["Asmara", "Keren", "Massawa", "Mendefera", "Assab", "Barentu", "Tessenei", "Dekemhare", "Nakfa", "Adi Quala"],
    "Somalia": ["Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Bosaso", "Galkayo", "Merca", "Berbera", "Burao", "Jowhar", "Beledweyne", "Qardho"],
    "Djibouti": ["Djibouti City", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil", "Arta"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Malindi", "Nyeri", "Thika", "Machakos", "Garissa"],
    "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Nyala", "Kassala", "El Obeid", "Gedaref", "Wad Madani"],
    "South Sudan": ["Juba", "Malakal", "Wau", "Bor", "Yei", "Rumbek", "Torit", "Bentiu"],
    "Egypt": ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Sharm el-Sheikh", "Port Said", "Suez", "Tanta", "Mansoura"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Kaduna", "Benin City", "Enugu", "Jos", "Zaria"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "Soweto"],
    "Ghana": ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Cape Coast", "Tema"],
    "Morocco": ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda"],
    "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Setif", "Tlemcen"],
    "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes"],
    "Libya": ["Tripoli", "Benghazi", "Misrata", "Al Bayda", "Tobruk", "Sabha"],
    "Tanzania": ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya", "Zanzibar City", "Tanga"],
    "Uganda": ["Kampala", "Gulu", "Lira", "Mbarara", "Jinja", "Entebbe", "Mbale"],
    "Rwanda": ["Kigali", "Butare", "Gisenyi", "Ruhengeri", "Cyangugu"],
    "Burundi": ["Bujumbura", "Gitega", "Ngozi", "Ruyigi"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk", "Abha", "Yanbu"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Al Ain"],
    "Qatar": ["Doha", "Al Wakrah", "Al Khor", "Mesaieed"],
    "Kuwait": ["Kuwait City", "Al Ahmadi", "Hawalli", "Farwaniya", "Salmiya"],
    "Oman": ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur"],
    "Bahrain": ["Manama", "Riffa", "Muharraq", "Isa Town", "Hamad Town"],
    "Jordan": ["Amman", "Zarqa", "Irbid", "Aqaba", "Madaba", "Salt"],
    "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre", "Baalbek", "Jounieh"],
    "Syria": ["Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Raqqa"],
    "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Kirkuk", "Najaf", "Karbala"],
    "Yemen": ["Sana'a", "Aden", "Taiz", "Hudaydah", "Mukalla", "Ibb"],
    "Palestine": ["Jerusalem", "Ramallah", "Gaza City", "Hebron", "Nablus", "Bethlehem", "Jenin"],
    "Iran": ["Tehran", "Isfahan", "Mashhad", "Tabriz", "Shiraz", "Qom", "Ahvaz", "Kermanshah"],
    "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Gaziantep", "Mersin"],
    "Pakistan": ["Islamabad", "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Quetta"],
    "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur"],
    "India": ["New Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Lucknow", "Jaipur"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Yogyakarta", "Makassar", "Palembang"],
    "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru", "Kota Kinabalu", "Kuching", "Ipoh", "Malacca"],
    "Philippines": ["Manila", "Quezon City", "Cebu City", "Davao City", "Zamboanga City", "Baguio"],
    "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Hong Kong"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Leeds", "Edinburgh", "Sheffield", "Bristol"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf", "Leipzig"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence", "Bologna", "Venice"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao", "Granada"],
    "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Maastricht"],
    "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne"],
    "Sweden": ["Stockholm", "Gothenburg", "Malmo", "Uppsala", "Linkoping"],
    "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromso"],
    "Russia": ["Moscow", "Saint Petersburg", "Kazan", "Sochi", "Novosibirsk", "Yekaterinburg"],
    "Ukraine": ["Kyiv", "Lviv", "Odessa", "Kharkiv", "Dnipro"],
    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Washington DC", "Boston", "Detroit", "Seattle", "Miami", "Atlanta"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Edmonton", "Winnipeg", "Quebec City"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"],
    "Afghanistan": ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Kunduz"],
    "Somaliland": ["Hargeisa", "Burao", "Berbera", "Erigavo", "Las Anod"],
    "Kazakhstan": ["Nur-Sultan", "Almaty", "Shymkent", "Karaganda", "Aktobe"],
    "Uzbekistan": ["Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan"],
    "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"],
    "Ireland": ["Dublin", "Cork", "Galway", "Limerick"],
    "Austria": ["Vienna", "Salzburg", "Graz", "Innsbruck", "Linz"],
    "Belgium": ["Brussels", "Antwerp", "Ghent", "Bruges", "Liege"],
    "Denmark": ["Copenhagen", "Aarhus", "Odense", "Aalborg"],
    "Finland": ["Helsinki", "Tampere", "Turku", "Espoo"],
    "Poland": ["Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan"],
    "Czech Republic": ["Prague", "Brno", "Ostrava", "Plzen"],
    "Portugal": ["Lisbon", "Porto", "Braga", "Faro", "Coimbra"],
    "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"],
    "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Krabi"],
    "Singapore": ["Singapore"],
    "Brazil": ["Brasilia", "Rio de Janeiro", "Sao Paulo", "Salvador", "Fortaleza", "Recife"],
    "Argentina": ["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "La Plata"],
    "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Cancun", "Tijuana", "Puebla"],
  };
  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step2.title")}</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step2.gender")}</label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
          {["male", "female"].map(g => (
            <label key={g} className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-[#3A3A3A] cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 has-[:checked]:signup-seg-active has-[:checked]:border-[#D4AF37] signup-seg-inactive">
              <input type="radio" name="gender" value={g} checked={localData.gender === g} onChange={handleChange} className="sr-only" />
              <span className="text-sm font-medium capitalize">{g === "male" ? t("register.step2.male") : t("register.step2.female")}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step2.dob")}</label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 min-w-0">
          <select name="dobDay" value={localData.dobDay || ""} onChange={handleDOB} className={`${sc} min-w-0`}>
            <option value="">{t("register.step2.day")}</option>
            {Array.from({length: 31}, (_, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>
            ))}
          </select>
          <select name="dobMonth" value={localData.dobMonth || ""} onChange={handleDOB} className={`${sc} min-w-0`}>
            <option value="">{t("register.step2.month")}</option>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((n, i) => (
              <option key={i+1} value={String(i+1).padStart(2,"0")}>{t("months." + n.toLowerCase())}</option>
            ))}
          </select>
          <select name="dobYear" value={localData.dobYear || ""} onChange={handleDOB} className={`${sc} min-w-0`}>
            <option value="">{t("register.step2.year")}</option>
            {Array.from({length: 83}, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step2.nationality")}</label>
        <select name="nationality" value={localData.nationality === "Other" ? "Other" : localData.nationality || ""} onChange={handleSelect("nationality")} className={sc}>
          <option value="">{t("register.step2.selectNationality")}</option>
          {allNat.map(n => <option key={n} value={n}>{n}</option>)}
          <option value="Other">{t("common.other")}</option>
        </select>
        {localData.nationality === "Other" && (
          <input name="nationalityOther" placeholder={t("register.step2.errNationalitySpecify")} value={localData.nationalityOther || ""} onChange={handleOther("nationality")} className={[sc, "mt-2"].join(" ")} />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <div>
          <label className="signup-label">{t("register.step2.country")}</label>
          <select name="country" value={localData.country === "Other" ? "Other" : localData.country || ""} onChange={handleSelect("country")} className={sc}>
            <option value="">{t("register.step2.selectCountry")}</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Other">{t("common.other")}</option>
          </select>
          {localData.country === "Other" && (
            <input name="countryOther" placeholder={t("register.step2.errCountrySpecify")} value={localData.countryOther || ""} onChange={handleOther("country")} className={[sc, "mt-2"].join(" ")} />
          )}
        </div>
        <div>
          <label className="signup-label">{t("register.step2.city")}</label>
          {(() => {
            const countryCities = localData.country && localData.country !== "Other" ? cityMap[localData.country] : null;
            return (
              <>
                <select name="city" value={localData.city === "Other" ? "Other" : localData.city || ""} onChange={handleSelect("city")} className={sc}>
                  <option value="">
                    {!localData.country ? t("register.step2.selectCountryFirst") : countryCities ? t("register.step2.selectCity") : t("register.step2.noCities")}
                  </option>
                  {countryCities?.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">{t("common.other")}</option>
                </select>
                {localData.city === "Other" && (
                  <input name="cityOther" placeholder={t("register.step2.errCitySpecify")} value={localData.cityOther || ""} onChange={handleOther("city")} className={[sc, "mt-2"].join(" ")} />
                )}
              </>
            );
          })()}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <div>
          <label className="signup-label">{t("register.step2.height")}</label>
          <input name="height" type="number" placeholder={t("register.step2.heightPlaceholder")} value={localData.height || ""} onChange={handleChange} className={sc} />
        </div>
        <div>
          <label className="signup-label">{t("register.step2.weight")}</label>
          <select name="weight" value={localData.weight || ""} onChange={handleChange} className={sc}>
          <option value="">{t("register.step2.selectWeight")}</option>
          <option value="below_40">{t("register.step2.weightBelow40")}</option>
          <option value="41_50">{t("register.step2.weight41to50")}</option>
          <option value="51_60">{t("register.step2.weight51to60")}</option>
          <option value="61_70">{t("register.step2.weight61to70")}</option>
          <option value="71_80">{t("register.step2.weight71to80")}</option>
          <option value="above_80">{t("register.step2.weightAbove80")}</option>
        </select>
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step2.appearance")}</label>
        <select name="appearance" value={localData.appearance || ""} onChange={handleChange} className={sc}>
          <option value="">{t("register.step2.selectAppearance")}</option>
          <option value="light">{t("register.step2.appearanceLight")}</option>
          <option value="reddish_brown">{t("register.step2.appearanceReddishBrown")}</option>
          <option value="brown">{t("register.step2.appearanceBrown")}</option>
          <option value="black">{t("register.step2.appearanceBlack")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step2.maritalStatus")}</label>
          <select name="maritalStatus" value={localData.maritalStatus || ""} onChange={handleChange} className={sc}>
            <option value="">{t("register.step2.selectStatus")}</option>
            <option value="single_never">{t("register.step2.singleVirgin")}</option>
            <option value="single_previous">{t("register.step2.singlePrevious")}</option>
            {localData.gender === "male" && <option value="married">{t("register.step2.married")}</option>}
            <option value="divorced">{t("register.step2.divorced")}</option>
            <option value="widowed">{t("register.step2.widowed")}</option>
          </select>
      </div>
      {localData.maritalStatus !== "single_never" && (
        <div className="space-y-4 border-t border-[#2A2A2A] pt-4">
          <p className="text-sm font-semibold text-white">{t("register.step2.childrenInfo")}</p>
          <div>
            <label className="signup-label">{t("register.step2.hasChildren")}</label>
            <div className="flex gap-3">
              {["no", "yes", "prefer_not"].map((v) => (
                <label key={v} className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-[#3A3A3A] cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 has-[:checked]:signup-seg-active has-[:checked]:border-[#D4AF37] signup-seg-inactive">
                  <input type="radio" name="hasChildren" value={v} checked={localData.hasChildren === v} onChange={handleChange} className="sr-only" />
                  <span className="text-sm font-medium">{v === "prefer_not" ? t("register.step2.hasChildrenPreferNot") : v === "yes" ? t("register.step2.hasChildrenYes") : t("register.step2.hasChildrenNo")}</span>
                </label>
              ))}
            </div>
          </div>
          {localData.hasChildren === "yes" && (
            <>
              <div>
                <label className="signup-label">{t("register.step2.childrenCount")}</label>
                <select name="childrenCount" value={localData.childrenCount || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="1">{t("register.step2.childrenCount1")}</option>
                  <option value="2">{t("register.step2.childrenCount2")}</option>
                  <option value="3">{t("register.step2.childrenCount3")}</option>
                  <option value="4">{t("register.step2.childrenCount4")}</option>
                  <option value="5_or_more">{t("register.step2.childrenCount5")}</option>
                </select>
              </div>
              <div>
                <label className="signup-label">{t("register.step2.childrenCustody")}</label>
                <select name="childrenCustody" value={localData.childrenCustody || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="with_me">{t("register.step2.custodyWithMe")}</option>
                  <option value="with_other">{t("register.step2.custodyWithOther")}</option>
                  <option value="shared">{t("register.step2.custodyShared")}</option>
                  <option value="independent">{t("register.step2.custodyIndependent")}</option>
                  <option value="other">{t("register.step2.custodyOther")}</option>
                  <option value="prefer_not">{t("register.step2.custodyPreferNot")}</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
      {localData.gender === "female" && (
        <div className="space-y-4 border-t border-[#2A2A2A] pt-4">
          <p className="text-sm font-semibold text-white">{t("register.step2.waliInfo")}</p>
          <div>
            <label className="signup-label">{t("register.step2.hasWali")}</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-[#3A3A3A] cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 has-[:checked]:signup-seg-active has-[:checked]:border-[#D4AF37] signup-seg-inactive">
                <input type="radio" name="hasWali" value="yes" checked={localData.hasWali === "yes"} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium">{t("common.yes")}</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-[#3A3A3A] cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 has-[:checked]:signup-seg-active has-[:checked]:border-[#D4AF37] signup-seg-inactive">
                <input type="radio" name="hasWali" value="no" checked={localData.hasWali === "no"} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium">{t("common.no")}</span>
              </label>
            </div>
          </div>
          {localData.hasWali === "yes" && (
            <div className="space-y-3 pl-4 border-l-2 border-accent/30">
              <div>
                <label className="signup-label">{t("register.step2.waliName")}</label>
                <input name="waliName" type="text" placeholder={t("register.step2.waliNamePlaceholder")} value={localData.waliName || ""} onChange={handleChange} className={sc} />
              </div>
              <div>
                <label className="signup-label">{t("register.step2.waliPhone")}</label>
                <input name="waliPhone" type="tel" placeholder={t("register.step2.waliPhonePlaceholder")} value={localData.waliPhone || ""} onChange={handleChange} className={sc} />
              </div>
              <div>
                <label className="signup-label">{t("register.step2.waliRelation")}</label>
                <select name="waliRelation" value={localData.waliRelation || ""} onChange={handleChange} className={sc}>
                  <option value="">{t("common.select")}</option>
                  <option value="FATHER">{t("register.step2.waliFather")}</option>
                  <option value="GRANDFATHER">{t("register.step2.waliGrandfather")}</option>
                  <option value="BROTHER">{t("register.step2.waliBrother")}</option>
                  <option value="UNCLE">{t("register.step2.waliUncle")}</option>
                  <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                  <option value="OTHER">{t("register.step2.waliOther")}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function ReligiousStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(3, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step3.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step3.religiousCommitment")}</label>
        <select name="religiousCommitment" value={localData.religiousCommitment || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="practicing">{t("register.step3.practicing")}</option>
          <option value="moderately_practicing">{t("register.step3.moderatelyPracticing")}</option>
          <option value="traditional">{t("register.step3.traditional")}</option>
          <option value="seeking">{t("register.step3.seekingKnowledge")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step3.prayerHabits")}</label>
        <select name="prayerHabits" value={localData.prayerHabits || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="always">{t("register.step3.always5")}</option>
          <option value="usually">{t("register.step3.usually")}</option>
          <option value="sometimes">{t("register.step3.sometimes")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step3.quranFrequency")}</label>
        <select name="quranReadingFrequency" value={localData.quranReadingFrequency || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="daily">{t("register.step3.daily")}</option>
          <option value="weekly">{t("register.step3.weekly")}</option>
          <option value="monthly">{t("register.step3.monthly")}</option>
          <option value="occasionally">{t("register.step3.occasionally")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step3.islamicClasses")}</label>
        <select name="islamicClassesAttendance" value={localData.islamicClassesAttendance || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="regularly">{t("register.step3.regularly")}</option>
          <option value="sometimes">{t("register.step3.sometimes")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
          <option value="never">{t("register.step3.never")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step3.preferredCommitment")}</label>
        <select name="preferredReligiousCommitment" value={localData.preferredReligiousCommitment || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="practicing">{t("register.step3.practicing")}</option>
          <option value="moderately_practicing">{t("register.step3.moderatelyPracticing")}</option>
          <option value="traditional">{t("register.step3.traditional")}</option>
          <option value="any">{t("register.step3.any")}</option>
        </select>
      </div>
      <div className="space-y-3 pt-2 border-t border-[#2A2A2A]">
        <p className="text-sm font-semibold text-white">{t("register.step3.islamicTradition")}</p>
        <div>
          <label className="signup-label">{t("register.step3.islamicTraditionQuestion")}</label>
          <select name="islamicTradition" value={localData.islamicTradition || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
            <option value="">{t("common.select")}</option>
            <option value="sunni">{t("register.step3.sunni")}</option>
            <option value="shia">{t("register.step3.shia")}</option>
            <option value="sufi">{t("register.step3.sufi")}</option>
            <option value="salafi">{t("register.step3.salafi")}</option>
            <option value="prefer_not">{t("common.preferNotToSay")}</option>
            <option value="other">{t("register.step3.otherSpecify")}</option>
          </select>
          {localData.islamicTradition === "other" && (
            <input name="islamicTraditionOther" type="text" placeholder={t("common.pleaseSpecify")} value={localData.islamicTraditionOther || ""} onChange={handleChange} className="w-full px-4 py-3.5 mt-2 signup-input text-sm rounded-2xl focus:outline-none" />
          )}
        </div>
        {localData.islamicTradition && localData.islamicTradition !== "prefer_not" && (
          <div>
            <label className="signup-label">{t("register.step3.matchTradition")}</label>
            <select name="islamicMatchPreference" value={localData.islamicMatchPreference || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
              <option value="">{t("common.select")}</option>
              <option value="own">{t("register.step3.traditionOwn")}</option>
              <option value="similar">{t("register.step3.traditionSimilar")}</option>
              <option value="any">{t("register.step3.traditionAny")}</option>
              <option value="no_preference">{t("common.noPreference")}</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function EducationStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const OCCUPATIONS = [
    "Accountant", "Actor", "Architect", "Artist", "Business Owner", "Consultant", "Dentist", "Doctor",
    "Engineer", "Entrepreneur", "Farmer", "Graphic Designer", "HR Manager", "Imam / Religious Scholar",
    "IT Specialist", "Journalist", "Judge", "Lawyer", "Lecturer", "Manager", "Merchant / Trader",
    "Military / Defense", "Nurse", "Pharmacist", "Photographer", "Physiotherapist", "Pilot", "Police Officer",
    "Politician", "Professor", "Programmer", "Psychologist", "Real Estate Agent", "Researcher", "Retail Manager",
    "Sales Representative", "Scientist", "Self-Employed", "Social Worker", "Software Developer", "Student",
    "Teacher", "Technician", "Translator", "Veterinarian", "Writer"
  ];
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const merged = { ...localData };
    if (merged.occupation === "other_occupation") merged.occupation = merged.occupationOther?.trim() || "Other";
    const err = validate(4, merged);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(merged);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step4.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step4.educationLevel")}</label>
        <select name="educationLevel" value={localData.educationLevel || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="high_school">{t("register.step4.highSchool")}</option>
          <option value="diploma">{t("register.step4.diploma")}</option>
          <option value="bachelor">{t("register.step4.bachelor")}</option>
          <option value="master">{t("register.step4.master")}</option>
          <option value="phd">{t("register.step4.phd")}</option>
          <option value="other">{t("register.step4.other")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step4.occupation")}</label>
        <select name="occupation" value={localData.occupation === "other_occupation" ? "other_occupation" : (OCCUPATIONS.includes(localData.occupation) ? localData.occupation : localData.occupation ? "other_occupation" : "")} onChange={(e) => { const v = e.target.value; setLocalData((prev: any) => ({ ...prev, occupation: v, occupationOther: v === "other_occupation" ? (prev.occupationOther || "") : v })); }} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="other_occupation">{t("register.step4.other")}</option>
        </select>
        {localData.occupation === "other_occupation" && (
          <input name="occupationOther" type="text" placeholder={t("register.step4.occupationPlaceholder")} value={localData.occupationOther || ""} onChange={handleChange} className="w-full px-4 py-3.5 mt-2 signup-input text-sm rounded-2xl focus:outline-none" />
        )}
      </div>
      <div>
        <label className="signup-label">{t("register.step4.employmentStatus")}</label>
        <select name="employmentStatus" value={localData.employmentStatus || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="employed">{t("register.step4.employed")}</option>
          <option value="self_employed">{t("register.step4.selfEmployed")}</option>
          <option value="student">{t("register.step4.student")}</option>
          <option value="unemployed">{t("register.step4.unemployed")}</option>
          <option value="retired">{t("register.step4.retired")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step4.incomeRange")}</label>
        <select name="monthlyIncomeRange" value={localData.monthlyIncomeRange || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="below_5000">{t("register.step4.below5000")}</option>
          <option value="5000_10000">{t("register.step4.range5000to10000")}</option>
          <option value="10000_20000">{t("register.step4.range10000to20000")}</option>
          <option value="20000_50000">{t("register.step4.range20000to50000")}</option>
          <option value="above_50000">{t("register.step4.above50000")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function IntentionsStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(5, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step5.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step5.reason")}</label>
        <select name="reasonForJoining" value={localData.reasonForJoining || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="seeking_marriage">{t("register.step5.seekingMarriage")}</option>
          <option value="family_assisted">{t("register.step5.familyAssisted")}</option>
          <option value="exploring">{t("register.step5.exploring")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step5.timeline")}</label>
        <select name="desiredMarriageTimeline" value={localData.desiredMarriageTimeline || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="asap">{t("register.step5.asap")}</option>
          <option value="6_months">{t("register.step5.within6Months")}</option>
          <option value="1_year">{t("register.step5.within1Year")}</option>
          <option value="flexible">{t("register.step5.flexible")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step5.childrenPreference")}</label>
        <select name="childrenPreference" value={localData.childrenPreference || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="yes">{t("register.step5.wantChildren")}</option>
          <option value="no">{t("register.step5.dontWantChildren")}</option>
          <option value="maybe">{t("register.step5.undecided")}</option>
        </select>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">{t("register.step5.personalPreference")}</p>
        <label className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200
          ${localData.personalPreference === 'no_experience'
            ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
            : 'border-[#3A3A3A] hover:border-[#D4AF37]/50'}`}>
          <input type="radio" name="personalPreference" value="no_experience" checked={localData.personalPreference === "no_experience"} onChange={handleChange} className="sr-only" />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${localData.personalPreference === 'no_experience' ? 'border-[#D4AF37]' : 'border-[#3A3A3A]'}`}>
            {localData.personalPreference === 'no_experience' && <span className="w-2 h-2 rounded-full bg-accent" />}
          </span>
          <span className="text-sm text-[#D1D5DB]">{t("register.step5.preferNoExperience")}</span>
        </label>
        <label className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200
          ${localData.personalPreference === 'no_preference'
            ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
            : 'border-[#3A3A3A] hover:border-[#D4AF37]/50'}`}>
          <input type="radio" name="personalPreference" value="no_preference" checked={localData.personalPreference === "no_preference"} onChange={handleChange} className="sr-only" />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${localData.personalPreference === 'no_preference' ? 'border-[#D4AF37]' : 'border-[#3A3A3A]'}`}>
            {localData.personalPreference === 'no_preference' && <span className="w-2 h-2 rounded-full bg-accent" />}
          </span>
          <span className="text-sm text-[#D1D5DB]">{t("register.step5.noPreference")}</span>
        </label>
        <label className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200
          ${localData.personalPreference === 'prefer_not'
            ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
            : 'border-[#3A3A3A] hover:border-[#D4AF37]/50'}`}>
          <input type="radio" name="personalPreference" value="prefer_not" checked={localData.personalPreference === "prefer_not"} onChange={handleChange} className="sr-only" />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${localData.personalPreference === 'prefer_not' ? 'border-[#D4AF37]' : 'border-[#3A3A3A]'}`}>
            {localData.personalPreference === 'prefer_not' && <span className="w-2 h-2 rounded-full bg-accent" />}
          </span>
          <span className="text-sm text-[#D1D5DB]">{t("register.step5.preferNotToAnswer")}</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function FamilyStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(6, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step6.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step6.ethnicBackground")}</label>
        <input name="ethnicBackground" type="text" placeholder={t("register.step6.ethnicPlaceholder")} value={localData.ethnicBackground || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div>
        <label className="signup-label">{t("register.step6.motherTongue")}</label>
        <input name="motherTongue" type="text" placeholder={t("register.step6.motherTonguePlaceholder")} value={localData.motherTongue || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div>
        <label className="signup-label">{t("register.step6.familyInvolvement")}</label>
        <select name="familyInvolvement" value={localData.familyInvolvement || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="high">{t("register.step6.highlyInvolved")}</option>
          <option value="moderate">{t("register.step6.moderate")}</option>
          <option value="minimal">{t("register.step6.minimal")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function LifestyleStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(7, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step7.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step7.smoking")}</label>
        <select name="smokingHabits" value={localData.smokingHabits || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="never">{t("register.step7.never")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="regularly">{t("register.step7.regularly")}</option>
          <option value="trying_to_quit">{t("register.step7.tryingToQuit")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step7.khat")}</label>
        <select name="khatUsage" value={localData.khatUsage || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="never">{t("register.step7.never")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="regularly">{t("register.step7.regularly")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step7.exercise")}</label>
        <select name="exerciseHabits" value={localData.exerciseHabits || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="daily">{t("register.step3.daily")}</option>
          <option value="weekly">{t("register.step3.weekly")}</option>
          <option value="occasionally">{t("register.step7.occasionally")}</option>
          <option value="rarely">{t("register.step3.rarely")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step7.livingPreference")}</label>
        <select name="livingPreference" value={localData.livingPreference || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="independent">{t("register.step7.independent")}</option>
          <option value="with_family">{t("register.step7.withFamily")}</option>
          <option value="flexible">{t("register.step7.flexible")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function PersonalityStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(8, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step8.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div>
        <label className="signup-label">{t("register.step8.selfDescription")}</label>
        <WordSuggest
          value={localData.selfDescription || ""}
          onChange={(val) => setLocalData((prev: any) => ({ ...prev, selfDescription: val }))}
          placeholder={t("register.step8.selfDescriptionPlaceholder")}
          rows={3}
          className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="signup-label">{t("register.step8.qualities")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {["Honest", "Patient", "Caring", "Respectful", "Kind", "Generous", "Humble", "Ambitious"].map((quality) => (
            <label key={quality} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#3A3A3A] cursor-pointer transition-all duration-200 hover:border-[#D4AF37]/40 has-[:checked]:signup-seg-active has-[:checked]:border-[#D4AF37] signup-seg-inactive">
              <input type="checkbox" name="qualities" value={quality.toLowerCase()} onChange={handleChange} className="rounded" />
              <span className="text-sm">{t("register.step8." + quality.toLowerCase())}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step8.interests")}</label>
        <WordSuggest
          value={localData.interests || ""}
          onChange={(val) => setLocalData((prev: any) => ({ ...prev, interests: val }))}
          placeholder={t("register.step8.interestsPlaceholder")}
          rows={3}
          className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function PreferencesStep({ formData, updateFormData, nextStep, prevStep, validate }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleNext = () => {
    const err = validate(9, localData);
    if (err) { setError(err); return; }
    setError("");
    updateFormData(localData);
    nextStep();
  };
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t("register.step9.title")}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <div>
          <label className="signup-label">{t("register.step9.ageRange")}</label>
          <div className="flex gap-2">
            <input name="preferredAgeMin" type="number" placeholder={t("register.step9.min")} value={localData.preferredAgeMin || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
            <input name="preferredAgeMax" type="number" placeholder={t("register.step9.max")} value={localData.preferredAgeMax || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
          </div>
        </div>
      </div>
      <div>
        <label className="signup-label">{t("register.step9.maritalStatus")}</label>
          <select name="preferredMaritalStatus" value={localData.preferredMaritalStatus || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
            <option value="">{t("common.select")}</option>
            <option value="single_never">{t("register.step2.singleVirgin")}</option>
            <option value="single_previous">{t("register.step2.singlePrevious")}</option>
            {localData.gender !== "male" && <option value="married">{t("register.step2.married")}</option>}
            <option value="divorced">{t("register.step2.divorced")}</option>
            <option value="widowed">{t("register.step2.widowed")}</option>
            <option value="any">{t("register.step3.any")}</option>
          </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step9.educationLevel")}</label>
        <select name="preferredEducationLevel" value={localData.preferredEducationLevel || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="high_school">{t("register.step4.highSchool")}</option>
          <option value="diploma">{t("register.step4.diploma")}</option>
          <option value="bachelor">{t("register.step4.bachelor")}</option>
          <option value="master">{t("register.step4.master")}</option>
          <option value="phd">{t("register.step4.phd")}</option>
          <option value="any">{t("register.step3.any")}</option>
        </select>
      </div>
      <div>
        <label className="signup-label">{t("register.step9.location")}</label>
        <input name="preferredLocation" type="text" placeholder={t("register.step9.locationPlaceholder")} value={localData.preferredLocation || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div>
        <label className="signup-label">{t("register.step9.waliInvolvement")}</label>
        <select name="waliInvolvement" value={localData.waliInvolvement || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="required">{t("register.step9.required")}</option>
          <option value="preferred">{t("register.step9.preferred")}</option>
          <option value="optional">{t("register.step9.optional")}</option>
        </select>
      </div>
      {localData.gender !== "male" && (
      <div>
        <label className="signup-label">{t("register.step9.polygamy")}</label>
        <select name="polygamyPreference" value={localData.polygamyPreference || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="not_acceptable">{t("register.step9.polygamyNotAcceptable")}</option>
          <option value="acceptable">{t("register.step9.polygamyAcceptable")}</option>
          <option value="depends">{t("register.step9.polygamyDepends")}</option>
        </select>
      </div>
      )}
      <div>
        <label className="signup-label">{t("register.step9.mahr")}</label>
        <input name="mahrExpectation" type="text" placeholder={t("register.step9.mahrPlaceholder")} value={localData.mahrExpectation || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
      </div>
      <div>
        <label className="signup-label">{t("register.step9.genderInteraction")}</label>
        <select name="genderInteraction" value={localData.genderInteraction || ""} onChange={handleChange} className="w-full min-w-0 px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
          <option value="">{t("common.select")}</option>
          <option value="conservative">{t("register.step9.conservative")}</option>
          <option value="moderate">{t("register.step9.moderate")}</option>
          <option value="flexible">{t("register.step9.flexible")}</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1">{t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
}
function HealthStep({ formData, updateFormData, handleSubmit, isSubmitting, prevStep, validate, submitError, clearSubmitError }: any) {
  const { t } = useI18n();
  const [localData, setLocalData] = useState({ ...formData });
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setLocalData((prev: any) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleNext = () => {
    const err = validate(10, localData);
    if (err) { setError(err); return; }
    setError("");
    clearSubmitError?.();
    setShowConfirm(true);
  };
  const handleConfirm = async () => {
    const merged = { ...formData, ...localData };
    updateFormData(localData);
    const result = await handleSubmit(merged);
    if (result === false) {
      setShowConfirm(false);
    }
  };
  const SelectField = ({ name, label, options, value, detailName, noOther }: { name: string; label: string; options: { value: string; label: string }[]; value?: string; detailName?: string; noOther?: boolean }) => (
    <div>
      <label className="signup-label">{label}</label>
      <select name={name} value={value || ""} onChange={handleChange}
        className="w-full px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
        <option value="">{t("common.select")}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {!noOther && <option value="other">{t("common.other")}</option>}
      </select>
      {value === "other" && detailName && (
        <div className="mt-2">
          <label className="signup-label">{t("common.pleaseSpecify")}</label>
          <input name={detailName} value={localData[detailName] || ""} onChange={handleChange}
            placeholder={t("register.step10.dwarfismRequired")}
            className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
        </div>
      )}
    </div>
  );
  const yesNoOptions = [
    { value: "yes", label: t("common.yes") },
    { value: "no", label: t("common.no") },
  ];
  const statusOptions = [
    { value: "yes", label: t("common.yes") },
    { value: "no", label: t("common.no") },
  ];
  const preferenceOptions = [
    { value: "any", label: "No preference — show all" },
    { value: "disclosed", label: "Only show people who have disclosed their status" },
    { value: "matching", label: "Only show people with compatible health information" },
  ];
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{t("register.step10.title")}</h3>
      <p className="text-sm text-[#9CA3AF] mb-4">{t("register.step10.disclaimer")}</p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">{t("register.step10.importantDisclaimer")}</p>
            <p className="text-xs text-amber-400/80 mt-1">
              {t("register.step10.disclaimerText")}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.hivStatus")}</h4>
          <SelectField name="hivStatus" label={t("register.step10.yourHivStatus")} options={statusOptions} value={localData.hivStatus} noOther />
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.stds")}</h4>
          <div className="space-y-3">
            <SelectField name="stdStatus" label={t("register.step10.doYouHaveStds")} options={yesNoOptions} value={localData.stdStatus} noOther />
            {localData.stdStatus === "yes" && (
              <div>
                <label className="signup-label">{t("register.step10.pleaseSpecify")}</label>
                <input name="stdDetails" value={localData.stdDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.stdPlaceholder")}
                  className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.hereditary")}</h4>
          <div className="space-y-3">
            <SelectField name="hereditaryDiseases" label={t("register.step10.doYouHaveHereditary")} options={yesNoOptions} value={localData.hereditaryDiseases} noOther />
            {localData.hereditaryDiseases === "yes" && (
              <div>
                <label className="signup-label">{t("register.step10.pleaseSpecify")}</label>
                <input name="hereditaryDetails" value={localData.hereditaryDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.hereditaryPlaceholder")}
                  className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.chronic")}</h4>
          <div className="space-y-3">
            <SelectField name="chronicConditions" label={t("register.step10.doYouHaveChronic")} options={yesNoOptions} value={localData.chronicConditions} noOther />
            {localData.chronicConditions === "yes" && (
              <div>
                <label className="signup-label">{t("register.step10.pleaseSpecify")}</label>
                <input name="chronicDetails" value={localData.chronicDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.chronicPlaceholder")}
                  className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.disabilities")}</h4>
          <div className="space-y-3">
            <SelectField name="disabilities" label={t("register.step10.doYouHaveDisabilities")} options={yesNoOptions} value={localData.disabilities} noOther />
            {localData.disabilities === "yes" && (
              <div>
                <label className="signup-label">{t("register.step10.pleaseSpecify")}</label>
                <input name="disabilityDetails" value={localData.disabilityDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.disabilityPlaceholder")}
                  className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.dwarfism")}</h4>
          <div className="space-y-3">
            <select name="dwarfismStatus" value={localData.dwarfismStatus || ""} onChange={handleChange}
              className="w-full px-4 py-3.5 signup-select text-sm rounded-2xl focus:outline-none">
              <option value="">{t("common.select")}</option>
              <option value="none">{t("register.step10.dwarfismNone")}</option>
              <option value="achondroplasia">{t("register.step10.dwarfismAchondroplasia")}</option>
              <option value="hypochondroplasia">{t("register.step10.dwarfismHypochondroplasia")}</option>
              <option value="other">{t("register.step10.dwarfismOther")}</option>
            </select>
            {localData.dwarfismStatus === "other" && (
              <div>
                <label className="signup-label">{t("register.step10.pleaseSpecify")}</label>
                <input name="dwarfismDetails" value={localData.dwarfismDetails || ""} onChange={handleChange}
                  placeholder={t("register.step10.dwarfismRequired")}
                  className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-white mb-3">{t("register.step10.otherConditions")}</h4>
          <div>
            <label className="signup-label">{t("register.step10.otherConditionsLabel")}</label>
            <textarea name="otherConditions" value={localData.otherConditions || ""} onChange={handleChange}
              placeholder={t("register.step10.otherConditionsPlaceholder")}
              rows={3}
              className="w-full px-4 py-3.5 signup-input text-sm rounded-2xl focus:outline-none resize-none" />
          </div>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#1A1A1A] rounded-2xl shadow-xl border border-[#2A2A2A] p-5 sm:p-6 max-w-sm w-full">
            {submitError?.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm font-semibold text-red-400">Please correct these errors:</p>
                </div>
                <ul className="text-xs text-red-300 space-y-1.5 list-disc list-inside">
                  {submitError.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <h4 className="text-lg font-semibold text-white mb-2">{t("register.step10.confirmTitle")}</h4>
            <p className="text-sm text-[#9CA3AF] mb-6">
              {t("register.step10.confirmText")}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => { setShowConfirm(false); clearSubmitError?.(); }} variant="ghost" className="flex-1">{t("register.step10.goBack")}</Button>
              <Button onClick={handleConfirm} variant="primary" className="flex-1" loading={isSubmitting}>
                {isSubmitting ? t("register.step10.creating") : t("register.step10.yesImSure")}
              </Button>
            </div>
          </div>
        </div>
      )}
      {submitError?.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-400">Please correct these errors before submitting:</p>
          </div>
          <ul className="text-xs text-red-300 space-y-1.5 list-disc list-inside">
            {submitError.map((e: string, i: number) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      <div className="flex gap-3 pt-6">
        <Button onClick={prevStep} variant="ghost" className="flex-1">{t("common.back")}</Button>
        <Button onClick={handleNext} variant="primary" className="flex-1" loading={isSubmitting}>
          {isSubmitting ? t("register.step10.creatingAccount") : t("register.step10.createAccount")} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
