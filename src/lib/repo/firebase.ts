/**
 * Firebase backend — placeholder.
 *
 * The app runs entirely on `LocalRepository` until real credentials exist.
 * To switch over:
 *
 * 1. `npm i firebase`
 * 2. Fill the NEXT_PUBLIC_FIREBASE_* variables in `.env.local`
 *    (see `.env.example`).
 * 3. Implement `FirebaseRepository` against `DataRepository` using
 *    Firestore collections `users/{uid}/meals` and `users/{uid}/history`,
 *    plus a `users/{uid}` doc for filters + settings.
 * 4. Return it from `getRepository()` in `src/lib/repo/index.ts` when
 *    `isFirebaseConfigured()` is true.
 *
 * Keeping this file separate means the swap touches exactly two files.
 */

export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function readFirebaseEnv(): FirebaseEnv | null {
  const env = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.values(env).some((value) => !value);
  return missing ? null : (env as FirebaseEnv);
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseEnv() !== null;
}
