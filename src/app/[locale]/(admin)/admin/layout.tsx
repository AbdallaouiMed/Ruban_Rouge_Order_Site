import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isDemo } from "@/lib/demo/config";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Demo admin. It exists only while demo mode is on: the real admin (server-side auth, database)
 * replaces it before launch, and launch builds set NEXT_PUBLIC_DEMO_MODE=0 so this route 404s.
 */
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isDemo) notFound();
  // The admin is French only: other locales land on the French one.
  if (locale !== "fr") redirect({ href: "/admin", locale: "fr" });
  return <AdminShell>{children}</AdminShell>;
}
