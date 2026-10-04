"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { BarChart3, ClipboardList, ExternalLink, Image as ImageIcon, LogOut, Package, Settings, Volume2, VolumeX, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { DEMO_ADMIN_PASSWORD } from "@/lib/demo/config";
import { useDemoData } from "@/lib/demo/store";
import { adminBtnPrimary, fieldClass } from "./ui";

const nav = [
  { href: "/admin", label: "Tableau de bord", short: "Accueil", icon: BarChart3 },
  { href: "/admin/orders", label: "Commandes", short: "Commandes", icon: ClipboardList },
  { href: "/admin/products", label: "Produits et prix", short: "Produits", icon: Package },
  { href: "/admin/images", label: "Images du site", short: "Images", icon: ImageIcon },
  { href: "/admin/settings", label: "Réglages", short: "Réglages", icon: Settings },
] as const;

const SESSION_KEY = "rr-admin";
const SOUND_KEY = "rr-admin-sound";
const EVENT = "rr-session";

/* sessionStorage flag as an external store (falls back to memory when storage is blocked) */
const memory: Record<string, boolean> = {};
function readFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return memory[key] ?? false;
  }
}
function writeFlag(key: string, value: boolean) {
  memory[key] = value;
  try {
    if (value) sessionStorage.setItem(key, "1");
    else sessionStorage.removeItem(key);
  } catch {
    /* kept in memory */
  }
  window.dispatchEvent(new Event(EVENT));
}
function useFlag(key: string): boolean | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    () => readFlag(key),
    () => null,
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio not available */
  }
}

function Login() {
  const [error, setError] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("password") ?? "");
    if (pw === DEMO_ADMIN_PASSWORD) writeFlag(SESSION_KEY, true);
    else setError(true);
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-flour p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-md bg-white p-8 shadow-lift" aria-labelledby="login-title">
        <Logo />
        <div>
          <h1 id="login-title" className="font-display text-(length:--text-2xl)">Connexion</h1>
          <p className="mt-1 text-(length:--text-sm) text-cocoa-soft">
            Espace de gestion : commandes, produits, prix et réglages de la boutique.
          </p>
        </div>
        <div>
          <label htmlFor="pw" className="font-semibold">Mot de passe</label>
          <input id="pw" name="password" type="password" autoComplete="off" required autoFocus aria-invalid={error || undefined} aria-describedby={error ? "pw-err" : undefined} className={`${fieldClass} mt-1`} onChange={() => setError(false)} />
          {error && <p id="pw-err" role="alert" className="mt-1 text-(length:--text-sm) font-semibold text-danger">Mot de passe incorrect.</p>}
        </div>
        <button type="submit" className={`${adminBtnPrimary} w-full`}>Se connecter</button>
        <Link href="/" className="block text-center text-(length:--text-sm) font-semibold text-ribbon underline-offset-4 hover:underline">← Retour au site</Link>
      </form>
    </main>
  );
}

const TOAST_MS = 8000;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const orders = useDemoData((s) => s.orders);
  const authed = useFlag(SESSION_KEY);
  const sound = useFlag(SOUND_KEY) ?? false;

  // Orders that arrive while the admin is open (public checkout in another tab, or "simulate")
  // show as toasts for a few seconds. Derived from the list, so there is no state to sync.
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const toasts = orders
    .filter((o) => Date.parse(o.createdAt) >= openedAt && now - Date.parse(o.createdAt) < TOAST_MS && !dismissed.includes(o.id))
    .slice(0, 3);

  const lastCount = useRef(0);
  useEffect(() => {
    if (toasts.length > lastCount.current && sound) beep();
    lastCount.current = toasts.length;
  }, [toasts.length, sound]);

  if (authed === null) return <div className="min-h-dvh bg-flour" aria-hidden="true" />;
  if (!authed) return <Login />;

  const newCount = orders.filter((o) => o.status === "new").length;
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const toggleSound = () => {
    writeFlag(SOUND_KEY, !sound);
    if (!sound) beep();
  };

  return (
    <div className="min-h-dvh bg-flour lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden flex-col gap-6 bg-cocoa p-5 text-flour lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="rounded-sm bg-flour px-3 py-2"><Logo /></div>
        <nav aria-label="Administration" className="flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-sm px-3 font-semibold hover:bg-flour/10 aria-[current=page]:bg-ribbon">
              <Icon aria-hidden="true" className="size-5" />
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && newCount > 0 && <span className="grid min-w-6 place-items-center rounded-pill bg-saffron px-2 text-(length:--text-xs) font-bold text-cocoa">{newCount}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 text-(length:--text-sm)">
          <Link href="/" className="flex min-h-11 items-center gap-2 rounded-sm px-3 hover:bg-flour/10"><ExternalLink aria-hidden="true" className="size-4" />Voir le site</Link>
          <button type="button" onClick={toggleSound} aria-pressed={sound} className="flex min-h-11 w-full items-center gap-2 rounded-sm px-3 hover:bg-flour/10">{sound ? <Volume2 aria-hidden="true" className="size-4" /> : <VolumeX aria-hidden="true" className="size-4" />}Son des commandes : {sound ? "oui" : "non"}</button>
          <button type="button" onClick={() => writeFlag(SESSION_KEY, false)} className="flex min-h-11 w-full items-center gap-2 rounded-sm px-3 hover:bg-flour/10"><LogOut aria-hidden="true" className="size-4" />Se déconnecter</button>
        </div>
        <p className="rounded-sm bg-flour/10 p-3 text-(length:--text-xs)">Données enregistrées sur cet appareil.</p>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-cocoa px-4 py-2 text-flour lg:hidden">
          <div className="rounded-sm bg-flour px-2 py-1"><Logo /></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Couper le son" : "Activer le son"} className="grid size-11 place-items-center rounded-pill hover:bg-flour/10">{sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}</button>
            <Link href="/" aria-label="Voir le site" className="grid size-11 place-items-center rounded-pill hover:bg-flour/10"><ExternalLink aria-hidden="true" /></Link>
            <button type="button" onClick={() => writeFlag(SESSION_KEY, false)} aria-label="Se déconnecter" className="grid size-11 place-items-center rounded-pill hover:bg-flour/10"><LogOut aria-hidden="true" /></button>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-cocoa/10 bg-white lg:hidden">
        {nav.map(({ href, short, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-(length:--text-xs) font-semibold text-cocoa-soft aria-[current=page]:text-ribbon">
            <Icon aria-hidden="true" className="size-5" />
            {short}
            {href === "/admin/orders" && newCount > 0 && <span className="absolute end-1/4 top-1.5 grid min-w-5 place-items-center rounded-pill bg-ribbon px-1 text-(length:--text-xs) font-bold text-white">{newCount}</span>}
          </Link>
        ))}
      </nav>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-16 z-50 flex flex-col items-center gap-2 lg:inset-x-auto lg:end-6 lg:top-6 lg:items-end">
        {toasts.map((o) => (
          <div key={o.id} role="status" className="pointer-events-auto flex items-center gap-3 rounded-md bg-ribbon px-4 py-3 font-semibold text-white shadow-lift">
            <Link href="/admin/orders" className="underline-offset-4 hover:underline">Nouvelle commande {o.number} · {o.customer.name}</Link>
            <button type="button" aria-label="Fermer" onClick={() => setDismissed((d) => [...d, o.id])} className="grid size-8 place-items-center rounded-pill hover:bg-white/20"><X aria-hidden="true" className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
