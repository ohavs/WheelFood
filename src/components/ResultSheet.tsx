"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORY_LABELS, COST_LABELS, KIND_EMOJI, KIND_LABELS, t } from "@/lib/strings";
import type { Meal } from "@/lib/types";

interface Props {
  meal: Meal;
  onAccept: () => void;
  onReroll: () => void;
  onClose: () => void;
}

export function ResultSheet({ meal, onAccept, onReroll, onClose }: Props) {
  return (
    <Sheet open onClose={onClose}>
      <div className="flex flex-col items-center gap-4 pb-2 pt-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t.result.title}</p>
        <div className="grid h-28 w-28 place-items-center rounded-full bg-primary-soft text-6xl">
          {meal.emoji}
        </div>
        <h2 className="text-3xl font-extrabold leading-tight text-ink">{meal.name}</h2>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted">
            {KIND_EMOJI[meal.kind]} {KIND_LABELS[meal.kind]}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted">
            ⏱ {t.common.minutes(meal.prepMinutes)}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted">
            {COST_LABELS[meal.cost]}
          </span>
          {meal.categories.slice(0, 2).map((category) => (
            <span key={category} className="rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted">
              {CATEGORY_LABELS[category]}
            </span>
          ))}
        </div>

        {meal.notes ? (
          <p className="max-w-sm rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-ink-muted">
            {meal.notes}
          </p>
        ) : null}

        <div className="mt-2 flex w-full flex-col gap-2">
          <Button size="lg" block onClick={onAccept}>
            {t.result.accept}
          </Button>
          <Button variant="ghost" block onClick={onReroll}>
            🔄 {t.result.reroll}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
