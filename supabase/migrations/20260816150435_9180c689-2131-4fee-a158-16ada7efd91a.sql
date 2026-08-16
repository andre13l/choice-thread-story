CREATE TABLE public.daily_top10 (
  date date NOT NULL PRIMARY KEY,
  number integer NOT NULL,
  challenge_id text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_top10 TO anon;
GRANT SELECT ON public.daily_top10 TO authenticated;
GRANT ALL ON public.daily_top10 TO service_role;

ALTER TABLE public.daily_top10 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published top10 schedule is public"
  ON public.daily_top10 FOR SELECT
  USING (published);

CREATE TABLE public.daily_person (
  date date NOT NULL PRIMARY KEY,
  number integer NOT NULL,
  person_id text NOT NULL REFERENCES public.connect_people(id),
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.daily_person TO service_role;

ALTER TABLE public.daily_person ENABLE ROW LEVEL SECURITY;