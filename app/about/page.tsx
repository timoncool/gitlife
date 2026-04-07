"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { ExternalLink } from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-2xl mx-auto px-4 py-10 md:py-14">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-5">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="flex flex-col min-h-full">
      <Header />

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-16 pb-6 md:pt-24 md:pb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {t("heroTitle")}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t("heroSubtitle")}
        </p>
      </section>

      <div className="border-t border-white/[0.06]" />

      <Section title={t("originTitle")}>
        <p>{t("originP1")}</p>
        <p>{t("originP2")}</p>
        <p>{t("originP3")}</p>
      </Section>

      <div className="border-t border-white/[0.06]" />

      <Section title={t("dataTitle")}>
        <p>{t("dataP1")}</p>
        <p>{t("dataP2")}</p>
        <p>{t("dataP3")}</p>
      </Section>

      <div className="border-t border-white/[0.06]" />

      <Section title={t("privacyTitle")}>
        <p>{t("privacyP1")}</p>
        <p>{t("privacyP2")}</p>
      </Section>

      <div className="border-t border-white/[0.06]" />

      <Section title={t("techTitle")}>
        <p className="font-mono text-sm">{t("techP1")}</p>
        <p>{t("techP2")}</p>
      </Section>

      <div className="border-t border-white/[0.06]" />

      <Section title={t("contributeTitle")}>
        <p>{t("contributeP1")}</p>
        <ul className="space-y-3 mt-4">
          <li className="flex gap-3"><span className="text-emerald-500 shrink-0">+</span><span>{t("contributeAdd")}</span></li>
          <li className="flex gap-3"><span className="text-emerald-500 shrink-0">+</span><span>{t("contributeTranslate")}</span></li>
          <li className="flex gap-3"><span className="text-emerald-500 shrink-0">+</span><span>{t("contributeFactors")}</span></li>
          <li className="flex gap-3"><span className="text-emerald-500 shrink-0">+</span><span>{t("contributeFix")}</span></li>
          <li className="flex gap-3"><span className="text-emerald-500 shrink-0">+</span><span>{t("contributeFeatures")}</span></li>
        </ul>
        <p className="mt-4">{t("contributeP2")}</p>
        <a
          href="https://github.com/timoncool/gitlife"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <GitHubIcon className="h-4 w-4" />
          github.com/timoncool/gitlife
          <ExternalLink className="h-3 w-3" />
        </a>
      </Section>
    </div>
  );
}
