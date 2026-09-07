import { useTownSession } from "./session/useTownSession";
import { AuthScreen } from "./ui/AuthScreen";
import { SyncBanner } from "./ui/SyncBanner";

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
      <p>Wallet {town.state.wallet}</p>
    </main>
  );
}
