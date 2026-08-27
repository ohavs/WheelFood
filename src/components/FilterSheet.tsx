"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Label, Toggle } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORY_EMOJI, CATEGORY_LABELS, COST_LABELS, KIND_EMOJI, KIND_LABELS, t } from "@/lib/strings";
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  MODE_KINDS,
  type Category,
  type Cost,
  type Filters,
  type Kind,
} from "@/lib/types";

const PREP_OPTIONS: (number | null)[] = [null, 10, 20, 30, 45, 60];
const RECENT_OPTIONS = [0, 3, 7, 14];

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

interface Props {
  onClose: () => void;
  filters: Filters;
  availableTags: string[];
  onApply: (next: Filters) => void;
}

/**
 * Mounted only while open (see WheelScreen), so the draft starts from the
 * live filters without an effect syncing props into state.
 */
export function FilterSheet({ onClose, filters, availableTags, onApply }: Props) {
  const [draft, setDraft] = useState<Filters>(filters);

  const patch = (next: Partial<Filters>) => setDraft((prev) => ({ ...prev, ...next }));

  return (
    <Sheet open onClose={onClose} title={t.filters.title} tall>
      <div className="flex flex-col gap-6 pt-2">
        <section>
          <Label>{t.filters.categories}</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                selected={draft.categories.includes(category)}
                onClick={() =>
                  patch({
                    categories: toggleIn<Category>(draft.categories, category),
                  })
                }
              >
                <span>{CATEGORY_EMOJI[category]}</span>
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </section>

        {/* Home has a single kind, so the chips would be a no-op there — the
            mode tabs already made that choice. */}
        {MODE_KINDS[draft.mode].length > 1 ? (
          <section>
            <Label>{t.filters.kinds}</Label>
            <div className="flex flex-wrap gap-2">
              {MODE_KINDS[draft.mode].map((kind) => (
                <Chip
                  key={kind}
                  selected={draft.kinds.includes(kind)}
                  onClick={() => patch({ kinds: toggleIn<Kind>(draft.kinds, kind) })}
                >
                  <span>{KIND_EMOJI[kind]}</span>
                  {KIND_LABELS[kind]}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        {availableTags.length > 0 ? (
          <section>
            <Label>{t.filters.tags}</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Chip
                  key={tag}
                  selected={draft.tags.includes(tag)}
                  onClick={() => patch({ tags: toggleIn(draft.tags, tag) })}
                >
                  #{tag}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <Label>{t.filters.maxPrep}</Label>
          <div className="flex flex-wrap gap-2">
            {PREP_OPTIONS.map((minutes) => (
              <Chip
                key={String(minutes)}
                selected={draft.maxPrepMinutes === minutes}
                onClick={() => patch({ maxPrepMinutes: minutes })}
              >
                {minutes === null ? t.filters.anyTime : `≤ ${t.common.minutes(minutes)}`}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <Label>{t.filters.maxCost}</Label>
          <div className="flex flex-wrap gap-2">
            {[null, 1, 2, 3].map((cost) => (
              <Chip
                key={String(cost)}
                selected={draft.maxCost === cost}
                onClick={() => patch({ maxCost: cost as Cost | null })}
              >
                {cost === null ? t.filters.anyCost : COST_LABELS[cost]}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <Label>{t.filters.excludeRecent}</Label>
          <div className="flex flex-wrap gap-2">
            {RECENT_OPTIONS.map((days) => (
              <Chip
                key={days}
                selected={draft.excludeRecentDays === days}
                onClick={() => patch({ excludeRecentDays: days })}
              >
                {days === 0 ? t.filters.excludeRecentOff : t.filters.days(days)}
              </Chip>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] bg-surface-muted px-4">
          <Toggle
            checked={draft.favoritesOnly}
            onChange={(favoritesOnly) => patch({ favoritesOnly })}
            label={t.filters.favoritesOnly}
          />
        </section>

        <div className="sticky bottom-0 -mx-1 flex gap-3 bg-bg-elevated pb-1 pt-3">
          <Button variant="secondary" onClick={() => setDraft({ ...DEFAULT_FILTERS, mode: draft.mode })}>
            {t.filters.clear}
          </Button>
          <Button
            block
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {t.filters.apply}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
