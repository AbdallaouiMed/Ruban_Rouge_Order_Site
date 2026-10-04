import { setRequestLocale } from "next-intl/server";
import { SettingsView } from "@/components/admin/SettingsView";

export default async function Page({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsView />;
}
