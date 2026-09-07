import { useState, type FormEvent } from "react";
import type { Action, SyncStatus, Task } from "../rules/types";
import { canWrite } from "./canWrite";

export function TaskList({
  tasks,
  sync,
  dispatch,
}: {
  tasks: Task[];
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const locked = !canWrite(sync);
  const open = tasks.filter((task) => task.completedAt === null);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await dispatch({
      type: "createTask",
      id: crypto.randomUUID(),
      title: trimmed,
      notes: "",
      at: new Date().toISOString(),
    });
    setTitle("");
  }

  return (
    <section>
      <h2>Tasks</h2>
      <form onSubmit={onCreate}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={locked}
          placeholder="Add a task"
        />
        <button type="submit" disabled={locked}>
          Add
        </button>
      </form>
      <ul>
        {open.map((task) => (
          <li key={task.id}>
            <span>{task.title}</span>
            <button
              type="button"
              disabled={locked}
              onClick={() =>
                void dispatch({
                  type: "completeTask",
                  id: task.id,
                  at: new Date().toISOString(),
                })
              }
            >
              Done
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => void dispatch({ type: "deleteTask", id: task.id })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
