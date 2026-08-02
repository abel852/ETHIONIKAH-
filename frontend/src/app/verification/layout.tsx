import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification",
  robots: { index: false, follow: false },
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
