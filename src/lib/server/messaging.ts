import "server-only";
import { bakery } from "@/data/bakery";
import type { ContactInput } from "@/lib/schemas/contact";
import { escapeHtml, singleLine } from "./security";

/**
 * Swappable backends. Each adapter reports whether it is configured, so the route
 * can tell "nothing is set up" (503) apart from "one adapter failed" (still ok).
 */
export interface MessageStore {
  readonly name: string;
  readonly configured: boolean;
  save(m: ContactInput & { ip: string }): Promise<void>;
}
export interface Notifier {
  readonly name: string;
  readonly configured: boolean;
  send(m: ContactInput): Promise<void>;
}

const timeout = () => AbortSignal.timeout(8000);

/** Source of truth: Supabase Postgres via PostgREST with the server-only service key. */
export const supabaseStore: MessageStore = {
  name: "supabase",
  get configured() {
    return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  async save(m) {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({ name: m.name, email: m.email ?? null, phone: m.phone ?? null, message: m.message, locale: m.locale, ip: m.ip }),
      signal: timeout(),
    });
    if (!res.ok) throw new Error(`supabase ${res.status}`);
  },
};

/** Optional mirror into the owners' existing Notion database (property names from the old setup). */
export const notionMirror: MessageStore = {
  name: "notion",
  get configured() {
    return !!process.env.NOTION_TOKEN && !!process.env.NOTION_DATABASE_ID;
  },
  async save(m) {
    const text = (content: string) => [{ text: { content: content.slice(0, 1900) } }];
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "notion-version": "2022-06-28",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          "Nom complet": { title: text(m.name) },
          ...(m.email ? { "Contact Email": { email: m.email } } : {}),
          ...(m.phone ? { Téléphone: { phone_number: m.phone } } : {}),
          "Date de soumission": { date: { start: new Date().toISOString() } },
          "Form Source": { select: { name: "Contact" } },
          message: { rich_text: text(m.message) },
        },
      }),
      signal: timeout(),
    });
    if (!res.ok) throw new Error(`notion ${res.status}`);
  },
};

/** Email to the owners through Resend. All user text is escaped; headers are single-line. */
export const resendNotifier: Notifier = {
  name: "resend",
  get configured() {
    return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM;
  },
  async send(m) {
    const row = (label: string, value?: string) =>
      value ? `<tr><td style="padding:6px 12px;color:#7E1420;font-weight:600">${escapeHtml(label)}</td><td style="padding:6px 12px">${escapeHtml(value)}</td></tr>` : "";
    const html = `<div style="font-family:system-ui,sans-serif;color:#2B1A14"><h2 style="color:#B3202A">Nouveau message du site</h2><table>${row("Nom", m.name)}${row("Email", m.email)}${row("Téléphone", m.phone)}${row("Langue", m.locale)}</table><p style="white-space:pre-wrap;background:#FBF4E8;padding:12px;border-radius:8px">${escapeHtml(m.message)}</p></div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [process.env.NOTIFICATION_EMAIL || bakery.notificationEmail],
        ...(m.email ? { reply_to: singleLine(m.email) } : {}),
        subject: `Ruban Rouge · message de ${singleLine(m.name).slice(0, 60)}`,
        html,
      }),
      signal: timeout(),
    });
    if (!res.ok) throw new Error(`resend ${res.status}`);
  },
};

export const stores: MessageStore[] = [supabaseStore, notionMirror];
export const notifiers: Notifier[] = [resendNotifier];
