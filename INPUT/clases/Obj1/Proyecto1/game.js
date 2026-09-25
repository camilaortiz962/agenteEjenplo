// Login del juego con dos modos:
//   - "login":    email + contraseña, contra los usuarios ya registrados.
//   - "register": nombre, alias, email y contraseña (con reglas de regex).

// Regex completa de la contraseña. Cada (?=...) es un "lookahead": revisa
// una condición desde el inicio sin consumir caracteres, así se pueden
// encadenar varias condiciones sobre el mismo texto.
//   (?=(?:\D*\d){3})  -> al menos 3 dígitos, en cualquier posición
//   (?=.*[A-Z])       -> al menos 1 mayúscula
//   .{6,}             -> mínimo 6 caracteres en total
const PASSWORD_REGEX = /^(?=(?:\D*\d){3})(?=.*[A-Z]).{6,}$/;

// Regex del email: usuario@dominio.extension
//   [^\s@]+      -> usuario: 1 o más caracteres que no sean espacio ni @
//   @            -> exactamente una arroba
//   [^\s@]+      -> dominio (ej. "gmail")
//   \.           -> un punto literal (sin "\" el punto significa "cualquier carácter")
//   [a-zA-Z]{2,} -> extensión de al menos 2 letras (ej. "com", "co")
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Las mismas reglas por separado, solo para marcar en la checklist cuál
// se cumple y cuál no (la regex de arriba solo dice sí/no en conjunto).
const rules = [
  { element: document.getElementById("ruleLength"), regex: /^.{6,}$/ },
  { element: document.getElementById("ruleDigits"), regex: /(?:\D*\d){3}/ },
  { element: document.getElementById("ruleUpper"), regex: /[A-Z]/ },
];

const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");
const aliasInput = document.getElementById("aliasInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const nameError = document.getElementById("nameError");
const aliasError = document.getElementById("aliasError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const welcome = document.getElementById("welcome");
const welcomeAlias = document.getElementById("welcomeAlias");
const loginTabs = document.getElementById("loginTabs");
const loginTitle = document.getElementById("loginTitle");
const submitBtn = document.getElementById("submitBtn");
const registerOnlyElements = document.querySelectorAll(".register-only");

// Modo activo del formulario: "login" o "register".
let mode = "login";

// Cambia de modo: muestra/oculta los campos de registro, actualiza textos
// y pestaña activa, y limpia los errores del modo anterior.
function setMode(newMode) {
  mode = newMode;
  const isRegister = mode === "register";

  registerOnlyElements.forEach(function(el) {
    el.hidden = !isRegister;
  });

  loginTitle.textContent = isRegister ? "Crear cuenta" : "Entrar al juego";
  submitBtn.textContent = isRegister ? "Registrarme" : "Entrar";
  // Le dice al navegador/gestor de contraseñas si debe sugerir una
  // contraseña nueva (registro) o autocompletar la guardada (login).
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";

  loginTabs.querySelectorAll(".login-tab").forEach(function(tab) {
    tab.classList.toggle("activo", tab.dataset.mode === mode);
  });

  [nameError, aliasError, emailError, passwordError].forEach(function(el) {
    el.textContent = "";
  });
}

// Delegación de eventos: un solo listener para las dos pestañas.
loginTabs.addEventListener("click", function(e) {
  const tab = e.target.closest(".login-tab");
  if (tab) setMode(tab.dataset.mode);
});

// Marca con la clase "ok" las reglas que la contraseña ya cumple.
function updateRules() {
  rules.forEach(function(rule) {
    rule.element.classList.toggle("ok", rule.regex.test(passwordInput.value));
  });
}

// "input" se dispara con cada tecla, así la checklist se actualiza en vivo.
passwordInput.addEventListener("input", updateRules);

// Los usuarios (loadUsers, findUserByEmail, addUser) viven en userStore.js,
// cargado antes que este archivo, porque gestion.html también los usa.

// Oculta el login, muestra el juego y lo arranca con el usuario que entró
// (startMemoryGame vive en memory.js).
function showWelcome(user) {
  loginForm.hidden = true;
  welcomeAlias.textContent = user.alias;
  welcome.hidden = false;
  startMemoryGame(user);
}

// Escribe el error del email y devuelve si es válido.
function validateEmail(email) {
  if (!email) {
    emailError.textContent = "Escribe tu email";
  } else if (!EMAIL_REGEX.test(email)) {
    emailError.textContent = "El email debe tener la forma usuario@dominio.com";
  } else {
    emailError.textContent = "";
  }
  return EMAIL_REGEX.test(email);
}

// Modo "login": solo email + contraseña.
async function handleLogin(email, password) {
  const isEmailValid = validateEmail(email);
  // Acá no se aplica la regex de contraseña: basta con que no esté vacía,
  // porque lo que importa es que coincida con la guardada.
  passwordError.textContent = password ? "" : "Escribe tu contraseña";
  if (!isEmailValid || !password) return;

  const users = await loadUsers();
  const existingUser = findUserByEmail(users, email);

  if (existingUser) {
    if (existingUser.password !== password) {
      passwordError.textContent = "Contraseña incorrecta";
      return;
    }
    showWelcome(existingUser);
    return;
  }

  // El email no está registrado: se pregunta si quiere crear una cuenta.
  // confirm() pausa la página y devuelve true (Aceptar) o false (Cancelar).
  const wantsToRegister = confirm(`No hay una cuenta con ${email}. ¿Deseas registrarte?`);
  if (!wantsToRegister) return;

  // Pasa al modo registro. setMode no toca los inputs, así el email y la
  // contraseña ya escritos se conservan; solo falta nombre y alias.
  setMode("register");
  updateRules();
  nameInput.focus();
}

// Modo "register": los 4 campos, con las reglas de regex.
async function handleRegister(name, alias, email, password) {
  nameError.textContent = name ? "" : "Escribe tu nombre";
  aliasError.textContent = alias ? "" : "Escribe tu alias";
  const isEmailValid = validateEmail(email);
  const isPasswordValid = PASSWORD_REGEX.test(password);
  passwordError.textContent = isPasswordValid ? "" : "La contraseña no cumple las reglas de abajo";
  updateRules();

  if (!name || !alias || !isEmailValid || !isPasswordValid) return;

  const users = await loadUsers();
  if (findUserByEmail(users, email)) {
    emailError.textContent = "Ya existe una cuenta con este email. Inicia sesión.";
    return;
  }

  // addUser le genera el id y le pone games: [] (ver userStore.js).
  const newUser = await addUser(name, alias, email, password);
  showWelcome(newUser);
}

loginForm.addEventListener("submit", function(e) {
  // Sin esto el formulario recargaría la página (su comportamiento por defecto).
  e.preventDefault();

  // trim() quita espacios al inicio y al final: "   " cuenta como vacío.
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (mode === "login") {
    handleLogin(email, password);
  } else {
    handleRegister(nameInput.value.trim(), aliasInput.value.trim(), email, password);
  }
});
