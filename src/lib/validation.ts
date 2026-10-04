/** Digits, spaces, dots, dashes, parentheses and a leading +; 8 to 15 digits overall. */
export const isValidPhone = (v: string) => {
  const t = v.trim();
  const digits = t.replace(/\D/g, "").length;
  return /^\+?[\d\s().-]+$/.test(t) && digits >= 8 && digits <= 15;
};

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Normalise a Moroccan or international phone to wa.me digits ("0663206008" -> "212663206008"). */
export const toWhatsAppNumber = (v: string) => {
  const digits = v.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  return digits;
};
