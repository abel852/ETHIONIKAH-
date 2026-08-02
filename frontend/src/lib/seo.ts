import type { Metadata } from "next";

const SITE_URL = "https://ethionikah.com";
const SITE_NAME = "Ethio Nikah";
const DEFAULT_IMAGE = "/application.png";

interface PageSEOInput {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  keywords,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
}: PageSEOInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 512,
          height: 512,
          alt: `${SITE_NAME} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export const SITE_CONFIG = {
  url: SITE_URL,
  name: SITE_NAME,
  description:
    "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia.",
  logo: `${SITE_URL}${DEFAULT_IMAGE}`,
  contactEmail: "support@ethionikah.com",
  contactPhone: "+251 11 123 4567",
  address: {
    country: "Ethiopia",
    region: "Addis Ababa",
  },
};

export const JSON_LD = {
  organization: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${DEFAULT_IMAGE}`,
    description: SITE_CONFIG.description,
    email: SITE_CONFIG.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ET",
      addressRegion: "Addis Ababa",
    },
    sameAs: [
      "https://www.facebook.com/ethionikah",
      "https://twitter.com/ethionikah",
      "https://www.instagram.com/ethionikah",
    ],
  },
  website: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/discover?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  webApplication: {
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "DatingApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ETB",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
};

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
