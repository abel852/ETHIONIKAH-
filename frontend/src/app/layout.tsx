import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "../styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { SocketProvider } from "@/context/SocketContext";
import { I18nProvider } from "@/context/I18nContext";
import { ToastProvider, ScreenshotGuard, NetworkBanner } from "@/components/common";
import { VerificationPrompt } from "@/components/auth/VerificationPrompt";
import { TwoFactorPrompt } from "@/components/auth/TwoFactorPrompt";
import { ThemeInit } from "@/components/ThemeInit";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Ethio Nikah - Islamic Matchmaking Platform",
  description: "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia.",
  keywords: ["Islamic marriage", "Muslim matchmaking", "halal dating", "Muslim matrimonial", "Ethio Nikah", "Ethiopian"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning data-scroll-behavior="smooth" className={inter.variable} nonce={nonce}>
      <body className="font-sans antialiased bg-background text-charcoal-900 dark:bg-charcoal-900 dark:text-charcoal-100 transition-colors duration-300">
        <ThemeInit />
        <NetworkBanner />
        <AuthProvider>
          <ScreenshotGuard />
          <RouteGuard>
            <I18nProvider>
              <SocketProvider>
                {children}
                <VerificationPrompt />
                <TwoFactorPrompt />
              </SocketProvider>
            </I18nProvider>
          </RouteGuard>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
