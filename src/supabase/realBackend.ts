import { createClient } from "@supabase/supabase-js";
import type { TownRows } from "../session/mapRow";
import type { ActionWithLayout, TownBackend, TownSession } from "./backend";

export function createRealBackend(url: string, anonKey: string): TownBackend {
  const supabase = createClient(url, anonKey);

  async function fetchRows(): Promise<TownRows> {
    const [tasks, habits, habitTicks, focusSessions, wallets, ledger, inventory, board] =
      await Promise.all([
        supabase.from("tasks").select("id,title,notes,created_at,completed_at"),
        supabase.from("habits").select("id,title,archived_at"),
        supabase.from("habit_ticks").select("id,habit_id,ticked_at"),
        supabase.from("focus_sessions").select("id,planned_minutes,started_at,ended_at,note,paid"),
        supabase.from("wallets").select("balance"),
        supabase.from("ledger").select("id,delta,source,source_id,created_at"),
        supabase.from("inventory").select("catalog_id,count"),
        supabase.from("board_pieces").select("id,catalog_id,x,y,rotation"),
      ]);
    const failed = [
      tasks,
      habits,
      habitTicks,
      focusSessions,
      wallets,
      ledger,
      inventory,
      board,
    ].find((result) => result.error);
    if (failed?.error) throw failed.error;
    return {
      tasks: tasks.data ?? [],
      habits: habits.data ?? [],
      habit_ticks: habitTicks.data ?? [],
      focus_sessions: focusSessions.data ?? [],
      wallets: wallets.data ?? [],
      ledger: ledger.data ?? [],
      inventory: inventory.data ?? [],
      board_pieces: board.data ?? [],
    } as TownRows;
  }

  return {
    isLocal: false,
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return data.session ? { userId: data.session.user.id } : null;
    },
    onAuthStateChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const mapped: TownSession | null = session ? { userId: session.user.id } : null;
        callback(mapped);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn(email: string) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      return { error: error ? error.message : null };
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    fetchRows,
    async applyAction(action: ActionWithLayout) {
      const { error } = await supabase.rpc("apply_action", { action });
      return { error: error ? error.message : null };
    },
  };
}
