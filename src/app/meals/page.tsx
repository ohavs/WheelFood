"use client";

import { useMemo, useState } from "react";
import { MealCard } from "@/components/MealCard";
import { MealForm } from "@/components/MealForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Field";
import { t } from "@/lib/strings";
import { useStore } from "@/lib/store";
import type { Meal } from "@/lib/types";

export default function MealsPage() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? store.meals.filter(
          (meal) =>
            meal.name.toLowerCase().includes(needle) ||
            meal.tags.some((tag) => tag.toLowerCase().includes(needle)),
        )
      : store.meals;
    return [...list].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
  }, [store.meals, query]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (meal: Meal) => {
    setEditing(meal);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t.meals.title}</h1>
          <p className="text-sm text-ink-muted">{t.meals.count(store.meals.length)}</p>
        </div>
        <Button onClick={openNew}>+ {t.meals.add}</Button>
      </header>

      {store.meals.length > 0 ? (
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.meals.search}
        />
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          emoji="📝"
          title={t.meals.empty}
          body={t.meals.emptyBody}
          action={<Button onClick={openNew}>{t.meals.add}</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((meal) => (
            <li key={meal.id}>
              <MealCard
                meal={meal}
                onEdit={() => openEdit(meal)}
                onToggleFavorite={() => void store.toggleFavorite(meal.id)}
                onToggleEnabled={() => void store.toggleEnabled(meal.id)}
                onDelete={() => {
                  if (window.confirm(t.meals.deleteConfirm)) void store.deleteMeal(meal.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {formOpen ? (
        <MealForm
          meal={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={async (draft) => {
            if (editing) await store.updateMeal(editing.id, draft);
            else await store.createMeal(draft);
          }}
        />
      ) : null}
    </div>
  );
}
