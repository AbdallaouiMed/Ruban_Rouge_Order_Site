"use client";

import { useEffect, type ReactNode } from "react";
import { useCart, useDemoData, useHydration } from "@/lib/demo/store";

/**
 * Loads the persisted cart and demo data after mount (never during SSR, so the server and the first
 * client render match), seeds demo orders once, and keeps tabs in sync through the `storage` event:
 * an order placed in one tab appears in an admin dashboard open in another.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let alive = true;
    Promise.all([useCart.persist.rehydrate(), useDemoData.persist.rehydrate()]).then(() => {
      if (!alive) return;
      useDemoData.getState().seedIfEmpty();
      useHydration.setState({ ready: true });
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === "rr-cart") void useCart.persist.rehydrate();
      if (e.key === "rr-demo") void useDemoData.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <>{children}</>;
}
