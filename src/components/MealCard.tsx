"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, COST_LABELS, KIND_EMOJI, KIND_LABELS, t } from "@/lib/strings";
import type { Meal } from "@/lib/types";

interface Props {
  meal: Meal;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

export function MealCard({ meal, onEdit, onToggleFavorite, onToggleEnabled, onDelete }: Props) {
  return (
    <Card className={cn("p-3", !meal.enabled && "opacity-55")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-muted text-3xl"
          aria-label={t.meals.edit}
        >
          {meal.emoji}
        </button>

        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-start">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-ink">{meal.name}</h3>
            {!meal.enabled ? (
              <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[0.7rem] text-ink-muted">
                {t.meals.disabled}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-ink-muted">
            {KIND_EMOJI[meal.kind]} {KIND_LABELS[meal.kind]} · ⏱ {t.common.minutes(meal.prepMinutes)} ·{" "}
            {COST_LABELS[meal.cost]} · {meal.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
          </p>
          {meal.tags.length ? (
            <p className="mt-1 truncate text-xs text-ink-muted/80">
              {meal.tags.map((tag) => `#${tag}`).join(" ")}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={t.form.favorite}
            aria-pressed={meal.favorite}
            className="grid h-9 w-9 place-items-center rounded-full text-lg transition hover:bg-surface-muted"
          >
            {meal.favorite ? "❤️" : "🤍"}
          </button>
          <details className="relative">
            <summary
              className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-ink-muted transition hover:bg-surface-muted"
              aria-label="עוד פעולות"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <circle cx="10" cy="4" r="1.6" />
                <circle cx="10" cy="10" r="1.6" />
                <circle cx="10" cy="16" r="1.6" />
              </svg>
            </summary>
            <div className="absolute end-0 z-20 mt-1 w-40 overflow-hidden rounded-[var(--radius-md)] border border-border-soft bg-bg-elevated shadow-pop">
              <button
                type="button"
                onClick={onToggleEnabled}
                className="block w-full px-4 py-2.5 text-start text-sm hover:bg-surface-muted"
              >
                {meal.enabled ? t.meals.disable : t.meals.enable}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="block w-full px-4 py-2.5 text-start text-sm text-danger hover:bg-danger-soft"
              >
                {t.meals.delete}
              </button>
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
}
