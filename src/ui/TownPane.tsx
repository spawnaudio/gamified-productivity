import type { Action, AppState, SyncStatus } from "../rules/types";
import { Board } from "./Board";

export function TownPane({
  state,
  sync,
  dispatch,
}: {
  state: AppState;
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  return (
    <section className="town-pane">
      <Board pieces={state.board} sync={sync} dispatch={dispatch} />
    </section>
  );
}
