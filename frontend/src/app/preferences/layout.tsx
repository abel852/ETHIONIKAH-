import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences",
  robots: { index: false, follow: false },
};

export default function PreferencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
