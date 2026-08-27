"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Label, TextArea, TextInput, Toggle } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORY_EMOJI, CATEGORY_LABELS, COST_LABELS, KIND_EMOJI, KIND_LABELS, t } from "@/lib/strings";
import {
  CATEGORIES,
  MODE_KINDS,
  modeOf,
  type Category,
  type Cost,
  type Meal,
  type MealDraft,
  type Mode,
  type Weight,
} from "@/lib/types";

const EMOJI_CHOICES = [
  "🍽️",
  "🍝",
  "🍕",
  "🍔",
  "🌮",
  "🥗",
  "🍣",
  "🍜",
  "🍲",
  "🥘",
  "🍳",
  "🥞",
  "🧆",
  "🥙",
  "🌯",
  "🍚",
  "🍗",
  "🥩",
  "🐟",
  "🥟",
  "🥪",
  "🥐",
  "🧀",
  "🥑",
  "🍰",
  "🍨",
  "🍫",
  "☕",
  "🥤",
  "🍿",
];

const WEIGHT_LABELS: Record<Weight, string> = {
  1: "רק לפעמים",
  2: "פה ושם",
  3: "רגיל",
  4: "אוהב",
  5: "מת על זה",
};

function emptyDraft(mode: Mode): MealDraft {
  return {
    name: "",
    emoji: mode === "home" ? "🍽️" : "🥡",
    categories: ["dinner"],
    kind: MODE_KINDS[mode][0],
    tags: [],
    prepMinutes: 20,
    cost: 1,
    weight: 3,
    enabled: true,
    favorite: false,
    notes: "",
  };
}

function toDraft(meal: Meal): MealDraft {
  return {
    name: meal.name,
    emoji: meal.emoji,
    categories: [...meal.categories],
    kind: meal.kind,
    tags: [...meal.tags],
    prepMinutes: meal.prepMinutes,
    cost: meal.cost,
    weight: meal.weight,
    enabled: meal.enabled,
    favorite: meal.favorite,
    notes: meal.notes ?? "",
  };
}

interface Props {
  meal: Meal | null;
  /** Which list the form was opened from; seeds the kind for a new meal. */
  mode: Mode;
  onClose: () => void;
  onSubmit: (draft: MealDraft) => Promise<void> | void;
}

/** Mounted only while open, so the draft is seeded once from `meal`. */
export function MealForm({ meal, mode, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<MealDraft>(() => (meal ? toDraft(meal) : emptyDraft(mode)));
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (next: Partial<MealDraft>) => setDraft((prev) => ({ ...prev, ...next }));

  const addTag = () => {
    const value = tagInput.trim().replace(/^#/, "");
    if (!value || draft.tags.includes(value)) {
      setTagInput("");
      return;
    }
    patch({ tags: [...draft.tags, value] });
    setTagInput("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError(t.form.required);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...draft,
        name,
        categories: draft.categories.length ? draft.categories : ["dinner"],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={meal ? t.meals.edit : t.meals.add} tall>
      <form onSubmit={submit} className="flex flex-col gap-6 pt-2">
        <section>
          <Label>{modeOf(draft.kind) === "home" ? t.form.name : t.form.placeName}</Label>
          <TextInput
            value={draft.name}
            onChange={(event) => {
              patch({ name: event.target.value });
              if (error) setError(null);
            }}
            placeholder={t.form.namePlaceholder}
            autoFocus
          />
          {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
        </section>

        <section>
          <Label>{t.form.emoji}</Label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => patch({ emoji })}
                aria-pressed={draft.emoji === emoji}
                className={`grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] text-xl transition ${
                  draft.emoji === emoji ? "bg-primary-soft ring-2 ring-primary" : "bg-surface-muted"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <section>
          <Label>{t.form.categories}</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                selected={draft.categories.includes(category)}
                onClick={() =>
                  patch({
                    categories: draft.categories.includes(category)
                      ? draft.categories.filter((c) => c !== category)
                      : [...draft.categories, category as Category],
                  })
                }
              >
                <span>{CATEGORY_EMOJI[category]}</span>
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </section>

        {MODE_KINDS[modeOf(draft.kind)].length > 1 ? (
          <section>
            <Label>{t.form.kind}</Label>
            <div className="flex flex-wrap gap-2">
              {MODE_KINDS[modeOf(draft.kind)].map((kind) => (
                <Chip key={kind} selected={draft.kind === kind} onClick={() => patch({ kind })}>
                  <span>{KIND_EMOJI[kind]}</span>
                  {KIND_LABELS[kind]}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <Label>{t.form.tags}</Label>
          {draft.tags.length ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => patch({ tags: draft.tags.filter((item) => item !== tag) })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm text-ink-muted"
                >
                  #{tag}
                  <span aria-hidden="true">✕</span>
                </button>
              ))}
            </div>
          ) : null}
          <TextInput
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder={t.form.tagsPlaceholder}
          />
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t.form.prep}</Label>
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              max={600}
              value={draft.prepMinutes}
              onChange={(event) =>
                patch({
                  prepMinutes: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </div>
          <div>
            <Label>{t.form.cost}</Label>
            <div className="flex gap-2">
              {([1, 2, 3] as Cost[]).map((cost) => (
                <Chip key={cost} selected={draft.cost === cost} onClick={() => patch({ cost })}>
                  {COST_LABELS[cost]}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        <section>
          <Label hint={t.form.weightHint}>{t.form.weight}</Label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={draft.weight}
            onChange={(event) => patch({ weight: Number(event.target.value) as Weight })}
            className="w-full accent-[var(--wf-primary)]"
          />
          <p className="mt-1 text-center text-sm font-medium text-ink-muted">{WEIGHT_LABELS[draft.weight]}</p>
        </section>

        <section>
          <Label>{t.form.notes}</Label>
          <TextArea
            value={draft.notes ?? ""}
            onChange={(event) => patch({ notes: event.target.value })}
            placeholder={t.form.notesPlaceholder}
          />
        </section>

        <section className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-1">
          <Toggle checked={draft.enabled} onChange={(enabled) => patch({ enabled })} label={t.form.enabled} />
          <Toggle
            checked={draft.favorite}
            onChange={(favorite) => patch({ favorite })}
            label={t.form.favorite}
          />
        </section>

        <div className="sticky bottom-0 -mx-1 flex gap-3 bg-bg-elevated pb-1 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t.form.cancel}
          </Button>
          <Button type="submit" block disabled={saving}>
            {t.form.save}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
