import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";

export const metadata: Metadata = createMetadata({
  title: "Islamic Marriage Guide",
  description:
    "A comprehensive guide to Islamic marriage for Ethiopian Muslims. Learn about the rulings, requirements, and etiquette of finding a spouse in accordance with Sharia and the prophetic tradition.",
  keywords: [
    "Islamic marriage guide",
    "halal marriage",
    "Muslim marriage rules",
    "Islamic wedding",
    "marriage in Islam",
    "Ethiopian Muslim marriage",
    "nikah guide",
  ],
  path: "/islamic-marriage-guide",
});

export default function IslamicMarriageGuidePage() {
  return (
    <PublicPageLayout
      title="Islamic Marriage Guide"
      description="A comprehensive guide to Islamic marriage for Ethiopian Muslims."
      breadcrumbItems={[{ name: "Islamic Marriage Guide", path: "/islamic-marriage-guide" }]}
    >
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Marriage in Islam is a sacred bond and a Sunnah of the Prophet Muhammad (peace be upon
          him). This guide provides essential information for Ethiopian Muslims seeking to marry
          in accordance with Islamic principles.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          The Importance of Marriage in Islam
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          The Prophet Muhammad (peace be upon him) said: "O young people, whoever among you can
          marry, should marry, because it helps him lower his gaze and guard his modestness."
          (Sahih Al-Bukhari). Marriage is considered half of one's faith and is highly encouraged
          in Islam for those who are able.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Requirements for Islamic Marriage
        </h2>
        <ul className="list-disc pl-6 space-y-3 text-charcoal-600 dark:text-charcoal-300">
          <li>
            <strong className="text-charcoal-900 dark:text-white">Mahr (Dowry):</strong> The groom
            must provide a mahr to the bride. This is her right and can be in the form of money,
            property, or other valuable items. The mahr is agreed upon by both parties.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Wali (Guardian):</strong> The
            bride's wali (typically her father or closest male relative) must consent to the
            marriage. A marriage without a wali is not valid in most Islamic schools of thought.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Witnesses:</strong> Two
            righteous Muslim witnesses must be present for the marriage contract (nikah).
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Offer and Acceptance:</strong>{" "}
            Both parties must clearly agree to the marriage. The offer (ijab) and acceptance
            (qabul) must be made in the same gathering.
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">Public Announcement:</strong>{" "}
            The marriage should be publicly announced. Islam discourages secret marriages.
          </li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Finding a Spouse the Halal Way
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-4">
          Islam provides clear guidelines for finding a spouse:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-charcoal-600 dark:text-charcoal-300">
          <li>Both parties should look at each other before marriage (with a chaperone) to ensure physical attraction.</li>
          <li>Conversations before marriage should be purposeful and focused on compatibility.</li>
          <li>Topics to discuss: Islamic practice, family expectations, financial situation, children, and lifestyle.</li>
          <li>The involvement of family and community is encouraged to ensure compatibility.</li>
          <li>Free mixing and dating as practiced in Western cultures is not permitted in Islam.</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          The Nikah Ceremony
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          The nikah is the Islamic marriage contract. It is typically conducted by an Imam or
          religious scholar. The ceremony includes the khutbah (sermon), the offer and acceptance,
          the announcement of the mahr, and the presence of witnesses. After the nikah, the couple
          is officially married in the eyes of Islam. In Ethiopia, it is also important to register
          the marriage with the civil authorities to ensure legal recognition.
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Qualities to Look for in a Spouse
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed mb-4">
          The Prophet Muhammad (peace be upon him) mentioned four qualities people marry for:
          wealth, family status, beauty, and religion. He recommended choosing a partner with
          strong religious commitment (deen) as the highest priority. Additional qualities to
          consider:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-charcoal-600 dark:text-charcoal-300">
          <li>Good character and manners (akhlaq)</li>
          <li>Compatibility in Islamic practice and values</li>
          <li>Ability to support a family (for men)</li>
          <li>Shared goals for family and children</li>
          <li>Cultural and family compatibility</li>
          <li>Education and intellectual compatibility</li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          Marriage in the Ethiopian Muslim Context
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          Ethiopian Muslims have a rich tradition of Islamic marriage that blends religious
          requirements with local customs. The Ethiopian Muslim community values family
          involvement, community gatherings, and celebrations. Ethio Nikah is designed to respect
          these traditions while providing a modern, safe platform for finding a spouse. We
          encourage users to involve their families and local imams in the process.
        </p>
      </div>
    </PublicPageLayout>
  );
}
