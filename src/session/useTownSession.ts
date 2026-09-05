import { useCallback, useEffect, useState } from "react";
import { getLayoutMode } from "../layout";
import { applyAction } from "../rules/apply";
import { emptyState } from "../rules/state";
import type { Action, AppState, LayoutMode, MutationResult, SyncStatus } from "../rules/types";
import { backend } from "../supabase/client";
import type { TownSession } from "../supabase/backend";
import { rowsToState } from "./mapRow";

function isNetworkError(message: string): boolean {
  return /fetch|network|Failed to fetch/i.test(message);
}

/**
 * Real desktop is detected via Tauri internals. In dev builds only, `?layout=home`
 * lets the browser preview the full dollhouse without packaging Tauri.
 */
function resolveLayout(): LayoutMode {
  const base = getLayoutMode(window as { __TAURI_INTERNALS__?: unknown });
  if (base === "home") return base;
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("layout") === "home") return "home";
  }
  return base;
}

export function useTownSession() {
  const layout: LayoutMode = resolveLayout();
  const [session, setSession] = useState<TownSession | null>(null);
  const [state, setState] = useState<AppState>(emptyState());
  const [sync, setSync] = useState<SyncStatus>("syncing");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setSync("syncing");
    try {
      const rows = await backend.fetchRows();
      setState(rowsToState(rows));
      setSync("ok");
      setError(null);
    } catch {
      setSync("offline");
      setError("Can't sync right now.");
    }
  }, []);

  useEffect(() => {
    void backend.getSession().then(setSession);
    return backend.onAuthStateChange(setSession);
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
    const { error: signInError } = await backend.signIn(email);
    if (signInError) setError(signInError);
  }

  async function signOut() {
    await backend.signOut();
    setState(emptyState());
    setSession(null);
  }

  async function dispatch(action: Action): Promise<MutationResult> {
    const predicted = applyAction(state, action, { layout, sync });
    if (!predicted.ok) return predicted;
    const previous = state;
    setState(predicted.state);
    const { error: rpcError } = await backend.applyAction({ ...action, layout });
    if (rpcError) {
      setState(previous);
      if (isNetworkError(rpcError)) {
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
