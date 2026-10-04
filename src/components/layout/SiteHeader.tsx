"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { useCart, useUi } from "@/lib/demo/store";

const links = [
  { href: "/menu", key: "menu" },
  { href: "/box", key: "box" },
  { href: "/cakes", key: "cakes" },
  { href: "/occasions", key: "occasions" },
  { href: "/story", key: "story" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // The menu is open only for the page it was opened on, so navigating closes it
  // without an effect that sets state.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setCartOpen = useUi((s) => s.setCartOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/10 bg-flour/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Ruban Rouge" className="inline-flex min-h-11 items-center rounded-sm">
          <Logo />
        </Link>

        <nav aria-label={t("primary")} className="hidden items-center lg:flex">
          {links.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className="relative min-h-11 content-center whitespace-nowrap px-2.5 font-semibold text-cocoa hover:text-ribbon aria-[current=page]:text-ribbon"
            >
              {t(key)}
              {isActive(href) && <span aria-hidden="true" className="ribbon-divider absolute inset-x-2 -bottom-0.5 h-3" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden lg:block">
            <LanguageSwitch />
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`${t("cart")}${count ? ` (${count})` : ""}`}
            className="relative inline-flex size-11 items-center justify-center rounded-pill text-cocoa hover:bg-butter"
          >
            <ShoppingBag aria-hidden="true" />
            {count > 0 && (
              <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-pill bg-ribbon px-1 text-(length:--text-xs) font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-pill text-cocoa hover:bg-butter lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-nav" hidden={!open} className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cocoa/10 bg-flour px-4 pb-5 pt-2 lg:hidden">
        <nav aria-label={t("primary")} className="flex flex-col">
          {links.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className="min-h-12 content-center border-b border-cocoa/10 font-display text-(length:--text-xl) text-cocoa aria-[current=page]:text-ribbon"
            >
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="mt-4">
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}
