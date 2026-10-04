import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors } from "@/lib/schemas/contact";

const valid = { name: "Salma B.", email: "salma@example.com", message: "Bonjour, je voudrais commander un gâteau.", locale: "fr" };

describe("contactSchema", () => {
  it("accepts a valid message with an email only", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid message with a phone only (empty email string)", () => {
    const r = contactSchema.safeParse({ ...valid, email: "", phone: "+212 6 63 20 60 08" });
    expect(r.success).toBe(true);
  });

  it("requires at least one of email or phone", () => {
    const r = contactSchema.safeParse({ ...valid, email: "", phone: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).email).toBe("contact");
  });

  it("rejects a short name and a short message with their own keys", () => {
    const r = contactSchema.safeParse({ ...valid, name: "A", message: "court" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.name).toBe("name");
      expect(e.message).toBe("message");
    }
  });

  it("rejects an invalid email and a malformed phone", () => {
    const bad = contactSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(bad.success).toBe(false);
    const phone = contactSchema.safeParse({ ...valid, email: "", phone: "abc123" });
    expect(phone.success).toBe(false);
    if (!phone.success) expect(fieldErrors(phone.error).phone).toBe("phone");
  });

  it("caps the message at 2000 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(2000) }).success).toBe(true);
  });

  it("rejects unknown locales and defaults a missing one to fr", () => {
    expect(contactSchema.safeParse({ ...valid, locale: "de" }).success).toBe(false);
    const noLocale = Object.fromEntries(Object.entries(valid).filter(([k]) => k !== "locale"));
    const r = contactSchema.safeParse(noLocale);
    expect(r.success && r.data.locale).toBe("fr");
  });

  it("carries the honeypot through so the route can detect it", () => {
    const r = contactSchema.safeParse({ ...valid, hp_trap: "http://spam.example" });
    // Must still parse: the route silently drops it (fake success) so bots learn nothing.
    expect(r.success && r.data.hp_trap).toBe("http://spam.example");
  });
});
