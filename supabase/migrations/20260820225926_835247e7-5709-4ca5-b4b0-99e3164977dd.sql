update public.daily_top10 set challenge_id = v.cid from (values
 ('2026-08-21'::date,'oscars-actor-2015-2024'),
 ('2026-08-23','franchise-bond'),
 ('2026-08-25','oscars-bp-1985-1994'),
 ('2026-08-27','franchise-pixar'),
 ('2026-08-29','wwbo-2017'),
 ('2026-09-04','wwbo-2004'),
 ('2026-09-07','wwbo-2008'),
 ('2026-09-08','wwbo-2006')
) as v(d, cid) where daily_top10.date = v.d;