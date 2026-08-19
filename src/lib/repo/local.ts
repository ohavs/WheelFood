import { uid } from "@/lib/id";
import { seedMeals } from "@/lib/seed";
import {
  DEFAULT_FILTERS,
  DEFAULT_SETTINGS,
  type AppData,
  type Filters,
  type Meal,
  type MealDraft,
  type Settings,
  type SpinRecord,
} from "@/lib/types";
import type { DataRepository } from "@/lib/repo/types";

const KEY = "wheelfood.v1";
const SCHEMA_VERSION = 1;

interface Persisted extends AppData {
  version: number;
}

function emptyData(): AppData {
  return {
    meals: [],
    history: [],
    filters: { ...DEFAULT_FILTERS },
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * localStorage-backed repository. Synchronous under the hood, but the async
 * surface matches what a remote backend needs so swapping it changes nothing
 * in the UI.
 */
export class LocalRepository implements DataRepository {
  readonly name = "local";

  private read(): AppData {
    if (typeof window === "undefined") return emptyData();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) {
        // First run: hand out the starter list rather than an empty wheel.
        const fresh = { ...emptyData(), meals: seedMeals() };
        this.write(fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      return {
        meals: Array.isArray(parsed.meals) ? parsed.meals : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        filters: { ...DEFAULT_FILTERS, ...(parsed.filters ?? {}) },
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    } catch {
      return emptyData();
    }
  }

  private write(data: AppData): void {
    if (typeof window === "undefined") return;
    const payload: Persisted = { ...data, version: SCHEMA_VERSION };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  }

  private mutate(fn: (data: AppData) => void): AppData {
    const data = this.read();
    fn(data);
    this.write(data);
    return data;
  }

  async load(): Promise<AppData> {
    return this.read();
  }

  async createMeal(draft: MealDraft): Promise<Meal> {
    const now = Date.now();
    const meal: Meal = {
      ...draft,
      id: uid("meal"),
      createdAt: now,
      updatedAt: now,
    };
    this.mutate((data) => {
      data.meals.unshift(meal);
    });
    return meal;
  }

  async updateMeal(id: string, patch: Partial<MealDraft>): Promise<Meal> {
    let updated: Meal | undefined;
    this.mutate((data) => {
      const index = data.meals.findIndex((m) => m.id === id);
      if (index === -1) return;
      updated = { ...data.meals[index], ...patch, updatedAt: Date.now() };
      data.meals[index] = updated;
    });
    if (!updated) throw new Error(`Meal not found: ${id}`);
    return updated;
  }

  async deleteMeal(id: string): Promise<void> {
    this.mutate((data) => {
      data.meals = data.meals.filter((m) => m.id !== id);
    });
  }

  async putMeals(meals: Meal[]): Promise<void> {
    this.mutate((data) => {
      const byId = new Map(data.meals.map((m) => [m.id, m]));
      for (const meal of meals) byId.set(meal.id, meal);
      data.meals = [...byId.values()];
    });
  }

  async addSpin(record: SpinRecord): Promise<void> {
    this.mutate((data) => {
      data.history.unshift(record);
      data.history = data.history.slice(0, 300);
    });
  }

  async updateSpin(id: string, patch: Partial<SpinRecord>): Promise<void> {
    this.mutate((data) => {
      const index = data.history.findIndex((h) => h.id === id);
      if (index !== -1) data.history[index] = { ...data.history[index], ...patch };
    });
  }

  async clearHistory(): Promise<void> {
    this.mutate((data) => {
      data.history = [];
    });
  }

  async saveFilters(filters: Filters): Promise<void> {
    this.mutate((data) => {
      data.filters = filters;
    });
  }

  async saveSettings(settings: Settings): Promise<void> {
    this.mutate((data) => {
      data.settings = settings;
    });
  }

  async reset(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  }

  subscribe(onChange: (data: AppData) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key === KEY) onChange(this.read());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}
