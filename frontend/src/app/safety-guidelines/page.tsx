import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";

export const metadata: Metadata = createMetadata({
  title: "Safety Guidelines",
  description:
    "Stay safe on Ethio Nikah with our comprehensive safety guidelines. Learn how to protect your privacy, identify red flags, and report suspicious behavior on our Islamic matchmaking platform.",
  keywords: [
    "safety guidelines",
    "online dating safety",
    "Islamic matchmaking safety",
    "protect privacy",
    "report abuse",
  ],
  path: "/safety-guidelines",
});

export default function SafetyGuidelinesPage() {
  return (
    <PublicPageLayout
      title="Safety Guidelines"
      description="Stay safe while using Ethio Nikah."
      breadcrumbItems={[{ name: "Safety Guidelines", path: "/safety-guidelines" }]}
    >
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Your safety is our top priority. While Ethio Nikah is designed to be a safe and secure
          platform, it is important to follow these guidelines to protect yourself and others.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          1. Protect Your Personal Information
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Do not share your phone number, email, or social media handles until you are confident in the person.</li>
          <li>Never share your home address, workplace, or financial information.</li>
          <li>Use the in-app messaging system to communicate — it is monitored for safety.</li>
          <li>Ethio Nikah automatically blocks phone numbers and social media handles in messages.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          2. Verify Before You Trust
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Look for the verified badge on profiles — it indicates identity verification.</li>
          <li>Be cautious of profiles with no photos, incomplete information, or vague answers.</li>
          <li>Ask questions and look for consistency in their responses.</li>
          <li>Be wary of anyone who seems too good to be true or tries to move too quickly.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          3. Recognize Red Flags
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Requests for money or financial assistance — never send money to anyone on the platform.</li>
          <li>Pressure to communicate outside the platform or meet in private.</li>
          <li>Inconsistent information or evasive answers to direct questions.</li>
          <li>Declining to involve family or a wali in the process.</li>
          <li>Aggressive, controlling, or disrespectful behavior.</li>
          <li>Claims of being in an emergency situation that requires your help.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          4. Meeting in Person
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Always meet in a public place with family members or a chaperone present.</li>
          <li>Inform your family and friends about the meeting details.</li>
          <li>Never meet alone in a private location for the first time.</li>
          <li>Follow Islamic etiquette — dress modestly and maintain appropriate boundaries.</li>
          <li>Arrange your own transportation to and from the meeting.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          5. Report Suspicious Behavior
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-4">
          If you encounter any of the following, report it immediately using the in-app report
          button or contact support:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Requests for money or financial information</li>
          <li>Fake or fraudulent profiles</li>
          <li>Harassment, threats, or abusive language</li>
          <li>Inappropriate or explicit content</li>
          <li>Attempts to circumvent platform safety features</li>
          <li>Suspicious links or attachments</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          6. Use Platform Features
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li><strong>Block users:</strong> If someone makes you uncomfortable, block them immediately.</li>
          <li><strong>Wali involvement:</strong> Use the wali feature to have a guardian oversee your interactions.</li>
          <li><strong>Exclusive process:</strong> The exclusive marriage process limits communication to one person at a time.</li>
          <li><strong>Privacy settings:</strong> Control who can see your profile and photos.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          7. Online Security Best Practices
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Use a strong, unique password for your account.</li>
          <li>Enable two-factor authentication if available.</li>
          <li>Do not share your account credentials with anyone.</li>
          <li>Log out from shared or public computers.</li>
          <li>Keep your browser and operating system updated.</li>
          <li>Be cautious of phishing emails claiming to be from Ethio Nikah.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          8. Emergency Contacts
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          If you feel threatened or in danger, contact local authorities immediately. For
          platform-related safety concerns, email us at{" "}
          <a href="mailto:support@ethionikah.com" className="text-accent hover:underline">
            support@ethionikah.com
          </a>{" "}
          or use the in-app report feature for immediate action.
        </p>
      </div>
    </PublicPageLayout>
  );
}
