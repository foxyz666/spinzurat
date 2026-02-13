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

const LOBBY_COUNTDOWN_MS = 5000;

// Sugestii ușoare
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

let countdownInterval = null;

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
    li.textContent = p.name;
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
  // FIX: dacă elementele nu există (de ex. încă ești în lobby), nu crăpa
  if (!suggestionChips || !secretWordInput) return;

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
      const ch = revealed?.[idx] || "";
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

    if ((disabledLetters || "").includes(ch)) {
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

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
}

function startCountdown(endsAt) {
  stopCountdown();
  countdownInterval = setInterval(() => {
    const leftMs = endsAt - Date.now();
    const leftSec = Math.max(0, Math.ceil(leftMs / 1000));
    partyStatus.textContent = `Jocul începe în ${leftSec} secunde...`;
    if (leftMs <= 0) stopCountdown();
  }, 200);
}

// =======================
// Party create/join
// =======================
createPartyBtn.addEventListener("click", async () => {
  try {
    myName = playerNameInput.value.trim() || "Anon";
    myId = myId || randomId();

    const expireMinutes = Number(expireMinutesSelect.value) || 10;
    const totalRounds = Number(roundsSelect.value) || 7;

    partyCode = randomPartyCode();
    roomRef = db.ref("rooms/" + partyCode);

    await roomRef.set({
      createdAt: Date.now(),
      expiresAt: Date.now() + expireMinutes * 60 * 1000,
      expireMinutes,
      totalRounds,
      round: 1,

      state: "lobby", // lobby | choosing | playing | finished
      countdownEndsAt: null,

      maxWrong: MAX_WRONG,
      hostId: myId,

      chooserId: null, // primul guest devine chooser
      guesserId: myId, // host ghicește primul

      // round state
      originalWord: "",
      secretNormalized: "",
      lengths: [],
      revealed: [], // string[] ("" = ascuns)
      wrongGuesses: 0,
      guessedLetters: "",
      letterStatus: {},

      endMessage: "Lobby creat. Așteaptă încă un jucător...",
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

    showScreen(partyScreen);
    attachRoomListener();
  } catch (err) {
    console.error(err);
    partyStatus.textContent = "Eroare Create Party: " + (err?.message || String(err));
  }
});

joinPartyBtn.addEventListener("click", () => {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  joinPartyPanel.classList.remove("hidden");
  createPartyPanel.classList.add("hidden");
  partyStatus.textContent = "Introdu codul și apasă Connect.";
});

joinCodeConfirmBtn.addEventListener("click", async () => {
  try {
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

    await roomRef.child("players/" + myId).set({ id: myId, name: myName });

    await roomRef.transaction((r) => {
      if (!r) return r;
      if (!r.chooserId) r.chooserId = myId; // primul guest devine chooser
      r.state = "lobby";
      return r;
    });

    partyStatus.textContent = "Conectat! Așteaptă startul...";
    showScreen(partyScreen);

    attachRoomListener();
  } catch (err) {
    console.error(err);
    partyStatus.textContent = "Eroare Join: " + (err?.message || String(err));
  }
});

// =======================
// Listener room
// =======================
function attachRoomListener() {
  if (!roomRef) return;

  roomRef.on("value", (snap) => {
    const room = snap.val();
    if (!room) return;

    if (room.expiresAt && Date.now() > room.expiresAt) {
      stopCountdown();
      showScreen(partyScreen);
      partyStatus.textContent = "Party-ul a expirat. Creează unul nou.";
      return;
    }

    const playersCount = room.players ? Object.keys(room.players).length : 0;
    const isHost = room.hostId === myId;

    // LOBBY
    if (room.state === "lobby") {
      showScreen(partyScreen);

      renderPlayersList(partyPlayersList, room.players || {});
      partyCodeDisplay.textContent = partyCode || "";

      if (playersCount < 2) {
        stopCountdown();
        partyStatus.textContent = "Lobby: așteaptă încă un jucător...";
      } else {
        // host pornește countdown o singură dată
        if (isHost && !room.countdownEndsAt) {
          roomRef.update({
            countdownEndsAt: Date.now() + LOBBY_COUNTDOWN_MS,
            endMessage: "Jocul începe în 5 secunde...",
            messageType: "",
          });
        }

        if (room.countdownEndsAt) {
          startCountdown(room.countdownEndsAt);
          const left = room.countdownEndsAt - Date.now();
          if (left <= 0 && isHost) {
            roomRef.update({
              state: "choosing",
              countdownEndsAt: null,
              endMessage: "Chooser alege cuvântul.",
              messageType: "",
            });
          }
        }
      }

      return;
    }

    // GAME
    stopCountdown();
    showScreen(gameScreen);

    gamePartyCodeEl.textContent = partyCode;
    roundNumberEl.textContent = String(room.round || 1);

    setPlayersUI(room.players || {}, room.chooserId, room.guesserId);

    wrongCountSpan.textContent = String(room.wrongGuesses || 0);
    maxWrongSpan.textContent = String(room.maxWrong || MAX_WRONG);
    showHangmanParts(room.wrongGuesses || 0);
    renderWord(room.lengths || [], room.revealed || []);

    // message
    gameMessage.className = "message";
    gameMessage.textContent = room.endMessage || "";
    if (room.messageType === "correct") gameMessage.classList.add("correct");
    if (room.messageType === "wrong") gameMessage.classList.add("lose");

    const isChooser = room.chooserId === myId;
    const isGuesser = room.guesserId === myId;

    // build chips only when needed
    if (room.state === "choosing" && isChooser) buildSuggestionChips();

    chooserBox.classList.toggle("hidden", !(room.state === "choosing" && isChooser));
    guesserBox.classList.toggle("hidden", !(room.state === "playing" && isGuesser));

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

    forceNextRoundBtn.classList.toggle("hidden", !(room.state === "finished" && isHost && !room.gameCompleted));
  });
}

// =======================
// Chooser: set word (FIX: Firebase-safe revealed = "" not null)
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

  // "" = ascuns (nu null) => nu se strică în Firebase
  const revealed = letters.map((ch) => {
    if (ch === " ") return " ";
    if (ch === "-") return "-";
    return "";
  });

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
// Guesser: guess letter (FIX: compare vs secretNormalized + revealed "" )
// =======================
function sendGuess(letter) {
  if (!roomRef) return;

  roomRef.transaction((room) => {
    if (!room) return room;
    if (room.state !== "playing") return room;
    if (room.guesserId !== myId) return room;

    const L = String(letter || "").toUpperCase();
    if (!/^[A-Z]$/.test(L)) return room;

    let guessed = room.guessedLetters || "";
    const statusMap = room.letterStatus || {};
    if (guessed.includes(L)) return room;

    guessed += L;

    const norm = normalizeLetter(L);
    const secret = String(room.secretNormalized || "");
    const original = String(room.originalWord || "");

    const secretArr = Array.from(secret);
    const origArr = Array.from(original);

    // ensure revealed length matches secret
    const revealedArr = Array.isArray(room.revealed) ? [...room.revealed] : [];
    while (revealedArr.length < secretArr.length) revealedArr.push("");

    let found = false;
    for (let i = 0; i < secretArr.length; i++) {
      const alreadyShown = typeof revealedArr[i] === "string" && revealedArr[i].length > 0;
      if (secretArr[i] === norm && !alreadyShown) {
        revealedArr[i] = origArr[i]; // show original char
        found = true;
      }
    }

    let wrong = room.wrongGuesses || 0;
    if (!found) wrong++;

    statusMap[L] = found ? "correct" : "wrong";

    // win check: all letter slots are revealed (not empty)
    const lengths = room.lengths || [];
    const isWin =
      lengths.length === secretArr.length &&
      lengths.every((t, idx) => {
        if (t === "space" || t === "dash") return true;
        return typeof revealedArr[idx] === "string" && revealedArr[idx].length > 0;
      });

    const isLose = wrong >= (room.maxWrong || MAX_WRONG);

    let state = room.state;
    let endMessage = room.endMessage || "";
    let messageType = "";

    if (isWin) {
      state = "finished";
      endMessage = "Guesser a câștigat! Se schimbă rolurile...";
      messageType = "correct";
    } else if (isLose) {
      state = "finished";
      endMessage = `Guesser a pierdut! Cuvântul era: "${room.originalWord}".`;
      messageType = "wrong";
    } else {
      endMessage = found ? `Corect: ${L}` : `Greșit: ${L}`;
      messageType = found ? "correct" : "wrong";
    }

    room.guessedLetters = guessed;
    room.letterStatus = statusMap;
    room.revealed = revealedArr;
    room.wrongGuesses = wrong;
    room.state = state;
    room.endMessage = endMessage;
    room.messageType = messageType;

    return room;
  }).then(async (res) => {
    if (!res?.snapshot?.exists()) return;
    const room = res.snapshot.val();
    if (room?.state === "finished") {
      // swap roles automatically after finish
      await swapRolesAndPrepareNextRound();
    }
  });
}

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

  await roomRef.transaction((room) => {
    if (!room) return room;
    if (room.state !== "finished") return room;

    const currentRound = room.round || 1;
    const totalRounds = room.totalRounds || 7;

    if (currentRound >= totalRounds) {
      room.gameCompleted = true;
      room.endMessage = `Joc încheiat! S-au jucat ${totalRounds} runde.`;
      room.messageType = "";
      return room;
    }

    if (room.lastSwappedRound === currentRound) return room;

    const oldChooser = room.chooserId;
    const oldGuesser = room.guesserId;

    room.chooserId = oldGuesser;
    room.guesserId = oldChooser;
    room.round = currentRound + 1;

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

forceNextRoundBtn.addEventListener("click", async () => {
  await swapRolesAndPrepareNextRound();
});

// copy code (clipboard poate fi blocat în unele contexte; dacă dă eroare, doar ignorăm)
copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(partyCodeDisplay.textContent);
    partyStatus.textContent = "Cod copiat!";
  } catch (e) {
    console.warn(e);
    partyStatus.textContent = "Nu am putut copia (browserul a blocat).";
  }
});