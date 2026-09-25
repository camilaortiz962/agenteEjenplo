/*
 * Juego de memoria (flip cards) con las cartas de "heroes" (data.js).
 *
 * Adaptado de "cardGame" de Julian Bejarano:
 * https://codepen.io/julianbejarano/pen/myrzjBG
 *
 * The MIT License (MIT)
 * Copyright (c) 2026 Julian Bejarano
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// Máximo de pares por partida: con más héroes (creados en gestión) se
// eligen 8 al azar, para que el tablero no crezca sin límite.
const MAX_PAIRS = 8;

// --- Estado de la partida ---
let memoryDeck = [];          // héroes elegidos para esta partida (sin duplicar)
let firstCard = null;         // elemento de la primera carta volteada del turno
let secondCard = null;        // elemento de la segunda
let isChecking = false;       // bloquea clicks mientras se comparan dos cartas
let pairsFound = 0;
let attempts = 0;
let seconds = 0;
let timerInterval = null;
let currentPlayer = null;     // usuario logueado (lo pasa game.js)

const memoryBoard = document.getElementById("memoryBoard");
const memoryMessage = document.getElementById("memoryMessage");
const hudTimer = document.getElementById("hudTimer");
const hudAttempts = document.getElementById("hudAttempts");
const hudPairs = document.getElementById("hudPairs");
const hudBest = document.getElementById("hudBest");
const memoryVictory = document.getElementById("memoryVictory");

// --- Cronómetro ---
function formatTime(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return mm + ":" + ss;
}

function startTimer() {
  // Se limpia el anterior para que no queden dos intervalos corriendo a la vez.
  clearInterval(timerInterval);
  seconds = 0;
  hudTimer.textContent = "00:00";
  // setInterval ejecuta la función cada 1000 ms (1 segundo).
  timerInterval = setInterval(function() {
    seconds++;
    hudTimer.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// --- Mezcla (Fisher-Yates): recorre de atrás hacia adelante e intercambia
// cada elemento con uno al azar de los que quedan antes. Trabaja sobre una
// copia (slice) para no desordenar el arreglo original. ---
function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

// --- Mejor puntaje: se calcula a partir del historial "games" del usuario
// (guardado en userStore.js). No se guarda aparte: siempre sale del historial.

// ¿La partida "a" es mejor que "b"? Menos intentos gana; si empatan,
// gana la de menos tiempo.
function isBetterGame(a, b) {
  return a.attempts < b.attempts
    || (a.attempts === b.attempts && a.seconds < b.seconds);
}

// Recorre el historial y se queda con la mejor partida (o null si no hay).
// reduce va "acumulando" un solo resultado a partir de todo el arreglo:
// acá el acumulador es la mejor partida vista hasta el momento.
function getBestGame(games) {
  return games.reduce(function(best, game) {
    return !best || isBetterGame(game, best) ? game : best;
  }, null);
}

function showBestScore() {
  const best = getBestGame(currentPlayer.games);
  hudBest.textContent = best ? best.attempts + " / " + formatTime(best.seconds) : "--";
}

// --- Tablero ---
// Arma el contenido de una carta: el frente oculto es el dorso BTS y la
// cara es la foto del héroe con su nombre y HP. Si el héroe no tiene imagen
// (en gestión es opcional), se muestra su inicial en grande.
function createMemoryCard(hero, pairId) {
  const card = document.createElement("div");
  card.className = "memory-card";
  // dataset siempre guarda texto: pairId (un número) queda como "3", por eso
  // al comparar se comparan textos con textos.
  card.dataset.pairId = pairId;

  const face = hero.Image
    ? `<img src="${hero.Image}" alt="${hero.nombre}">`
    : `<div class="memory-initial">${hero.nombre.charAt(0)}</div>`;

  card.innerHTML = `
    <div class="memory-card-inner">
      <div class="memory-card-front">
        <img src="../img/bts-carta-atras.png" alt="Carta oculta">
      </div>
      <div class="memory-card-back">
        ${face}
        <div class="memory-card-info">
          <p class="memory-card-name">${hero.nombre}</p>
          <p class="memory-card-hp">HP ${hero.nivelDeFuerza}</p>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", function() {
    handleCardClick(card);
  });
  return card;
}

function renderBoard() {
  memoryBoard.innerHTML = "";

  // Se eligen hasta 8 héroes al azar y se usa su posición en "memoryDeck"
  // como id del par. No se usa "nombre" porque gestión permite crear dos
  // héroes con el mismo nombre, y habría 4 cartas que "coinciden".
  memoryDeck = shuffle(heroes).slice(0, MAX_PAIRS);

  if (memoryDeck.length < 2) {
    memoryMessage.textContent = "Se necesitan al menos 2 personajes para jugar. Crea más en gestión.";
    memoryMessage.hidden = false;
    return;
  }
  memoryMessage.hidden = true;

  // Cada héroe aparece dos veces (una por carta del par) y todo se mezcla.
  const cards = [];
  memoryDeck.forEach(function(hero, index) {
    cards.push({ hero: hero, pairId: index });
    cards.push({ hero: hero, pairId: index });
  });

  shuffle(cards).forEach(function(c) {
    memoryBoard.appendChild(createMemoryCard(c.hero, c.pairId));
  });

  startTimer();
}

// --- Lógica de un turno ---
function handleCardClick(card) {
  if (isChecking) return;
  if (card.classList.contains("flipped") || card.classList.contains("found")) return;

  card.classList.add("flipped");

  // Primera carta del turno: se guarda y se espera la segunda.
  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  attempts++;
  hudAttempts.textContent = attempts;
  isChecking = true;

  if (firstCard.dataset.pairId === secondCard.dataset.pairId) {
    handlePairFound();
  } else {
    // No coinciden: se dejan ver un momento y se vuelven a tapar.
    setTimeout(flipBack, 900);
  }
}

function handlePairFound() {
  firstCard.classList.add("found");
  secondCard.classList.add("found");
  pairsFound++;
  hudPairs.textContent = pairsFound + "/" + memoryDeck.length;
  clearSelection();

  if (pairsFound === memoryDeck.length) {
    stopTimer();
    setTimeout(showVictory, 500);
  }
}

function flipBack() {
  firstCard.classList.remove("flipped");
  secondCard.classList.remove("flipped");
  clearSelection();
}

function clearSelection() {
  firstCard = null;
  secondCard = null;
  isChecking = false;
}

// --- Victoria ---
// "async" porque guardar la partida pasa por loadUsers (que puede leer users.json).
async function showVictory() {
  // Se compara contra el récord ANTES de guardar esta partida en el historial.
  const previousBest = getBestGame(currentPlayer.games);
  const isRecord = !previousBest || isBetterGame({ attempts: attempts, seconds: seconds }, previousBest);

  // Guarda la partida en el historial del usuario y se queda con la versión
  // actualizada (con la partida nueva incluida) para el HUD.
  const updatedUser = await addGameToUser(currentPlayer.id, attempts, seconds);
  if (updatedUser) currentPlayer = updatedUser;
  showBestScore();

  document.getElementById("victoryTitle").textContent = isRecord
    ? "¡Nuevo récord, " + currentPlayer.alias + "!"
    : "¡Lo lograste, " + currentPlayer.alias + "!";
  document.getElementById("victoryTime").textContent = formatTime(seconds);
  document.getElementById("victoryAttempts").textContent = attempts;
  document.getElementById("victoryPairs").textContent = pairsFound + "/" + memoryDeck.length;

  memoryVictory.hidden = false;
}

// --- Reiniciar / arrancar ---
function resetGame() {
  memoryVictory.hidden = true;
  clearSelection();
  pairsFound = 0;
  attempts = 0;
  hudAttempts.textContent = "0";
  renderBoard();
  hudPairs.textContent = "0/" + memoryDeck.length;
}

// La llama game.js después de un login o registro exitoso.
function startMemoryGame(player) {
  currentPlayer = player;
  showBestScore();
  resetGame();
}

document.getElementById("btnRestart").addEventListener("click", resetGame);
document.getElementById("btnPlayAgain").addEventListener("click", resetGame);
