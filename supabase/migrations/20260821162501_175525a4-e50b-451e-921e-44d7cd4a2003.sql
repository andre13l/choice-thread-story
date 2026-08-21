UPDATE public.connect_cast c
   SET person_id = 'Q190162'
 WHERE c.person_id = 'tp8691'
   AND NOT EXISTS (
     SELECT 1 FROM public.connect_cast d
      WHERE d.person_id = 'Q190162' AND d.movie_id = c.movie_id
   );

DELETE FROM public.connect_cast WHERE person_id = 'tp8691';

UPDATE public.connect_people
   SET name = 'Zoe Saldaña',
       profile_path = COALESCE(profile_path, (SELECT profile_path FROM public.connect_people WHERE id = 'tp8691')),
       popularity = COALESCE(popularity, (SELECT popularity FROM public.connect_people WHERE id = 'tp8691')),
       source = 'tmdb',
       last_synced_at = now()
 WHERE id = 'Q190162';

DELETE FROM public.connect_people WHERE id = 'tp8691';

UPDATE public.connect_people SET tmdb_id = 8691 WHERE id = 'Q190162';