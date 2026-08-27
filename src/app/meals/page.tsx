"use client";

import { useMemo, useState } from "react";
import { MealCard } from "@/components/MealCard";
import { MealForm } from "@/components/MealForm";
import { ModeTabs } from "@/components/ModeTabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Field";
import { t } from "@/lib/strings";
import { useStore } from "@/lib/store";
import { MODE_KINDS, modeOf, type Meal, type Mode } from "@/lib/types";

export default function MealsPage() {
  const store = useStore();
  const [mode, setMode] = useState<Mode>("home");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);

  const counts = useMemo(
    () =>
      store.meals.reduce(
        (acc, meal) => {
          acc[modeOf(meal.kind)] += 1;
          return acc;
        },
        { home: 0, out: 0 } as Record<Mode, number>,
      ),
    [store.meals],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = store.meals.filter((meal) => {
      if (!MODE_KINDS[mode].includes(meal.kind)) return false;
      if (!needle) return true;
      return (
        meal.name.toLowerCase().includes(needle) ||
        meal.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
    return list.sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
  }, [store.meals, query, mode]);

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
        <Button onClick={openNew}>+ {mode === "home" ? t.meals.addHome : t.meals.addOut}</Button>
      </header>

      <ModeTabs value={mode} counts={counts} onChange={setMode} />

      {counts[mode] > 0 ? (
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.meals.search}
        />
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          emoji={mode === "home" ? "🍳" : "🛵"}
          title={mode === "home" ? t.wheel.emptyHome : t.wheel.emptyOut}
          body={mode === "home" ? t.wheel.emptyHomeBody : t.wheel.emptyOutBody}
          action={<Button onClick={openNew}>{mode === "home" ? t.meals.addHome : t.meals.addOut}</Button>}
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
          mode={mode}
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
