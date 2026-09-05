import type { Action, LayoutMode } from "../rules/types";
import type { TownRows } from "../session/mapRow";

export type TownSession = { userId: string };

export type ActionWithLayout = Action & { layout: LayoutMode };

/**
 * The slice of backend behavior the town session depends on. A real Supabase
 * adapter and a dev-mode local adapter both implement it, so the UI never
 * talks to Supabase directly.
 */
export interface TownBackend {
  readonly isLocal: boolean;
  getSession(): Promise<TownSession | null>;
  onAuthStateChange(callback: (session: TownSession | null) => void): () => void;
  signIn(email: string): Promise<{ error: string | null }>;
  signOut(): Promise<void>;
  fetchRows(): Promise<TownRows>;
  applyAction(action: ActionWithLayout): Promise<{ error: string | null }>;
}
