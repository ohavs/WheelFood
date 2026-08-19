import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn("rounded-[var(--radius-lg)] border border-border-soft bg-surface shadow-soft", className)}
    >
      {children}
    </div>
  );
}
