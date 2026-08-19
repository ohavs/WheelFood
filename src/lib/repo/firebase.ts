"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type CollectionReference,
  type Firestore,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureUser, getFirebase } from "@/lib/firebase/client";
import { uid } from "@/lib/id";
import { LocalRepository } from "@/lib/repo/local";
import type { DataRepository } from "@/lib/repo/types";
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

const HISTORY_LIMIT = 300;

/** One shared list for everyone using this deployment. */
const SPACE_ID = process.env.NEXT_PUBLIC_WHEELFOOD_SPACE || "shared";

/** Set once a device has folded its pre-shared data into the shared space. */
const MIGRATION_KEY = "wheelfood.migrated-to-shared.v1";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Firestore layout:
 *
 *   spaces/{space}/meals/{id}     -> Meal
 *   spaces/{space}/history/{id}   -> SpinRecord
 *
 * Meals and history are shared: every device signs in anonymously and works on
 * the same space, so what one person adds shows up for the other immediately.
 *
 * Filters and settings deliberately stay on the device (localStorage) — theme,
 * sound and the active filter are personal, and syncing them would let one
 * person's choices reach across to the other's screen.
 */
export class FirebaseRepository implements DataRepository {
  readonly name = "firebase";
  readonly realtime = true;

  private db: Firestore | null = null;
  private userId: string | null = null;

  /** Device-local half of the state. */
  private readonly local = new LocalRepository();
  private prefs: { filters: Filters; settings: Settings } = {
    filters: { ...DEFAULT_FILTERS },
    settings: { ...DEFAULT_SETTINGS },
  };

  private async connect(): Promise<{ db: Firestore; userId: string }> {
    if (this.db && this.userId) return { db: this.db, userId: this.userId };

    const firebase = getFirebase();
    if (!firebase) throw new Error("Firebase is not configured");

    const user = await ensureUser(firebase.auth);
    this.db = firebase.db;
    this.userId = user.uid;
    return { db: this.db, userId: this.userId };
  }

  private meals(db: Firestore): CollectionReference {
    return collection(db, "spaces", SPACE_ID, "meals");
  }

  private history(db: Firestore): CollectionReference {
    return collection(db, "spaces", SPACE_ID, "history");
  }

  async load(): Promise<AppData> {
    const { db } = await this.connect();

    const localData = await this.local.load();
    this.prefs = { filters: localData.filters, settings: localData.settings };

    const [mealsSnap, historySnap] = await Promise.all([
      getDocs(this.meals(db)),
      getDocs(query(this.history(db), orderBy("at", "desc"), limit(HISTORY_LIMIT))),
    ]);

    let meals = mealsSnap.docs.map((snapshot) => snapshot.data() as Meal);
    meals = await this.migrateIntoShared(meals, localData.meals);

    if (meals.length === 0) {
      meals = seedMeals();
      await this.putMeals(meals);
    }

    return {
      meals,
      history: historySnap.docs.map((snapshot) => snapshot.data() as SpinRecord),
      filters: this.prefs.filters,
      settings: this.prefs.settings,
    };
  }

  /**
   * One-time fold of this device's older data into the shared space: meals it
   * kept in localStorage before the cloud existed, plus meals written under
   * the per-user tree the app used first. Matching names are dropped so two
   * devices carrying the same starter list do not double it up.
   */
  private async migrateIntoShared(shared: Meal[], localMeals: Meal[]): Promise<Meal[]> {
    if (typeof window === "undefined") return shared;
    if (window.localStorage.getItem(MIGRATION_KEY) === "1") return shared;

    const { db, userId } = await this.connect();

    const legacyRemote = await getDocs(collection(db, "users", userId, "meals"))
      .then((snapshot) => snapshot.docs.map((document) => document.data() as Meal))
      .catch(() => [] as Meal[]);

    const known = new Set(shared.map((meal) => normalizeName(meal.name)));
    const incoming: Meal[] = [];

    for (const meal of [...legacyRemote, ...localMeals]) {
      const key = normalizeName(meal.name);
      if (!meal.name.trim() || known.has(key)) continue;
      known.add(key);
      incoming.push(meal);
    }

    if (incoming.length) await this.putMeals(incoming);
    window.localStorage.setItem(MIGRATION_KEY, "1");

    return [...shared, ...incoming];
  }

  async createMeal(draft: MealDraft): Promise<Meal> {
    const { db } = await this.connect();
    const now = Date.now();
    const meal: Meal = { ...draft, id: uid("meal"), createdAt: now, updatedAt: now };
    await setDoc(doc(this.meals(db), meal.id), meal);
    return meal;
  }

  async updateMeal(id: string, patch: Partial<MealDraft>): Promise<Meal> {
    const { db } = await this.connect();
    const payload = { ...patch, updatedAt: Date.now() };
    await updateDoc(doc(this.meals(db), id), payload);
    return { id, ...payload } as Meal;
  }

  async deleteMeal(id: string): Promise<void> {
    const { db } = await this.connect();
    await deleteDoc(doc(this.meals(db), id));
  }

  async putMeals(meals: Meal[]): Promise<void> {
    const { db } = await this.connect();
    // Firestore caps a batch at 500 writes.
    for (let start = 0; start < meals.length; start += 400) {
      const batch = writeBatch(db);
      for (const meal of meals.slice(start, start + 400)) {
        batch.set(doc(this.meals(db), meal.id), meal);
      }
      await batch.commit();
    }
  }

  async addSpin(record: SpinRecord): Promise<void> {
    const { db } = await this.connect();
    await setDoc(doc(this.history(db), record.id), record);
  }

  async updateSpin(id: string, patch: Partial<SpinRecord>): Promise<void> {
    const { db } = await this.connect();
    await setDoc(doc(this.history(db), id), patch, { merge: true });
  }

  async clearHistory(): Promise<void> {
    const { db } = await this.connect();
    await this.deleteAll(db, await getDocs(this.history(db)));
  }

  private async deleteAll(db: Firestore, snapshot: QuerySnapshot): Promise<void> {
    const docs = snapshot.docs;
    for (let start = 0; start < docs.length; start += 400) {
      const batch = writeBatch(db);
      for (const document of docs.slice(start, start + 400)) batch.delete(document.ref);
      await batch.commit();
    }
  }

  /** Personal, so it never leaves the device. */
  async saveFilters(filters: Filters): Promise<void> {
    this.prefs = { ...this.prefs, filters };
    await this.local.saveFilters(filters);
  }

  /** Personal, so it never leaves the device. */
  async saveSettings(settings: Settings): Promise<void> {
    this.prefs = { ...this.prefs, settings };
    await this.local.saveSettings(settings);
  }

  async reset(): Promise<void> {
    const { db } = await this.connect();
    await this.deleteAll(db, await getDocs(this.meals(db)));
    await this.deleteAll(db, await getDocs(this.history(db)));
  }

  subscribe(onChange: (data: AppData) => void): () => void {
    let unsubscribes: Unsubscribe[] = [];
    let cancelled = false;

    let meals: Meal[] = [];
    let history: SpinRecord[] = [];
    // Emit only once both streams have spoken, so the UI never flashes an
    // empty wheel while the second query is still in flight.
    const seen = { meals: false, history: false };
    const emit = () => {
      if (seen.meals && seen.history) {
        onChange({ meals, history, filters: this.prefs.filters, settings: this.prefs.settings });
      }
    };

    void this.connect().then(({ db }) => {
      if (cancelled) return;

      unsubscribes = [
        onSnapshot(this.meals(db), (snapshot) => {
          meals = snapshot.docs.map((document) => document.data() as Meal);
          seen.meals = true;
          emit();
        }),
        onSnapshot(query(this.history(db), orderBy("at", "desc"), limit(HISTORY_LIMIT)), (snapshot) => {
          history = snapshot.docs.map((document) => document.data() as SpinRecord);
          seen.history = true;
          emit();
        }),
      ];
    });

    return () => {
      cancelled = true;
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }
}
