import { applyAction } from "../rules/apply";
import type { Action, ApplyContext, AppState, MutationResult } from "../rules/types";

export type LatestState = {
  current: AppState;
};

export function commitAction(
  latest: LatestState,
  action: Action,
  context: ApplyContext,
): MutationResult {
  const predicted = applyAction(latest.current, action, context);
  if (!predicted.ok) return predicted;
  latest.current = predicted.state;
  return predicted;
}
