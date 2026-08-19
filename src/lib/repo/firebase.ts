"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
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

/**
 * Firestore layout:
 *
 *   users/{uid}                -> { filters, settings }
 *   users/{uid}/meals/{id}     -> Meal
 *   users/{uid}/history/{id}   -> SpinRecord
 *
 * Each device signs in anonymously, so a uid is a private notebook. Writes go
 * straight to the SDK, which queues them offline and flushes on reconnect;
 * reads come back through `subscribe`, so the UI never polls.
 */
export class FirebaseRepository implements DataRepository {
  readonly name = "firebase";
  readonly realtime = true;

  private db: Firestore | null = null;
  private userId: string | null = null;

  /** Signs in (anonymously) and caches the handles. Rejects if unavailable. */
  private async connect(): Promise<{ db: Firestore; userId: string }> {
    if (this.db && this.userId) return { db: this.db, userId: this.userId };

    const firebase = getFirebase();
    if (!firebase) throw new Error("Firebase is not configured");

    const user = await ensureUser(firebase.auth);
    this.db = firebase.db;
    this.userId = user.uid;
    return { db: this.db, userId: this.userId };
  }

  private paths(db: Firestore, userId: string) {
    return {
      user: doc(db, "users", userId),
      meals: collection(db, "users", userId, "meals"),
      history: collection(db, "users", userId, "history"),
    };
  }

  async load(): Promise<AppData> {
    const { db, userId } = await this.connect();
    const paths = this.paths(db, userId);

    const [mealsSnap, historySnap, profile] = await Promise.all([
      getDocs(paths.meals),
      getDocs(query(paths.history, orderBy("at", "desc"), limit(HISTORY_LIMIT))),
      this.readProfile(db, userId),
    ]);

    let meals = mealsSnap.docs.map((snapshot) => snapshot.data() as Meal);

    if (meals.length === 0) {
      // First run against this account: carry over anything the device already
      // collected locally, otherwise fall back to the starter list.
      const local = await new LocalRepository().load();
      meals = local.meals.length ? local.meals : seedMeals();
      await this.putMeals(meals);
      await this.saveFilters(local.filters);
      await this.saveSettings(local.settings);
      return {
        meals,
        history: historySnap.docs.map((snapshot) => snapshot.data() as SpinRecord),
        filters: local.filters,
        settings: local.settings,
      };
    }

    return {
      meals,
      history: historySnap.docs.map((snapshot) => snapshot.data() as SpinRecord),
      filters: profile.filters,
      settings: profile.settings,
    };
  }

  private async readProfile(
    db: Firestore,
    userId: string,
  ): Promise<{ filters: Filters; settings: Settings }> {
    const snapshot = await getDoc(doc(db, "users", userId, "profile", "main"));
    const data = snapshot.data() as { filters?: Filters; settings?: Settings } | undefined;
    return {
      filters: { ...DEFAULT_FILTERS, ...(data?.filters ?? {}) },
      settings: { ...DEFAULT_SETTINGS, ...(data?.settings ?? {}) },
    };
  }

  async createMeal(draft: MealDraft): Promise<Meal> {
    const { db, userId } = await this.connect();
    const now = Date.now();
    const meal: Meal = { ...draft, id: uid("meal"), createdAt: now, updatedAt: now };
    await setDoc(doc(db, "users", userId, "meals", meal.id), meal);
    return meal;
  }

  async updateMeal(id: string, patch: Partial<MealDraft>): Promise<Meal> {
    const { db, userId } = await this.connect();
    const ref = doc(db, "users", userId, "meals", id);
    const payload = { ...patch, updatedAt: Date.now() };
    await updateDoc(ref, payload);
    return { id, ...payload } as Meal;
  }

  async deleteMeal(id: string): Promise<void> {
    const { db, userId } = await this.connect();
    await deleteDoc(doc(db, "users", userId, "meals", id));
  }

  async putMeals(meals: Meal[]): Promise<void> {
    const { db, userId } = await this.connect();
    // Firestore caps a batch at 500 writes.
    for (let start = 0; start < meals.length; start += 400) {
      const batch = writeBatch(db);
      for (const meal of meals.slice(start, start + 400)) {
        batch.set(doc(db, "users", userId, "meals", meal.id), meal);
      }
      await batch.commit();
    }
  }

  async addSpin(record: SpinRecord): Promise<void> {
    const { db, userId } = await this.connect();
    await setDoc(doc(db, "users", userId, "history", record.id), record);
  }

  async updateSpin(id: string, patch: Partial<SpinRecord>): Promise<void> {
    const { db, userId } = await this.connect();
    await setDoc(doc(db, "users", userId, "history", id), patch, { merge: true });
  }

  async clearHistory(): Promise<void> {
    const { db, userId } = await this.connect();
    const snapshot = await getDocs(collection(db, "users", userId, "history"));
    for (let start = 0; start < snapshot.docs.length; start += 400) {
      const batch = writeBatch(db);
      for (const document of snapshot.docs.slice(start, start + 400)) batch.delete(document.ref);
      await batch.commit();
    }
  }

  async saveFilters(filters: Filters): Promise<void> {
    const { db, userId } = await this.connect();
    await setDoc(doc(db, "users", userId, "profile", "main"), { filters }, { merge: true });
  }

  async saveSettings(settings: Settings): Promise<void> {
    const { db, userId } = await this.connect();
    await setDoc(doc(db, "users", userId, "profile", "main"), { settings }, { merge: true });
  }

  async reset(): Promise<void> {
    const { db, userId } = await this.connect();
    const [meals, history] = await Promise.all([
      getDocs(collection(db, "users", userId, "meals")),
      getDocs(collection(db, "users", userId, "history")),
    ]);
    const docs = [...meals.docs, ...history.docs];
    for (let start = 0; start < docs.length; start += 400) {
      const batch = writeBatch(db);
      for (const document of docs.slice(start, start + 400)) batch.delete(document.ref);
      await batch.commit();
    }
  }

  subscribe(onChange: (data: AppData) => void): () => void {
    let unsubscribes: Unsubscribe[] = [];
    let cancelled = false;

    const state: AppData = {
      meals: [],
      history: [],
      filters: { ...DEFAULT_FILTERS },
      settings: { ...DEFAULT_SETTINGS },
    };
    // Emit only once every stream has spoken, so the UI never flashes an empty
    // wheel while the profile document is still in flight.
    const seen = { meals: false, history: false, profile: false };
    const emit = () => {
      if (seen.meals && seen.history && seen.profile) onChange({ ...state });
    };

    void this.connect().then(({ db, userId }) => {
      if (cancelled) return;
      const paths = this.paths(db, userId);

      unsubscribes = [
        onSnapshot(paths.meals, (snapshot) => {
          state.meals = snapshot.docs.map((document) => document.data() as Meal);
          seen.meals = true;
          emit();
        }),
        onSnapshot(query(paths.history, orderBy("at", "desc"), limit(HISTORY_LIMIT)), (snapshot) => {
          state.history = snapshot.docs.map((document) => document.data() as SpinRecord);
          seen.history = true;
          emit();
        }),
        onSnapshot(doc(db, "users", userId, "profile", "main"), (snapshot) => {
          const data = snapshot.data() as { filters?: Filters; settings?: Settings } | undefined;
          state.filters = { ...DEFAULT_FILTERS, ...(data?.filters ?? {}) };
          state.settings = { ...DEFAULT_SETTINGS, ...(data?.settings ?? {}) };
          seen.profile = true;
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
