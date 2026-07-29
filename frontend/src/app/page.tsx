"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown, Shield, CheckCircle, Sparkles, Star, ArrowRight,
  UserCheck, Heart, MessageCircle, Quote, ChevronLeft, ChevronRight,
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
      className="text-center mb-16 md:mb-20"
    >
      {imageSrc && (
        <div className="relative w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-accent/50">
          <Image src={imageSrc} alt={imageAlt ?? ""} fill sizes="96px" className="object-cover" />
        </div>
      )}
      {label && (
        <span className="inline-block text-xs uppercase tracking-[0.3em] text-accent font-medium mb-4">
          {label}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-display font-bold ${light ? "text-white" : "text-charcoal-900"} mb-4 leading-tight`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${light ? "text-charcoal-300" : "text-charcoal-500"}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <span className="block w-12 h-px bg-accent/30" />
      <Gem className="w-4 h-4 text-accent/60" />
      <span className="block w-12 h-px bg-accent/30" />
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
        <Image src="/images/gemini-bg-1.png" alt="" fill sizes="100vw" className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/70 via-charcoal-900/50 to-charcoal-900/80" />
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
      </div>

      <motion.div style={{ opacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div>
          <span className="inline-block text-xs uppercase tracking-[0.35em] text-accent/80 font-medium mb-6">
            {t("home.heroEyebrow")}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold text-white leading-[1.1] mb-6">
          {t("home.heroTitle")}{" "}
          <span className="block mt-2">
            <HighlightText text={t("home.heroTitleLine2", { highlight })} highlight={highlight} />
          </span>
        </h1>

        <p className="text-lg md:text-xl text-charcoal-300 max-w-2xl mx-auto mb-10 leading-relaxed">
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

        <div className="mt-16 flex items-center justify-center gap-6 text-sm text-charcoal-400">
          {heroBadges.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-accent/60" />
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="w-5 h-5 text-accent/50" />
        </motion.div>
      </div>
    </section>
  );
}

function PremiumSection() {
  const { t } = useI18n();
  const premiumFeatures = [
    { icon: Star, label: t("home.premiumFeature1"), desc: t("home.premiumFeature1Desc") },
    { icon: Users, label: t("home.premiumFeature2"), desc: t("home.premiumFeature2Desc") },
    { icon: Heart, label: t("home.premiumFeature3"), desc: t("home.premiumFeature3Desc") },
    { icon: Shield, label: t("home.premiumFeature4"), desc: t("home.premiumFeature4Desc") },
    { icon: CheckCircle, label: t("home.premiumFeature5"), desc: t("home.premiumFeature5Desc") },
    { icon: Award, label: t("home.premiumFeature6"), desc: t("home.premiumFeature6Desc") },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/images/gemini-bg-2.png" alt="" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/80 via-charcoal-900/60 to-charcoal-900/80" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/[0.07] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-3">{t("home.premiumEyebrow")}</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            {t("home.premiumTitle")}
          </h2>
          <p className="text-charcoal-400 max-w-xl mx-auto">
            {t("home.premiumSubtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Gold */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.1 }}
            className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-gold/40 transition-colors duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t("home.premiumGold")}</h3>
                <p className="text-sm text-charcoal-400">{t("home.premiumGoldDesc")}</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t("home.premiumGoldPrice")}</span>
              <span className="text-charcoal-400 ml-2">{t("home.premiumGoldPeriod")}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {premiumFeatures.slice(0, 4).map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <f.icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-charcoal-400">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link href="/login">
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-charcoal-900 font-semibold text-sm hover:shadow-lg hover:shadow-gold/20 transition-all duration-300">
                {t("home.premiumGoldCta")}
              </button>
            </Link>
          </motion.div>

          {/* Platinum */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.2 }}
            className="relative bg-white/[0.06] backdrop-blur-xl border border-accent/30 rounded-3xl p-8 hover:border-accent/60 transition-colors duration-300"
          >
            <div className="absolute -top-3 right-6">
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-accent text-white px-3 py-1 rounded-full">{t("home.premiumPlatinumBadge")}</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Gem className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t("home.premiumPlatinum")}</h3>
                <p className="text-sm text-charcoal-400">{t("home.premiumPlatinumDesc")}</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t("home.premiumPlatinumPrice")}</span>
              <span className="text-charcoal-400 ml-2">{t("home.premiumPlatinumPeriod")}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {premiumFeatures.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <f.icon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-charcoal-400">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link href="/login">
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
                {t("home.premiumPlatinumCta")}
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-charcoal-500 mt-8"
        >
          {t("home.premiumFooter")}
        </motion.p>
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
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-500 hover:shadow-gold-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors duration-500">
                <item.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-charcoal-300 leading-relaxed">{item.desc}</p>
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
  const isInView = useInView(ref, { once: true, margin: "-100px" });
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
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent hidden md:block" />
      <div className="absolute left-1/2 top-0 bottom-0 w-[200px] -translate-x-1/2 bg-accent/[0.02] blur-3xl rounded-full pointer-events-none hidden md:block" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t("home.journeyEyebrow")}
          title={t("home.journeyTitle")}
          subtitle={t("home.journeySubtitle")}
          light
        />

        <div className="relative">
          {steps.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className={`relative flex items-start gap-6 md:gap-0 mb-12 md:mb-16 last:mb-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`hidden md:block w-1/2 ${isLeft ? "pr-12 text-right" : "pl-12"}`}>
                  <h3 className="text-lg font-display font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-charcoal-300 leading-relaxed">{step.desc}</p>
                </div>

                <div className="relative flex-shrink-0 z-10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="absolute w-8 h-8 rounded-full bg-accent/5 animate-ping opacity-30" />
                </div>

                <div className="md:hidden flex-1">
                  <h3 className="text-lg font-display font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-charcoal-300 leading-relaxed">{step.desc}</p>
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

function StoriesSection() {
  const { t } = useI18n();
  const stories = [
    {
      name: t("home.story1Name"),
      location: t("home.story1Location"),
      image: "/images/4288.png",
      quote: t("home.story1Quote"),
      role: t("home.story1Role"),
    },
    {
      name: t("home.story2Name"),
      location: t("home.story2Location"),
      image: "/images/B2.png",
      quote: t("home.story2Quote"),
      role: t("home.story2Role"),
    },
    {
      name: t("home.story3Name"),
      location: t("home.story3Location"),
      image: "/images/R.png",
      quote: t("home.story3Quote"),
      role: t("home.story3Role"),
    },
  ];

  const [active, setActive] = useState(0);
  const prev = () => setActive((a) => (a === 0 ? stories.length - 1 : a - 1));
  const next = () => setActive((a) => (a === stories.length - 1 ? 0 : a + 1));

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  const story = stories[active];

  return (
    <section className="relative py-24 md:py-32 bg-charcoal-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image src={story.image} alt="" fill sizes="100vw" className="object-cover opacity-10 transition-opacity duration-1000" priority={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/95 to-charcoal-900/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label={t("home.storiesEyebrow")} title={t("home.storiesTitle")} subtitle={t("home.storiesSubtitle")} light imageSrc="/images/decorative-1.png" imageAlt="" />

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image src={story.image} alt={story.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Quote className="w-10 h-10 text-accent/30 mb-6" />
                <blockquote className="text-xl md:text-2xl lg:text-3xl font-display font-medium text-white leading-relaxed mb-8">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-accent/50 bg-accent/20">
                    <Image src={story.image} alt={story.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-white">{story.name}</p>
                    <p className="text-sm text-charcoal-400">{story.role} · {story.location}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-4 mt-10">
              <div className="flex gap-2">
                {stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === active ? "bg-accent w-6" : "bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <button onClick={prev} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-accent hover:border-accent/50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={next} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-accent hover:border-accent/50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
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
        <Image src="/images/gemini-bg-2.png" alt="" fill sizes="100vw" className="object-cover opacity-[0.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/95 to-charcoal-900/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-3xl" />
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

          <h2 className="text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
            <HighlightText text={t("home.ctaTitle", { highlight })} highlight={highlight} />
          </h2>

          <p className="text-lg text-charcoal-300 max-w-xl mx-auto mb-10 leading-relaxed">
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

          <div className="mt-12 pt-8 border-t border-white/5">
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
      <PremiumSection />
      <TrustSection />
      <JourneySection />
      <StoriesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
