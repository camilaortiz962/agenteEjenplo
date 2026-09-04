# Explicación de error — 2026-09-04

**Código:**
```js
btnOscuro.addEventListener("click", function() {
  console.log("click en el botón");
document.body.classList.toggle("dark-mode");
if (document.body.classList.contains("dark-mode")) {
  btnOscuro.textContent = "Light mode";
} else {
  btnOscuro.textContent = "Dark mode";
});
```

**Tipo de error:** sintaxis (`SyntaxError` — falta cerrar un bloque).

**Causa:** el `else` abre una llave `{` que nunca se cierra, y por eso tampoco alcanza a cerrarse la función `function() { ... }` del `addEventListener`. El `});` de la última línea intenta cerrar la llamada, pero como faltan dos `}` (una del `else`, una de la función), el navegador no puede terminar de leer el `<script>` completo — y por eso *ningún* botón responde, no solo el de dark mode.

**Concepto:** cada `{` necesita su `}` correspondiente. Cuando falta una, el intérprete sigue "esperando" el cierre y todo lo que viene después queda dentro de un bloque a medio abrir, hasta que el archivo se acaba — ahí recién avisa el error. Por eso conviene cerrar cada bloque apenas se abre, antes de llenarlo.

**Corrección:**
```js
btnOscuro.addEventListener("click", function() {
  console.log("click en el botón");
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    btnOscuro.textContent = "Light mode";
  } else {
    btnOscuro.textContent = "Dark mode";
  }
});
```
