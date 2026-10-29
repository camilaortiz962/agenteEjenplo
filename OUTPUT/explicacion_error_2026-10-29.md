# Explicación de error — 2026-10-29

**Archivo:** `INPUT/clases/Obj1/semana-11/practica/prueba2.html`
**Síntoma:** el botón "Traer productos" no hace nada.
**Error en consola (F12):** `ReferenceError: db is not defined`

## Tipo de error
ReferenceError: el código usa un nombre que no existe en ningún scope visible.

## Causa
- `prueba2.html` carga `<script src="../js/supabaseClient.js">`.
- Ese archivo **no existe** en `semana-11/js/` (ahí solo está `data.js`). El navegador da 404 y sigue de largo.
- `supabaseClient.js` es el que crea `const db = createClient(...)`. Sin él, `db` nunca se declara.
- La página no falla al cargar porque `db` solo se usa **dentro** de funciones/listeners: el error sale apenas se ejecuta el click.

## Concepto
Los `<script>` clásicos comparten un scope global: una variable declarada en un archivo se ve en los siguientes **solo si ese archivo se cargó**. Una ruta rota no rompe la página; rompe todo lo que dependía de ese archivo.

## Corrección
Copiar `INPUT/semana9-supabase/js/supabaseClient.js` a `INPUT/clases/Obj1/semana-11/js/supabaseClient.js` (o corregir la ruta del `<script>`).

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../js/supabaseClient.js"></script> <!-- crea db -->
<script src="datos.js"></script>                <!-- usa db -->
<script src="prueba2.js"></script>
```
