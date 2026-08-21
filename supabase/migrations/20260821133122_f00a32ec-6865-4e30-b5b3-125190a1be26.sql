-- 1. TMDB identifiers + sync metadata on the existing catalogue (non-destructive)
ALTER TABLE public.connect_movies
  ADD COLUMN IF NOT EXISTS tmdb_id integer,
  ADD COLUMN IF NOT EXISTS release_date date,
  ADD COLUMN IF NOT EXISTS popularity numeric,
  ADD COLUMN IF NOT EXISTS poster_path text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.connect_people
  ADD COLUMN IF NOT EXISTS tmdb_id integer,
  ADD COLUMN IF NOT EXISTS profile_path text,
  ADD COLUMN IF NOT EXISTS popularity numeric,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.connect_cast
  ADD COLUMN IF NOT EXISTS cast_order integer,
  ADD COLUMN IF NOT EXISTS tmdb_credit_id text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'wikidata';

CREATE UNIQUE INDEX IF NOT EXISTS connect_movies_tmdb_id_key ON public.connect_movies (tmdb_id) WHERE tmdb_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS connect_people_tmdb_id_key ON public.connect_people (tmdb_id) WHERE tmdb_id IS NOT NULL;

-- 2. Durable ingestion jobs
CREATE TABLE IF NOT EXISTS public.connect_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'tmdb',
  source text NOT NULL DEFAULT 'tmdb',
  status text NOT NULL DEFAULT 'pending',
  stage text NOT NULL DEFAULT 'seed',
  total_items integer NOT NULL DEFAULT 0,
  done_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.connect_sync_jobs TO service_role;
ALTER TABLE public.connect_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.connect_sync_items (
  job_id uuid NOT NULL REFERENCES public.connect_sync_jobs(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS connect_sync_items_pending_idx
  ON public.connect_sync_items (job_id, kind, status);

GRANT ALL ON public.connect_sync_items TO service_role;
ALTER TABLE public.connect_sync_items ENABLE ROW LEVEL SECURITY;

-- 3. Future Daily Connect candidates
CREATE TABLE IF NOT EXISTS public.daily_connect_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_date date,
  start_person_id text NOT NULL,
  target_person_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  optimal_clicks integer,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (start_person_id, target_person_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_connect_candidates_planned_date_key
  ON public.daily_connect_candidates (planned_date) WHERE planned_date IS NOT NULL;

GRANT ALL ON public.daily_connect_candidates TO service_role;
ALTER TABLE public.daily_connect_candidates ENABLE ROW LEVEL SECURITY;