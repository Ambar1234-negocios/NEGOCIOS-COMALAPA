
alter table public.empeno_perfiles
  add column logo text not null default '' check (logo = '' or logo ~ '^[a-f0-9-]{36}[.]webp$'),
  add column banner text not null default '' check (banner = '' or banner ~ '^[a-f0-9-]{36}[.]webp$');
grant update (logo, banner) on public.empeno_perfiles to authenticated;
