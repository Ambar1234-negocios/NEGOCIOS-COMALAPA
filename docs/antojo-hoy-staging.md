# ¿Qué se te antoja hoy? en staging

El dueño y administración gestionan los destacados desde el menú o catálogo del negocio. El panel muestra cuántos productos activos están destacados. Al llenar el cupo, las opciones restantes quedan bloqueadas y el panel explica cómo liberar un lugar.

## Datos y permisos

- El cupo Estándar es de tres por negocio. Aplica a comida con menú, Abazarlo Boutique (`abazarlo-boutique`), Shopping Morales, Karen Shop y Fundación Dondé (`fundacion-donde-comalapa`).
- `antojo_hoy_selecciones` guarda las referencias `negocio` y `producto`. El catálogo conserva sus campos, disponibilidad, historial y `enCarrusel`. Al seleccionar, se valida que el producto siga activo y pertenezca al negocio.
- `antojo_hoy_gestionar` reutiliza el permiso existente `dueno_permitido_v53` y serializa los guardados del mismo negocio. Las selecciones se leen públicamente y los cambios pasan por esta operación autorizada.
- `antojo_hoy_limites_superiores` permite asignar un límite mayor que tres a un negocio cuando se defina su plan. La configuración es privada y se entrega al usuario autorizado únicamente como el cupo aplicable. No se asignaron límites superiores.
- Con base aislada configurada, la portada usa la selección explícita y empieza vacía hasta que se elijan productos. El modo estático de staging muestra hasta tres ejemplos disponibles de comida por negocio con las reglas de visibilidad ya existentes.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `sql/antojo-hoy.sql` | Tablas, permisos, consulta de productos y validación del cupo. Ejecutar después del esquema de catálogos en la base de staging. |
| `panel/antojo-hoy.js`, `panel/menu-completo.css` | Sección compartida con contador, aviso y controles de selección. |
| `panel/dueno-menu.js`, `panel/menu-completo.js`, `panel/empeno-dueno.js` | Integración con el menú, la vista de administración y el catálogo independiente de Fundación Dondé. |
| `panel/dueno.html`, `panel/dueno-adelina.html`, `panel/dueno-forno.html`, `panel/menu-completo.html` | Carga del editor y retiro del control anterior de esa sección. |
| `comida.js`, `menu-publicado.js`, `empeno-publico.js`, `index.html` | Carga de las selecciones y presentación pública de los productos activos. |

## Comprobación en el entorno aislado

1. Inicia sesión con una cuenta ficticia dueña de un negocio con cuatro productos activos. Marca tres, verifica el contador y prueba la cuarta opción con clic y teclado.
2. Desmarca uno, destaca el cuarto y recarga. Confirma la persistencia y comprueba el carrusel público.
3. Repite desde Administración y desde Fundación Dondé. Comprueba que una cuenta sin permiso para ese negocio reciba un rechazo.
4. Construye con la configuración de [staging](staging.md) y usa productos y cuentas de prueba.


La verificación local ejecutó el SQL en PostgreSQL con datos ficticios y simuló el panel y la portada. Cubrió los tres lugares, el rechazo del cuarto producto, el cambio de selección, los permisos, Fundación Dondé y un cupo superior de prueba.
