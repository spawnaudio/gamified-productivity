import { useState, type FormEvent } from "react";

export function AuthScreen({
  onSubmit,
  error,
}: {
  onSubmit: (email: string) => Promise<void>;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(email.trim());
    setSent(true);
  }

  return (
    <main className="auth">
      <h1>Tiny Town</h1>
      <p>Sign in with a magic link. This is a personal tool.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button type="submit">Send link</button>
      </form>
      {sent ? <p>Check your email.</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
