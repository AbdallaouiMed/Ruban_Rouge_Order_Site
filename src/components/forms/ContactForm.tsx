"use client";

import { useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { contactSchema, fieldErrors } from "@/lib/schemas/contact";
import { isDemo } from "@/lib/demo/config";

type Field = "name" | "email" | "phone" | "message";
type Status = "idle" | "sending" | "success" | "error" | "rate_limited";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileWindow = Window & { turnstile?: { reset: () => void } };

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      message: String(fd.get("message") ?? ""),
      hp_trap: String(fd.get("hp_trap") ?? ""),
      turnstileToken:
        String(fd.get("cf-turnstile-response") ?? "") || undefined,
      locale,
    };

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setStatus("idle");
      const first = (["name", "email", "phone", "message"] as Field[]).find(
        (f) => errs[f],
      );
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        form.reset();
        setStatus("success");
      } else if (res.status === 400) {
        const data = (await res.json()) as {
          fields?: Partial<Record<Field, string>>;
        };
        setErrors(data.fields ?? {});
        setStatus("idle");
      } else {
        setStatus(res.status === 429 ? "rate_limited" : "error");
      }
    } catch {
      setStatus("error");
    } finally {
      // Turnstile tokens are single-use: get a fresh one so a retry is not rejected as a replay.
      (window as TurnstileWindow).turnstile?.reset();
    }
  }

  const input =
    "mt-1 min-h-12 w-full rounded-sm border bg-white px-4 py-2 outline-offset-2 aria-[invalid=true]:border-danger aria-[invalid=true]:border-2 border-cocoa/30";

  const fieldProps = (f: Field) => ({
    id: `contact-${f}`,
    name: f,
    "aria-invalid": errors[f] ? (true as const) : undefined,
    "aria-describedby": errors[f] ? `contact-${f}-error` : undefined,
  });

  const err = (f: Field) =>
    errors[f] ? (
      <p
        id={`contact-${f}-error`}
        className="mt-1 text-(length:--text-sm) font-semibold text-danger"
      >
        {t(`errors.${errors[f]}`)}
      </p>
    ) : null;

  return (
    <>
      {/* Mounted from the start: screen readers announce changes inside an existing live region,
          not a region inserted together with its text. */}
      <div role="status" aria-live="polite">
        {status === "success" && (
          <div className="rounded-md bg-success p-6 text-white">
            <CheckCircle2 aria-hidden="true" className="mb-2 size-8" />
            <p className="font-semibold">{t("success")}</p>
            {isDemo && <p className="mt-1 text-sm">{t("demoNote")}</p>}
          </div>
        )}
      </div>
      {status !== "success" && (
        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="space-y-5"
          aria-label={t("formTitle")}
        >
          <div>
            <label htmlFor="contact-name" className="font-semibold">
              {t("name")} <span className="font-normal text-cocoa-soft">*</span>
            </label>
            <input
              {...fieldProps("name")}
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              className={input}
            />
            {err("name")}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-email" className="font-semibold">
                {t("email")}
              </label>
              <input
                {...fieldProps("email")}
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={200}
                dir="ltr"
                className={input}
              />
              {err("email")}
            </div>
            <div>
              <label htmlFor="contact-phone" className="font-semibold">
                {t("phone")}
              </label>
              <input
                {...fieldProps("phone")}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={30}
                dir="ltr"
                className={input}
              />
              {err("phone")}
            </div>
          </div>
          <p className="-mt-2 text-(length:--text-sm) text-cocoa-soft">
            {t("contactHint")}
          </p>

          <div>
            <label htmlFor="contact-message" className="font-semibold">
              {t("message")}{" "}
              <span className="font-normal text-cocoa-soft">*</span>
            </label>
            <textarea
              {...fieldProps("message")}
              rows={6}
              required
              minLength={10}
              maxLength={2000}
              className={input}
            />
            {err("message")}
          </div>

          {/* Honeypot: hidden from people and assistive tech, bots fill it */}
          <div
            aria-hidden="true"
            className="absolute -start-[9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="contact-hp-trap">Leave this field empty</label>
            <input
              id="contact-hp-trap"
              name="hp_trap"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {siteKey && (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="lazyOnload"
              />
              <div className="cf-turnstile" data-sitekey={siteKey} />
            </>
          )}

          <div aria-live="polite" className="min-h-6">
            {status === "error" && (
              <p className="font-semibold text-danger">{t("error")}</p>
            )}
            {status === "rate_limited" && (
              <p className="font-semibold text-danger">{t("rateLimited")}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex min-h-12 items-center justify-center rounded-pill bg-ribbon px-8 font-semibold text-white shadow-soft transition-[transform,background-color] duration-200 ease-(--ease-spring) hover:bg-garnet active:scale-[0.97] disabled:opacity-60"
          >
            {status === "sending" ? t("sending") : t("send")}
          </button>
        </form>
      )}
    </>
  );
}
