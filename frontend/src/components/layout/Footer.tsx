"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Platform: [
    { href: "/matches", label: "Browse Matches" },
    { href: "/search", label: "Search" },
    { href: "/verification", label: "Verification" },
    { href: "/settings", label: "Privacy Settings" },
  ],
  Support: [
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact Us" },
    { href: "/report", label: "Report Abuse" },
    { href: "/safety", label: "Safety Tips" },
  ],
  Legal: [
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/guidelines", label: "Community Guidelines" },
    { href: "/sharia", label: "Sharia Compliance" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/images/logo.png" alt="Ethio Nikah" width={48} height={48} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
              <span className="font-display font-bold text-xl [-webkit-text-stroke:0.5px_#D4AF37]">
                Ethio <span className="text-accent [-webkit-text-stroke:0.5px_#111]">Nikah</span>
              </span>
            </Link>
            <p className="text-charcoal-400 text-sm leading-relaxed mb-6">
              Find your righteous spouse in a safe, Sharia-compliant environment.
              Premium matchmaking for the Muslim community.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-charcoal-400 text-sm">
                <Mail className="w-4 h-4 text-accent" />
                ethionikah@gmail.com
              </div>
              <div className="flex items-center gap-2 text-charcoal-400 text-sm">
                <Phone className="w-4 h-4 text-accent" />
                0911348962
              </div>
              <div className="flex items-center gap-2 text-charcoal-400 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                Addis Ababa, Ethiopia
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm text-charcoal-300 mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-charcoal-400 hover:text-accent text-sm transition-colors"
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
          <p className="text-charcoal-500 text-sm">
            © {new Date().getFullYear()} Ethio Nikah. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
