import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Info",
  robots: { index: false, follow: false },
};

export default function HealthInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
