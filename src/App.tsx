import { useState } from "react";
import { useTownSession } from "./session/useTownSession";
import { AuthScreen } from "./ui/AuthScreen";
import { SyncBanner } from "./ui/SyncBanner";
import { TownPane } from "./ui/TownPane";
import { WorkPane } from "./ui/WorkPane";

export function App() {
  const town = useTownSession();
  const [collapsed, setCollapsed] = useState(false);
  if (!town.session) {
    return <AuthScreen onSubmit={town.signIn} error={town.error} />;
  }
  return (
    <main className={town.layout === "home" ? "home" : "companion"}>
      <header>
        <h1>Tiny Town</h1>
        <SyncBanner sync={town.sync} />
        {town.layout === "home" ? (
          <button type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "Show work" : "Hide work"}
          </button>
        ) : null}
        <button type="button" onClick={() => void town.signOut()}>
          Sign out
        </button>
      </header>
      {town.layout === "home" ? (
        <TownPane state={town.state} sync={town.sync} dispatch={town.dispatch} />
      ) : null}
      {town.layout === "companion" || !collapsed ? (
        <WorkPane state={town.state} sync={town.sync} dispatch={town.dispatch} />
      ) : null}
    </main>
  );
}
