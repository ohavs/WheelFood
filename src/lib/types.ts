/**
 * Domain model for WheelFood / Meal Roulette.
 *
 * Everything the UI reads goes through these types, and every mutation goes
 * through `DataRepository` (see src/lib/repo). That keeps the swap from
 * localStorage to Firebase a one-file change.
 */

export const CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
export type Category = (typeof CATEGORIES)[number];

export const KINDS = ["home", "takeout", "restaurant"] as const;
export type Kind = (typeof KINDS)[number];

/**
 * The app is split in two all the way through: cooking at home is a different
 * decision from eating out, with its own list and its own wheel.
 */
export const MODES = ["home", "out"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_KINDS: Record<Mode, Kind[]> = {
  home: ["home"],
  out: ["takeout", "restaurant"],
};

export function modeOf(kind: Kind): Mode {
  return kind === "home" ? "home" : "out";
}

/** 1 = cheap, 2 = mid, 3 = splurge. */
export type Cost = 1 | 2 | 3;

/** 1 = rarely, 3 = normal, 5 = often. Drives the weighted draw. */
export type Weight = 1 | 2 | 3 | 4 | 5;

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  categories: Category[];
  kind: Kind;
  tags: string[];
  prepMinutes: number;
  cost: Cost;
  weight: Weight;
  /** Excluded from the wheel while false, without deleting it. */
  enabled: boolean;
  favorite: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type MealDraft = Omit<Meal, "id" | "createdAt" | "updatedAt">;

export interface SpinRecord {
  id: string;
  mealId: string;
  /** Denormalised so history survives a deleted meal. */
  mealName: string;
  emoji: string;
  at: number;
  /** true once the user confirmed they actually ate it. */
  accepted: boolean;
}

export interface Filters {
  /** Which of the two wheels is showing. */
  mode: Mode;
  categories: Category[];
  kinds: Kind[];
  tags: string[];
  maxPrepMinutes: number | null;
  maxCost: Cost | null;
  favoritesOnly: boolean;
  /** Skip meals picked within the last N days. 0 disables the rule. */
  excludeRecentDays: number;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  haptics: boolean;
  sound: boolean;
  reduceMotion: boolean;
  /** How many slices the wheel draws at most. */
  wheelSize: number;
}

export interface AppData {
  meals: Meal[];
  history: SpinRecord[];
  filters: Filters;
  settings: Settings;
}

export const DEFAULT_FILTERS: Filters = {
  mode: "home",
  categories: [],
  kinds: [],
  tags: [],
  maxPrepMinutes: null,
  maxCost: null,
  favoritesOnly: false,
  excludeRecentDays: 0,
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  haptics: true,
  sound: true,
  reduceMotion: false,
  wheelSize: 8,
};
