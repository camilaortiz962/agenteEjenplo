// "Base de datos" de usuarios del juego, guardada en localStorage.
// La usan game.html (login + juego) y gestion.html (pestaña Usuarios), por
// eso vive en su propio archivo en vez de repetirse en los dos lados.
//
// users.json es solo la SEMILLA: la primera vez se copian sus usuarios a
// localStorage, y desde ahí localStorage es la única fuente de verdad
// (el navegador no puede escribir en users.json).
//
// Forma de cada usuario:
//   { id, name, alias, email, password, games: [ { id, date, attempts, seconds } ] }

const USERS_KEY = "gameUsers";
const SEEDED_KEY = "gameUsersSeeded";

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Copia los usuarios de users.json a localStorage, UNA sola vez (lo marca
// con SEEDED_KEY). Si un email ya existe en localStorage, no se duplica.
async function seedFromJson(users) {
  if (localStorage.getItem(SEEDED_KEY)) return users;

  try {
    const response = await fetch("users.json");
    const jsonUsers = await response.json();

    jsonUsers.forEach(function(jsonUser) {
      const exists = users.some(function(u) {
        return u.email.toLowerCase() === jsonUser.email.toLowerCase();
      });
      if (!exists) users.push(jsonUser);
    });

    localStorage.setItem(SEEDED_KEY, "true");
  } catch (error) {
    // Pasa si la página se abre con doble click (file://). No se marca como
    // "sembrado", así se vuelve a intentar la próxima vez con Live Server.
    console.warn("No se pudo leer users.json (¿abriste la página con Live Server?)", error);
  }
  return users;
}

// Devuelve todos los usuarios, ya sembrados y con la forma completa.
// Los registrados antes de que existieran los ids no tienen "id" ni "games":
// se les agregan acá para que no se pierdan (esto se llama "migrar" datos).
async function loadUsers() {
  const users = await seedFromJson(getStoredUsers());

  users.forEach(function(u) {
    // crypto.randomUUID() genera un id único (UUID v4) incluido en el navegador.
    if (!u.id) u.id = crypto.randomUUID();
    if (!Array.isArray(u.games)) u.games = [];
  });

  saveUsers(users);
  return users;
}

// Busca un usuario por email. Se compara en minúsculas porque
// "Camila@Gmail.com" y "camila@gmail.com" son el mismo correo.
function findUserByEmail(users, email) {
  return users.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase();
  });
}

// Crea un usuario nuevo con su id y sin partidas, lo guarda y lo devuelve.
async function addUser(name, alias, email, password) {
  const users = await loadUsers();
  const newUser = {
    id: crypto.randomUUID(),
    name: name,
    alias: alias,
    email: email,
    password: password,
    games: [],
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Registra una partida completada en el historial del usuario (por su id).
// Devuelve el usuario actualizado, o null si ya no existe.
async function addGameToUser(userId, attempts, seconds) {
  const users = await loadUsers();
  const user = users.find(function(u) {
    return u.id === userId;
  });
  if (!user) return null;

  user.games.push({
    id: crypto.randomUUID(),
    // Formato ISO ("2026-09-25T15:42:10.000Z"): es un estándar, se ordena
    // bien como texto y se vuelve a convertir en fecha con new Date(...).
    date: new Date().toISOString(),
    attempts: attempts,
    seconds: seconds,
  });

  saveUsers(users);
  return user;
}
