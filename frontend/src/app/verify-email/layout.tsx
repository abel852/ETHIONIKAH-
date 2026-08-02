import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Verify Your Email",
  description: "Verify your email address to activate your Ethio Nikah account and start your journey toward finding a righteous Muslim spouse.",
  path: "/verify-email",
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
