import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/games/core/useSession";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: `Save your scores — create a profile | ${SITE.name}` },
      {
        name: "description",
        content:
          "Optional NIRCOSI profile: claim the daily scores you already played, keep your streak across devices and put a username on the leaderboards.",
      },
      { property: "og:title", content: `Create your ${SITE.name} profile` },
      {
        property: "og:description",
        content: "Keep your daily film-game streak and leaderboard history across devices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.loading && session.userId) void navigate({ to: "/profile", replace: true });
  }, [session.loading, session.userId, navigate]);

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (err) throw err;
    } catch {
      setError("Google sign-in is unavailable right now. Try the email link.");
      setBusy(false);
    }
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Optional
        </p>
        <h1 className="mt-6 font-display text-[clamp(2rem,8vw,3.2rem)] leading-none tracking-[0.08em] text-foreground">
          SAVE YOUR SCORES
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Everything stays playable without an account. A profile just keeps your streak, history
          and leaderboard name across devices — and claims what you already played in this browser.
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-10 w-full border border-foreground bg-foreground px-6 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="mt-8 flex items-center gap-3 text-[9px] uppercase tracking-[0.24em] text-muted-foreground/70">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        {sent ? (
          <p className="mt-8 border border-border/70 px-4 py-5 text-sm text-muted-foreground">
            Check your inbox — we sent a sign-in link to{" "}
            <span className="text-foreground">{email}</span>.
          </p>
        ) : (
          <form onSubmit={magicLink} className="mt-8 text-left">
            <label
              htmlFor="email"
              className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground"
            >
              Email sign-in link
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full border border-border/70 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-3 w-full border border-border px-6 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Send link
            </button>
          </form>
        )}

        {error && <p className="mt-4 text-[12px] text-accent-foreground">{error}</p>}

        <Link
          to="/daily"
          className="mt-10 inline-block text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to today
        </Link>
      </div>
    </div>
  );
}
