import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Reset Password",
  description: "Set a new password for your Ethio Nikah account to regain access to the Islamic matchmaking platform.",
  path: "/reset-password",
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
