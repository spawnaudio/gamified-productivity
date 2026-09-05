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
    const archived = applyAction(ticked.state, { type: "archiveHabit", id: "h1" }, homeOk);
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

describe("town", () => {
  it("buys a path when the wallet can pay, and refuses when it cannot", () => {
    const broke = applyAction(
      emptyState(),
      { type: "buy", id: "b1", catalogId: "path", at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(broke).toEqual({ ok: false, error: "insufficient_funds" });

    const rich = emptyState();
    rich.wallet = 1;
    const bought = applyAction(
      rich,
      { type: "buy", id: "b1", catalogId: "path", at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.state.wallet).toBe(0);
    expect(bought.state.inventory).toEqual([{ catalogId: "path", count: 1 }]);
    expect(bought.state.ledger[0]?.delta).toBe(-1);
  });

  it("does not sell the starter well", () => {
    const rich = emptyState();
    rich.wallet = 20;
    const result = applyAction(
      rich,
      { type: "buy", id: "b1", catalogId: "well", at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(result).toEqual({ ok: false, error: "starter_not_for_sale" });
  });

  it("retries the same buy id without charging twice", () => {
    const rich = emptyState();
    rich.wallet = 5;
    const first = applyAction(
      rich,
      { type: "buy", id: "b1", catalogId: "path", at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    if (!first.ok) throw new Error("setup");
    const retry = applyAction(
      first.state,
      { type: "buy", id: "b1", catalogId: "path", at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.state.wallet).toBe(4);
    expect(retry.state.inventory[0]?.count).toBe(1);
  });

  it("places from inventory and rejects overlap and off-board", () => {
    const state = emptyState();
    state.inventory = [{ catalogId: "cottage", count: 1 }];
    const off = applyAction(
      state,
      { type: "place", id: "p1", catalogId: "cottage", x: 15, y: 11, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(off).toEqual({ ok: false, error: "off_board" });

    const placed = applyAction(
      state,
      { type: "place", id: "p1", catalogId: "cottage", x: 0, y: 0, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    if (!placed.ok) throw new Error("setup");
    expect(placed.state.inventory).toEqual([]);
    const overlap = applyAction(
      placed.state,
      { type: "place", id: "p2", catalogId: "path", x: 1, y: 1, rotation: 0, at: "2026-09-06T10:01:00.000Z" },
      homeOk,
    );
    expect(overlap.ok).toBe(false);
    if (overlap.ok) return;
    expect(overlap.error).toBe("empty_inventory");
  });

  it("cannot place with empty inventory", () => {
    const result = applyAction(
      emptyState(),
      { type: "place", id: "p1", catalogId: "path", x: 0, y: 0, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    expect(result).toEqual({ ok: false, error: "empty_inventory" });
  });

  it("detects overlap when inventory allows placement", () => {
    const state = emptyState();
    state.inventory = [
      { catalogId: "cottage", count: 1 },
      { catalogId: "path", count: 1 },
    ];
    const placed = applyAction(
      state,
      { type: "place", id: "p1", catalogId: "cottage", x: 0, y: 0, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    if (!placed.ok) throw new Error("setup");
    const overlap = applyAction(
      placed.state,
      { type: "place", id: "p2", catalogId: "path", x: 1, y: 1, rotation: 0, at: "2026-09-06T10:01:00.000Z" },
      homeOk,
    );
    expect(overlap).toEqual({ ok: false, error: "overlap" });
  });

  it("picks up a piece back into inventory at no cost", () => {
    const state = emptyState();
    state.inventory = [{ catalogId: "path", count: 1 }];
    const placed = applyAction(
      state,
      { type: "place", id: "p1", catalogId: "path", x: 2, y: 2, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
      homeOk,
    );
    if (!placed.ok) throw new Error("setup");
    const wallet = placed.state.wallet;
    const picked = applyAction(placed.state, { type: "pickUp", id: "p1" }, homeOk);
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;
    expect(picked.state.wallet).toBe(wallet);
    expect(picked.state.board).toHaveLength(0);
    expect(picked.state.inventory).toEqual([{ catalogId: "path", count: 1 }]);
  });
});

describe("guards", () => {
  it("blocks writes when sync is not ok", () => {
    const result = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      { layout: "home", sync: "offline" },
    );
    expect(result).toEqual({ ok: false, error: "sync_blocked" });
  });

  it("forbids buy, place, and pick up on companion", () => {
    const state = emptyState();
    state.wallet = 5;
    state.inventory = [{ catalogId: "path", count: 1 }];
    state.board = [{ id: "p1", catalogId: "path", x: 0, y: 0, rotation: 0 }];
    const companion = { layout: "companion" as const, sync: "ok" as const };
    expect(
      applyAction(state, { type: "buy", id: "b1", catalogId: "path", at: "2026-09-06T10:00:00.000Z" }, companion),
    ).toEqual({ ok: false, error: "companion_forbidden" });
    expect(
      applyAction(
        state,
        { type: "place", id: "p2", catalogId: "path", x: 1, y: 0, rotation: 0, at: "2026-09-06T10:00:00.000Z" },
        companion,
      ),
    ).toEqual({ ok: false, error: "companion_forbidden" });
    expect(applyAction(state, { type: "pickUp", id: "p1" }, companion)).toEqual({
      ok: false,
      error: "companion_forbidden",
    });
  });

  it("allows work writes on companion when sync is ok", () => {
    const result = applyAction(
      emptyState(),
      { type: "createTask", id: "t1", title: "Invoice", notes: "", at: "2026-09-06T01:00:00.000Z" },
      { layout: "companion", sync: "ok" },
    );
    expect(result.ok).toBe(true);
  });
});
