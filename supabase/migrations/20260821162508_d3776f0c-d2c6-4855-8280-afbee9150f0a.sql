CREATE UNIQUE INDEX IF NOT EXISTS connect_people_tmdb_id_key
  ON public.connect_people (tmdb_id) WHERE tmdb_id IS NOT NULL;