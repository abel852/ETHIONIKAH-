import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";

export const metadata: Metadata = createMetadata({
  title: "Marriage Tips for Muslim Singles",
  description:
    "Practical marriage tips for Muslim singles seeking a righteous spouse. Learn how to prepare for marriage, communicate effectively, and build a strong Islamic family foundation.",
  keywords: [
    "marriage tips",
    "Muslim marriage advice",
    "Islamic marriage preparation",
    "halal relationship tips",
    "finding a spouse",
  ],
  path: "/marriage-tips",
});

export default function MarriageTipsPage() {
  return (
    <PublicPageLayout
      title="Marriage Tips for Muslim Singles"
      description="Practical advice for Muslim singles seeking a righteous spouse."
      breadcrumbItems={[{ name: "Marriage Tips", path: "/marriage-tips" }]}
    >
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Finding the right spouse and building a successful marriage requires preparation,
          patience, and wisdom. Here are practical tips grounded in Islamic teachings to help
          you on your journey.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          1. Prepare Yourself First
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Before seeking a spouse, focus on becoming the best version of yourself. Strengthen your
          relationship with Allah, improve your character, and develop the skills needed for
          marriage. The Prophet (peace be upon him) said: "The best of you are those who are best
          to their families."
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          2. Make Dua Regularly
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Turn to Allah in prayer and ask Him for a righteous spouse. The Prophet (peace be upon
          him) taught us to pray Istikhara when making important decisions. Make dua with sincerity
          and trust in Allah's plan and timing.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          3. Prioritize Deen Over Everything
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          While physical attraction, education, and family background are important, religious
          commitment (deen) should be your top priority. A spouse with strong faith will help you
          raise a righteous family and grow closer to Allah together.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          4. Be Honest in Your Profile
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          When creating your profile on Ethio Nikah, be truthful about your Islamic practice,
          education, occupation, and what you are looking for. Honesty builds trust and helps you
          find someone truly compatible.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          5. Involve Your Family Early
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          In Ethiopian Muslim culture, family involvement is essential. Introduce potential
          matches to your family early in the process. Their wisdom and perspective can help you
          make the right decision. Ethio Nikah's wali feature makes this easy.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          6. Ask the Right Questions
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-4">
          When getting to know someone, ask about:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Their daily Islamic practice (prayer, fasting, Quran)</li>
          <li>Views on raising children with Islamic values</li>
          <li>Financial expectations and responsibilities</li>
          <li>Role of extended family in the marriage</li>
          <li>Career and education goals</li>
          <li>Where they want to live (Ethiopia or abroad)</li>
          <li>Expectations regarding hijab, modesty, and lifestyle</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          7. Take Your Time
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Don't rush into marriage. Take time to get to know the person, their family, and their
          character. Ethio Nikah's exclusive marriage process is designed to give you focused time
          with one potential spouse without distractions.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          8. Maintain Islamic Boundaries
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          While getting to know someone, maintain Islamic boundaries. Avoid inappropriate
          conversations, keep interactions purposeful, and involve a wali or family member.
          Remember that the goal is marriage, not casual chatting.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          9. Be Realistic
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          No one is perfect. Look for someone whose strengths complement your weaknesses and vice
          versa. Focus on the essentials and be willing to compromise on non-essential matters.
          A successful marriage is built on mutual respect, not perfection.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          10. Seek Advice from Trusted Sources
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Consult with your imam, family elders, and trusted friends. They can offer valuable
          perspective and help you see things you might miss. Marriage is a major life decision
          and seeking counsel is a Sunnah.
        </p>
      </div>
    </PublicPageLayout>
  );
}
