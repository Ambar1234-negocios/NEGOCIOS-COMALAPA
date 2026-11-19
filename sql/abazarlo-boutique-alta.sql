with perfil as (
  select $perfil$
{
  "nombre": "Abazarlo Boutique",
  "slug": "abazarlo-boutique",
  "categoria": "cat-ropa-calzado-y-accesorios",
  "descripcion": "Boutique con ropa, accesorios, belleza y fragancias para dama y caballero. Encuentra prendas casuales y deportivas, bolsas, gorras, lentes, maquillaje original, perfumes de diseñador y árabes, además de productos Victoria’s Secret y Bath & Body Works.",
  "telefono": "9673558715",
  "whatsapp": "9631381644",
  "tipoCatalogo": "visual",
  "activo": true,
  "verificado": false,
  "delivery": false,
  "mostrarGaleria": false,
  "productos": [],
  "galeria": [],
  "servicios": [],
  "horarios": {
    "lunes": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "martes": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "miercoles": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "jueves": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "viernes": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "sabado": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "20:00"
        }
      ]
    },
    "domingo": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "11:00",
          "fin": "17:00"
        }
      ]
    }
  },
  "categoriasDinamicas": true,
  "seccionesCatalogo": [
    "Moda para dama",
    "Moda para caballero",
    "Ropa deportiva",
    "Lencería y ropa interior",
    "Bolsas y bandoleras",
    "Carteras, billeteras y monederos",
    "Cinturones, gorras y lentes",
    "Maquillaje",
    "Perfumes",
    "Victoria’s Secret",
    "Bath & Body Works",
    "Otros accesorios"
  ],
  "seccionesOcultas": []
}
$perfil$::jsonb
    || jsonb_build_object('id', floor(extract(epoch from clock_timestamp()) * 1000)) as contenido
), creado as (
  insert into public.piloto_menus_completos (slug, original, borrador, plan)
  select contenido->>'slug', contenido, contenido, 'normal' from perfil
  on conflict (slug) do nothing
  returning slug, original
)
insert into public.sitio_historial (tipo, registro, anterior, nuevo, actor)
select 'negocios', slug, '{}'::jsonb, original - 'productos', null from creado
returning registro;
