-- PROFILES ------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_len CHECK (char_length(username) BETWEEN 3 AND 20),
  CONSTRAINT profiles_username_fmt CHECK (username ~ '^[A-Za-z0-9_]+$')
);
CREATE UNIQUE INDEX profiles_username_lower_key ON public.profiles (lower(username));

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usernames are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- DAILY SCORES ---------------------------------------------------------
CREATE TABLE public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game text NOT NULL,
  puzzle_date date NOT NULL,
  puzzle_number integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_key text,
  -- Canonical ordering key, higher is always better (server-computed).
  rank_key integer NOT NULL,
  -- Raw display score for the game (moves, correct answers, clues...).
  primary_score integer NOT NULL,
  time_ms integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_scores_identity CHECK (user_id IS NOT NULL OR visitor_key IS NOT NULL),
  CONSTRAINT daily_scores_time CHECK (time_ms >= 0 AND time_ms <= 21600000)
);

CREATE UNIQUE INDEX daily_scores_user_key
  ON public.daily_scores (game, puzzle_date, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX daily_scores_visitor_key
  ON public.daily_scores (game, puzzle_date, visitor_key) WHERE visitor_key IS NOT NULL;
CREATE INDEX daily_scores_board
  ON public.daily_scores (game, puzzle_date, rank_key DESC, time_ms ASC, submitted_at ASC);

GRANT ALL ON public.daily_scores TO service_role;

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: every read goes through the SECURITY DEFINER
-- functions below, every write goes through the server (service role).

-- HELPERS --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.daily_label(_id uuid, _username text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(_username, 'Guest ' || upper(substr(md5(_id::text), 1, 4)));
$$;

CREATE OR REPLACE FUNCTION public.daily_leaderboard(
  _game text, _date date, _limit integer DEFAULT 20, _offset integer DEFAULT 0
)
RETURNS TABLE (rank bigint, entry_id uuid, label text, primary_score integer, time_ms integer, meta jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (
    SELECT row_number() OVER (
             ORDER BY s.rank_key DESC, s.time_ms ASC, s.submitted_at ASC
           ) AS rank,
           s.id AS entry_id,
           public.daily_label(s.id, p.username) AS label,
           s.primary_score, s.time_ms, s.meta
    FROM public.daily_scores s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    WHERE s.game = _game AND s.puzzle_date = _date
  ) q
  ORDER BY q.rank
  OFFSET GREATEST(_offset, 0)
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.daily_rank(_game text, _date date, _entry_id uuid)
RETURNS TABLE (rank bigint, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH board AS (
    SELECT s.id,
           row_number() OVER (
             ORDER BY s.rank_key DESC, s.time_ms ASC, s.submitted_at ASC
           ) AS rn
    FROM public.daily_scores s
    WHERE s.game = _game AND s.puzzle_date = _date
  )
  SELECT (SELECT rn FROM board WHERE id = _entry_id), (SELECT count(*) FROM board);
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_scores(_visitor_key text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); moved integer := 0;
BEGIN
  IF uid IS NULL OR _visitor_key IS NULL OR char_length(_visitor_key) < 8 THEN
    RETURN 0;
  END IF;
  UPDATE public.daily_scores s
     SET user_id = uid, visitor_key = NULL
   WHERE s.visitor_key = _visitor_key
     AND s.user_id IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.daily_scores t
        WHERE t.game = s.game AND t.puzzle_date = s.puzzle_date AND t.user_id = uid
     );
  GET DIAGNOSTICS moved = ROW_COUNT;
  RETURN moved;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_username(_username text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); clean text := btrim(_username);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF clean !~ '^[A-Za-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Usernames are 3-20 characters, letters, numbers and underscores only.';
  END IF;
  IF lower(clean) = ANY (ARRAY['admin','administrator','moderator','mod','nircosi','support','staff','guest','anonymous','system','root','null','undefined','owner','official']) THEN
    RAISE EXCEPTION 'That username is reserved.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(clean) AND id <> uid) THEN
    RAISE EXCEPTION 'That username is taken.';
  END IF;
  INSERT INTO public.profiles (id, username) VALUES (uid, clean)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, updated_at = now();
  RETURN clean;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_daily_history(_limit integer DEFAULT 60)
RETURNS TABLE (game text, puzzle_date date, puzzle_number integer, primary_score integer, time_ms integer, meta jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.game, s.puzzle_date, s.puzzle_number, s.primary_score, s.time_ms, s.meta
  FROM public.daily_scores s
  WHERE s.user_id = auth.uid()
  ORDER BY s.puzzle_date DESC, s.game
  LIMIT LEAST(GREATEST(_limit, 1), 400);
$$;

REVOKE ALL ON FUNCTION public.daily_leaderboard(text, date, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.daily_rank(text, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_daily_scores(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_username(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.my_daily_history(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.daily_leaderboard(text, date, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.daily_rank(text, date, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_daily_scores(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_username(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_daily_history(integer) TO authenticated, service_role;