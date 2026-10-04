import { setRequestLocale } from "next-intl/server";
import { DashboardView } from "@/components/admin/DashboardView";

export default async function Page({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardView />;
}
