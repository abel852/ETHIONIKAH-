import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description:
    "Read the Ethio Nikah Terms of Service. Understand the rules and guidelines for using our Islamic matchmaking platform, including user obligations and prohibited conduct.",
  keywords: ["terms of service", "terms and conditions", "user agreement", "platform rules"],
  path: "/terms-of-service",
});

export default function TermsOfServicePage() {
  return (
    <PublicPageLayout
      title="Terms of Service"
      description="The rules and guidelines for using Ethio Nikah."
      breadcrumbItems={[{ name: "Terms of Service", path: "/terms-of-service" }]}
    >
      <JsonLd
        data={{
          "@type": "TermsOfService",
          name: "Ethio Nikah Terms of Service",
          url: "https://ethionikah.com/terms-of-service",
          publisher: { "@id": "https://ethionikah.com/#organization" },
        }}
      />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-sm text-charcoal-400 dark:text-charcoal-500 mb-8">
          Last updated: August 2026
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          By registering for or using Ethio Nikah, you agree to be bound by these Terms of Service.
          If you do not agree with any part of these terms, you must not use our platform.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">2. Eligibility</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          You must be at least 18 years old and legally capable of entering into a marriage contract
          under Islamic and applicable law. By using the platform, you confirm that you are single
          (never married, divorced, or widowed) and seeking marriage in accordance with Islamic
          principles.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">3. User Obligations</h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300 mb-6">
          <li>Provide accurate and truthful information in your profile.</li>
          <li>Maintain the confidentiality of your account credentials.</li>
          <li>Use the platform solely for the purpose of seeking halal marriage.</li>
          <li>Treat other users with respect and Islamic adab (etiquette).</li>
          <li>Comply with all applicable laws and Islamic principles.</li>
          <li>Report any suspicious or inappropriate behavior to our team.</li>
        </ul>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">4. Prohibited Conduct</h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300 mb-6">
          <li>Creating fake or fraudulent profiles.</li>
          <li>Harassing, abusing, or threatening other users.</li>
          <li>Sharing inappropriate, explicit, or non-halal content.</li>
          <li>Using the platform for commercial purposes or advertising.</li>
          <li>Attempting to circumvent the exclusive marriage process.</li>
          <li>Sharing contact information (phone numbers, social media) before marriage.</li>
          <li>Using bots, scrapers, or automated tools.</li>
          <li>Impersonating another person or entity.</li>
        </ul>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">5. Exclusive Marriage Process</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          Our platform features an exclusive marriage process. When you enter this process with
          another user, you can only communicate with that person. This feature is designed to
          promote sincerity and commitment. Attempting to circumvent this restriction is a
          violation of these terms.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">6. Wali Involvement</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          Female users are encouraged to involve a wali (guardian) in the matchmaking process.
          The wali receives a secure invitation to oversee the marriage process. This feature
          is designed in accordance with Islamic principles and is optional but recommended.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">7. Subscriptions and Payments</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We offer premium subscription plans with enhanced features. Payments are processed
          securely through our payment partners. Subscription fees are non-refundable except as
          required by law. You can cancel your subscription at any time from your settings.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">8. Account Termination</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We may suspend or terminate your account if you violate these terms. You may delete your
          account at any time from your settings. Upon termination, your data will be removed in
          accordance with our Privacy Policy.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">9. Disclaimer</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          Ethio Nikah is a platform that facilitates connections. We do not guarantee that you
          will find a spouse through our platform. We are not responsible for the conduct of users
          or the outcome of any interactions. You use the platform at your own risk.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">10. Limitation of Liability</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          To the maximum extent permitted by law, Ethio Nikah shall not be liable for any indirect,
          incidental, special, or consequential damages arising from your use of the platform.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">11. Changes to Terms</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We may update these terms from time to time. Continued use of the platform after changes
          constitutes acceptance of the updated terms.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">12. Contact</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          For questions about these Terms, contact us at{" "}
          <a href="mailto:support@ethionikah.com" className="text-accent hover:underline">
            support@ethionikah.com
          </a>
          .
        </p>
      </div>
    </PublicPageLayout>
  );
}
