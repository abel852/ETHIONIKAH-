import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { JSON_LD } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Us",
  description:
    "Learn about Ethio Nikah, Ethiopia's premier Islamic matchmaking platform. We help Muslim singles find righteous spouses in a safe, Sharia-compliant environment.",
  keywords: [
    "about Ethio Nikah",
    "Islamic matchmaking Ethiopia",
    "Muslim marriage platform",
    "halal matchmaking service",
    "Sharia-compliant dating",
  ],
  path: "/about",
});

export default function AboutPage() {
  return (
    <PublicPageLayout
      title="About Ethio Nikah"
      description="Learn about Ethio Nikah, Ethiopia's premier Islamic matchmaking platform."
      breadcrumbItems={[{ name: "About Us", path: "/about" }]}
    >
      <JsonLd
        data={{
          "@type": "AboutPage",
          name: "About Ethio Nikah",
          url: "https://ethionikah.com/about",
          description:
            "Ethio Nikah is Ethiopia's premier Islamic matchmaking platform designed for Muslim singles seeking righteous spouses.",
          publisher: { "@id": "https://ethionikah.com/#organization" },
        }}
      />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Ethio Nikah is Ethiopia's premier Islamic matchmaking platform, designed specifically
          for Muslim singles who are serious about finding a righteous spouse in accordance with
          Islamic principles. We combine modern technology with traditional values to create a
          safe, respectful, and Sharia-compliant environment for marriage seekers.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Our Mission
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Our mission is to facilitate meaningful, halal connections between Muslim men and women
          in Ethiopia and beyond. We believe that marriage is half of faith, and we are committed
          to making the search for a righteous spouse easier, safer, and more dignified. We strive
          to uphold the highest standards of Islamic ethics while leveraging modern technology to
          bring people together.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Our Values
        </h2>
        <ul className="space-y-3 text-charcoal-600 dark:text-charcoal-300">
          <li>
            <strong className="text-charcoal-900 dark:text-white">Sharia Compliance:</strong> Every
            feature on our platform is designed in accordance with Islamic principles. We do not
            allow free mixing, inappropriate content, or behavior that contradicts Islamic teachings.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Privacy & Safety:</strong> We
            employ rigorous verification processes and privacy controls to ensure a secure
            environment for all our users. Your data is protected and never shared without consent.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Wali Involvement:</strong> We
            encourage the involvement of a wali (guardian) in the matchmaking process, especially
            for sisters, in keeping with Islamic tradition.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Exclusivity:</strong> Our
            exclusive marriage process ensures that users focus on one potential spouse at a time,
            promoting sincerity and commitment.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Community:</strong> We are building
            a community of practicing Muslims who are serious about marriage and family life.
          </li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          How We Are Different
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Unlike conventional dating apps, Ethio Nikah is built from the ground up with Islamic
          values at its core. Our platform features a unique exclusive marriage process that
          prevents users from messaging multiple people simultaneously. We require identity
          verification, offer wali involvement, and maintain strict community guidelines. Every
          interaction on our platform is designed to move users closer to marriage, not away from it.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Who We Serve
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Ethio Nikah serves the Muslim community in Ethiopia and the Ethiopian diaspora worldwide.
          Whether you are in Addis Ababa, Dire Dawa, Mekelle, or living abroad, our platform
          connects you with like-minded Muslims who share your values and commitment to Islamic
          marriage. We welcome users from all Islamic schools of thought and cultural backgrounds
          within the Ethiopian Muslim community.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Join Us Today
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Ready to begin your journey toward a righteous marriage? Join Ethio Nikah today and
          connect with serious, verified Muslim singles who are looking for the same thing you are.
          Registration is free, and our premium plans offer enhanced features to help you find your
          match faster.
        </p>
      </div>
    </PublicPageLayout>
  );
}
