import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-6 font-semibold transition-[transform,background-color,box-shadow] duration-200 ease-(--ease-spring) active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ribbon text-white shadow-soft hover:bg-garnet hover:shadow-lift",
  secondary: "bg-butter text-garnet hover:bg-[#ecd3a3]",
  ghost: "text-ribbon hover:bg-butter",
  // For use on butter-coloured panels, where the secondary variant would blend in
  outline: "bg-white text-ribbon ring-2 ring-ribbon/40 hover:ring-ribbon",
};

export const buttonClasses = (variant: Variant = "primary", className = "") => `${base} ${variants[variant]} ${className}`;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

/** Locale-aware internal link styled as a button. */
export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
