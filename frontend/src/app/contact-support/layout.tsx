import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Contact Support",
  description: "Get help with your Ethio Nikah account. Contact our support team for technical assistance, reporting issues, or general inquiries about our Islamic matchmaking platform.",
  keywords: ["contact support", "help", "Ethio Nikah support", "customer service"],
  path: "/contact-support",
});

export default function ContactSupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
