import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Create Your Account",
  description:
    "Join Ethio Nikah, Ethiopia's premier Islamic matchmaking platform. Register free and connect with verified Muslim singles seeking halal marriage. Safe, Sharia-compliant.",
  keywords: [
    "register Ethio Nikah",
    "Islamic matchmaking sign up",
    "Muslim marriage registration",
    "halal dating sign up",
    "Ethiopian Muslim singles",
  ],
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
