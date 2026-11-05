# Explicación de error — 2026-10-30

**Archivo:** `INPUT/clases/Obj1/semana-11/practica/cliente.html` + `js/cliente.js`
**Síntoma:** al dar "Iniciar sesión" la página se recarga y no pasa nada. No hay error en consola.

## Tipo de error
Error de lógica: el código corre sin fallar, pero no hace lo que se espera — aquí, porque falta código.

## Causa
- `cliente.js` solo escucha el `submit` de `#form-registro` (registro con `db.auth.signUp`).
- `#form-login` no tiene ningún listener, y no existe ninguna llamada a `db.auth.signInWithPassword()`.
- Sin listener no hay `event.preventDefault()`: el form hace lo que hace por defecto, **recargar la página**.
- `#btn-logout` tampoco tiene listener (`db.auth.signOut()`).

## Concepto
El HTML solo dibuja el formulario; no sabe qué hacer con los datos. Cada `<form>` necesita su propio
`addEventListener('submit', ...)`. Registrarse (`signUp`) e iniciar sesión (`signInWithPassword`) son
operaciones distintas de Supabase Auth.

## Corrección (esqueleto)
```js
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault();
  const { data, error } = await db.auth.signInWithPassword({
    email: document.getElementById('login-correo').value.trim(),
    password: document.getElementById('login-password').value,
  });
  // error → mostrar mensaje; data.user → sesión iniciada
});
```

## Ojo: otra causa posible después de agregarlo
Si el proyecto exige confirmar el correo, `signInWithPassword` devuelve `Email not confirmed`
hasta que la persona abra el enlace del correo (Authentication → Providers → Email).

---

# Error 2 — `ReferenceError: mostrarEstadoSesion is not defined` (cliente.js:214)

## Causa
- El login ya funciona: `signInWithPassword` salió bien y por eso se entra al `if (usuario)`.
- En la línea 214 se llama `mostrarEstadoSesion()`, pero esa función **no está declarada en ningún archivo**.
  El comentario dice "definida en la sección 5": es de la guía, todavía no se escribió.
- El error salta en el clic (no al cargar) porque la llamada está dentro del listener.

## Problema extra en el mismo archivo
`registrarCliente()` y el listener de `#form-registro` están **dos veces** (líneas 1–84 y 87–170).
Con dos listeners, un solo clic en "Crear cuenta" ejecuta `signUp` dos veces: el segundo falla
("User already registered") y puede pisar el mensaje de éxito.

## Corrección
Declarar `mostrarEstadoSesion()` (lee la sesión con `db.auth.getUser()` y escribe en `#estado-sesion`)
y borrar el bloque duplicado.
