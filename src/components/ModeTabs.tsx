"use client";

import { cn } from "@/lib/cn";
import { MODE_EMOJI, MODE_LABELS } from "@/lib/strings";
import { MODES, type Mode } from "@/lib/types";

interface Props {
  value: Mode;
  onChange: (next: Mode) => void;
  /** Optional per-tab badge, e.g. how many meals that side holds. */
  counts?: Record<Mode, number>;
}

/** The app's top-level split: cooking at home vs eating out. */
export function ModeTabs({ value, onChange, counts }: Props) {
  return (
    <div
      role="tablist"
      aria-label="סוג ארוחה"
      className="flex w-full gap-1 rounded-full border border-border-soft bg-surface-muted p-1"
    >
      {MODES.map((mode) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-150",
              active ? "bg-surface text-ink shadow-soft" : "text-ink-muted",
            )}
          >
            <span aria-hidden="true">{MODE_EMOJI[mode]}</span>
            {MODE_LABELS[mode]}
            {counts ? (
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold",
                  active ? "bg-primary text-ink-inverse" : "bg-border-soft text-ink-muted",
                )}
              >
                {counts[mode]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
