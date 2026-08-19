import type { Filters, Meal, SpinRecord } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Meals that survive the current filter set, in wheel-eligible order. */
export function filterMeals(meals: Meal[], filters: Filters, history: SpinRecord[]): Meal[] {
  const recentCutoff = filters.excludeRecentDays > 0 ? Date.now() - filters.excludeRecentDays * DAY_MS : 0;
  const recentIds = new Set(
    recentCutoff ? history.filter((h) => h.at >= recentCutoff).map((h) => h.mealId) : [],
  );

  return meals.filter((meal) => {
    if (!meal.enabled) return false;
    if (filters.favoritesOnly && !meal.favorite) return false;
    if (filters.categories.length && !meal.categories.some((c) => filters.categories.includes(c)))
      return false;
    if (filters.kinds.length && !filters.kinds.includes(meal.kind)) return false;
    if (filters.tags.length && !meal.tags.some((t) => filters.tags.includes(t))) return false;
    if (filters.maxPrepMinutes !== null && meal.prepMinutes > filters.maxPrepMinutes) return false;
    if (filters.maxCost !== null && meal.cost > filters.maxCost) return false;
    if (recentIds.has(meal.id)) return false;
    return true;
  });
}

function weightedIndex(weights: number[], random: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(random() * weights.length);
  let roll = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Draws the slices the wheel will show.
 *
 * The pool can be far larger than the wheel, so we sample `size` distinct
 * meals weighted by preference. The spin then picks among exactly what the
 * user can see — no invisible outcomes.
 */
export function drawCandidates(pool: Meal[], size: number, random: () => number = Math.random): Meal[] {
  if (pool.length <= size) return shuffle(pool, random);

  const remaining = [...pool];
  const picked: Meal[] = [];
  while (picked.length < size && remaining.length) {
    const index = weightedIndex(
      remaining.map((m) => m.weight),
      random,
    );
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return picked;
}

/** Weighted pick of the winning slice among the visible candidates. */
export function pickWinner(candidates: Meal[], random: () => number = Math.random): number {
  if (!candidates.length) return -1;
  return weightedIndex(
    candidates.map((m) => m.weight),
    random,
  );
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Every tag in use, sorted by how often it appears. */
export function collectTags(meals: Meal[]): string[] {
  const counts = new Map<string, number>();
  for (const meal of meals) {
    for (const tag of meal.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

export function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.categories.length) count += 1;
  if (filters.kinds.length) count += 1;
  if (filters.tags.length) count += 1;
  if (filters.maxPrepMinutes !== null) count += 1;
  if (filters.maxCost !== null) count += 1;
  if (filters.favoritesOnly) count += 1;
  if (filters.excludeRecentDays > 0) count += 1;
  return count;
}
