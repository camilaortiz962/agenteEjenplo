# Semana 9 — De localStorage a Supabase

Copia de `INPUT/clases/Obj1/Proyecto1` (semana 7) migrada a Supabase.
El original **no se tocó**: compáralos para ver el ANTES / AHORA.

## Estructura

| Ruta | Qué es |
|---|---|
| `js/supabaseClient.js` | Crea `db` (Project URL + anon key de `practica-productos`). Lo usan todas las páginas. |
| `img/` | Copia de `Obj1/img`. Las rutas en Supabase son `../../img/...`, por eso las páginas están 2 niveles abajo. |
| `proyectos/practica/prueba.html` | Sección 4.4: botón que trae `productos_practica`. |
| `proyectos/practica/practica.html` | Sección 5: CRUD de la Lámpara Solar Portátil sobre `productos_practica`. |
| `proyectos/Proyecto1/` | Tu proyecto BTS, ahora leyendo/escribiendo la tabla `heroes`. |
| `proyectos/gestion-heroes/` | Sección 4.6: página de gestión independiente (lista, agregar, buscar, modificar, eliminar) sobre `heroes`, con `crudHeroes.js`. |

## Qué cambió en Proyecto1

| Archivo | Cambio |
|---|---|
| `data.js` | Ya no tiene el arreglo escrito a mano ni localStorage. `heroes` arranca vacío; `cargarHeroes()` lo llena desde Supabase. Aquí viven las 4 funciones CRUD: `agregarHeroe`, `buscarHeroePorId` / `buscarHeroesPorNombre`, `modificarHeroe`, `eliminarHeroe` (todas `async`). |
| `gestion.js` | Listeners `async` + `await`. Se eliminaron `guardarHeroeEnLocalStorage`, `eliminarHeroeDeLocalStorage`, `agregarANombresEliminados`. Actualizar/eliminar usan `id` en vez de `nombre`. |
| `gestion.html` | La sección **Buscar** (estaba vacía) ahora busca por id y por nombre. Scripts del CDN y `supabaseClient.js` antes de `data.js`. |
| `Index.js` | `iniciar()` espera `cargarHeroes()` antes de dibujar la baraja. |
| `memory.js` | `startMemoryGame()` espera `cargarHeroes()` antes de armar el tablero. |
| `Index.html`, `game.html` | Scripts del CDN y `supabaseClient.js` antes de `data.js`. |

Sin cambios: `cartas.js`, `game.js`, `styles.css`, `userStore.js`, `users.json`.
Los **usuarios del login siguen en localStorage**: se migran con Supabase Auth (semana 13).

## Orden de scripts

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> <!-- 1° -->
<script src="../../js/supabaseClient.js"></script>                           <!-- 2° crea db -->
<script src="data.js"></script>                                              <!-- 3° heroes + CRUD -->
<script src="gestion.js"></script>                                           <!-- 4° -->
```

## Ojo

- RLS está abierto (sección 3.4): cualquiera con la anon key puede editar/borrar. Temporal hasta la semana 13.
- Los `id` no se reutilizan: si borras el 9, el siguiente será 10 (o más).
- Imágenes subidas desde Crear/Actualizar se guardan como data URL dentro de la columna `Image`.
