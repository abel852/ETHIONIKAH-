import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Login",
  description:
    "Sign in to your Ethio Nikah account to continue your journey toward finding a righteous Muslim spouse in Ethiopia. Secure Islamic matchmaking platform.",
  keywords: ["Ethio Nikah login", "Islamic matchmaking sign in", "Muslim marriage login"],
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
