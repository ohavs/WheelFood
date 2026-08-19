import { LocalRepository } from "@/lib/repo/local";
import type { DataRepository } from "@/lib/repo/types";

export type { DataRepository } from "@/lib/repo/types";

let instance: DataRepository | null = null;

/**
 * Returns the active repository.
 *
 * When Firebase credentials land, add the branch here (see
 * src/lib/repo/firebase.ts) — nothing else in the app needs to change:
 *
 *   if (isFirebaseConfigured()) return (instance = new FirebaseRepository());
 */
export function getRepository(): DataRepository {
  if (!instance) instance = new LocalRepository();
  return instance;
}

/** Test/debug hook for injecting a different backend. */
export function setRepository(repo: DataRepository): void {
  instance = repo;
}
