CREATE TABLE public.daily_connect (
  date date PRIMARY KEY,
  number integer NOT NULL,
  start_person_id text NOT NULL REFERENCES public.connect_people(id),
  target_person_id text NOT NULL REFERENCES public.connect_people(id),
  optimal_clicks integer NOT NULL CHECK (optimal_clicks >= 2),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_connect_distinct_people CHECK (start_person_id <> target_person_id),
  CONSTRAINT daily_connect_number_unique UNIQUE (number)
);

CREATE INDEX daily_connect_published_idx ON public.daily_connect(date DESC) WHERE published;

GRANT SELECT ON public.daily_connect TO anon, authenticated;
GRANT ALL ON public.daily_connect TO service_role;

ALTER TABLE public.daily_connect ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published dailies are public" ON public.daily_connect
FOR SELECT USING (published);