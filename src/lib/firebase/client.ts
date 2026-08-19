"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { readFirebaseEnv } from "@/lib/repo/firebase-env";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

/** Lazily boots the SDK. Returns null when the project is not configured. */
export function getFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } | null {
  const env = readFirebaseEnv();
  if (!env) return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp(env);
    // Persistent cache gives us offline reads/writes and a queue that flushes
    // when the connection comes back — the PWA keeps working on the subway.
    // It needs IndexedDB, which private-mode browsers and some in-app webviews
    // withhold; there we fall back to an in-memory cache rather than letting
    // initialization throw and drop the whole session to local-only storage.
    const hasIndexedDb = typeof globalThis.indexedDB !== "undefined";
    db = initializeFirestore(app, {
      localCache: hasIndexedDb
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
    });
    auth = getAuth(app);
  }

  return { app: app!, db: db!, auth: auth! };
}

/**
 * Resolves the current user, signing in anonymously if needed.
 *
 * Anonymous auth is what scopes every document to a device/account, so it must
 * be enabled in Firebase Console → Authentication → Sign-in method. If it is
 * not, this rejects and the app falls back to local storage.
 */
export function ensureUser(auth: Auth): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }
        signInAnonymously(auth).catch((error) => {
          unsubscribe();
          reject(error);
        });
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}
