"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-ink-inverse shadow-card hover:bg-primary-hover active:scale-[0.98] disabled:bg-primary/40",
  secondary:
    "bg-surface text-ink border border-border-soft shadow-soft hover:border-border-strong active:scale-[0.98]",
  ghost: "text-ink-muted hover:bg-surface-muted active:scale-[0.98]",
  danger: "bg-danger-soft text-danger hover:brightness-95 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[0.95rem] gap-2",
  lg: "h-14 px-6 text-lg gap-2.5",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}
