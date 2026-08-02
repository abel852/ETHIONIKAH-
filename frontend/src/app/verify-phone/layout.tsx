import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Verify Your Phone",
  description: "Verify your phone number to complete your Ethio Nikah registration and access the Islamic matchmaking platform.",
  path: "/verify-phone",
});

export default function VerifyPhoneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
