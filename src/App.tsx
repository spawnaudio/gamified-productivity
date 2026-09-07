import { useState } from "react";
import { useTownSession } from "./session/useTownSession";
import { AuthScreen } from "./ui/AuthScreen";
import { SidePane } from "./ui/SidePane";
import { SyncBanner } from "./ui/SyncBanner";
import { TownPane } from "./ui/TownPane";

export function App() {
  const town = useTownSession();
  const [collapsed, setCollapsed] = useState(false);
  if (!town.session) {
    return <AuthScreen onSubmit={town.signIn} error={town.error} />;
  }
  const isHome = town.layout === "home";
  const showSide = town.layout === "companion" || !collapsed;
  return (
    <main className={isHome ? (collapsed ? "home home--map-only" : "home") : "companion"}>
      <header>
        <h1>Tiny Town</h1>
        <SyncBanner sync={town.sync} />
        {isHome ? (
          <button type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "Show work" : "Hide work"}
          </button>
        ) : null}
        <button type="button" onClick={() => void town.signOut()}>
          Sign out
        </button>
      </header>
      {isHome ? (
        <TownPane state={town.state} sync={town.sync} dispatch={town.dispatch} />
      ) : null}
      {showSide ? (
        <SidePane
          state={town.state}
          sync={town.sync}
          dispatch={town.dispatch}
          showShop={isHome}
        />
      ) : null}
    </main>
  );
}
