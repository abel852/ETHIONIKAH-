import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Forgot Password",
  description:
    "Reset your Ethio Nikah account password. Enter your email to receive a secure password reset link and regain access to your Islamic matchmaking account.",
  keywords: ["forgot password", "reset password", "Ethio Nikah account recovery"],
  path: "/forgot-password",
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
