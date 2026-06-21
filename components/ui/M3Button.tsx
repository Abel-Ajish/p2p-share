"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "filled" | "tonal" | "outlined" | "text";

interface M3ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; icon?: React.ReactNode; }

const variantClasses: Record<Variant, string> = {
  filled: "bg-primary text-on-primary hover:shadow-elevation-1 active:scale-[0.98]",
  tonal: "bg-primary-container text-on-primary-container hover:shadow-elevation-1 active:scale-[0.98]",
  outlined: "bg-transparent border border-outline text-on-surface hover:bg-on-surface/5 active:scale-[0.98]",
  text: "bg-transparent text-primary hover:bg-primary/10 active:scale-[0.98]",
};

export const M3Button = forwardRef<HTMLButtonElement, M3ButtonProps>(({ variant = "filled", icon, className = "", children, ...props }, ref) => (
  <button ref={ref} className={`inline-flex items-center justify-center gap-2 rounded-m3-full px-6 py-2.5 font-body text-sm font-medium tracking-wide transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`} {...props}>
    {icon}{children}
  </button>
));
M3Button.displayName = "M3Button";