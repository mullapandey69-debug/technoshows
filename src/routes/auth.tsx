import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Logo, btn } from "@/components/ui-kit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TechnoShows" },
      { name: "description", content: "Sign in to save your watchlist and continue watching." },
      { property: "og:title", content: "Sign in — TechnoShows" },
      { property: "og:description", content: "Sign in to TechnoShows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    if (mode === "up" && !data.session) setMsg({ ok: true, text: "Check your email to confirm your account." });
  };
  const oauth = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) setMsg({ ok: false, text: error.message });
    } catch (error) {
      setMsg({
        ok: false,
        text: error instanceof Error ? error.message : "Google sign-in could not start. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-card">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save your watchlist and pick up where you left off.</p>
        <button type="button" disabled={busy} onClick={oauth} className={`${btn.ghost} mt-6 w-full`}>
          {busy ? "Redirecting to Google…" : "Continue with Google"}
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="h-11 w-full rounded-lg border bg-input/30 px-3 outline-none focus:border-primary" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className="h-11 w-full rounded-lg border bg-input/30 px-3 outline-none focus:border-primary" />
          <button disabled={busy} className={`${btn.primary} w-full`}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
        </form>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-gold" : "text-destructive"}`}>{msg.text}</p>}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
