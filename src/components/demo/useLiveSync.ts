"use client";

import { useEffect } from "react";
import { isDemo } from "@/lib/demo/config";
import { isShared, pullOrders, pushOrder } from "@/lib/demo/live";
import { useDemoData } from "@/lib/demo/store";

const POLL_MS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * While `active`, pulls the shared order list about once a second (an unchanged list answers 304) and merges it
 * into this device's copy. Orders that exist here but not on the server are pushed again, so a missed or failed
 * send heals itself. Used by the admin and the order confirmation page, never the whole public site.
 */
export function useLiveSync(active: boolean) {
  useEffect(() => {
    if (!isDemo || !active) return;
    let stopped = false;
    let busy = false;
    let etag: string | null = null;

    const tick = async () => {
      if (stopped || busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const res = await pullOrders(etag);
        if (!res || res === "same" || stopped) return;
        etag = res.etag;
        const remote = new Set(res.orders.map((o) => o.id));
        useDemoData.getState().mergeRemote(res.orders);
        for (const o of useDemoData.getState().orders) {
          if (isShared(o) && !remote.has(o.id) && Date.now() - Date.parse(o.createdAt) < DAY_MS) void pushOrder(o);
        }
      } finally {
        busy = false;
      }
    };

    void tick();
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active]);
}
