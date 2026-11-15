do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.sitio_perfil_guardar(text,integer,jsonb)'::regprocedure) into definition;
 if position('''catalogoGaleria''' in definition)=0 then
  if position('''galeria'',''mostrarGaleria''' in definition)=0 then raise exception 'Revisar lista de campos antes de continuar'; end if;
  definition:=replace(definition,'''galeria'',''mostrarGaleria''','''galeria'',''catalogoGaleria'',''mostrarGaleria''');
  execute definition;
 end if;
end $patch$;
