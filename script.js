// =======================
// Firebase config (AL TĂU)
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyCLJDyC8iLxQjsK6VrrMOtzj5ukfmuARC8",
  authDomain: "spanzuratoarea-online.firebaseapp.com",
  databaseURL:
    "https://spanzuratoarea-online-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spanzuratoarea-online",
  storageBucket: "spanzuratoarea-online.firebasestorage.app",
  messagingSenderId: "698255636308",
  appId: "1:698255636308:web:225201554f9fadd634bac1",
  measurementId: "G-MNBDW17ZL3",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =======================
// Config joc
// =======================
const MAX_WRONG = 7;
const BODY_PARTS = [
  "part-head",
  "part-body",
  "part-arm-left",
  "part-arm-right",
  "part-leg-left",
  "part-leg-right",
  "part-hat",
];

// Sugestii ușoare (poți adăuga oricâte)
const EASY_WORDS = [
  "masa",
  "scaun",
  "telefon",
  "caiet",
  "pix",
  "apa",
  "lapte",
  "soare",
  "luna",
  "floare",
  "copac",
  "minge",
  "pisica",
  "caine",
  "mere",
  "banane",
  "portocală",
  "cartof",
  "paine",
  "zambet",
];

// =======================
// State local
// =======================
let myId = null;
let myName = "";
let partyCode = null;
let roomRef = null;
let unsubscribed = false;

// =======================
// DOM
// =======================
const partyScreen = document.getElementById("party-screen");
const gameScreen = document.getElementById("game-screen");

const playerNameInput = document.getElementById("player-name-input");
const createPartyBtn = document.getElementById("create-party-btn");
const joinPartyBtn = document.getElementById("join-party-btn");

const createPartyPanel = document.getElementById("create-party-panel");
const joinPartyPanel = document.getElementById("join-party-panel");

const partyCodeDisplay = document.getElementById("party-code-display");
const copyCodeBtn = document.getElementById("copy-code-btn");
const partyPlayersList = document.getElementById("party-players-list");

const joinCodeInput = document.getElementById("join-code-input");
const joinCodeConfirmBtn = document.getElementById("join-code-confirm-btn");
const expireMinutesSelect = document.getElementById("expire-minutes-select");
const roundsSelect = document.getElementById("rounds-select");
const partySettingsSummary = document.getElementById("party-settings-summary");

const partyStatus = document.getElementById("party-status");

// game screen
const gamePartyCodeEl = document.getElementById("game-party-code");
const roundNumberEl = document.getElementById("round-number");
const chooserNameEl = document.getElementById("chooser-name");
const guesserNameEl = document.getElementById("guesser-name");
const gamePlayersList = document.getElementById("game-players-list");

const wrongCountSpan = document.getElementById("wrong-count");
const maxWrongSpan = document.getElementById("max-wrong");
const wordDisplay = document.getElementById("word-display");
const gameMessage = document.getElementById("game-message");

const chooserBox = document.getElementById("chooser-box");
const guesserBox = document.getElementById("guesser-box");

const suggestionChips = document.getElementById("suggestion-chips");
const randomSuggestionBtn = document.getElementById("random-suggestion-btn");
const secretWordInput = document.getElementById("secret-word-input");
const setWordBtn = document.getElementById("set-word-btn");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");
const keyboard = document.getElementById("keyboard");

const forceNextRoundBtn = document.getElementById("force-next-round-btn");

// =======================
// Utils
// =======================
function showScreen(screen) {
  [partyScreen, gameScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function randomPartyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function normalizeLetter(ch) {
  const map = {
    ă: "a",
    â: "a",
    î: "i",
    ș: "s",
    ş: "s",
    ț: "t",
    ţ: "t",
  };
  ch = (ch || "").toLowerCase();
  return map[ch] || ch;
}

function renderPlayersList(listEl, playersObj) {
  listEl.innerHTML = "";
  if (!playersObj) return;
  Object.values(playersObj).forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.id === playersObj[p.id]?.hostId ? "" : "");
    listEl.appendChild(li);
  });
}

function setPlayersUI(playersObj, chooserId, guesserId) {
  renderPlayersList(partyPlayersList, playersObj);
  renderPlayersList(gamePlayersList, playersObj);

  const chooser = playersObj?.[chooserId];
  const guesser = playersObj?.[guesserId];
  chooserNameEl.textContent = chooser ? chooser.name : "(?)";
  guesserNameEl.textContent = guesser ? guesser.name : "(?)";
}

function buildSuggestionChips() {
  suggestionChips.innerHTML = "";
  EASY_WORDS.slice(0, 12).forEach((w) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = w;
    chip.addEventListener("click", () => {
      secretWordInput.value = w;
      secretWordInput.focus();
    });
    suggestionChips.appendChild(chip);
  });
}

function pickRandomEasyWord() {
  return EASY_WORDS[Math.floor(Math.random() * EASY_WORDS.length)];
}

function renderWord(lengths, revealed) {
  wordDisplay.innerHTML = "";
  (lengths || []).forEach((type, idx) => {
    const slot = document.createElement("div");
    if (type === "space") {
      slot.className = "letter-slot space";
      slot.textContent = "";
    } else if (type === "dash") {
      slot.className = "letter-slot dash";
      slot.textContent = "-";
    } else {
      slot.className = "letter-slot";
      const ch = revealed?.[idx];
      slot.textContent = ch ? ch.toUpperCase() : "";
      if (ch) slot.classList.add("correct");
    }
    wordDisplay.appendChild(slot);
  });
}

function resetHangman() {
  BODY_PARTS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("show");
    }
  });
}

function showHangmanParts(count) {
  resetHangman();
  for (let i = 0; i < Math.min(count, MAX_WRONG); i++) {
    const id = BODY_PARTS[i];
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("hidden");
      el.classList.add("show");
    }
  }
}

function buildKeyboard(disabledLetters = "", correctnessMap = {}) {
  keyboard.innerHTML = "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of letters) {
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.textContent = ch;
    btn.dataset.letter = ch;

    if (disabledLetters.includes(ch)) {
      btn.disabled = true;
      const st = correctnessMap[ch];
      if (st === "correct") btn.classList.add("correct");
      if (st === "wrong") btn.classList.add("wrong");
    }

    btn.addEventListener("click", () => {
      if (!partyCode || !roomRef) return;
      sendGuess(ch);
    });

    keyboard.appendChild(btn);
  }
}

// =======================
// Party create/join
// =======================
createPartyBtn.addEventListener("click", async () => {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  const expireMinutes = Number(expireMinutesSelect.value) || 10;
  const totalRounds = Number(roundsSelect.value) || 7;

  partyCode = randomPartyCode();
  roomRef = db.ref("rooms/" + partyCode);

  // IMPORTANT: primul GUESSER este HOST-ul (cerința ta)
  // => la început chooser = primul guest care intră, guesser = host
  await roomRef.set({
    createdAt: Date.now(),
    expiresAt: Date.now() + expireMinutes * 60 * 1000,
    expireMinutes,
    totalRounds,
    round: 1,
    state: "lobby", // lobby | choosing | playing | finished
    maxWrong: MAX_WRONG,

    hostId: myId,
    chooserId: null,     // devine guest când intră
    guesserId: myId,     // host ghicește primul

    // round state
    originalWord: "",
    secretNormalized: "",
    lengths: [],
    revealed: [],
    wrongGuesses: 0,
    guessedLetters: "",
    letterStatus: {}, // { "A": "wrong"|"correct" }
    endMessage: "",
    messageType: "",

    players: {
      [myId]: { id: myId, name: myName },
    },
  });

  partyCodeDisplay.textContent = partyCode;
  partySettingsSummary.textContent = `Expiră în ${expireMinutes} minute • ${totalRounds} runde`;
  createPartyPanel.classList.remove("hidden");
  joinPartyPanel.classList.add("hidden");
  partyStatus.textContent = "Party creat. Trimite codul prietenului tău.";

  attachRoomListener();
});

joinPartyBtn.addEventListener("click", () => {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  joinPartyPanel.classList.remove("hidden");
  createPartyPanel.classList.add("hidden");
  partyStatus.textContent = "Introdu codul și apasă Connect.";
});

joinCodeConfirmBtn.addEventListener("click", async () => {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    partyStatus.textContent = "Introdu un cod.";
    return;
  }

  partyCode = code;
  roomRef = db.ref("rooms/" + partyCode);

  const snap = await roomRef.get();
  if (!snap.exists()) {
    partyStatus.textContent = "Party-ul nu există.";
    return;
  }
  const room = snap.val();
  if (room?.expiresAt && Date.now() > room.expiresAt) {
    partyStatus.textContent = "Party-ul a expirat.";
    return;
  }

  // Add player
  await roomRef.child("players/" + myId).set({ id: myId, name: myName });

  // Dacă încă nu există chooserId, acesta guest devine chooser (alege cuvântul)
  await roomRef.transaction((room) => {
    if (!room) return room;
    if (!room.chooserId) {
      room.chooserId = myId;
      // imediat după ce avem chooser+guesser, intrăm în choosing
      room.state = "choosing";
    }
    return room;
  });

  partyStatus.textContent = "Conectat!";
  attachRoomListener();
});

// =======================
// Listener room (sincronizare UI)
// =======================
function attachRoomListener() {
  if (!roomRef) return;
  unsubscribed = false;

  roomRef.on("value", (snap) => {
    const room = snap.val();
    if (!room) return;
    if (room.expiresAt && Date.now() > room.expiresAt) {
      showScreen(partyScreen);
      partyStatus.textContent = "Party-ul a expirat. Creează unul nou.";
      return;
    }

    showScreen(gameScreen);
    gamePartyCodeEl.textContent = partyCode;
    roundNumberEl.textContent = String(room.round || 1);

    // players
    setPlayersUI(room.players || {}, room.chooserId, room.guesserId);

    // status hangman + word
    wrongCountSpan.textContent = String(room.wrongGuesses || 0);
    maxWrongSpan.textContent = String(room.maxWrong || MAX_WRONG);
    showHangmanParts(room.wrongGuesses || 0);
    renderWord(room.lengths || [], room.revealed || []);

    // message
    gameMessage.className = "message";
    gameMessage.textContent = room.endMessage || "";
    if (room.messageType === "correct") {
      gameMessage.classList.add("correct");
    } else if (room.messageType === "wrong") {
      gameMessage.classList.add("lose");
    }

    // UI by role & state
    const isChooser = room.chooserId === myId;
    const isGuesser = room.guesserId === myId;

    // build suggestions once
    buildSuggestionChips();

    // chooser UI
    chooserBox.classList.toggle("hidden", !(room.state === "choosing" && isChooser));
    // guesser UI
    guesserBox.classList.toggle("hidden", !(room.state === "playing" && isGuesser));

    // Keyboard state for everyone (show it only for guesser but we still compute)
    const guessedLetters = room.guessedLetters || "";
    const letterStatus = room.letterStatus || {};
    if (room.state === "playing" && isGuesser) {
      buildKeyboard(guessedLetters, letterStatus);
      letterInput.disabled = false;
      guessBtn.disabled = false;
    } else {
      keyboard.innerHTML = "";
      letterInput.disabled = true;
      guessBtn.disabled = true;
    }

    // If finished, allow host to force next round (optional)
    const isHost = room.hostId === myId;
    forceNextRoundBtn.classList.toggle("hidden", !(room.state === "finished" && isHost && !room.gameCompleted));
  });
}

// =======================
// Chooser: set word
// =======================
randomSuggestionBtn.addEventListener("click", () => {
  secretWordInput.value = pickRandomEasyWord();
  secretWordInput.focus();
});

setWordBtn.addEventListener("click", async () => {
  if (!roomRef) return;

  const word = (secretWordInput.value || "").trim();
  if (!word) {
    gameMessage.textContent = "Introdu un cuvânt.";
    return;
  }

  const letters = Array.from(word);
  const lengths = letters.map((ch) => (ch === " " ? "space" : ch === "-" ? "dash" : "letter"));
  const revealed = letters.map((ch) => (ch === " " ? " " : ch === "-" ? "-" : null));
  const normalized = letters.map(normalizeLetter).join("");

  await roomRef.update({
    originalWord: word,
    secretNormalized: normalized,
    lengths,
    revealed,
    wrongGuesses: 0,
    guessedLetters: "",
    letterStatus: {},
    endMessage: "Jocul a început! Guesser ghicește litere.",
    messageType: "",
    state: "playing",
  });

  secretWordInput.value = "";
});

// =======================
// Guesser: guess letter (FIX: chiar trimite și actualizează DB)
// =======================
function sendGuess(letter) {
  if (!roomRef) return;

  // IMPORTANT: doar guesser are voie să ghicească
  roomRef.transaction((room) => {
    if (!room) return room;
    if (room.state !== "playing") return room;
    if (room.guesserId !== myId) return room;

    const L = String(letter || "").toUpperCase();
    if (!/^[A-Z]$/.test(L)) return room;

    let guessed = room.guessedLetters || "";
    const statusMap = room.letterStatus || {};

    if (guessed.includes(L)) return room; // deja ghicit

    guessed += L;

    const norm = normalizeLetter(L);
    const secret = room.secretNormalized || "";
    const orig = room.originalWord || "";

    const secretArr = Array.from(secret);
    const origArr = Array.from(orig);
    const revealedArr = Array.isArray(room.revealed) ? [...room.revealed] : [];

    let found = false;
    for (let i = 0; i < secretArr.length; i++) {
      if (secretArr[i] === norm && revealedArr[i] === null) {
        revealedArr[i] = origArr[i];
        found = true;
      }
    }

    let wrong = room.wrongGuesses || 0;
    if (!found) wrong++;

    statusMap[L] = found ? "correct" : "wrong";

    // win/lose check
    const lengths = room.lengths || [];
    const isWin =
      revealedArr.length &&
      revealedArr.every((v, idx) => {
        if (lengths[idx] === "space" || lengths[idx] === "dash") return true;
        return v !== null;
      });

    const isLose = wrong >= (room.maxWrong || MAX_WRONG);

    let state = room.state;
    let endMessage = room.endMessage || "";
    let messageType = "";

    if (isWin) {
      state = "finished";
      endMessage = "Guesser a câștigat! Se schimbă rolurile...";
    } else if (isLose) {
      state = "finished";
      endMessage = `Guesser a pierdut! Cuvântul era: "${room.originalWord}". Se schimbă rolurile...`;
    } else {
      endMessage = found ? `Litera corectă aleasă: ${L}` : `Literă greșită: ${L}`;
      messageType = found ? "correct" : "wrong";
    }

    return {
      ...room,
      guessedLetters: guessed,
      letterStatus: statusMap,
      revealed: revealedArr,
      wrongGuesses: wrong,
      state,
      endMessage,
      messageType,
    };
  }).then(async (result) => {
    // Dacă s-a terminat runda, facem swap automat (o singură dată)
    // folosim o tranzacție separată ca să evităm conflicte
    if (!result?.snapshot?.exists()) return;
    const room = result.snapshot.val();
    if (!room) return;

    if (room.state === "finished") {
      // swap roles
      await swapRolesAndPrepareNextRound();
    }
  });
}

// guess via input
guessBtn.addEventListener("click", () => {
  const ch = (letterInput.value || "").trim();
  if (!ch) return;
  sendGuess(ch[0].toUpperCase());
  letterInput.value = "";
  letterInput.focus();
});

letterInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    guessBtn.click();
  }
});

// =======================
// Swap roles after finish
// =======================
async function swapRolesAndPrepareNextRound() {
  if (!roomRef) return;

  // tranzacție: dacă deja am făcut swap pentru această rundă, nu îl mai facem
  await roomRef.transaction((room) => {
    if (!room) return room;
    if (room.state !== "finished") return room;

    // marker: lastSwappedRound
    const currentRound = room.round || 1;
    const totalRounds = room.totalRounds || 7;
    if (currentRound >= totalRounds) {
      room.gameCompleted = true;
      room.endMessage = `Joc încheiat! S-au jucat ${totalRounds} runde.`;
      room.messageType = "";
      return room;
    }
    if (room.lastSwappedRound === currentRound) {
      return room; // deja swap-uit
    }

    const oldChooser = room.chooserId;
    const oldGuesser = room.guesserId;

    // swap
    room.chooserId = oldGuesser; // guesser devine chooser
    room.guesserId = oldChooser; // chooser devine guesser
    room.round = currentRound + 1;

    // pregătim noua rundă
    room.state = "choosing";
    room.originalWord = "";
    room.secretNormalized = "";
    room.lengths = [];
    room.revealed = [];
    room.wrongGuesses = 0;
    room.guessedLetters = "";
    room.letterStatus = {};
    room.endMessage = "Rundă nouă! Chooser alege un cuvânt.";
    room.messageType = "";
    room.lastSwappedRound = currentRound;

    return room;
  });
}

// host can force next round if needed
forceNextRoundBtn.addEventListener("click", async () => {
  await swapRolesAndPrepareNextRound();
});

// copy party code
copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(partyCodeDisplay.textContent);
    partyStatus.textContent = "Cod copiat!";
  } catch {
    partyStatus.textContent = "Nu am putut copia codul.";
  }
});
