/**
 * Demo mode: while on, the cart, orders and admin run entirely in the browser (localStorage)
 * with placeholder data. There is no server, no real login and no real payment.
 * Launch builds must set NEXT_PUBLIC_DEMO_MODE=0 (enforced by scripts/check-placeholders.mjs),
 * and the real admin (Supabase Auth, server-side checks) replaces the demo one first.
 */
export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "0";

/** Password for the demo admin login. Not a security control: it ships in the page bundle. */
export const DEMO_ADMIN_PASSWORD = "demo";
