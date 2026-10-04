"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useUi } from "@/lib/demo/store";

// The drawer is only needed after the first tap on the cart, so its code is fetched then,
// not with every page. Once opened it stays mounted so closing and reopening is instant.
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

export function CartDrawerLoader() {
  const open = useUi((s) => s.cartOpen);
  const [wasOpened, setWasOpened] = useState(false);
  if (open && !wasOpened) setWasOpened(true); // derived during render: no effect needed
  return wasOpened ? <CartDrawer /> : null;
}
