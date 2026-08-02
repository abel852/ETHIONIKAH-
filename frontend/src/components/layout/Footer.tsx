"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export default function Footer() {
  const { t } = useI18n();

  const footerGroups = [
    {
      title: t("footer.platform"),
      links: [
        { href: "/matches", label: t("footer.browseMatches") },
        { href: "/search", label: t("footer.search") },
        { href: "/verification", label: t("footer.verification") },
        { href: "/settings", label: t("footer.privacySettings") },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { href: "/faq", label: t("footer.faq") },
        { href: "/contact", label: t("footer.contactUs") },
        { href: "/report", label: t("footer.reportAbuse") },
        { href: "/safety", label: t("footer.safetyTips") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { href: "/terms", label: t("footer.terms") },
        { href: "/privacy", label: t("footer.privacyPolicy") },
        { href: "/guidelines", label: t("footer.communityGuidelines") },
        { href: "/sharia", label: t("footer.shariaCompliance") },
      ],
    },
  ];

  return (
    <footer className="bg-charcoal-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/application.png" alt="Ethio Nikah" width={48} height={48} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
              <span className="font-cursive font-bold text-2xl [-webkit-text-stroke:0.5px_#D4AF37]">
                Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#111]">Nikah</span>
              </span>
            </Link>
            <p className="text-charcoal-300 text-base font-script leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-charcoal-300 text-base font-script">
                <Mail className="w-4 h-4 text-accent" />
                ethiopianikah@gmail.com
              </div>
              <div className="flex items-center gap-2 text-charcoal-300 text-base font-script">
                <MapPin className="w-4 h-4 text-accent" />
                Addis Ababa, Ethiopia
              </div>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="font-cursive font-bold text-lg text-accent mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-charcoal-300 hover:text-accent text-base font-script transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-charcoal-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-charcoal-400 text-base font-script">
            © {new Date().getFullYear()} {t("app.name")}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
