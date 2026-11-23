-- Alta inicial. Una segunda ejecución conserva las ediciones del panel.
with datos as (
  select $snacks$
{
  "slug": "la-casa-de-los-snacks",
  "nombre": "La Casa de los Snack’s",
  "slogan": "Un bocado de sabor",
  "categoria": "comida",
  "tipoCatalogo": "comida",
  "descripcion": "Snacks, alitas, banderillas coreanas, bolitas de queso, papas preparadas y más, con diferentes sabores y opciones para elegir.",
  "telefono": "9616556465",
  "telefonoAlternativo": "9614010731",
  "whatsapp": "9616556465",
  "direccion": "Barrio Nueva Esperanza, carretera a Huixnayal, Frontera Comalapa. Aproximadamente 5 cuadras de la Comisaría Ejidal / 50 metros antes de cruzar el libramiento.",
  "horarios": {
    "lunes": {
      "modo": "cerrado",
      "turnos": []
    },
    "martes": {
      "modo": "cerrado",
      "turnos": []
    },
    "miercoles": {
      "modo": "cerrado",
      "turnos": []
    },
    "jueves": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "17:00",
          "fin": "22:00"
        }
      ]
    },
    "viernes": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "17:00",
          "fin": "22:00"
        }
      ]
    },
    "sabado": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "17:00",
          "fin": "22:00"
        }
      ]
    },
    "domingo": {
      "modo": "abierto",
      "turnos": [
        {
          "inicio": "17:00",
          "fin": "22:00"
        }
      ]
    }
  },
  "activo": true,
  "verificado": false,
  "plan": "normal",
  "delivery": true,
  "tipoDelivery": "por-confirmar",
  "mostrarGaleria": false,
  "servicios": [
    "Servicio a domicilio disponible"
  ],
  "galeria": [],
  "palabrasClave": [
    "snacks"
  ],
  "productos": [
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627101",
      "nombre": "Alitas",
      "seccion": "Alitas",
      "precio": 100,
      "gruposOpciones": [
        {
          "id": "piezas",
          "nombre": "Presentación",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "6 piezas",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "8 piezas",
              "precio": 130,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "12 piezas",
              "precio": 180,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "16 piezas",
              "precio": 250,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-5",
              "nombre": "20 piezas",
              "precio": 300,
              "tipoPrecio": "propio",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        },
        {
          "id": "salsas",
          "nombre": "Salsas",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "De la casa (picosita)",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "BBQ",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Mango habanero",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "Lemon Pepper",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-5",
              "nombre": "Valentina",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "multiple",
          "obligatorio": true,
          "limitePorOpcion": {
            "grupo": "piezas",
            "maximos": {
              "op-1": 1,
              "op-2": 2,
              "op-3": 3,
              "op-4": 4,
              "op-5": 5
            },
            "notas": {
              "op-5": "Selección de salsas por confirmar con el negocio."
            }
          }
        }
      ],
      "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
      "extras": [
        {
          "id": "papas-extra",
          "nombre": "Agregar papas a la francesa",
          "precio": 25,
          "disponible": true
        }
      ],
      "foto": "",
      "disponible": true,
      "enCarrusel": false,
      "extrasConCantidad": true
    },
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627102",
      "nombre": "Papas a la francesa",
      "seccion": "Papas",
      "precio": 60,
      "gruposOpciones": [
        {
          "id": "tamano",
          "nombre": "Tamaño",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Chicas",
              "precio": 60,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Grandes",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        }
      ],
      "ingredientes": "",
      "extras": [],
      "foto": "",
      "disponible": true,
      "enCarrusel": false
    },
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627103",
      "nombre": "Salchipapas",
      "seccion": "Papas",
      "precio": 70,
      "gruposOpciones": [
        {
          "id": "tamano",
          "nombre": "Tamaño",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Chica",
              "precio": 70,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Grande",
              "precio": 120,
              "tipoPrecio": "propio",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        }
      ],
      "ingredientes": "",
      "extras": [],
      "foto": "",
      "disponible": true,
      "enCarrusel": false
    },
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627104",
      "nombre": "Papas de bolsa preparadas",
      "seccion": "Papas",
      "precio": 35,
      "gruposOpciones": [
        {
          "id": "sabor",
          "nombre": "Sabor",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Natural",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Queso cheddar",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Adobadas",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "Queso jalapeño",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-5",
              "nombre": "Chile de árbol",
              "precio": 0,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        }
      ],
      "ingredientes": "",
      "extras": [],
      "foto": "",
      "disponible": true,
      "enCarrusel": false
    },
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627105",
      "nombre": "Banderilla coreana",
      "seccion": "Banderillas coreanas",
      "precio": 50,
      "gruposOpciones": [
        {
          "id": "base",
          "nombre": "Base",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Base salchicha",
              "precio": 50,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Base mixta",
              "precio": 60,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Base queso mozzarella",
              "precio": 70,
              "tipoPrecio": "propio",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        },
        {
          "id": "toppings",
          "nombre": "Toppings",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Ramen",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Papas",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Jalapeño",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "Cheetos Cheddar",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-5",
              "nombre": "Cheetos Flamin’ Hot",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-6",
              "nombre": "Doritos Nachos",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-7",
              "nombre": "Takis Azules",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-8",
              "nombre": "Ruffles Queso",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "multiple",
          "obligatorio": false
        }
      ],
      "ingredientes": "",
      "extras": [],
      "foto": "",
      "disponible": true,
      "enCarrusel": false
    },
    {
      "id": "40dcba83-54dd-4f5b-8fd2-665c9c627106",
      "nombre": "Bolitas de queso",
      "seccion": "Bolitas de queso",
      "precio": 90,
      "gruposOpciones": [
        {
          "id": "presentacion",
          "nombre": "Presentación",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "6 piezas clásicas",
              "precio": 90,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "6 piezas papa",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "6 piezas jalapeño",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "6 piezas ramen",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-5",
              "nombre": "6 piezas Sabritas",
              "precio": 100,
              "tipoPrecio": "propio",
              "disponible": true
            },
            {
              "id": "op-6",
              "nombre": "8 piezas combinadas",
              "precio": 150,
              "tipoPrecio": "propio",
              "disponible": true
            }
          ],
          "seleccion": "unica",
          "obligatorio": true
        },
        {
          "id": "picositos",
          "nombre": "Aderezos extra picositos",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Mango habanero",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Queso jalapeño",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Habanero verde",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-4",
              "nombre": "Habanero rojo",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "multiple",
          "obligatorio": false
        },
        {
          "id": "dulces",
          "nombre": "Aderezos extra dulces",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Catsup",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Salsa BBQ",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "multiple",
          "obligatorio": false
        },
        {
          "id": "cremosos",
          "nombre": "Aderezos extra cremosos",
          "opciones": [
            {
              "id": "op-1",
              "nombre": "Salsa Ranch",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-2",
              "nombre": "Queso amarillo",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            },
            {
              "id": "op-3",
              "nombre": "Chimichurri",
              "precio": 10,
              "tipoPrecio": "adicional",
              "disponible": true
            }
          ],
          "seleccion": "multiple",
          "obligatorio": false
        }
      ],
      "ingredientes": "",
      "extras": [],
      "foto": "",
      "disponible": true,
      "enCarrusel": false
    }
  ]
}
$snacks$::jsonb
    || jsonb_build_object('id', floor(extract(epoch from clock_timestamp()) * 1000)) as perfil
), negocio_creado as (
  insert into public.piloto_menus_completos (slug, original, borrador, plan)
  select perfil->>'slug', perfil, perfil, perfil->>'plan' from datos
  on conflict (slug) do nothing
  returning slug, original, revision
), productos_publicados as (
  insert into public.menu_productos_publicados (negocio, producto, contenido, publicado_por, revision)
  select n.slug, p->>'id', p, '00000000-0000-0000-0000-000000000000'::uuid, n.revision
  from negocio_creado n cross join lateral jsonb_array_elements(n.original->'productos') p
  returning producto
), alta_registrada as (
  insert into public.sitio_historial (tipo, registro, anterior, nuevo, actor)
  select 'negocios', slug, '{}'::jsonb, original-'productos', null from negocio_creado
  returning registro
)
select registro as slug, (select count(*) from productos_publicados) as productos
from alta_registrada;
