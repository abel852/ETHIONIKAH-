import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Membership Plans",
  description:
    "Explore Ethio Nikah membership plans. Choose from free, premium, and elite tiers with features like unlimited messaging, advanced filters, and priority visibility for Islamic matchmaking.",
  keywords: [
    "Ethio Nikah membership",
    "premium matchmaking plans",
    "Islamic marriage subscription",
    "halal dating premium",
    "membership pricing",
  ],
  path: "/membership",
});

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
