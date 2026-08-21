/**
 * Lightweight session + profile hook. Auth is optional everywhere in NIRCOSI,
 * so this never blocks rendering: it starts as "unknown" and settles.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimAnonymousScores } from "./leaderboard";
import { visitorKey } from "./visitor";

export interface SessionState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loading: true,
    userId: null,
    email: null,
    username: null,
  });

  useEffect(() => {
    let alive = true;

    const load = async (userId: string | null, email: string | null) => {
      if (!userId) {
        if (alive) setState({ loading: false, userId: null, email: null, username: null });
        return;
      }
      // Anything played anonymously in this browser becomes theirs, once.
      await claimAnonymousScores(visitorKey());
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();
      if (alive) {
        setState({ loading: false, userId, email, username: data?.username ?? null });
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void load(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void load(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
