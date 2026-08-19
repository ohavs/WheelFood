export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Reads the public web config.
 *
 * These have to be referenced as full literals so Next can inline them at
 * build time — `process.env[name]` would not be replaced.
 */
export function readFirebaseEnv(): FirebaseEnv | null {
  const env = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return Object.values(env).some((value) => !value) ? null : (env as FirebaseEnv);
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseEnv() !== null;
}
