import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbSchema, SITE_CONFIG } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const fullItems = [{ name: "Home", path: "/" }, ...items];

  return (
    <>
      <JsonLd data={breadcrumbSchema(fullItems)} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-charcoal-500 dark:text-charcoal-400 mb-6 flex-wrap">
        <Link href="/" className="flex items-center gap-1 hover:text-accent transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span className="sr-only">Home</span>
        </Link>
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-300 dark:text-charcoal-600" />
            {index === items.length - 1 ? (
              <span className="text-charcoal-900 dark:text-white font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="hover:text-accent transition-colors">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
