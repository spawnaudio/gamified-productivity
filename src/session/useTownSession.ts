import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getLayoutMode } from "../layout";
import { applyAction } from "../rules/apply";
import { emptyState } from "../rules/state";
import type { Action, AppState, LayoutMode, MutationResult, SyncStatus } from "../rules/types";
import { supabase } from "../supabase/client";
import { rowsToState, type TownRows } from "./mapRow";

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
  const failed = [tasks, habits, habitTicks, focusSessions, wallets, ledger, inventory, board].find(
    (result) => result.error,
  );
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
  };
}

export function useTownSession() {
  const layout: LayoutMode = getLayoutMode(window as { __TAURI_INTERNALS__?: unknown });
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState>(emptyState());
  const [sync, setSync] = useState<SyncStatus>("syncing");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setSync("syncing");
    try {
      const rows = await fetchRows();
      setState(rowsToState(rows));
      setSync("ok");
      setError(null);
    } catch {
      setSync("offline");
      setError("Can't sync right now.");
    }
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    void reload();
  }, [session, reload]);

  useEffect(() => {
    const onFocus = () => {
      if (session) void reload();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [session, reload]);

  async function signIn(email: string) {
    const { error: signInError } = await supabase.auth.signInWithOtp({ email });
    if (signInError) setError(signInError.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState(emptyState());
    setSession(null);
  }

  async function dispatch(action: Action): Promise<MutationResult> {
    const predicted = applyAction(state, action, { layout, sync });
    if (!predicted.ok) return predicted;
    const previous = state;
    setState(predicted.state);
    const { error: rpcError } = await supabase.rpc("apply_action", {
      action: { ...action, layout },
    });
    if (rpcError) {
      setState(previous);
      if (/fetch|network|Failed to fetch/i.test(rpcError.message)) {
        setSync("offline");
        setError("Can't sync right now.");
      } else {
        await reload();
      }
      return { ok: false, error: "not_found" };
    }
    return predicted;
  }

  return { session, state, sync, layout, error, signIn, signOut, dispatch, reload };
}
