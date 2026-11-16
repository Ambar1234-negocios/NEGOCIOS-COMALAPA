-- Run as database administrator. Every fixture/write is rolled back.
begin;
do $$
declare uid uuid; correo text; m public.piloto_menus_completos; nuevo jsonb; otros text; pub jsonb;
begin
 select u.id,u.email into strict uid,correo from auth.users u where u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now()) and not exists(select 1 from public.piloto_administradores a where a.usuario_id=u.id) limit 1;
 select * into strict m from public.piloto_menus_completos where slug='cueto-sax';
 select md5(string_agg(original::text||borrador::text,',' order by slug)) into otros from public.piloto_menus_completos where slug<>'cueto-sax';
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.cueto_perfil_guardar('cueto-sax',m.revision,'{}');raise exception 'Anonymous accepted';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 if public.dueno_permitido_v53('cueto-sax') then raise exception 'Choose an unrelated test user';end if;
 begin perform public.cueto_perfil_guardar('cueto-sax',m.revision,'{}');raise exception 'Unrelated account accepted';exception when insufficient_privilege then null;end;
 insert into public.dueno_accesos_v53(correo,negocio,activo,creado_por) values(lower(correo),'cueto-sax',true,uid);
 begin perform public.cueto_perfil_guardar('forno-mexa',m.revision,'{}');raise exception 'Other business accepted';exception when insufficient_privilege then null;end;
 begin perform public.cueto_perfil_guardar('cueto-sax',m.revision-1,'{}');raise exception 'Old version accepted';exception when raise_exception then if sqlerrm<>'El perfil cambió. Actualiza antes de guardar.' then raise;end if;end;
 begin perform public.cueto_perfil_guardar('cueto-sax',m.revision,'{"whatsapp":"1111111111"}');raise exception 'Protected field accepted';exception when raise_exception then if sqlerrm<>'Campos de perfil inválidos.' then raise;end if;end;
 begin perform public.cueto_perfil_guardar('cueto-sax',m.revision,'{"galeria":["https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000.webp"]}');raise exception 'Unowned photo accepted';exception when raise_exception then if sqlerrm<>'La foto no está cargada o no pertenece a tu cuenta.' then raise;end if;end;
 nuevo:=jsonb_build_object('slogan','Prueba reversible Cueto','descripcion','Prueba reversible','servicios',jsonb_set(jsonb_set(m.original->'servicios','{0,nombre}','"Bodas de prueba"'),'{1,activo}','false'),'galeria',m.original->'galeria','horarios',m.original->'horarios','video','https://www.youtube.com/watch?v=prueba','mostrarGaleria',true);
 perform public.cueto_perfil_guardar('cueto-sax',m.revision,nuevo);
 select p into strict pub from jsonb_array_elements(public.sitio_publicacion()->'perfiles') p where p->>'slug'='cueto-sax';
 if pub->>'slogan'<>'Prueba reversible Cueto' or pub#>>'{servicios,0,nombre}'<>'Bodas de prueba' or pub#>>'{servicios,1,activo}'<>'false' then raise exception 'Public projection mismatch';end if;
 if not exists(select 1 from public.piloto_menus_completos where slug='cueto-sax' and original->'productos'=m.original->'productos' and borrador->'productos'=m.borrador->'productos' and original->>'whatsapp'='9636357763' and borrador->>'slogan'='Prueba reversible Cueto' and revision=m.revision+1) then raise exception 'Preservation mismatch';end if;
 if otros is distinct from (select md5(string_agg(original::text||borrador::text,',' order by slug)) from public.piloto_menus_completos where slug<>'cueto-sax') then raise exception 'Other business changed';end if;
 if has_function_privilege('anon','public.cueto_perfil_guardar(text,integer,jsonb)','execute') or not has_function_privilege('authenticated','public.cueto_perfil_guardar(text,integer,jsonb)','execute') then raise exception 'RPC grants mismatch';end if;
end $$;
rollback;
