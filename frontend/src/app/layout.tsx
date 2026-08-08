import type { Metadata } from "next";
import { Inter, Poppins, Allura, Bonbon, Cormorant_Garamond } from "next/font/google";
import { headers } from "next/headers";
import "../styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { SocketProvider } from "@/context/SocketContext";
import { I18nProvider } from "@/context/I18nContext";
import { ToastProvider, NetworkBanner } from "@/components/common";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { ThemeInit } from "@/components/ThemeInit";
import { AppShell } from "@/components/layout/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { JSON_LD } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const nektar = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-nektar", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: ["400"], variable: "--font-allura", display: "swap" });
const bonbon = Bonbon({ subsets: ["latin"], weight: ["400"], variable: "--font-bonbon", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-cormorant", display: "swap" });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
} as const;

export const metadata: Metadata = {
  metadataBase: new URL("https://ethionikah.com"),
  title: {
    default: "Ethio Nikah - Islamic Matchmaking Platform",
    template: "%s | Ethio Nikah",
  },
  description: "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia.",
  keywords: ["Islamic marriage", "Muslim matchmaking", "halal dating", "Muslim matrimonial", "Ethio Nikah", "Ethiopian", "Muslim marriage Ethiopia", "halal matchmaking", "Islamic dating", "Muslim singles"],
  authors: [{ name: "Ethio Nikah" }],
  creator: "Ethio Nikah",
  publisher: "Ethio Nikah",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://ethionikah.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ethionikah.com",
    siteName: "Ethio Nikah",
    title: "Ethio Nikah - Islamic Matchmaking Platform",
    description: "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia.",
    images: [
      {
        url: "/application.png",
        width: 512,
        height: 512,
        alt: "Ethio Nikah Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethio Nikah - Islamic Matchmaking Platform",
    description: "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia.",
    images: ["/application.png"],
  },
  icons: {
    icon: [
      { url: "/application.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/application.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${nektar.variable} ${allura.variable} ${bonbon.variable} ${cormorant.variable}`} nonce={nonce}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content" />
      </head>
      <body className="font-sans antialiased bg-background text-charcoal-900 dark:bg-charcoal-900 dark:text-charcoal-100 transition-colors duration-300">
        <JsonLd data={[JSON_LD.organization, JSON_LD.website, JSON_LD.webApplication]} />
        <ThemeInit />
        <AuthProvider>
          <I18nProvider>
            <RouteGuard>
              <NetworkBanner />
              <SocketProvider>
                <AppShell>
                  {children}
                </AppShell>
                <TwoFactorPrompt />
              </SocketProvider>
            </RouteGuard>
          </I18nProvider>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
