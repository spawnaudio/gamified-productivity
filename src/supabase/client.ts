import type { TownBackend } from "./backend";
import { createLocalBackend } from "./localBackend";
import { createRealBackend } from "./realBackend";

function selectBackend(): TownBackend {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    return createRealBackend(url, anonKey);
  }
  if (import.meta.env.PROD) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }
  console.warn(
    "[tiny-town] Supabase env vars missing; using the in-browser local backend for development.",
  );
  return createLocalBackend();
}

export const backend: TownBackend = selectBackend();
export const usingLocalBackend = backend.isLocal;
