-- Availability is determined when reception quotes the real delivery price.
-- Keep the availability probe internal so it cannot be used to infer the balance.
alter function public.exhibicion_fondo_disponible(text[],integer) set schema promocion_privada;
revoke all on function promocion_privada.exhibicion_fondo_disponible(text[],integer) from public,anon,authenticated;

