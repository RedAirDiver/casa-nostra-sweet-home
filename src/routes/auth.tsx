import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Logga in – Casa Nostra Kjula" },
      { name: "description", content: "Inloggning för Casa Nostra Kjulas ägare och personal." },
      { property: "og:title", content: "Logga in – Casa Nostra Kjula" },
      { property: "og:description", content: "Inloggning för restaurangens ägare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (err) throw err;
        if (!data.session) {
          setMessage("Konto skapat. Kolla din e-post och klicka på bekräftelselänken.");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          ← Till hemsidan
        </Link>
        <h1 className="mt-6 font-[var(--serif)] text-5xl">
          {mode === "signin" ? "Logga in" : "Skapa konto"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          För Casa Nostras ägare – här redigerar du menyer och bilder.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            E-post
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-muted px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Lösenord
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-border bg-muted px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-primary">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Vänta…" : mode === "signin" ? "Logga in" : "Skapa konto"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-6 text-sm text-muted-foreground underline"
        >
          {mode === "signin" ? "Har du inget konto? Skapa ett" : "Har du redan ett konto? Logga in"}
        </button>
      </div>
    </main>
  );
}
