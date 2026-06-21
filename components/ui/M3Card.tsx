import { HTMLAttributes } from "react";

type Elevation = 0 | 1 | 2 | 3;
interface M3CardProps extends HTMLAttributes<HTMLDivElement> { elevation?: Elevation; variant?: "filled" | "outlined"; }

export function M3Card({ elevation = 1, variant = "filled", className = "", children, ...props }: M3CardProps) {
  const elevationClass = `shadow-elevation-${elevation}`;
  const variantClass = variant === "outlined" ? "border border-outline-variant bg-surface" : "bg-surface-container";
  return <div className={`rounded-m3-xl ${variantClass} ${elevationClass} transition-shadow duration-200 ${className}`} {...props}>{children}</div>;
}