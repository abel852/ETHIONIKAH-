"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown, Shield, CheckCircle, Sparkles, Star, ArrowRight,
  UserCheck, Heart, MessageCircle,
  Award, Gem, Fingerprint, Users,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

const goldText = "bg-gold-gradient bg-clip-text text-transparent";

function SectionHeading({ label, title, subtitle, light, imageSrc, imageAlt }: { label?: string; title: string; subtitle?: string; light?: boolean; imageSrc?: string; imageAlt?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8 }}
      className="text-center mb-10 md:mb-12 relative"
    >
      {imageSrc && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-accent/50 shadow-[0_0_25px_rgba(212,175,55,0.15)]"
        >
          <Image src={imageSrc} alt={imageAlt ?? ""} fill sizes="96px" className="object-cover" />
        </motion.div>
      )}
      {label && (
        <span className="inline-block text-xs uppercase tracking-[0.3em] text-accent font-medium mb-4">
          {label}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-cursive font-bold ${light ? "text-white" : "text-charcoal-900"} mb-4 leading-tight`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-script ${light ? "text-charcoal-200" : "text-charcoal-600"}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <span className="block w-12 h-px bg-gradient-to-r from-transparent to-accent/40" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Gem className="w-4 h-4 text-accent" />
      </motion.div>
      <span className="block w-12 h-px bg-gradient-to-l from-transparent to-accent/40" />
    </div>
  );
}

function WaveSeparator() {
  return (
    <div className="relative bg-charcoal-900 pointer-events-none -mt-px">
      <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" className="w-full h-[50px] md:h-[80px]">
        <motion.path
          d="M0,50 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,100 L0,100 Z"
          fill="#0a0a0a"
          opacity="0.4"
          animate={{
            d: [
              "M0,50 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,100 L0,100 Z",
              "M0,40 C240,70 480,20 720,50 C960,80 1200,30 1440,40 L1440,100 L0,100 Z",
              "M0,50 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,100 L0,100 Z",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,60 C240,30 480,80 720,50 C960,20 1200,70 1440,40 L1440,100 L0,100 Z"
          fill="#0a0a0a"
          opacity="0.7"
          animate={{
            d: [
              "M0,60 C240,30 480,80 720,50 C960,20 1200,70 1440,40 L1440,100 L0,100 Z",
              "M0,50 C240,80 480,20 720,60 C960,30 1200,80 1440,50 L1440,100 L0,100 Z",
              "M0,60 C240,30 480,80 720,50 C960,20 1200,70 1440,40 L1440,100 L0,100 Z",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,70 C240,50 480,90 720,65 C960,40 1200,85 1440,60 L1440,100 L0,100 Z"
          fill="#111111"
          animate={{
            d: [
              "M0,70 C240,50 480,90 720,65 C960,40 1200,85 1440,60 L1440,100 L0,100 Z",
              "M0,60 C240,80 480,40 720,75 C960,50 1200,90 1440,65 L1440,100 L0,100 Z",
              "M0,70 C240,50 480,90 720,65 C960,40 1200,85 1440,60 L1440,100 L0,100 Z",
            ],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function Highlight({ text, className }: { text: string; className?: string }) {
  return <span className={className ? `${className} ${goldText}` : goldText}>{text}</span>;
}

function HighlightText({ text, highlight, className }: { text: string; highlight: string; className?: string }) {
  const parts = text.split(highlight);
  return (
    <>
      {parts[0]}
      {parts.length > 1 && (
        <>
          <Highlight text={highlight} className={className} />
          {parts.slice(1).join(highlight)}
        </>
      )}
      {parts.length === 1 && text}
    </>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  const ref = useRef(null);
  const { t } = useI18n();
  const { scrollYProgress } = useScroll({ target: ref, container: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const highlight = t("home.heroHighlight");
  const heroBadges = [t("home.heroBadge1"), t("home.heroBadge2"), t("home.heroBadge3")];

  return (
    <section ref={ref} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-charcoal-900">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/images/hero-mosque.svg" alt="" fill sizes="100vw" className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/50 via-charcoal-900/30 to-charcoal-900/60" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 border border-accent/10 rounded-full bg-accent/[0.02]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] border border-accent/10 rounded-full bg-accent/[0.02]"
        />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 border border-accent/10 rounded-full bg-accent/[0.02]"
        />
        {/* Floating sparkle particles */}
        {[
          { x: "10%", y: "20%", s: 4, d: 0 },
          { x: "85%", y: "30%", s: 6, d: 0.5 },
          { x: "70%", y: "60%", s: 3, d: 1 },
          { x: "20%", y: "70%", s: 5, d: 1.5 },
          { x: "50%", y: "15%", s: 4, d: 0.3 },
          { x: "90%", y: "75%", s: 3, d: 2 },
          { x: "30%", y: "40%", s: 5, d: 0.8 },
          { x: "60%", y: "80%", s: 4, d: 1.2 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
            className="absolute"
            style={{ left: p.x, top: p.y }}
          >
            <div className="rounded-full bg-accent/40" style={{ width: p.s, height: p.s }} />
          </motion.div>
        ))}
      </div>

      <motion.div style={{ opacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div>
          <span className="inline-block text-xs uppercase tracking-[0.35em] text-accent/80 font-medium mb-6">
            {t("home.heroEyebrow")}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-cursive font-bold text-white leading-[1.1] mb-6">
          {t("home.heroTitle")}{" "}
          <span className="block mt-2">
            <HighlightText text={t("home.heroTitleLine2", { highlight })} highlight={highlight} />
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-charcoal-200 max-w-2xl mx-auto mb-8 leading-relaxed font-script">
          {t("home.heroDesc")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <button className="group relative overflow-hidden premium-button-primary text-lg px-10 py-4">
              <span className="relative z-10">{t("home.heroCtaPrimary")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </Link>
          <Link href="/login">
            <button className="premium-button-secondary text-lg px-10 py-4">
              {t("home.heroCtaSecondary")}
            </button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {heroBadges.map((item) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-sm border border-accent/20 text-sm text-charcoal-200 hover:border-accent/40 hover:bg-white/[0.08] transition-all duration-300"
            >
              <CheckCircle className="w-4 h-4 text-accent" />
              {item}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeaturesShowcaseSection() {
  const { t } = useI18n();
  const features = [
    { icon: Sparkles, title: t("home.feature1Title"), desc: t("home.feature1Desc") },
    { icon: Shield, title: t("home.feature2Title"), desc: t("home.feature2Desc") },
    { icon: MessageCircle, title: t("home.feature3Title"), desc: t("home.feature3Desc") },
    { icon: Users, title: t("home.feature4Title"), desc: t("home.feature4Desc") },
    { icon: Heart, title: t("home.feature5Title"), desc: t("home.feature5Desc") },
    { icon: Fingerprint, title: t("home.feature6Title"), desc: t("home.feature6Desc") },
  ];

  return (
    <section className="relative pt-0 pb-24 md:pt-0 md:pb-32 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/images/pattern-bg.svg" alt="" fill sizes="100vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/60 via-charcoal-900/40 to-charcoal-900/60" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/[0.07] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          label={t("home.featuresEyebrow")}
          title={t("home.featuresTitle")}
          subtitle={t("home.featuresSubtitle")}
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.6, type: "spring", stiffness: 60 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 hover:bg-white/[0.07] transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:border-accent/25 overflow-hidden"
            >
              {/* Hover gradient sweep */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Glowing icon */}
              <div className="relative mb-5">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 w-14 h-14 rounded-2xl bg-accent/10 blur-md"
                />
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] group-hover:border-accent/50 transition-all duration-500"
                >
                  <feature.icon className="w-6 h-6 text-accent" />
                </motion.div>
              </div>

              <h3 className="relative text-xl font-cursive font-bold text-white mb-2">{feature.title}</h3>
              <p className="relative text-base font-script text-charcoal-200 leading-relaxed">{feature.desc}</p>

              {/* Bottom accent line on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/register">
            <button className="group relative overflow-hidden premium-button-primary text-base px-8 py-3">
              <span className="relative z-10 flex items-center gap-2">
                {t("home.heroCtaPrimary")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function TrustSection() {
  const { t } = useI18n();
  const trustItems = [
    { icon: Shield, title: t("home.trust1Title"), desc: t("home.trust1Desc") },
    { icon: Fingerprint, title: t("home.trust2Title"), desc: t("home.trust2Desc") },
    { icon: Award, title: t("home.trust3Title"), desc: t("home.trust3Desc") },
    { icon: UserCheck, title: t("home.trust4Title"), desc: t("home.trust4Desc") },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/[0.03] blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          label={t("home.trustEyebrow")}
          title={t("home.trustTitle")}
          subtitle={t("home.trustSubtitle")}
          light
        />

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.6, type: "spring", stiffness: 60 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.07] transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:border-accent/25 overflow-hidden"
            >
              {/* Hover gradient sweep */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-start gap-5">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 flex items-center justify-center group-hover:from-accent/25 group-hover:to-accent/10 group-hover:border-accent/40 transition-all duration-500 shadow-[0_0_20px_rgba(212,175,55,0.08)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                >
                  <item.icon className="w-6 h-6 text-accent" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-cursive font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-base font-script text-charcoal-200 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const { t } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 20%"] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const steps = [
    { icon: UserCheck, title: t("home.journeyStep1Title"), desc: t("home.journeyStep1Desc") },
    { icon: Shield, title: t("home.journeyStep2Title"), desc: t("home.journeyStep2Desc") },
    { icon: Sparkles, title: t("home.journeyStep3Title"), desc: t("home.journeyStep3Desc") },
    { icon: Heart, title: t("home.journeyStep4Title"), desc: t("home.journeyStep4Desc") },
    { icon: Users, title: t("home.journeyStep5Title"), desc: t("home.journeyStep5Desc") },
    { icon: Award, title: t("home.journeyStep6Title"), desc: t("home.journeyStep6Desc") },
  ];

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-charcoal-900 overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          label={t("home.journeyEyebrow")}
          title={t("home.journeyTitle")}
          subtitle={t("home.journeySubtitle")}
          light
        />

        {/* Timeline */}
        <div className="relative">
          {/* Track (background line) */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-white/5 md:-translate-x-1/2" />
          {/* Animated progress line */}
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-6 md:left-1/2 top-0 w-0.5 bg-gradient-to-b from-accent via-accent-light to-gold md:-translate-x-1/2 shadow-[0_0_12px_rgba(212,175,55,0.5)]"
          />

          {steps.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: isLeft ? -50 : 50, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 80 }}
                className={`relative flex items-center gap-6 md:gap-0 mb-16 md:mb-20 last:mb-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                {/* Content card */}
                <div className={`hidden md:block w-1/2 ${isLeft ? "pr-16 text-right" : "pl-16"}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-accent/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]"
                  >
                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? "justify-end" : ""}`}>
                      <span className="text-3xl font-cursive font-bold text-accent/20">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="text-xl font-cursive font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-base font-script text-charcoal-200 leading-relaxed">{step.desc}</p>
                    {/* Arrow pointing to center */}
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"} hidden md:block`}>
                      <div className={`w-3 h-3 rotate-45 bg-white/[0.04] border-${isLeft ? "r" : "l"}-t border-white/[0.08]`} />
                    </div>
                  </motion.div>
                </div>

                {/* Glowing node */}
                <div className="relative flex-shrink-0 z-10 flex items-center justify-center">
                  {/* Outer pulse ring */}
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                    className="absolute w-16 h-16 rounded-full bg-accent/10"
                  />
                  {/* Middle glow */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    className="absolute w-14 h-14 rounded-full bg-accent/5 blur-sm"
                  />
                  {/* Node circle */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="relative w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border-2 border-accent/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    <step.icon className="w-5 h-5 text-accent" />
                    {/* Step number badge */}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-charcoal-900 text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </motion.div>
                </div>

                {/* Mobile content */}
                <div className="md:hidden flex-1">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-accent/30 transition-all duration-500"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-cursive font-bold text-accent/20">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="text-lg font-cursive font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-base font-script text-charcoal-200 leading-relaxed">{step.desc}</p>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <GoldDivider />
      </div>
    </section>
  );
}

function BenefitsSection() {
  const { t } = useI18n();
  const benefits = [
    { icon: CheckCircle, title: t("home.benefit1Title"), desc: t("home.benefit1Desc") },
    { icon: Shield, title: t("home.benefit2Title"), desc: t("home.benefit2Desc") },
    { icon: Star, title: t("home.benefit3Title"), desc: t("home.benefit3Desc") },
    { icon: Sparkles, title: t("home.benefit4Title"), desc: t("home.benefit4Desc") },
    { icon: Fingerprint, title: t("home.benefit5Title"), desc: t("home.benefit5Desc") },
    { icon: Users, title: t("home.benefit6Title"), desc: t("home.benefit6Desc") },
    { icon: Heart, title: t("home.benefit7Title"), desc: t("home.benefit7Desc") },
    { icon: Award, title: t("home.benefit8Title"), desc: t("home.benefit8Desc") },
  ];

  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const count = benefits.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % count);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, count]);

  const getOffset = (i: number) => {
    let offset = i - active;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;
    return offset;
  };

  return (
    <section className="relative py-24 md:py-32 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/images/pattern-bg.svg" alt="" fill sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/70 via-charcoal-900/50 to-charcoal-900/70" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/[0.05] blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          label={t("home.benefitsEyebrow")}
          title={t("home.benefitsTitle")}
          subtitle={t("home.benefitsSubtitle")}
          light
          imageSrc="/images/decorative-star.svg"
          imageAlt=""
        />

        {/* 3D Carousel */}
        <div
          className="relative h-[420px] md:h-[440px] flex items-center justify-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {benefits.map((benefit, i) => {
            const offset = getOffset(i);
            const isCenter = offset === 0;
            const isAdjacent = Math.abs(offset) === 1;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            const x = offset * 300;
            const scale = isCenter ? 1 : isAdjacent ? 0.8 : 0.65;
            const blur = isCenter ? 0 : isAdjacent ? 2 : 5;
            const zIndex = isCenter ? 30 : isAdjacent ? 20 : 10;

            return (
              <motion.div
                key={benefit.title}
                animate={{
                  x,
                  scale,
                  opacity: 1,
                  filter: `blur(${blur}px)`,
                  zIndex,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 20, duration: 0.6 }}
                className="absolute w-[280px] md:w-[340px] cursor-pointer"
                onClick={() => setActive(i)}
                style={{ zIndex }}
              >
                <div
                  className={`relative bg-white/[0.04] backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 overflow-hidden ${
                    isCenter
                      ? "border-accent/40 shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                      : "border-white/[0.08]"
                  }`}
                >
                  {isCenter && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-transparent pointer-events-none" />
                  )}

                  {/* Glowing icon */}
                  <div className="relative mb-6 flex justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                      className="absolute w-14 h-14 rounded-2xl bg-accent/15 blur-md"
                    />
                    <div
                      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border flex items-center justify-center transition-all duration-500 ${
                        isCenter
                          ? "border-accent/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                          : "border-accent/20"
                      }`}
                    >
                      <benefit.icon className="w-7 h-7 text-accent" />
                    </div>
                  </div>

                  <h3 className="relative text-xl font-cursive font-bold text-white mb-3 text-center">
                    {benefit.title}
                  </h3>
                  {isCenter && (
                    <p className="relative text-lg font-script text-charcoal-200 leading-relaxed text-center">
                      {benefit.desc}
                    </p>
                  )}

                  {isCenter && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {benefits.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "bg-accent w-6" : "bg-white/20 hover:bg-white/40 w-2"
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-10"
        >
          <p className="text-lg font-script text-charcoal-300 mb-5">{t("home.benefitsCtaDesc")}</p>
          <Link href="/register">
            <button className="group relative overflow-hidden premium-button-primary text-base px-8 py-3">
              <span className="relative z-10 flex items-center gap-2">
                {t("home.benefitsCta")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const { t } = useI18n();
  const highlight = t("home.ctaHighlight");
  return (
    <section className="relative py-28 md:py-40 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/images/pattern-bg.svg" alt="" fill sizes="100vw" className="object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/80 to-charcoal-900/70" />
        {/* Pulsing center glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent rounded-full blur-3xl"
        />
        {/* Floating sparkles */}
        {[
          { x: "15%", y: "30%", d: 0 },
          { x: "80%", y: "25%", d: 0.7 },
          { x: "70%", y: "70%", d: 1.4 },
          { x: "25%", y: "75%", d: 2.1 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -25, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
            className="absolute"
            style={{ left: p.x, top: p.y }}
          >
            <Sparkles className="w-4 h-4 text-accent/40" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block text-xs uppercase tracking-[0.35em] text-accent/80 font-medium mb-6">
            {t("home.ctaEyebrow")}
          </span>

          <h2 className="text-3xl md:text-4xl lg:text-6xl font-cursive font-bold text-white leading-tight mb-6">
            <HighlightText text={t("home.ctaTitle", { highlight })} highlight={highlight} />
          </h2>

          <p className="text-xl text-charcoal-200 max-w-xl mx-auto mb-10 leading-relaxed font-script">
            {t("home.ctaDesc")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <button className="group relative overflow-hidden premium-button-primary text-lg px-12 py-4">
                <span className="relative z-10">{t("home.ctaPrimary")}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </Link>
            <Link href="/login">
              <button className="premium-button-secondary text-lg px-12 py-4">
                {t("home.ctaSecondary")}
              </button>
            </Link>
          </div>

          <div className="mt-12 pt-8">
            <p className="text-xs text-charcoal-500 uppercase tracking-[0.2em]">
              {t("home.ctaTrust")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/matches");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <WaveSeparator />
      <FeaturesShowcaseSection />
      <WaveSeparator />
      <TrustSection />
      <WaveSeparator />
      <JourneySection />
      <WaveSeparator />
      <BenefitsSection />
      <WaveSeparator />
      <CTASection />
      <Footer />
    </div>
  );
}
