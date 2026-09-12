# Explicación de error — 2026-09-10

**Código:**
```js
function handleResize() {
const gc4 = document.querySelector(".grid-container4");
}
const btn3 = document.getElementById("btn3")

btn3.addEventListener("click", function() {
  alert("hola mundo 3");
  gc4.style.display = "none";
});
```

**Tipo de error:** referencia (`ReferenceError: gc4 is not defined`).

**Causa:** `gc4` se declara con `const` **dentro** de `handleResize`, una función que nunca se llama. Esa declaración solo existe dentro de ese bloque de función — fuera de ahí, `gc4` no existe. El listener de `btn3` está en otro bloque de función (el `function()` del `addEventListener`) y trata de usar `gc4` como si fuera visible ahí, pero no lo es.

**Concepto:** el *scope* (alcance) de una variable declarada con `let`/`const` es el bloque `{ }` donde se declaró — no se "escapa" hacia afuera ni se comparte entre funciones distintas solo porque están en el mismo archivo. Por eso el `alert("hola mundo 3")` sí se ve (esa línea no depende de `gc4`), pero la línea siguiente rompe la ejecución y la caja nunca desaparece.

**Corrección:**
```js
const gc4 = document.querySelector(".grid-container4");
const btn3 = document.getElementById("btn3");

btn3.addEventListener("click", function() {
  alert("hola mundo 3");
  gc4.style.display = "none";
});
```
Se saca `gc4` de dentro de `handleResize` (que no se estaba usando) y se declara en el mismo scope donde se necesita: junto a `btn3`, antes del listener.

## Patrón detectado

Este es el **tercer** `ReferenceError` registrado (después del 2026-08-20 y 2026-08-22). Los dos anteriores eran por variables nunca declaradas; este es por una variable declarada en el scope equivocado — mismo tipo de error, causa un poco distinta, y ya no solo en sketches de p5.js sino también en JS de DOM. Vale la pena repasar cómo funciona el scope de bloque (`{ }`) con `let`/`const`, no solo "declarar antes de usar".
