import { useTownSession } from "./session/useTownSession";
import { AuthScreen } from "./ui/AuthScreen";
import { SyncBanner } from "./ui/SyncBanner";
import { WorkPane } from "./ui/WorkPane";

export function App() {
  const town = useTownSession();
  if (!town.session) {
    return <AuthScreen onSubmit={town.signIn} error={town.error} />;
  }
  return (
    <main>
      <header>
        <h1>Tiny Town</h1>
        <SyncBanner sync={town.sync} />
        <button type="button" onClick={() => void town.signOut()}>
          Sign out
        </button>
      </header>
      <WorkPane state={town.state} sync={town.sync} dispatch={town.dispatch} />
    </main>
  );
}
