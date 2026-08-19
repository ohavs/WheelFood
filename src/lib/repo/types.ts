import type { AppData, Filters, Meal, MealDraft, Settings, SpinRecord } from "@/lib/types";

/**
 * The single seam between the UI and storage.
 *
 * `LocalRepository` implements it on top of localStorage today; a Firebase
 * implementation (src/lib/repo/firebase.ts) can be dropped in without any
 * component changing, because nothing outside this folder knows where data
 * lives.
 */
export interface DataRepository {
  readonly name: string;

  /**
   * True when `subscribe` pushes every change back on its own. Callers then
   * skip the re-read after a mutation and let the stream deliver it.
   */
  readonly realtime: boolean;

  /** Full snapshot used to hydrate the store on boot. */
  load(): Promise<AppData>;

  createMeal(draft: MealDraft): Promise<Meal>;
  updateMeal(id: string, patch: Partial<MealDraft>): Promise<Meal>;
  deleteMeal(id: string): Promise<void>;
  /** Bulk insert used by the seed / import flows. */
  putMeals(meals: Meal[]): Promise<void>;

  addSpin(record: SpinRecord): Promise<void>;
  updateSpin(id: string, patch: Partial<SpinRecord>): Promise<void>;
  clearHistory(): Promise<void>;

  saveFilters(filters: Filters): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;

  /** Wipes everything this repository owns. */
  reset(): Promise<void>;

  /**
   * Optional live channel. Local storage uses it for cross-tab sync; Firebase
   * will use it for realtime snapshots. Returns an unsubscribe function.
   */
  subscribe?(onChange: (data: AppData) => void): () => void;
}
