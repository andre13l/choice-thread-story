CREATE TABLE public.connect_movies (
  id text PRIMARY KEY,
  title text NOT NULL,
  year integer NOT NULL,
  notability integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'wikidata',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.connect_people (
  id text PRIMARY KEY,
  name text NOT NULL,
  notability integer NOT NULL DEFAULT 0,
  birth_year integer,
  image_file text,
  image_attribution_url text,
  image_source text NOT NULL DEFAULT 'wikimedia-commons',
  challenge_eligible boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'wikidata',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.connect_cast (
  movie_id text NOT NULL REFERENCES public.connect_movies(id) ON DELETE CASCADE,
  person_id text NOT NULL REFERENCES public.connect_people(id) ON DELETE CASCADE,
  billing integer,
  character_name text,
  PRIMARY KEY (movie_id, person_id)
);

CREATE INDEX connect_cast_person_idx ON public.connect_cast(person_id);
CREATE INDEX connect_movies_title_idx ON public.connect_movies(lower(title));
CREATE INDEX connect_people_name_idx ON public.connect_people(lower(name));
CREATE INDEX connect_people_eligible_idx ON public.connect_people(challenge_eligible) WHERE challenge_eligible;

CREATE TABLE public.connect_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('actor_missing','movie_missing','actor_missing_from_movie','wrong_connection','other')),
  movie_id text,
  person_id text,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  visitor_key text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX connect_reports_created_idx ON public.connect_reports(created_at DESC);
CREATE INDEX connect_reports_visitor_idx ON public.connect_reports(visitor_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.connect_reports_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE recent integer;
BEGIN
  IF NEW.visitor_key IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO recent
  FROM public.connect_reports
  WHERE visitor_key = NEW.visitor_key
    AND created_at > now() - interval '1 hour';
  IF recent >= 10 THEN
    RAISE EXCEPTION 'report rate limit reached, please try again later';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER connect_reports_rate_limit_trg
BEFORE INSERT ON public.connect_reports
FOR EACH ROW EXECUTE FUNCTION public.connect_reports_rate_limit();

CREATE VIEW public.connect_catalog_counts
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM public.connect_movies) AS films,
  (SELECT count(*) FROM public.connect_people) AS people,
  (SELECT count(*) FROM public.connect_cast) AS connections,
  (SELECT count(*) FROM public.connect_people WHERE challenge_eligible) AS challenge_actors;

GRANT SELECT ON public.connect_movies TO anon, authenticated;
GRANT SELECT ON public.connect_people TO anon, authenticated;
GRANT SELECT ON public.connect_cast TO anon, authenticated;
GRANT SELECT ON public.connect_catalog_counts TO anon, authenticated;
GRANT INSERT ON public.connect_reports TO anon, authenticated;
GRANT ALL ON public.connect_movies TO service_role;
GRANT ALL ON public.connect_people TO service_role;
GRANT ALL ON public.connect_cast TO service_role;
GRANT ALL ON public.connect_reports TO service_role;

ALTER TABLE public.connect_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogue movies are public" ON public.connect_movies FOR SELECT USING (true);
CREATE POLICY "Catalogue people are public" ON public.connect_people FOR SELECT USING (true);
CREATE POLICY "Catalogue cast is public" ON public.connect_cast FOR SELECT USING (true);
CREATE POLICY "Anyone can submit a report" ON public.connect_reports FOR INSERT WITH CHECK (true);