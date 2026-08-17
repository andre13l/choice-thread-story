CREATE TABLE public.connect_ingest_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL DEFAULT 'connect',
  stage text NOT NULL DEFAULT 'pool',
  status text NOT NULL DEFAULT 'running',
  source text NOT NULL DEFAULT 'wikidata',
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.connect_ingest_items (
  run_id uuid NOT NULL REFERENCES public.connect_ingest_runs(id) ON DELETE CASCADE,
  stage text NOT NULL,
  item_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, stage, item_id)
);
CREATE INDEX connect_ingest_items_queue_idx ON public.connect_ingest_items (run_id, stage, status);

CREATE TABLE public.connect_stage_movies (
  run_id uuid NOT NULL REFERENCES public.connect_ingest_runs(id) ON DELETE CASCADE,
  id text NOT NULL,
  title text NOT NULL,
  year integer NOT NULL,
  sitelinks integer NOT NULL DEFAULT 0,
  PRIMARY KEY (run_id, id)
);

CREATE TABLE public.connect_stage_people (
  run_id uuid NOT NULL REFERENCES public.connect_ingest_runs(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  sitelinks integer NOT NULL DEFAULT 0,
  birth_year integer,
  image_file text,
  PRIMARY KEY (run_id, id)
);

CREATE TABLE public.connect_stage_cast (
  run_id uuid NOT NULL REFERENCES public.connect_ingest_runs(id) ON DELETE CASCADE,
  movie_id text NOT NULL,
  person_id text NOT NULL,
  billing integer,
  character_qid text,
  PRIMARY KEY (run_id, movie_id, person_id)
);
CREATE INDEX connect_stage_cast_person_idx ON public.connect_stage_cast (run_id, person_id);

CREATE TABLE public.connect_stage_characters (
  run_id uuid NOT NULL REFERENCES public.connect_ingest_runs(id) ON DELETE CASCADE,
  id text NOT NULL,
  label text NOT NULL,
  PRIMARY KEY (run_id, id)
);

GRANT ALL ON public.connect_ingest_runs TO service_role;
GRANT ALL ON public.connect_ingest_items TO service_role;
GRANT ALL ON public.connect_stage_movies TO service_role;
GRANT ALL ON public.connect_stage_people TO service_role;
GRANT ALL ON public.connect_stage_cast TO service_role;
GRANT ALL ON public.connect_stage_characters TO service_role;

ALTER TABLE public.connect_ingest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_ingest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_stage_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_stage_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_stage_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_stage_characters ENABLE ROW LEVEL SECURITY;

CREATE VIEW public.connect_ingest_status AS
SELECT r.id AS run_id, r.label, r.stage AS run_stage, r.status AS run_status,
       i.stage, i.status, count(*) AS items, max(i.updated_at) AS last_update
FROM public.connect_ingest_runs r
LEFT JOIN public.connect_ingest_items i ON i.run_id = r.id
GROUP BY r.id, r.label, r.stage, r.status, i.stage, i.status;

GRANT SELECT ON public.connect_ingest_status TO service_role;