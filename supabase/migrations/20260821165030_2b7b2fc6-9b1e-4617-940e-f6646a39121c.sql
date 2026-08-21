ALTER TABLE public.connect_people ADD COLUMN IF NOT EXISTS legacy_qid text;
ALTER TABLE public.connect_movies ADD COLUMN IF NOT EXISTS legacy_qid text;

-- Merge two confirmed duplicate films (same title + year, one legacy Wikidata
-- row and one canonical TMDB row). Cast edges move first, then the legacy row
-- retires; the QID is preserved on the survivor for future debugging.
DO $$
DECLARE pair record;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES ('Q352431','tm2757'), ('Q52951815','tm458156')) AS t(legacy_id, canonical_id)
  LOOP
    IF EXISTS (SELECT 1 FROM public.connect_movies WHERE id = pair.legacy_id)
       AND EXISTS (SELECT 1 FROM public.connect_movies WHERE id = pair.canonical_id) THEN

      UPDATE public.connect_cast c
         SET movie_id = pair.canonical_id
       WHERE c.movie_id = pair.legacy_id
         AND NOT EXISTS (
           SELECT 1 FROM public.connect_cast d
            WHERE d.movie_id = pair.canonical_id AND d.person_id = c.person_id
         );

      DELETE FROM public.connect_cast WHERE movie_id = pair.legacy_id;

      UPDATE public.connect_movies
         SET legacy_qid = pair.legacy_id,
             notability = GREATEST(notability, (SELECT notability FROM public.connect_movies WHERE id = pair.legacy_id))
       WHERE id = pair.canonical_id;

      DELETE FROM public.connect_movies WHERE id = pair.legacy_id;
    END IF;
  END LOOP;
END $$;

-- Guard: one canonical row per TMDB film identity (people already guarded).
CREATE UNIQUE INDEX IF NOT EXISTS connect_movies_tmdb_id_key
  ON public.connect_movies (tmdb_id) WHERE tmdb_id IS NOT NULL;