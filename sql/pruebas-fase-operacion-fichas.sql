-- Prueba transaccional: no conserva cambios en pedidos, clientes ni catálogo.
BEGIN;
DO $test$
DECLARE admin_id uuid; recepcion_id uuid; p public.piloto_pedidos; c public.clientes;
 m public.piloto_menus_completos; r jsonb; producto_id uuid:=gen_random_uuid();
 ficha jsonb:='{"activa":true,"fotos":[],"secciones":[{"titulo":"Descripción","contenido":"Producto de prueba"},{"titulo":"Usos","contenido":"Uso de prueba"}]}';
 prueba text; bloqueado boolean; revision_nueva integer; fotos jsonb;
BEGIN
 select usuario_id into admin_id from public.piloto_administradores limit 1;
 select usuario_id into recepcion_id from public.piloto_recepcion_accesos where activo and usuario_id<>admin_id limit 1;
 if admin_id is null or recepcion_id is null then raise exception 'Faltan roles para la prueba';end if;
 perform set_config('request.jwt.claim.sub',recepcion_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',recepcion_id,'role','authenticated')::text,true);
 if not public.piloto_es_operador() or public.piloto_es_admin() then raise exception 'Roles incorrectos';end if;
 foreach prueba in array array['select public.cliente_operacion_listar()','select public.cliente_campanas_listar()',
 'select public.cliente_campana_guardar(''{}''::jsonb)',
 'select public.cliente_telefono_verificar_cliente(null,null)',
 'select public.cliente_telefono_corregir_cliente(null,''9611234567'')',
 'select public.cliente_beneficio_enlace_crear_cliente(null)',
 'select public.piloto_config_pago_guardar(''{}''::jsonb)',
 'select public.piloto_pedido_finalizar_admin(null,1)',
 'select public.piloto_pedido_cerrar_recepcion(null,1)',
 'select public.menu_producto_crear(''forno-mexa'',1,gen_random_uuid(),''{}''::jsonb)'] loop
  bloqueado:=false;begin execute prueba;exception when insufficient_privilege then bloqueado:=true;end;
  if not bloqueado then raise exception 'Recepción accedió a %',prueba;end if;
 end loop;
 r:=public.piloto_operacion_listar();
 if exists(select 1 from jsonb_array_elements(r->'pedidos') x where (x->'cliente_info') ? 'cumple_dia' or (x->'cliente_info') ? 'beneficios_activos') then raise exception 'Filtración de marketing';end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 perform public.cliente_operacion_listar();perform public.cliente_campanas_listar();
 select * into p from public.piloto_pedidos where estado not in ('entregado','cancelado') limit 1;
 if p.id is null then raise exception 'Falta pedido para probar cierre';end if;
 update public.piloto_pedidos set estado='pendiente',aceptado=false,pago='efectivo',pago_verificado=false,efectivo_recibido=false where id=p.id;
 r:=public.piloto_pedido_finalizar_admin(p.id,p.revision);
 if r->>'estado'<>'entregado' or not (r->>'efectivo_recibido')::boolean or (r->>'terminado_en') is null then raise exception 'Cierre efectivo incoherente';end if;
 if not exists(select 1 from public.piloto_pedido_eventos where pedido_id=p.id and accion='finalizar_admin' and actor=admin_id and revision=p.revision+1) then raise exception 'Falta auditoría';end if;
 bloqueado:=false;begin perform public.piloto_pedido_finalizar_admin(p.id,p.revision);exception when others then bloqueado:=true;end;
 if not bloqueado then raise exception 'Permitió revisión obsoleta';end if;
 update public.piloto_pedidos set estado='cotizado',pago='transferencia',pago_verificado=false,efectivo_recibido=false where id=p.id;
 r:=public.piloto_pedido_finalizar_admin(p.id,p.revision+1);
 if not (r->>'pago_verificado')::boolean or (r->>'efectivo_recibido')::boolean then raise exception 'Cierre transferencia incoherente';end if;
 select * into c from public.clientes where public.cliente_telefono_normalizar(telefono)<>'' limit 1;
 perform public.cliente_telefono_verificar_cliente(c.id,c.telefono);
 perform public.cliente_telefono_corregir_cliente(c.id,c.telefono);
 if not exists(select 1 from public.cliente_eventos where cliente_id=c.id and tipo='telefono_verificado' and pedido_id is null) then raise exception 'Falta auditoría del teléfono';end if;
 select * into m from public.piloto_menus_completos order by slug limit 1;
 select jsonb_agg('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/'||name) into fotos from (select name from storage.objects where bucket_id='menu-publico' and metadata->>'mimetype'='image/webp' and split_part(name,'/',1)=admin_id::text order by name limit 4) s;
 if jsonb_array_length(fotos)<>4 then raise exception 'Faltan fotos cargadas para la prueba';end if;
 ficha:=jsonb_set(ficha,'{fotos}',fotos);
 r:=public.menu_producto_crear(m.slug,m.revision,producto_id,jsonb_build_object('nombre','Prueba transaccional','precio',10,'ingredientes','','disponible',true,'foto',fotos->>0,'seccion','Pruebas','fichaAvanzada',ficha));
 revision_nueva:=(r->>'revision')::integer;
 if not exists(select 1 from public.menu_productos_publicados where negocio=m.slug and producto=producto_id::text and contenido->'fichaAvanzada'=ficha) then raise exception 'Ficha no persistida';end if;
 ficha:=jsonb_set(ficha,'{secciones,1,contenido}','"Uso modificado"');
 ficha:=jsonb_set(ficha,'{fotos}',jsonb_build_array(fotos->2,fotos->0,fotos->1));
 perform public.menu_producto_publicar(m.slug,revision_nueva,producto_id::text,jsonb_build_object('fichaAvanzada',ficha));
 if not exists(select 1 from jsonb_array_elements(public.menu_catalogo_publicado()) x where x->>'producto'=producto_id::text and x#>'{contenido,fichaAvanzada}'=ficha) then raise exception 'Ficha pública no actualizada';end if;
 bloqueado:=false;begin perform public.menu_validar_ficha_avanzada(jsonb_set(ficha,'{fotos}','["a","b","c","d","e"]'));exception when others then bloqueado:=true;end;
 if not bloqueado then raise exception 'Aceptó más de 4 fotos';end if;
 bloqueado:=false;begin perform public.menu_validar_ficha_avanzada(jsonb_set(ficha,'{fotos}','["https://externo.example/foto.webp"]'));exception when others then bloqueado:=true;end;
 if not bloqueado then raise exception 'Aceptó foto ajena';end if;
END $test$;
ROLLBACK;
SELECT 'OK: roles, privacidad, cierres efectivo/transferencia, revisión, auditoría, teléfono, persistencia y catálogo público, límite y origen de fotos; cambios revertidos' AS resultado;
