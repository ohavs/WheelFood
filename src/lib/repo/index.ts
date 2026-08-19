"use client";

import { FirebaseRepository } from "@/lib/repo/firebase";
import { isFirebaseConfigured } from "@/lib/repo/firebase-env";
import { LocalRepository } from "@/lib/repo/local";
import type { DataRepository } from "@/lib/repo/types";

export type { DataRepository } from "@/lib/repo/types";
export { isFirebaseConfigured } from "@/lib/repo/firebase-env";

/**
 * Picks the backend for this session: Firestore when the project is
 * configured, localStorage otherwise. `StoreProvider` falls back to local if
 * the Firebase handshake fails (offline first load, anonymous auth disabled),
 * so a bad connection degrades instead of blocking the app.
 */
export function createRepository(): DataRepository {
  return isFirebaseConfigured() ? new FirebaseRepository() : new LocalRepository();
}

export function createLocalRepository(): DataRepository {
  return new LocalRepository();
}
