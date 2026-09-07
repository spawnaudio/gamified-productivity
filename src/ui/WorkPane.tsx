import type { Action, AppState, SyncStatus } from "../rules/types";
import { FocusTimer } from "./FocusTimer";
import { HabitList } from "./HabitList";
import { TaskList } from "./TaskList";
import { WalletBadge } from "./WalletBadge";

export function WorkPane({
  state,
  sync,
  dispatch,
}: {
  state: AppState;
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  return (
    <div className="work-pane">
      <WalletBadge balance={state.wallet} />
      <TaskList tasks={state.tasks} sync={sync} dispatch={dispatch} />
      <HabitList habits={state.habits} sync={sync} dispatch={dispatch} />
      <FocusTimer sessions={state.focusSessions} sync={sync} dispatch={dispatch} />
    </div>
  );
}
