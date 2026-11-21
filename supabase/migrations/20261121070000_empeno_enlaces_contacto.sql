
alter table public.empeno_perfiles
  add column maps_url text not null default '' check (length(maps_url) <= 1000 and (maps_url = '' or maps_url ~* '^https?://[^[:space:]]+$')),
  add column facebook_url text not null default '' check (length(facebook_url) <= 1000 and (facebook_url = '' or facebook_url ~* '^https?://[^[:space:]]+$')),
  add column instagram_url text not null default '' check (length(instagram_url) <= 1000 and (instagram_url = '' or instagram_url ~* '^https?://[^[:space:]]+$')),
  add column tiktok_url text not null default '' check (length(tiktok_url) <= 1000 and (tiktok_url = '' or tiktok_url ~* '^https?://[^[:space:]]+$'));
grant update (maps_url, facebook_url, instagram_url, tiktok_url) on public.empeno_perfiles to authenticated;
