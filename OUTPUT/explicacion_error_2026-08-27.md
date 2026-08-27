# Explicación de error — 2026-08-27

**Código:**
```js
for (let i = 0 ; i > 10 ; i++ ){
  console.log( i + 1 );
}
```

**Tipo de error:** lógico (sin mensaje en consola — el bucle nunca se ejecuta).

**Causa:** la condición del `for` se evalúa antes de cada iteración, incluida la primera. Con `i = 0`, `i > 10` es falso desde el inicio, así que el cuerpo del bucle nunca corre.

**Concepto:** la condición de un `for` es "mientras esto sea verdadero, sigo", no "hasta dónde llego". Para contar de 0 a 9 la condición debe ser `i < 10`.

**Corrección:**
```js
for (let i = 0; i < 10; i++) {
  console.log(i + 1);
}
```
