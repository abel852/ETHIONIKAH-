"use client";

import { useI18n } from "@/context/I18nContext";
import { PublicPageLayout } from "@/components/seo/PublicPageLayout";
import { JsonLd } from "@/components/seo/JsonLd";

export default function AboutContent() {
  const { t } = useI18n();

  return (
    <PublicPageLayout
      title={t("about.title")}
      description={t("about.description")}
      breadcrumbItems={[{ name: t("about.title"), path: "/about" }]}
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
          {t("about.intro")}
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          {t("about.missionTitle")}
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          {t("about.missionText")}
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          {t("about.valuesTitle")}
        </h2>
        <ul className="space-y-3 text-charcoal-600 dark:text-charcoal-300">
          <li>
            <strong className="text-charcoal-900 dark:text-white">{t("about.value1Title")}</strong>{" "}
            {t("about.value1Text")}
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">{t("about.value2Title")}</strong>{" "}
            {t("about.value2Text")}
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">{t("about.value3Title")}</strong>{" "}
            {t("about.value3Text")}
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">{t("about.value4Title")}</strong>{" "}
            {t("about.value4Text")}
          </li>
          <li>
            <strong className="text-charcoal-900 dark:text-white">{t("about.value5Title")}</strong>{" "}
            {t("about.value5Text")}
          </li>
        </ul>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          {t("about.differentTitle")}
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          {t("about.differentText")}
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          {t("about.serveTitle")}
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          {t("about.serveText")}
        </p>

        <h2 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mt-10 mb-4">
          {t("about.joinTitle")}
        </h2>
        <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          {t("about.joinText")}
        </p>
      </div>
    </PublicPageLayout>
  );
}
