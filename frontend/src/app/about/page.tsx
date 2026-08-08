import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = createMetadata({
  title: "About Us",
  description:
    "Learn about Ethio Nikah, Ethiopia's premier Islamic matchmaking platform. We help Muslim singles find righteous spouses in a safe, Sharia-compliant environment.",
  keywords: [
    "about Ethio Nikah",
    "Islamic matchmaking Ethiopia",
    "Muslim marriage platform",
    "halal matchmaking service",
    "Sharia-compliant dating",
  ],
  path: "/about",
});

export default function AboutPage() {
  return <AboutContent />;
}
