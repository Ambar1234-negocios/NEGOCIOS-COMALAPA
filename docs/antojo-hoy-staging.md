# Destacados del Plan Estándar en staging

El plan se toma de la asignación existente en Administración. En los selectores versionados, `normal` corresponde a Básico, `destacado` a Estándar y `premium` a Premium. También se reconoce el valor explícito `estandar`. El cambio no modifica las asignaciones de los negocios.

- Un negocio Estándar puede elegir hasta tres productos activos. Los menús de comida se muestran en **¿Qué se te antoja hoy?**. Los demás catálogos se muestran en **Tendencias**.
- El dueño y administración ven el contador y el aviso al llegar al cupo. El servidor comprueba la autorización, el plan, la disponibilidad y el límite en cada cambio.
- Los negocios sin plan o con Básico quedan fuera de esta función. Premium tiene un cupo configurable en `antojo_hoy_limites_superiores`, sin un número asignado.
- Las selecciones se guardan en `antojo_hoy_selecciones` como referencias de negocio y producto. Ni el catálogo ni `enCarrusel` son campos de guardado de este flujo.
- Los catálogos independientes de empeño se admiten cuando existe una asignación de plan para el negocio en el control de menús o en su ficha. Sin asignación, no se les aplica el cupo por nombre.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `sql/antojo-hoy.sql` | Consulta el plan, comprueba el límite y devuelve selecciones activas para la portada. |
| `panel/antojo-hoy.js` | Adapta el nombre de la sección y el aviso al tipo de catálogo. |
| `comida.js`, `menu-publicado.js` | Distribuyen las selecciones entre comida y Tendencias. |
| `portada-demo.js`, `portada-demo.css`, `index.html` | Muestran las tarjetas de catálogo en Tendencias y cargan los archivos actualizados. |

La verificación local usa datos ficticios. Comprueba el rechazo del cuarto producto en ambos destinos, el cambio de selección, los permisos, el cambio de plan y el cupo superior configurable.

