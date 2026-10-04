import { setRequestLocale } from "next-intl/server";
import { ImagesView } from "@/components/admin/ImagesView";

export default async function Page({ params }: PageProps<"/[locale]/admin/images">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ImagesView />;
}
