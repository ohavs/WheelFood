"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getRepository } from "@/lib/repo";
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

interface StoreValue extends AppData {
  ready: boolean;
  createMeal: (draft: MealDraft) => Promise<Meal>;
  updateMeal: (id: string, patch: Partial<MealDraft>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleEnabled: (id: string) => Promise<void>;
  addSpin: (record: SpinRecord) => Promise<void>;
  updateSpin: (id: string, patch: Partial<SpinRecord>) => Promise<void>;
  clearHistory: () => Promise<void>;
  setFilters: (next: Filters) => Promise<void>;
  setSettings: (patch: Partial<Settings>) => Promise<void>;
  importData: (data: Partial<AppData>) => Promise<void>;
  resetAll: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const EMPTY: AppData = {
  meals: [],
  history: [],
  filters: { ...DEFAULT_FILTERS },
  settings: { ...DEFAULT_SETTINGS },
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let unsubscribe: (() => void) | undefined;

    repo.load().then((loaded) => {
      if (!mounted.current) return;
      setData(loaded);
      setReady(true);
      unsubscribe = repo.subscribe?.((next) => {
        if (mounted.current) setData(next);
      });
    });

    return () => {
      mounted.current = false;
      unsubscribe?.();
    };
  }, [repo]);

  const refresh = useCallback(async () => {
    const next = await repo.load();
    if (mounted.current) setData(next);
  }, [repo]);

  const createMeal = useCallback(
    async (draft: MealDraft) => {
      const meal = await repo.createMeal(draft);
      await refresh();
      return meal;
    },
    [repo, refresh],
  );

  const updateMeal = useCallback(
    async (id: string, patch: Partial<MealDraft>) => {
      await repo.updateMeal(id, patch);
      await refresh();
    },
    [repo, refresh],
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      await repo.deleteMeal(id);
      await refresh();
    },
    [repo, refresh],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const meal = data.meals.find((m) => m.id === id);
      if (!meal) return;
      await repo.updateMeal(id, { favorite: !meal.favorite });
      await refresh();
    },
    [data.meals, repo, refresh],
  );

  const toggleEnabled = useCallback(
    async (id: string) => {
      const meal = data.meals.find((m) => m.id === id);
      if (!meal) return;
      await repo.updateMeal(id, { enabled: !meal.enabled });
      await refresh();
    },
    [data.meals, repo, refresh],
  );

  const addSpin = useCallback(
    async (record: SpinRecord) => {
      await repo.addSpin(record);
      await refresh();
    },
    [repo, refresh],
  );

  const updateSpin = useCallback(
    async (id: string, patch: Partial<SpinRecord>) => {
      await repo.updateSpin(id, patch);
      await refresh();
    },
    [repo, refresh],
  );

  const clearHistory = useCallback(async () => {
    await repo.clearHistory();
    await refresh();
  }, [repo, refresh]);

  const setFilters = useCallback(
    async (next: Filters) => {
      setData((prev) => ({ ...prev, filters: next }));
      await repo.saveFilters(next);
    },
    [repo],
  );

  const setSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...data.settings, ...patch };
      setData((prev) => ({ ...prev, settings: next }));
      await repo.saveSettings(next);
    },
    [data.settings, repo],
  );

  const importData = useCallback(
    async (incoming: Partial<AppData>) => {
      if (incoming.meals?.length) await repo.putMeals(incoming.meals);
      if (incoming.filters) await repo.saveFilters({ ...DEFAULT_FILTERS, ...incoming.filters });
      if (incoming.settings) await repo.saveSettings({ ...DEFAULT_SETTINGS, ...incoming.settings });
      await refresh();
    },
    [repo, refresh],
  );

  const resetAll = useCallback(async () => {
    await repo.reset();
    await repo.putMeals(seedMeals());
    await repo.saveFilters({ ...DEFAULT_FILTERS });
    await repo.saveSettings({ ...DEFAULT_SETTINGS });
    await refresh();
  }, [repo, refresh]);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      ready,
      createMeal,
      updateMeal,
      deleteMeal,
      toggleFavorite,
      toggleEnabled,
      addSpin,
      updateSpin,
      clearHistory,
      setFilters,
      setSettings,
      importData,
      resetAll,
    }),
    [
      data,
      ready,
      createMeal,
      updateMeal,
      deleteMeal,
      toggleFavorite,
      toggleEnabled,
      addSpin,
      updateSpin,
      clearHistory,
      setFilters,
      setSettings,
      importData,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
