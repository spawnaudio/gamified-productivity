export function isAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { status?: unknown; message?: unknown };
  if (record.status === 401) return true;
  if (typeof record.message !== "string") return false;
  return /jwt|auth/i.test(record.message);
}
