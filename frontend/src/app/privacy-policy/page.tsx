import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "Read the Ethio Nikah Privacy Policy. Learn how we collect, use, and protect your personal data on our Islamic matchmaking platform in compliance with applicable laws.",
  keywords: ["privacy policy", "data protection", "Ethio Nikah privacy", "user data", "GDPR"],
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      description="How Ethio Nikah collects, uses, and protects your personal data."
      breadcrumbItems={[{ name: "Privacy Policy", path: "/privacy-policy" }]}
    >
      <JsonLd
        data={{
          "@type": "PrivacyPolicy",
          name: "Ethio Nikah Privacy Policy",
          url: "https://ethionikah.com/privacy-policy",
          publisher: { "@id": "https://ethionikah.com/#organization" },
        }}
      />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-sm text-charcoal-400 dark:text-charcoal-500 mb-8">
          Last updated: August 2026
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">1. Introduction</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          Ethio Nikah ("we", "us", or "our") is an Islamic matchmaking platform that connects Muslim
          singles for the purpose of marriage. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our platform. By using Ethio Nikah,
          you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">2. Information We Collect</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-3">
          We collect the following types of information:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300 mb-6">
          <li><strong>Account Information:</strong> Name, email address, phone number, password (hashed), and profile details.</li>
          <li><strong>Profile Information:</strong> Photos, bio, preferences, Islamic practice level, education, occupation, and other details you choose to provide.</li>
          <li><strong>Activity Data:</strong> Messages, matches, likes, profile views, and other interactions on the platform.</li>
          <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
          <li><strong>Verification Data:</strong> Documents submitted for identity verification.</li>
        </ul>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300 mb-6">
          <li>To create and manage your account and profile.</li>
          <li>To facilitate matchmaking and communication between users.</li>
          <li>To verify user identity and maintain platform safety.</li>
          <li>To send notifications, updates, and support communications.</li>
          <li>To improve our services and develop new features.</li>
          <li>To comply with legal obligations and enforce our terms.</li>
        </ul>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">4. Data Sharing</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We do not sell your personal data. We share information only with other users as part of
          the matchmaking process (e.g., your profile is visible to other users), and with service
          providers who help us operate the platform (e.g., cloud hosting, email delivery). All
          service providers are bound by confidentiality obligations.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">5. Data Security</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We implement industry-standard security measures including encryption, secure servers,
          and access controls. Passwords are hashed using bcrypt. Despite our efforts, no method
          of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">6. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300 mb-6">
          <li><strong>Access:</strong> You can view your data in your profile and settings.</li>
          <li><strong>Correction:</strong> You can edit your profile information at any time.</li>
          <li><strong>Deletion:</strong> You can delete your account permanently from settings.</li>
          <li><strong>Export:</strong> You can request a copy of your data by contacting support.</li>
          <li><strong>Opt-out:</strong> You can disable notifications and marketing communications.</li>
        </ul>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">7. Cookies</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          We use cookies and similar technologies for authentication, session management, and
          analytics. You can control cookies through your browser settings.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">8. Children's Privacy</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-6">
          Ethio Nikah is intended for adults aged 18 and above. We do not knowingly collect
          information from minors. If you believe a minor has registered, please contact us.
        </p>

        <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3">9. Contact Us</h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:support@ethionikah.com" className="text-accent hover:underline">
            support@ethionikah.com
          </a>
          .
        </p>
      </div>
    </PublicPageLayout>
  );
}
