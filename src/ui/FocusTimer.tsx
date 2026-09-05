import { useEffect, useState } from "react";
import type { Action, FocusSession, SyncStatus } from "../rules/types";
import { canWrite } from "./canWrite";

const PRESETS = [15, 25, 50] as const;
const STORAGE_KEY = "tiny-town:focus-minutes";

export function FocusTimer({
  sessions,
  sync,
  dispatch,
}: {
  sessions: FocusSession[];
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const locked = !canWrite(sync);
  const open = sessions.find((session) => session.endedAt === null);
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState<15 | 25 | 50>(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored === 15 || stored === 50 ? stored : 25;
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  const remaining = open
    ? Math.max(0, open.plannedMinutes * 60_000 - (now - new Date(open.startedAt).getTime()))
    : 0;
  const remainingLabel = `${Math.floor(remaining / 60_000)}:${String(
    Math.floor((remaining % 60_000) / 1000),
  ).padStart(2, "0")}`;

  return (
    <section>
      <h2>Focus</h2>
      {open ? (
        <>
          <p>{remainingLabel}</p>
          <label>
            What moved
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={locked}
            />
          </label>
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              void dispatch({
                type: "finishFocus",
                id: open.id,
                note,
                at: new Date().toISOString(),
              })
            }
          >
            Finish
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              void dispatch({
                type: "discardFocus",
                id: open.id,
                at: new Date().toISOString(),
              })
            }
          >
            Discard
          </button>
        </>
      ) : (
        <>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={locked}
              onClick={() => {
                setMinutes(preset);
                localStorage.setItem(STORAGE_KEY, String(preset));
              }}
            >
              {preset}m
            </button>
          ))}
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              void dispatch({
                type: "startFocus",
                id: crypto.randomUUID(),
                plannedMinutes: minutes,
                at: new Date().toISOString(),
              })
            }
          >
            Start {minutes}m
          </button>
        </>
      )}
    </section>
  );
}
