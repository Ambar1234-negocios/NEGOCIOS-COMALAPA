-- Apply only to the isolated staging database after the catalog schema.
CREATE TABLE IF NOT EXISTS public.antojo_hoy_selecciones (
  negocio text NOT NULL,
  producto text NOT NULL,
  PRIMARY KEY (negocio, producto)
);
ALTER TABLE public.antojo_hoy_selecciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.antojo_hoy_selecciones FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS antojo_hoy_lectura ON public.antojo_hoy_selecciones;

CREATE TABLE IF NOT EXISTS public.antojo_hoy_limites_superiores (
  negocio text PRIMARY KEY,
  limite integer NOT NULL CHECK (limite > 3)
);
ALTER TABLE public.antojo_hoy_limites_superiores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.antojo_hoy_limites_superiores FROM PUBLIC, anon, authenticated;

-- This private helper lists eligible products from the existing catalog sources.
CREATE OR REPLACE FUNCTION public.antojo_hoy_productos(slug_negocio text)
RETURNS TABLE (id text) LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT p->>'id'
  FROM public.piloto_menus_completos m
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(m.original->'productos') = 'array'
    THEN m.original->'productos' ELSE '[]'::jsonb END) p
  WHERE m.slug = slug_negocio
    AND p->>'id' IS NOT NULL AND p->>'eliminado' IS DISTINCT FROM 'true'
    AND p->>'disponible' IS DISTINCT FROM 'false'
  UNION
  SELECT a.id::text
  FROM public.empeno_articulos a
  JOIN public.empeno_categorias c ON (c.negocio, c.id) = (a.negocio, a.categoria)
  WHERE a.negocio = slug_negocio
    AND NOT a.pausado AND a.estado = 'Disponible' AND c.visible;
$$;
REVOKE ALL ON FUNCTION public.antojo_hoy_productos(text) FROM PUBLIC, anon, authenticated;


CREATE OR REPLACE FUNCTION public.antojo_hoy_cupo(slug_negocio text)
RETURNS TABLE (limite integer, seccion text) LANGUAGE sql STABLE SET search_path = '' AS $$
  WITH ficha AS (
    SELECT lower(trim(m.plan::text)) AS plan,
      CASE WHEN m.original->>'categoria' = 'comida' THEN 'antojo' ELSE 'tendencias' END AS seccion
    FROM public.piloto_menus_completos m
    WHERE m.slug = slug_negocio
    UNION ALL
    SELECT lower(trim(to_jsonb(e)->>'plan')), 'tendencias'
    FROM public.empeno_perfiles e
    WHERE e.slug = slug_negocio
  )
  SELECT CASE WHEN f.plan IN ('estandar', 'estándar', 'destacado') THEN 3
    WHEN f.plan = 'premium' THEN l.limite END, f.seccion
  FROM ficha f
  LEFT JOIN public.antojo_hoy_limites_superiores l ON l.negocio = slug_negocio
  WHERE f.plan IS NOT NULL
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.antojo_hoy_cupo(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.antojo_hoy_publicados()
RETURNS TABLE (negocio text, producto text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT negocios.negocio, destacados.producto
  FROM (SELECT DISTINCT s.negocio FROM public.antojo_hoy_selecciones s) negocios
  CROSS JOIN LATERAL public.antojo_hoy_cupo(negocios.negocio) cupo
  CROSS JOIN LATERAL (
    SELECT s.producto FROM public.antojo_hoy_selecciones s
    JOIN public.antojo_hoy_productos(negocios.negocio) p ON p.id = s.producto
    WHERE s.negocio = negocios.negocio
    ORDER BY s.producto
    LIMIT cupo.limite
  ) destacados
  WHERE cupo.limite IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.antojo_hoy_publicados() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.antojo_hoy_publicados() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.antojo_hoy_gestionar(
  slug_negocio text, id_producto text DEFAULT NULL, destacar boolean DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  limite_plan integer;
  seccion_publica text;
  productos_activos text[];
  seleccionados text[];
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(public.dueno_permitido_v53(slug_negocio), false) THEN
    RAISE EXCEPTION 'Sin acceso a este negocio.' USING ERRCODE = '42501';
  END IF;

  -- Serialize all saves for one business, including parallel owner/admin sessions.
  IF id_producto IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(slug_negocio, 30491));
  END IF;

  SELECT coalesce(array_agg(p.id), ARRAY[]::text[]) INTO productos_activos
  FROM public.antojo_hoy_productos(slug_negocio) p;
  SELECT c.limite, c.seccion INTO limite_plan, seccion_publica
  FROM public.antojo_hoy_cupo(slug_negocio) c;
  IF limite_plan IS NULL THEN
    IF id_producto IS NOT NULL THEN RAISE EXCEPTION 'El plan asignado no incluye destacados.'; END IF;
    RETURN jsonb_build_object('habilitado', false);
  END IF;

  IF id_producto IS NOT NULL THEN
    IF destacar IS NULL THEN RAISE EXCEPTION 'Indica si quieres destacar el producto.'; END IF;
    IF destacar AND NOT (id_producto = ANY(productos_activos)) THEN
      RAISE EXCEPTION 'Solo puedes destacar productos activos de este negocio.';
    END IF;
    DELETE FROM public.antojo_hoy_selecciones s
    WHERE s.negocio = slug_negocio AND NOT (s.producto = ANY(productos_activos));
    IF NOT destacar THEN
      DELETE FROM public.antojo_hoy_selecciones s
      WHERE s.negocio = slug_negocio AND s.producto = id_producto;
    ELSIF NOT EXISTS (
      SELECT 1 FROM public.antojo_hoy_selecciones s WHERE s.negocio = slug_negocio AND s.producto = id_producto
    ) THEN
      IF (SELECT count(*) FROM public.antojo_hoy_selecciones s WHERE s.negocio = slug_negocio) >= limite_plan THEN
        RAISE EXCEPTION 'Tu plan incluye hasta % productos en %. Si quieres destacar otro producto, primero desmarca uno de los que ya tienes seleccionados.',
          limite_plan, CASE WHEN seccion_publica = 'antojo' THEN '¿Qué se te antoja hoy?' ELSE 'Tendencias' END;
      END IF;
      INSERT INTO public.antojo_hoy_selecciones VALUES (slug_negocio, id_producto);
    END IF;
  END IF;

  SELECT coalesce(array_agg(s.producto ORDER BY s.producto), ARRAY[]::text[]) INTO seleccionados
  FROM public.antojo_hoy_selecciones s
  WHERE s.negocio = slug_negocio AND s.producto = ANY(productos_activos);
  RETURN jsonb_build_object('habilitado', true, 'seccion', seccion_publica, 'limite', limite_plan, 'activos', productos_activos, 'seleccionados', seleccionados);
END;
$$;
REVOKE ALL ON FUNCTION public.antojo_hoy_gestionar(text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.antojo_hoy_gestionar(text, text, boolean) TO authenticated;

