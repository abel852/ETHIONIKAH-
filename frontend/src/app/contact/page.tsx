import type { Metadata } from "next";
import { createMetadata, SITE_CONFIG } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = createMetadata({
  title: "Contact Us",
  description:
    "Get in touch with Ethio Nikah support. Contact us for questions about our Islamic matchmaking platform, technical support, partnership inquiries, or feedback.",
  keywords: ["contact Ethio Nikah", "support", "help", "Islamic matchmaking contact", "customer service"],
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PublicPageLayout
      title="Contact Us"
      description="Get in touch with the Ethio Nikah team."
      breadcrumbItems={[{ name: "Contact", path: "/contact" }]}
    >
      <JsonLd
        data={{
          "@type": "ContactPage",
          name: "Contact Ethio Nikah",
          url: "https://ethionikah.com/contact",
          email: SITE_CONFIG.contactEmail,
          publisher: { "@id": "https://ethionikah.com/#organization" },
        }}
      />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          We are here to help. Whether you have a question about our platform, need technical
          support, or want to share feedback, our team is ready to assist you.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Get in Touch
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 not-prose">
          <div className="p-6 rounded-2xl border border-charcoal-100 dark:border-charcoal-800 bg-charcoal-50 dark:bg-charcoal-800/30">
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-charcoal-600 dark:text-charcoal-300 text-sm mb-3">
              For general inquiries and support
            </p>
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="text-accent hover:underline font-medium"
            >
              {SITE_CONFIG.contactEmail}
            </a>
          </div>

          <div className="p-6 rounded-2xl border border-charcoal-100 dark:border-charcoal-800 bg-charcoal-50 dark:bg-charcoal-800/30">
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-2">Phone</h3>
            <p className="text-charcoal-600 dark:text-charcoal-300 text-sm mb-3">
              Available Sunday–Thursday, 9am–5pm EAT
            </p>
            <a
              href={`tel:${SITE_CONFIG.contactPhone.replace(/\s/g, "")}`}
              className="text-accent hover:underline font-medium"
            >
              {SITE_CONFIG.contactPhone}
            </a>
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Response Time
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          We strive to respond to all inquiries within 24–48 hours. For urgent matters related to
          safety or security, please use the in-app report feature for faster response.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Report a Problem
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          If you encounter inappropriate behavior, a technical issue, or a security concern, please
          report it through the in-app report button or contact us directly. All reports are
          treated confidentially and investigated promptly.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Partnership Inquiries
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          For mosque partnerships, community organizations, or business inquiries, please email us
          with the subject line "Partnership Inquiry" and we will connect you with the right team.
        </p>
      </div>
    </PublicPageLayout>
  );
}
