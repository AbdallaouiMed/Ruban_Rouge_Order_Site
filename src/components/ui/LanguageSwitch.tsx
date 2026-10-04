"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<string, { short: string; name: string }> = {
  fr: { short: "FR", name: "Français" },
  ar: { short: "ع", name: "العربية" },
  en: { short: "EN", name: "English" },
};

export function LanguageSwitch() {
  const current = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav aria-label={t("language")} className="inline-flex rounded-pill bg-butter p-1">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          lang={l}
          aria-current={l === current ? "true" : undefined}
          title={labels[l].name}
          className={
            "min-w-11 min-h-11 inline-flex items-center justify-center rounded-pill px-3 text-(length:--text-sm) font-semibold transition-colors " +
            (l === current ? "bg-ribbon text-white" : "text-cocoa hover:bg-flour")
          }
        >
          {labels[l].short}
        </Link>
      ))}
    </nav>
  );
}
