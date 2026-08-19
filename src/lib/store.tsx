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
import { createLocalRepository, createRepository, type DataRepository } from "@/lib/repo";
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

export type BackendStatus = "connecting" | "cloud" | "local" | "fallback";

interface StoreValue extends AppData {
  ready: boolean;
  /** Which backend actually served this session, for the settings screen. */
  backend: BackendStatus;
  backendError: string | null;
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
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<BackendStatus>("connecting");
  const [backendError, setBackendError] = useState<string | null>(null);

  const repoRef = useRef<DataRepository | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      let repo = createRepository();
      let loaded: AppData;

      try {
        loaded = await repo.load();
        setBackend(repo.name === "firebase" ? "cloud" : "local");
      } catch (error) {
        // Anonymous auth disabled, offline first load, bad config — keep the
        // app usable on this device rather than showing a dead screen.
        repo = createLocalRepository();
        loaded = await repo.load();
        setBackend("fallback");
        setBackendError(error instanceof Error ? error.message : String(error));
      }

      if (!mounted.current) return;
      repoRef.current = repo;
      setData(loaded);
      setReady(true);

      unsubscribe = repo.subscribe?.((next) => {
        if (mounted.current) setData(next);
      });
    };

    void start();

    return () => {
      mounted.current = false;
      unsubscribe?.();
    };
  }, []);

  /**
   * Re-reads after a mutation, but only for backends without a live stream —
   * a realtime repository delivers its own update through `subscribe`.
   */
  const refresh = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo || repo.realtime) return;
    const next = await repo.load();
    if (mounted.current) setData(next);
  }, []);

  const repo = () => {
    const current = repoRef.current;
    if (!current) throw new Error("Store is not ready yet");
    return current;
  };

  const createMeal = useCallback(
    async (draft: MealDraft) => {
      const meal = await repo().createMeal(draft);
      await refresh();
      return meal;
    },
    [refresh],
  );

  const updateMeal = useCallback(
    async (id: string, patch: Partial<MealDraft>) => {
      await repo().updateMeal(id, patch);
      await refresh();
    },
    [refresh],
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      await repo().deleteMeal(id);
      await refresh();
    },
    [refresh],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const meal = data.meals.find((item) => item.id === id);
      if (!meal) return;
      await repo().updateMeal(id, { favorite: !meal.favorite });
      await refresh();
    },
    [data.meals, refresh],
  );

  const toggleEnabled = useCallback(
    async (id: string) => {
      const meal = data.meals.find((item) => item.id === id);
      if (!meal) return;
      await repo().updateMeal(id, { enabled: !meal.enabled });
      await refresh();
    },
    [data.meals, refresh],
  );

  const addSpin = useCallback(
    async (record: SpinRecord) => {
      await repo().addSpin(record);
      await refresh();
    },
    [refresh],
  );

  const updateSpin = useCallback(
    async (id: string, patch: Partial<SpinRecord>) => {
      await repo().updateSpin(id, patch);
      await refresh();
    },
    [refresh],
  );

  const clearHistory = useCallback(async () => {
    await repo().clearHistory();
    await refresh();
  }, [refresh]);

  const setFilters = useCallback(async (next: Filters) => {
    // Optimistic: filtering should feel instant even on a slow connection.
    setData((prev) => ({ ...prev, filters: next }));
    await repo().saveFilters(next);
  }, []);

  const setSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...data.settings, ...patch };
      setData((prev) => ({ ...prev, settings: next }));
      await repo().saveSettings(next);
    },
    [data.settings],
  );

  const importData = useCallback(
    async (incoming: Partial<AppData>) => {
      const current = repo();
      if (incoming.meals?.length) await current.putMeals(incoming.meals);
      if (incoming.filters) await current.saveFilters({ ...DEFAULT_FILTERS, ...incoming.filters });
      if (incoming.settings) await current.saveSettings({ ...DEFAULT_SETTINGS, ...incoming.settings });
      await refresh();
    },
    [refresh],
  );

  const resetAll = useCallback(async () => {
    const current = repo();
    await current.reset();
    await current.putMeals(seedMeals());
    await current.saveFilters({ ...DEFAULT_FILTERS });
    await current.saveSettings({ ...DEFAULT_SETTINGS });
    await refresh();
  }, [refresh]);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      ready,
      backend,
      backendError,
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
      backend,
      backendError,
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
