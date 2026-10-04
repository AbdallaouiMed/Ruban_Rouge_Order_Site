import { z } from "zod";

/** Digits, spaces, dots, dashes, parentheses and a leading +; 8 to 15 digits overall. */
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, { message: "phone" });

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/**
 * Error messages are translation keys under `contact.errors`, resolved in the UI,
 * so the same schema validates on the client and the server.
 */
export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "name").max(100, "name"),
    email: z.preprocess(emptyToUndefined, z.string().trim().max(200).email("email").optional()),
    phone: z.preprocess(emptyToUndefined, phone.optional()),
    message: z.string().trim().min(10, "message").max(2000, "message"),
    locale: z.enum(["fr", "ar", "en"]).default("fr"),
    /** Honeypot: real users never see or fill this field. The route silently drops filled ones. */
    hp_trap: z.string().max(500).optional().default(""),
    turnstileToken: z.string().max(4096).optional(),
  })
  .refine((v) => v.email || v.phone, { message: "contact", path: ["email"] });

export type ContactInput = z.infer<typeof contactSchema>;

/** First error key per field, ready to render. */
const errorKeys = new Set(["name", "email", "phone", "message", "contact"]);

export function fieldErrors(error: z.ZodError): Partial<Record<"name" | "email" | "phone" | "message", string>> {
  const out: Partial<Record<"name" | "email" | "phone" | "message", string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as "name" | "email" | "phone" | "message" | undefined;
    if (!field || out[field]) continue;
    // Never leak zod's default English text to the UI: unknown messages fall back to the field's own key.
    out[field] = errorKeys.has(issue.message) ? issue.message : field;
  }
  return out;
}
