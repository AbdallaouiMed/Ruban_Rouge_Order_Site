import { setRequestLocale } from "next-intl/server";
import { ProductsView } from "@/components/admin/ProductsView";

export default async function Page({ params }: PageProps<"/[locale]/admin/products">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProductsView />;
}
