"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Full-height variant for forms; default hugs its content. */
  tall?: boolean;
}

/** Bottom sheet: the app's one modal surface (filters, results, forms). */
export function Sheet({ open, onClose, title, children, tall = false }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="wf-fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "wf-pop-in relative w-full max-w-lg rounded-t-[var(--radius-xl)] border border-b-0 border-border-soft bg-bg-elevated shadow-pop",
          tall ? "max-h-[92vh]" : "max-h-[85vh]",
          "flex flex-col",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-2">
          <div className="absolute inset-x-0 top-2 mx-auto h-1.5 w-10 rounded-full bg-border-strong" />
          {title ? <h2 className="mt-3 text-lg font-bold">{title}</h2> : <span className="mt-3" />}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-ink-muted transition hover:text-ink"
            aria-label="סגירה"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="wf-safe-bottom min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
