import { describe, expect, it } from "vitest";
import { applyAction } from "./apply";
import { emptyState } from "./state";

const homeOk = { layout: "home" as const, sync: "ok" as const };

describe("tasks", () => {
  it("creates a task without paying", () => {
    const result = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      homeOk,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.wallet).toBe(0);
    expect(result.state.tasks[0]?.title).toBe("Invoice");
  });

  it("pays 1 the first time a task is completed", () => {
    const created = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      homeOk,
    );
    if (!created.ok) throw new Error("setup");
    const result = applyAction(
      created.state,
      { type: "completeTask", id: "t1", at: "2026-09-06T01:05:00.000Z" },
      homeOk,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.wallet).toBe(1);
    expect(result.state.ledger).toHaveLength(1);
    expect(result.state.tasks[0]?.completedAt).toBe("2026-09-06T01:05:00.000Z");
  });

  it("does not pay twice for the same task, including retries", () => {
    const created = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      homeOk,
    );
    if (!created.ok) throw new Error("setup");
    const once = applyAction(created.state, { type: "completeTask", id: "t1", at: "2026-09-06T01:05:00.000Z" }, homeOk);
    if (!once.ok) throw new Error("setup");
    const twice = applyAction(once.state, { type: "completeTask", id: "t1", at: "2026-09-06T01:06:00.000Z" }, homeOk);
    expect(twice.ok).toBe(true);
    if (!twice.ok) return;
    expect(twice.state.wallet).toBe(1);
    expect(twice.state.ledger).toHaveLength(1);
  });

  it("does not claw back currency when a completed task is deleted", () => {
    const created = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      homeOk,
    );
    if (!created.ok) throw new Error("setup");
    const done = applyAction(created.state, { type: "completeTask", id: "t1", at: "2026-09-06T01:05:00.000Z" }, homeOk);
    if (!done.ok) throw new Error("setup");
    const result = applyAction(done.state, { type: "deleteTask", id: "t1" }, homeOk);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.wallet).toBe(1);
    expect(result.state.tasks).toHaveLength(0);
  });
});

describe("habits", () => {
  it("pays 1 per tick, including two ticks the same day", () => {
    const created = applyAction(emptyState(), { type: "createHabit", id: "h1", title: "Make the bed" }, homeOk);
    if (!created.ok) throw new Error("setup");
    const first = applyAction(
      created.state,
      { type: "tickHabit", tickId: "k1", habitId: "h1", at: "2026-09-06T08:00:00.000Z" },
      homeOk,
    );
    if (!first.ok) throw new Error("setup");
    const second = applyAction(
      first.state,
      { type: "tickHabit", tickId: "k2", habitId: "h1", at: "2026-09-06T20:00:00.000Z" },
      homeOk,
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.state.wallet).toBe(2);
    expect(second.state.habitTicks).toHaveLength(2);
  });

  it("retries the same tick id without double-credit", () => {
    const created = applyAction(emptyState(), { type: "createHabit", id: "h1", title: "Make the bed" }, homeOk);
    if (!created.ok) throw new Error("setup");
    const first = applyAction(
      created.state,
      { type: "tickHabit", tickId: "k1", habitId: "h1", at: "2026-09-06T08:00:00.000Z" },
      homeOk,
    );
    if (!first.ok) throw new Error("setup");
    const retry = applyAction(
      first.state,
      { type: "tickHabit", tickId: "k1", habitId: "h1", at: "2026-09-06T08:00:00.000Z" },
      homeOk,
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.state.wallet).toBe(1);
    expect(retry.state.habitTicks).toHaveLength(1);
  });

  it("keeps credits after a habit is archived", () => {
    const created = applyAction(emptyState(), { type: "createHabit", id: "h1", title: "Make the bed" }, homeOk);
    if (!created.ok) throw new Error("setup");
    const ticked = applyAction(
      created.state,
      { type: "tickHabit", tickId: "k1", habitId: "h1", at: "2026-09-06T08:00:00.000Z" },
      homeOk,
    );
    if (!ticked.ok) throw new Error("setup");
    const archived = applyAction(
      ticked.state,
      { type: "archiveHabit", id: "h1" },
      homeOk,
    );
    expect(archived.ok).toBe(true);
    if (!archived.ok) return;
    expect(archived.state.wallet).toBe(1);
    expect(archived.state.habits[0]?.archivedAt).not.toBeNull();
  });
});

describe("focus", () => {
  it("does not pay when discarded", () => {
    const started = applyAction(
      emptyState(),
      { type: "startFocus", id: "f1", plannedMinutes: 25, at: "2026-09-06T09:00:00.000Z" },
      homeOk,
    );
    if (!started.ok) throw new Error("setup");
    const discarded = applyAction(
      started.state,
      { type: "discardFocus", id: "f1", at: "2026-09-06T09:10:00.000Z" },
      homeOk,
    );
    expect(discarded.ok).toBe(true);
    if (!discarded.ok) return;
    expect(discarded.state.wallet).toBe(0);
    expect(discarded.state.focusSessions[0]?.paid).toBe(false);
    expect(discarded.state.focusSessions[0]?.endedAt).toBe("2026-09-06T09:10:00.000Z");
  });

  it("does not pay finish without a note", () => {
    const started = applyAction(
      emptyState(),
      { type: "startFocus", id: "f1", plannedMinutes: 25, at: "2026-09-06T09:00:00.000Z" },
      homeOk,
    );
    if (!started.ok) throw new Error("setup");
    const finished = applyAction(
      started.state,
      { type: "finishFocus", id: "f1", note: "   ", at: "2026-09-06T09:25:00.000Z" },
      homeOk,
    );
    expect(finished).toEqual({ ok: false, error: "note_required" });
  });

  it("pays 1 when finished with a note, including early end", () => {
    const started = applyAction(
      emptyState(),
      { type: "startFocus", id: "f1", plannedMinutes: 50, at: "2026-09-06T09:00:00.000Z" },
      homeOk,
    );
    if (!started.ok) throw new Error("setup");
    const finished = applyAction(
      started.state,
      { type: "finishFocus", id: "f1", note: "Drafted intro", at: "2026-09-06T09:12:00.000Z" },
      homeOk,
    );
    expect(finished.ok).toBe(true);
    if (!finished.ok) return;
    expect(finished.state.wallet).toBe(1);
    expect(finished.state.focusSessions[0]?.paid).toBe(true);
  });

  it("rejects a second open session", () => {
    const started = applyAction(
      emptyState(),
      { type: "startFocus", id: "f1", plannedMinutes: 25, at: "2026-09-06T09:00:00.000Z" },
      homeOk,
    );
    if (!started.ok) throw new Error("setup");
    const second = applyAction(
      started.state,
      { type: "startFocus", id: "f2", plannedMinutes: 15, at: "2026-09-06T09:01:00.000Z" },
      homeOk,
    );
    expect(second).toEqual({ ok: false, error: "focus_already_open" });
  });

  it("retries finishFocus without double-credit", () => {
    const started = applyAction(
      emptyState(),
      { type: "startFocus", id: "f1", plannedMinutes: 25, at: "2026-09-06T09:00:00.000Z" },
      homeOk,
    );
    if (!started.ok) throw new Error("setup");
    const finished = applyAction(
      started.state,
      { type: "finishFocus", id: "f1", note: "Drafted intro", at: "2026-09-06T09:25:00.000Z" },
      homeOk,
    );
    if (!finished.ok) throw new Error("setup");
    const retry = applyAction(
      finished.state,
      { type: "finishFocus", id: "f1", note: "Drafted intro", at: "2026-09-06T09:26:00.000Z" },
      homeOk,
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.state.wallet).toBe(1);
  });
});
