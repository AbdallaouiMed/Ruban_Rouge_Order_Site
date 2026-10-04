import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isDemo } from "@/lib/demo/config";

/** Always-visible notice while the site runs on placeholder data. Hidden in launch builds. */
export async function DemoBanner() {
  if (!isDemo) return null;
  const t = await getTranslations("demo");
  return (
    <aside aria-label={t("label")} className="bg-cocoa px-4 py-2 text-center text-(length:--text-xs) text-flour">
      {t("banner")}{" "}
      {/* Vertical padding with an equal negative margin gives a 44px touch target without making the bar taller */}
      <Link href="/admin" className="-my-3 inline-block py-3 font-semibold text-saffron underline underline-offset-2">
        {t("adminLink")}
      </Link>
    </aside>
  );
}
