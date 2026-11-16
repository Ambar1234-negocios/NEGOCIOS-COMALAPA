-- Configure Karen with the shared dynamic catalog. Preserve existing data.
WITH antes AS (
 SELECT * FROM public.piloto_menus_completos WHERE slug='karen-shop' FOR UPDATE
), cambio AS (
 UPDATE public.piloto_menus_completos m SET
 original=m.original||jsonb_build_object('tipoCatalogo','visual','categoriasDinamicas',true,'seccionesCatalogo',coalesce(m.original->'seccionesCatalogo',m.original->'servicios','[]'::jsonb),'seccionesOcultas',coalesce(m.original->'seccionesOcultas','[]'::jsonb),'mostrarGaleria',true),
 borrador=m.borrador||jsonb_build_object('tipoCatalogo','visual','categoriasDinamicas',true,'seccionesCatalogo',coalesce(m.borrador->'seccionesCatalogo',m.borrador->'servicios','[]'::jsonb),'seccionesOcultas',coalesce(m.borrador->'seccionesOcultas','[]'::jsonb),'mostrarGaleria',true),
 revision=m.revision+1,actualizado_en=now()
 FROM antes WHERE m.slug=antes.slug RETURNING m.*
)
INSERT INTO public.sitio_historial(tipo,registro,anterior,nuevo,actor)
SELECT 'negocios','karen-shop',antes.original,cambio.original,auth.uid() FROM antes,cambio;
