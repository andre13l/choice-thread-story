CREATE TEMP TABLE m_merge AS
WITH pairs AS (
  SELECT t.id AS new_id, l.id AS legacy_id, t.tmdb_id, t.release_date, t.popularity, t.poster_path
  FROM public.connect_movies t
  JOIN public.connect_movies l
    ON lower(l.title) = lower(t.title) AND l.year = t.year AND l.tmdb_id IS NULL
  WHERE t.tmdb_id IS NOT NULL AND t.id LIKE 'tm%'
), one_legacy AS (
  SELECT DISTINCT ON (new_id) * FROM pairs ORDER BY new_id, legacy_id
)
SELECT DISTINCT ON (legacy_id) * FROM one_legacy ORDER BY legacy_id, new_id;

UPDATE public.connect_cast c SET movie_id = m.legacy_id
FROM m_merge m
WHERE c.movie_id = m.new_id
  AND NOT EXISTS (SELECT 1 FROM public.connect_cast x WHERE x.movie_id = m.legacy_id AND x.person_id = c.person_id);

DELETE FROM public.connect_cast c USING m_merge m WHERE c.movie_id = m.new_id;
DELETE FROM public.connect_movies t USING m_merge m WHERE t.id = m.new_id;

UPDATE public.connect_movies l
SET tmdb_id = m.tmdb_id, release_date = m.release_date, popularity = m.popularity,
    poster_path = m.poster_path, last_synced_at = now()
FROM m_merge m WHERE l.id = m.legacy_id;

CREATE TEMP TABLE p_merge AS
WITH cand AS (
  SELECT t.id AS new_id, l.id AS legacy_id, t.tmdb_id, t.popularity, t.profile_path, t.birth_year,
         count(*) OVER (PARTITION BY t.id) AS legacy_matches,
         count(*) OVER (PARTITION BY l.id) AS new_matches
  FROM public.connect_people t
  JOIN public.connect_people l
    ON lower(l.name) = lower(t.name) AND l.tmdb_id IS NULL
   AND (l.birth_year IS NULL OR t.birth_year IS NULL OR l.birth_year = t.birth_year)
  WHERE t.tmdb_id IS NOT NULL AND t.id LIKE 'tp%'
)
SELECT new_id, legacy_id, tmdb_id, popularity, profile_path, birth_year
FROM cand WHERE legacy_matches = 1 AND new_matches = 1;

UPDATE public.connect_cast c SET person_id = p.legacy_id
FROM p_merge p
WHERE c.person_id = p.new_id
  AND NOT EXISTS (SELECT 1 FROM public.connect_cast x WHERE x.person_id = p.legacy_id AND x.movie_id = c.movie_id);

DELETE FROM public.connect_cast c USING p_merge p WHERE c.person_id = p.new_id;
DELETE FROM public.connect_people t USING p_merge p WHERE t.id = p.new_id;

UPDATE public.connect_people l
SET tmdb_id = p.tmdb_id, popularity = p.popularity, profile_path = p.profile_path,
    birth_year = COALESCE(l.birth_year, p.birth_year),
    last_synced_at = now()
FROM p_merge p WHERE l.id = p.legacy_id;