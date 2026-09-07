import { describe, expect, it } from "vitest";
import { applyAction } from "../rules/apply";
import { emptyState } from "../rules/state";
import type { AppState } from "../rules/types";
import { commitAction } from "./commitAction";

const homeOk = { layout: "home" as const, sync: "ok" as const };

function stateWithTwoOpenTasks(): AppState {
  const first = applyAction(
    emptyState(),
    { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
    homeOk,
  );
  if (!first.ok) throw new Error("setup");
  const second = applyAction(
    first.state,
    { type: "createTask", id: "t2", title: "Walk", notes: "", at: "2026-09-06T01:01:00.000Z" },
    homeOk,
  );
  if (!second.ok) throw new Error("setup");
  return second.state;
}

describe("commitAction", () => {
  it("applies a second complete against the latest state so both credits stick", () => {
    const latest = { current: stateWithTwoOpenTasks() };
    const first = commitAction(latest, { type: "completeTask", id: "t1", at: "2026-09-06T01:05:00.000Z" }, homeOk);
    const second = commitAction(latest, { type: "completeTask", id: "t2", at: "2026-09-06T01:06:00.000Z" }, homeOk);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(latest.current.wallet).toBe(2);
    expect(latest.current.ledger).toHaveLength(2);
  });
});
