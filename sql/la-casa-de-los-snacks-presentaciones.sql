-- Separa las presentaciones y conserva las tres tarjetas de Papas.
with datos as (
  select $menu$
[
  {
    "id": "30dcba83-54dd-4f5b-8fd2-665c9c627101",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas · 6 piezas",
    "precio": 100,
    "seccion": "Alitas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "salsas",
        "nombre": "Salsas",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "De la casa (picosita)",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "maximo": 1
        }
      }
    ],
    "extrasConCantidad": true
  },
  {
    "id": "30dcba83-54dd-4f5b-8fd2-665c9c627102",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas · 8 piezas",
    "precio": 130,
    "seccion": "Alitas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "salsas",
        "nombre": "Salsas",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "De la casa (picosita)",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "maximo": 2
        }
      }
    ],
    "extrasConCantidad": true
  },
  {
    "id": "30dcba83-54dd-4f5b-8fd2-665c9c627103",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas · 12 piezas",
    "precio": 180,
    "seccion": "Alitas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "salsas",
        "nombre": "Salsas",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "De la casa (picosita)",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "maximo": 3
        }
      }
    ],
    "extrasConCantidad": true
  },
  {
    "id": "30dcba83-54dd-4f5b-8fd2-665c9c627104",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas · 16 piezas",
    "precio": 250,
    "seccion": "Alitas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "salsas",
        "nombre": "Salsas",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "De la casa (picosita)",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "maximo": 4
        }
      }
    ],
    "extrasConCantidad": true
  },
  {
    "id": "30dcba83-54dd-4f5b-8fd2-665c9c627105",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas · 20 piezas",
    "precio": 300,
    "seccion": "Alitas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "salsas",
        "nombre": "Salsas",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "De la casa (picosita)",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "maximo": 5,
          "nota": "Selección de salsas por confirmar con el negocio."
        }
      }
    ],
    "extrasConCantidad": true
  },
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627102",
    "foto": "",
    "extras": [],
    "nombre": "Papas a la francesa",
    "precio": 60,
    "seccion": "Papas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "tamano",
        "nombre": "Tamaño",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Chicas",
            "precio": 60,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-2",
            "nombre": "Grandes",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          }
        ],
        "seleccion": "unica",
        "obligatorio": true
      }
    ]
  },
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627103",
    "foto": "",
    "extras": [],
    "nombre": "Salchipapas",
    "precio": 70,
    "seccion": "Papas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "tamano",
        "nombre": "Tamaño",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Chica",
            "precio": 70,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-2",
            "nombre": "Grande",
            "precio": 120,
            "disponible": true,
            "tipoPrecio": "propio"
          }
        ],
        "seleccion": "unica",
        "obligatorio": true
      }
    ]
  },
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627104",
    "foto": "",
    "extras": [],
    "nombre": "Papas de bolsa preparadas",
    "precio": 35,
    "seccion": "Papas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "sabor",
        "nombre": "Sabor",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Natural",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso cheddar",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Adobadas",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Queso jalapeño",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Chile de árbol",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "unica",
        "obligatorio": true
      }
    ]
  },
  {
    "id": "50dcba83-54dd-4f5b-8fd2-665c9c627101",
    "foto": "",
    "extras": [],
    "nombre": "Banderilla coreana · base salchicha",
    "precio": 50,
    "seccion": "Banderillas coreanas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "toppings",
        "nombre": "Toppings",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Ramen",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Papas",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Cheetos Cheddar",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Cheetos Flamin’ Hot",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-6",
            "nombre": "Doritos Nachos",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-7",
            "nombre": "Takis Azules",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-8",
            "nombre": "Ruffles Queso",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "50dcba83-54dd-4f5b-8fd2-665c9c627102",
    "foto": "",
    "extras": [],
    "nombre": "Banderilla coreana · base mixta",
    "precio": 60,
    "seccion": "Banderillas coreanas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "toppings",
        "nombre": "Toppings",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Ramen",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Papas",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Cheetos Cheddar",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Cheetos Flamin’ Hot",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-6",
            "nombre": "Doritos Nachos",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-7",
            "nombre": "Takis Azules",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-8",
            "nombre": "Ruffles Queso",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "50dcba83-54dd-4f5b-8fd2-665c9c627103",
    "foto": "",
    "extras": [],
    "nombre": "Banderilla coreana · base queso mozzarella",
    "precio": 70,
    "seccion": "Banderillas coreanas",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "toppings",
        "nombre": "Toppings",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Ramen",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Papas",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Cheetos Cheddar",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Cheetos Flamin’ Hot",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-6",
            "nombre": "Doritos Nachos",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-7",
            "nombre": "Takis Azules",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-8",
            "nombre": "Ruffles Queso",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627101",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 6 piezas clásicas",
    "precio": 90,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627102",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 6 piezas papa",
    "precio": 100,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627103",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 6 piezas jalapeño",
    "precio": 100,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627104",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 6 piezas ramen",
    "precio": 100,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627105",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 6 piezas Sabritas",
    "precio": 100,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  },
  {
    "id": "60dcba83-54dd-4f5b-8fd2-665c9c627106",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso · 8 piezas combinadas",
    "precio": 150,
    "seccion": "Bolitas de queso",
    "disponible": true,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "picositos",
        "nombre": "Aderezos extra picositos",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Mango habanero",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ]
  }
]
$menu$::jsonb as productos,
         $retirados$
[
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627101",
    "foto": "",
    "extras": [
      {
        "id": "papas-extra",
        "nombre": "Agregar papas a la francesa",
        "precio": 25,
        "disponible": true
      }
    ],
    "nombre": "Alitas",
    "precio": 100,
    "seccion": "Alitas",
    "disponible": false,
    "enCarrusel": false,
    "ingredientes": "Incluye pepino, zanahoria y aderezo Ranch.",
    "gruposOpciones": [
      {
        "id": "piezas",
        "nombre": "Presentación",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "6 piezas",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-2",
            "nombre": "8 piezas",
            "precio": 130,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-3",
            "nombre": "12 piezas",
            "precio": 180,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-4",
            "nombre": "16 piezas",
            "precio": 250,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-5",
            "nombre": "20 piezas",
            "precio": 300,
            "disponible": true,
            "tipoPrecio": "propio"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "BBQ",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Mango habanero",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Lemon Pepper",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Valentina",
            "precio": 0,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": true,
        "limitePorOpcion": {
          "grupo": "piezas",
          "notas": {
            "op-5": "Selección de salsas por confirmar con el negocio."
          },
          "maximos": {
            "op-1": 1,
            "op-2": 2,
            "op-3": 3,
            "op-4": 4,
            "op-5": 5
          }
        }
      }
    ],
    "extrasConCantidad": true,
    "eliminado": true
  },
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627105",
    "foto": "",
    "extras": [],
    "nombre": "Banderilla coreana",
    "precio": 50,
    "seccion": "Banderillas coreanas",
    "disponible": false,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "base",
        "nombre": "Base",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "Base salchicha",
            "precio": 50,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-2",
            "nombre": "Base mixta",
            "precio": 60,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-3",
            "nombre": "Base queso mozzarella",
            "precio": 70,
            "disponible": true,
            "tipoPrecio": "propio"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Papas",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Cheetos Cheddar",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-5",
            "nombre": "Cheetos Flamin’ Hot",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-6",
            "nombre": "Doritos Nachos",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-7",
            "nombre": "Takis Azules",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-8",
            "nombre": "Ruffles Queso",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ],
    "eliminado": true
  },
  {
    "id": "40dcba83-54dd-4f5b-8fd2-665c9c627106",
    "foto": "",
    "extras": [],
    "nombre": "Bolitas de queso",
    "precio": 90,
    "seccion": "Bolitas de queso",
    "disponible": false,
    "enCarrusel": false,
    "ingredientes": "",
    "gruposOpciones": [
      {
        "id": "presentacion",
        "nombre": "Presentación",
        "opciones": [
          {
            "id": "op-1",
            "nombre": "6 piezas clásicas",
            "precio": 90,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-2",
            "nombre": "6 piezas papa",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-3",
            "nombre": "6 piezas jalapeño",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-4",
            "nombre": "6 piezas ramen",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-5",
            "nombre": "6 piezas Sabritas",
            "precio": 100,
            "disponible": true,
            "tipoPrecio": "propio"
          },
          {
            "id": "op-6",
            "nombre": "8 piezas combinadas",
            "precio": 150,
            "disponible": true,
            "tipoPrecio": "propio"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso jalapeño",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Habanero verde",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-4",
            "nombre": "Habanero rojo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Salsa BBQ",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
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
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-2",
            "nombre": "Queso amarillo",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          },
          {
            "id": "op-3",
            "nombre": "Chimichurri",
            "precio": 10,
            "disponible": true,
            "tipoPrecio": "adicional"
          }
        ],
        "seleccion": "multiple",
        "obligatorio": false
      }
    ],
    "eliminado": true
  }
]
$retirados$::jsonb as retirados
), actualizado as (
  update public.piloto_menus_completos m
  set original=jsonb_set(m.original,'{productos}',d.productos),
      borrador=jsonb_set(m.borrador,'{productos}',d.productos),
      revision=m.revision+1,
      actualizado_en=now()
  from datos d
  where m.slug='la-casa-de-los-snacks' and m.revision=1
  returning m.slug,m.revision
), cambios as (
  select a.slug,a.revision,p as producto
  from actualizado a cross join datos d
  cross join lateral jsonb_array_elements(d.productos || d.retirados) p
  where p->>'id' not in ('40dcba83-54dd-4f5b-8fd2-665c9c627102', '40dcba83-54dd-4f5b-8fd2-665c9c627103', '40dcba83-54dd-4f5b-8fd2-665c9c627104')
), anteriores as (
  select c.*, coalesce(p.contenido,'{}'::jsonb) as anterior
  from cambios c left join public.menu_productos_publicados p
    on p.negocio=c.slug and p.producto=c.producto->>'id'
), publicados as (
  insert into public.menu_productos_publicados (negocio,producto,contenido,publicado_por,revision)
  select slug,producto->>'id',producto,'00000000-0000-0000-0000-000000000000'::uuid,revision
  from anteriores
  on conflict (negocio,producto) do update set
    contenido=excluded.contenido,publicado_por=excluded.publicado_por,
    revision=excluded.revision,publicado_en=now()
  returning negocio,producto
)
insert into public.menu_publicacion_historial (negocio,producto,anterior,nuevo,actor)
select a.slug,p.producto,a.anterior,a.producto,'00000000-0000-0000-0000-000000000000'::uuid
from anteriores a join publicados p on p.negocio=a.slug and p.producto=a.producto->>'id'
returning producto;
