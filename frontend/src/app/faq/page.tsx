import type { Metadata } from "next";
import { createMetadata, faqSchema } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";

const faqs = [
  {
    question: "What is Ethio Nikah?",
    answer:
      "Ethio Nikah is an Islamic matchmaking platform designed for Muslim singles in Ethiopia and the diaspora. We help you find a righteous spouse in a safe, Sharia-compliant environment with verified profiles and wali involvement.",
  },
  {
    question: "Is Ethio Nikah free to use?",
    answer:
      "Registration and basic features are free. We offer premium membership plans with enhanced features such as unlimited messaging, advanced search filters, and priority profile visibility.",
  },
  {
    question: "How does the exclusive marriage process work?",
    answer:
      "When two users enter an exclusive marriage process, they can only message each other. This prevents talking to multiple people simultaneously and promotes sincerity and commitment in the matchmaking journey.",
  },
  {
    question: "What is a wali and how does wali involvement work?",
    answer:
      "A wali is a female user's guardian in Islam. Ethio Nikah allows female users to register a wali who receives a secure invitation to oversee and approve the marriage process, ensuring Islamic principles are followed.",
  },
  {
    question: "How does profile verification work?",
    answer:
      "All users must verify their identity through our verification system, which includes email and phone verification. Additional identity verification may be required to display a verified badge on your profile.",
  },
  {
    question: "Is my data safe on Ethio Nikah?",
    answer:
      "Yes. We use industry-standard encryption and security measures to protect your data. Your personal information is never shared with third parties without your consent. You control your privacy settings.",
  },
  {
    question: "Can I use Ethio Nikah if I live outside Ethiopia?",
    answer:
      "Yes. Ethio Nikah is available to Ethiopian Muslims worldwide. Whether you are in the diaspora or living in Ethiopia, you can register and connect with other Muslim singles.",
  },
  {
    question: "How do I report inappropriate behavior?",
    answer:
      "You can report any user through the report button on their profile or through our contact support page. Our team reviews all reports promptly and takes appropriate action to maintain a safe community.",
  },
  {
    question: "What makes Ethio Nikah different from other matchmaking apps?",
    answer:
      "Ethio Nikah is built entirely on Islamic principles. We have an exclusive marriage process, wali involvement, strict community guidelines, identity verification, and no free mixing. Every feature is designed to move you closer to halal marriage.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "You can delete your account at any time from your settings page. Account deletion is permanent and will remove all your data from our platform in accordance with our privacy policy.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about Ethio Nikah, Ethiopia's Islamic matchmaking platform. Learn about our features, verification, wali involvement, and more.",
  keywords: [
    "Ethio Nikah FAQ",
    "Islamic matchmaking questions",
    "Muslim marriage platform help",
    "halal dating FAQ",
    "wali involvement",
  ],
  path: "/faq",
});

export default function FAQPage() {
  return (
    <PublicPageLayout
      title="Frequently Asked Questions"
      description="Find answers to common questions about Ethio Nikah."
      breadcrumbItems={[{ name: "FAQ", path: "/faq" }]}
    >
      <JsonLd data={faqSchema(faqs)} />

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-charcoal-100 dark:border-charcoal-800 pb-6"
          >
            <h2 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
              {faq.question}
            </h2>
            <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
