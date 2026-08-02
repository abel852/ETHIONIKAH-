import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { Footer } from "@/components/layout";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";
import { JSON_LD } from "@/lib/seo";

interface PublicPageLayoutProps {
  title: string;
  description: string;
  breadcrumbItems: { name: string; path: string }[];
  children: React.ReactNode;
  showJsonLd?: boolean;
}

export function PublicPageLayout({
  title,
  breadcrumbItems,
  children,
  showJsonLd = true,
}: PublicPageLayoutProps) {
  return (
    <>
      {showJsonLd && (
        <JsonLd data={[JSON_LD.organization, JSON_LD.website]} />
      )}
      <div className="min-h-screen bg-white dark:bg-charcoal-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-100 dark:border-charcoal-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/application.png" alt="Ethio Nikah Logo" width={36} height={36} className="rounded-lg" />
              <span className="font-display font-bold text-lg text-charcoal-900 dark:text-white">
                Ethio <span className="text-accent">Nikah</span>
              </span>
            </Link>
            <Link href="/" className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-charcoal-900 dark:text-white mb-2">
            {title}
          </h1>
          <div className="w-20 h-1 bg-accent rounded-full mb-8" />
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}
