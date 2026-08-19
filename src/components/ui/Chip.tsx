"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

/** Filter/selection pill. Used for categories, kinds, tags. */
export function Chip({ selected = false, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
        selected
          ? "border-transparent bg-primary text-ink-inverse shadow-soft"
          : "border-border-soft bg-surface text-ink-muted hover:border-border-strong",
        className,
      )}
    >
      {children}
    </button>
  );
}
