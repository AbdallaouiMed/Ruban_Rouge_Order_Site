import { setRequestLocale } from "next-intl/server";
import { OrdersView } from "@/components/admin/OrdersView";

export default async function Page({ params }: PageProps<"/[locale]/admin/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OrdersView />;
}
