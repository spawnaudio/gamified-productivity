import { useState, type FormEvent } from "react";
import type { Action, Habit, SyncStatus } from "../rules/types";
import { canWrite } from "./canWrite";

export function HabitList({
  habits,
  sync,
  dispatch,
}: {
  habits: Habit[];
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const locked = !canWrite(sync);
  const active = habits.filter((habit) => habit.archivedAt === null);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await dispatch({ type: "createHabit", id: crypto.randomUUID(), title: trimmed });
    setTitle("");
  }

  return (
    <section>
      <h2>Habits</h2>
      <form onSubmit={onCreate}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={locked}
          placeholder="Add a habit"
        />
        <button type="submit" disabled={locked}>
          Add
        </button>
      </form>
      <ul>
        {active.map((habit) => (
          <li key={habit.id}>
            <span>{habit.title}</span>
            <button
              type="button"
              disabled={locked}
              onClick={() =>
                void dispatch({
                  type: "tickHabit",
                  tickId: crypto.randomUUID(),
                  habitId: habit.id,
                  at: new Date().toISOString(),
                })
              }
            >
              Tick
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => void dispatch({ type: "archiveHabit", id: habit.id })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
