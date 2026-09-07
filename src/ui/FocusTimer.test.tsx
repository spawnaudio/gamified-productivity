import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FocusSession } from "../rules/types";
import { FocusTimer } from "./FocusTimer";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => memory.clear(),
    },
  });
});

afterEach(() => {
  cleanup();
});

function openSession(id: string): FocusSession {
  return {
    id,
    plannedMinutes: 25,
    startedAt: "2026-09-07T01:00:00.000Z",
    endedAt: null,
    note: null,
    paid: false,
  };
}

function finishButton() {
  return screen.getByRole("button", { name: "Finish" }) as HTMLButtonElement;
}

function noteInput() {
  return screen.getByLabelText("What moved") as HTMLInputElement;
}

describe("FocusTimer", () => {
  it("disables Finish unless the note has non-whitespace text and writes are allowed", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const session = openSession("f1");
    const { rerender } = render(
      <FocusTimer sessions={[session]} sync="ok" dispatch={dispatch} />,
    );

    expect(finishButton().disabled).toBe(true);

    await user.type(noteInput(), "   ");
    expect(finishButton().disabled).toBe(true);

    await user.clear(noteInput());
    await user.type(noteInput(), "Drafted intro");
    expect(finishButton().disabled).toBe(false);

    rerender(<FocusTimer sessions={[session]} sync="offline" dispatch={dispatch} />);
    expect(finishButton().disabled).toBe(true);
  });

  it("does not dispatch finishFocus when the note is empty", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn().mockResolvedValue(undefined);
    render(<FocusTimer sessions={[openSession("f1")]} sync="ok" dispatch={dispatch} />);

    finishButton().click();
    expect(dispatch).not.toHaveBeenCalled();
    await user.click(finishButton());
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("dispatches finishFocus when Finish is clicked with a note", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn().mockResolvedValue(undefined);
    render(<FocusTimer sessions={[openSession("f1")]} sync="ok" dispatch={dispatch} />);

    await user.type(noteInput(), "Drafted intro");
    await user.click(finishButton());
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "finishFocus",
        id: "f1",
        note: "Drafted intro",
      }),
    );
  });

  it("clears What moved when the open session id changes", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const first = openSession("f1");
    const { rerender } = render(
      <FocusTimer sessions={[first]} sync="ok" dispatch={dispatch} />,
    );

    await user.type(noteInput(), "Previous session note");
    expect(noteInput().value).toBe("Previous session note");

    rerender(
      <FocusTimer
        sessions={[{ ...first, endedAt: "2026-09-07T01:25:00.000Z" }]}
        sync="ok"
        dispatch={dispatch}
      />,
    );
    rerender(
      <FocusTimer sessions={[openSession("f2")]} sync="ok" dispatch={dispatch} />,
    );

    expect(noteInput().value).toBe("");
  });

  it("does not throw when localStorage is missing", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: undefined,
    });
    expect(() =>
      render(<FocusTimer sessions={[]} sync="ok" dispatch={vi.fn()} />),
    ).not.toThrow();
  });
});
