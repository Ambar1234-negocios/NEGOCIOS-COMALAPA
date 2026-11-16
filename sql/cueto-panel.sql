-- Dedicated owner endpoint: no direct table grants and no changes to other profiles.
create or replace function public.cueto_perfil_guardar(negocio text, version integer, datos jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.piloto_menus_completos; s jsonb; viejo jsonb; src text; ruta text; k text; h jsonb; t jsonb;
begin
 if auth.uid() is null or negocio is distinct from 'cueto-sax' or not coalesce(public.dueno_permitido_v53(negocio),false) then
  raise exception 'Sin permiso para editar Cueto Sax.' using errcode='42501';
 end if;
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found or m.original->>'tipoCatalogo' is distinct from 'artista' then raise exception 'Perfil no disponible.';end if;
 if version is distinct from m.revision then raise exception 'El perfil cambió. Actualiza antes de guardar.';end if;
 if jsonb_typeof(datos) is distinct from 'object' or octet_length(datos::text)>120000
 or exists(select 1 from jsonb_object_keys(datos) key where key not in ('servicios','galeria','mostrarGaleria','video','slogan','descripcion','horarios','facebook','instagram','tiktok','sitioWeb')) then raise exception 'Campos de perfil inválidos.';end if;
 for k in select jsonb_object_keys(datos) loop
  if k in ('slogan','descripcion','facebook','instagram','tiktok','sitioWeb','video') then
   if jsonb_typeof(datos->k) is distinct from 'string' or length(datos->>k)>2000 then raise exception 'Texto inválido.';end if;
   perform public.sitio_validar(datos->k,k);
  end if;
 end loop;
 if datos ? 'mostrarGaleria' and jsonb_typeof(datos->'mostrarGaleria') is distinct from 'boolean' then raise exception 'Visibilidad inválida.';end if;
 if datos ? 'servicios' then
  if jsonb_typeof(datos->'servicios') is distinct from 'array' or jsonb_array_length(datos->'servicios')<>7 then raise exception 'Conserva las siete tarjetas.';end if;
  if (select count(distinct value->>'evento') from jsonb_array_elements(datos->'servicios'))<>7 then raise exception 'Eventos repetidos.';end if;
  for s in select value from jsonb_array_elements(datos->'servicios') loop
   if jsonb_typeof(s) is distinct from 'object' or s->>'tipo' is distinct from 'evento'
    or coalesce(s->>'evento','') not in ('bodas','bautizos','xv','serenatas','cumpleanos','especiales','otro')
    or jsonb_typeof(s->'nombre') is distinct from 'string' or length(trim(s->>'nombre')) not between 1 and 120
    or jsonb_typeof(s->'descripcion') is distinct from 'string' or length(s->>'descripcion')>2000
    or jsonb_typeof(s->'foto') is distinct from 'string'
    or (s ? 'activo' and jsonb_typeof(s->'activo') is distinct from 'boolean')
    or exists(select 1 from jsonb_object_keys(s) key where key not in ('tipo','evento','nombre','descripcion','foto','activo')) then raise exception 'Tarjeta inválida.';end if;
   perform public.sitio_validar(s->'nombre','nombre');perform public.sitio_validar(s->'descripcion','descripcion');
  end loop;
 end if;
 if datos ? 'galeria' then
  if jsonb_typeof(datos->'galeria') is distinct from 'array' or jsonb_array_length(datos->'galeria')>20 or exists(select 1 from jsonb_array_elements(datos->'galeria') x where jsonb_typeof(x)<>'string') then raise exception 'Máximo 20 fotos.';end if;
 end if;
 -- Existing published photos may be retained/reordered. New images must belong to the caller.
 for src in
  select value#>>'{}' from jsonb_array_elements(coalesce(datos->'galeria','[]'))
  union all select value->>'foto' from jsonb_array_elements(coalesce(datos->'servicios','[]'))
 loop
  if src='' then continue;end if;
  if coalesce(m.original->'galeria','[]') @> jsonb_build_array(src) or exists(select 1 from jsonb_array_elements(m.original->'servicios') x where x->>'foto'=src) then continue;end if;
  if src !~ '^https://gyvoyzxsgckpfkagzjtf[.]supabase[.]co/storage/v1/object/public/menu-publico/[a-f0-9-]+/[a-f0-9-]+[.]webp$' then raise exception 'Sube la foto desde el panel.';end if;
  ruta:=split_part(src,'/menu-publico/',2);
  if split_part(ruta,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La foto no está cargada o no pertenece a tu cuenta.';end if;
 end loop;
 if datos ? 'horarios' then
  if jsonb_typeof(datos->'horarios') is distinct from 'object' or (select count(*) from jsonb_object_keys(datos->'horarios'))<>7 then raise exception 'Completa los siete días.';end if;
  for k,h in select * from jsonb_each(datos->'horarios') loop
   if k not in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo') or coalesce(h->>'modo','') not in ('abierto','cerrado','24h','sin_confirmar') or jsonb_typeof(h->'turnos') is distinct from 'array' then raise exception 'Horario inválido.';end if;
   if jsonb_array_length(h->'turnos')>2 or (h->>'modo'='abierto' and jsonb_array_length(h->'turnos')=0) then raise exception 'Revisa los turnos.';end if;
   for t in select value from jsonb_array_elements(h->'turnos') loop
    if coalesce(t->>'inicio','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(t->>'fin','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or t->>'inicio'=t->>'fin' then raise exception 'Turno inválido.';end if;
   end loop;
  end loop;
 end if;
 viejo:=m.original-'productos';
 update public.piloto_menus_completos set original=original||datos,borrador=borrador||datos,revision=revision+1,actualizado_en=now() where slug=negocio returning * into m;
 insert into public.sitio_historial(tipo,registro,anterior,nuevo,actor) values('negocios',negocio,viejo,m.original-'productos',auth.uid());
 return jsonb_build_object('slug',m.slug,'revision',m.revision,'publicado',true);
end $$;
revoke all on function public.cueto_perfil_guardar(text,integer,jsonb) from public,anon;
grant execute on function public.cueto_perfil_guardar(text,integer,jsonb) to authenticated;
