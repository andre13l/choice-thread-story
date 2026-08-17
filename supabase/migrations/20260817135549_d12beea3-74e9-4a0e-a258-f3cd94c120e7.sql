ALTER TABLE public.connect_people
  ADD COLUMN IF NOT EXISTS coverage_status text NOT NULL DEFAULT 'connector',
  ADD COLUMN IF NOT EXISTS credit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hydrated_at timestamptz;

ALTER TABLE public.connect_people
  DROP CONSTRAINT IF EXISTS connect_people_coverage_status_check;
ALTER TABLE public.connect_people
  ADD CONSTRAINT connect_people_coverage_status_check
  CHECK (coverage_status IN ('connector', 'playable'));

CREATE INDEX IF NOT EXISTS connect_people_playable_idx
  ON public.connect_people (coverage_status)
  WHERE coverage_status = 'playable';

ALTER TABLE public.connect_reports
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS resolved_movie_id text,
  ADD COLUMN IF NOT EXISTS resolved_person_id text;

CREATE INDEX IF NOT EXISTS connect_reports_dedupe_idx
  ON public.connect_reports (dedupe_key);