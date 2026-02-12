// ===== CONFIG FIREBASE - datele tale =====
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

// ===== STATE =====
let myId = null;
let myName = "";
let myRole = null; // "host" sau "guest"
let partyCode = null;

let lengths = [];
let revealed = [];
let wrongGuesses = 0;
let maxWrong = 7;
let gameOver = false;
let originalWord = "";
let secretWordNormalized = "";

// ===== DOM =====
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

const partyStatus = document.getElementById("party-status");

const secretWordInput = document.getElementById("secret-word-input");
const startGameBtn = document.getElementById("start-game-btn");

const gamePartyCodeEl = document.getElementById("game-party-code");
const gamePlayersList = document.getElementById("game-players-list");
const wrongCountSpan = document.getElementById("wrong-count");
const maxWrongSpan = document.getElementById("max-wrong");
const wordDisplay = document.getElementById("word-display");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");
const keyboard = document.getElementById("keyboard");
const gameMessage = document.getElementById("game-message");

// ===== Utilitare =====
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
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
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
  ch = ch.toLowerCase();
  return map[ch] || ch;
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of letters) {
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.textContent = ch;
    btn.dataset.letter = ch;
    btn.addEventListener("click", () => {
      if (myRole !== "guest" || gameOver) return;
      sendGuess(ch);
    });
    keyboard.appendChild(btn);
  }
}

function disableKeyboard() {
  keyboard.querySelectorAll("button").forEach((b) => (b.disabled = true));
}

function renderPlayersList(listEl, playersObj) {
  listEl.innerHTML = "";
  if (!playersObj) return;
  Object.values(playersObj).forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.role === "host" ? " (Host)" : "");
    listEl.appendChild(li);
  });
}

function renderWord() {
  wordDisplay.innerHTML = "";
  lengths.forEach((type, idx) => {
    const slot = document.createElement("div");
    if (type === "space") {
      slot.className = "letter-slot space";
      slot.textContent = "";
    } else if (type === "dash") {
      slot.className = "letter-slot dash";
      slot.textContent = "-";
    } else {
      slot.className = "letter-slot";
      const ch = revealed[idx];
      if (ch && ch !== " " && ch !== "-") {
        slot.textContent = ch.toUpperCase();
      }
    }
    wordDisplay.appendChild(slot);
  });
}

function buildKeyboardFromGuessed(guessedStr) {
  if (!keyboard.children.length) buildKeyboard();
  const guessed = guessedStr.split("").filter(Boolean);
  guessed.forEach((letter) => {
    const btn = Array.from(keyboard.querySelectorAll("button")).find(
      (b) => b.dataset.letter === letter
    );
    if (btn) {
      btn.disabled = true;
    }
  });
}

// ===== CREATE PARTY (Host) =====
createPartyBtn.addEventListener("click", async () => {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  myRole = "host";

  partyCode = randomPartyCode();
  const roomRef = db.ref("rooms/" + partyCode);

  await roomRef.set({
    hostId: myId,
    state: "lobby",
    maxWrong: 7,
    wrongGuesses: 0,
    guessedLetters: "",
    lengths: [],
    revealed: [],
    originalWord: "",
    secretWordNormalized: "",
    endMessage: "",
    players: {
      [myId]: {
        id: myId,
        name: myName,
        role: "host",
      },
    },
  });

  partyCodeDisplay.textContent = partyCode;
  partyStatus.textContent = "Party creat. Aștept să intre prietenul.";
  createPartyPanel.classList.remove("hidden");
  joinPartyPanel.classList.add("hidden");

  roomRef.on("value", (snap) => {
    const data = snap.val();
    if (!data) return;

    renderPlayersList(partyPlayersList, data.players);
    renderPlayersList(gamePlayersList, data.players);

    if (data.state === "playing" || data.state === "finished") {
      lengths = data.lengths || [];
      revealed = data.revealed || [];
      wrongGuesses = data.wrongGuesses || 0;
      maxWrong = data.maxWrong || 7;

      wrongCountSpan.textContent = wrongGuesses.toString();
      maxWrongSpan.textContent = maxWrong.toString();
      renderWord();

      showScreen(gameScreen);
      gamePartyCodeEl.textContent = partyCode;

      buildKeyboard();
      buildKeyboardFromGuessed(data.guessedLetters || "");

      if (data.state === "finished") {
        gameOver = true;
        gameMessage.textContent = data.endMessage || "Joc terminat.";
        if (data.endMessage && data.endMessage.startsWith("Bravo")) {
          gameMessage.classList.add("win");
        } else {
          gameMessage.classList.add("lose");
        }
        disableKeyboard();
      }
    }
  });
});

// ===== JOIN PARTY (Guest) =====
joinPartyBtn.addEventListener("click", () => {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  myRole = "guest";

  createPartyPanel.classList.add("hidden");
  joinPartyPanel.classList.remove("hidden");
  partyStatus.textContent = "Introdu codul de party și apasă Connect.";
});

joinCodeConfirmBtn.addEventListener("click", async () => {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    partyStatus.textContent = "Introdu un cod de party.";
    return;
  }
  partyCode = code;

  const roomRef = db.ref("rooms/" + partyCode);
  const snap = await roomRef.get();
  if (!snap.exists()) {
    partyStatus.textContent = "Party-ul nu există.";
    return;
  }
  const data = snap.val();
  if (data.state !== "lobby" && data.state !== "playing") {
    partyStatus.textContent = "Acest party nu mai este disponibil.";
    return;
  }

  await roomRef.child("players/" + myId).set({
    id: myId,
    name: myName,
    role: "guest",
  });

  partyStatus.textContent = "Conectat! Așteptăm host-ul / jocul.";
  showScreen(gameScreen);
  gamePartyCodeEl.textContent = partyCode;

  roomRef.on("value", (snap2) => {
    const d = snap2.val();
    if (!d) return;

    renderPlayersList(gamePlayersList, d.players);

    lengths = d.lengths || [];
    revealed = d.revealed || [];
    wrongGuesses = d.wrongGuesses || 0;
    maxWrong = d.maxWrong || 7;

    wrongCountSpan.textContent = wrongGuesses.toString();
    maxWrongSpan.textContent = maxWrong.toString();
    renderWord();

    buildKeyboard();
    buildKeyboardFromGuessed(d.guessedLetters || "");

    if (d.state === "playing") {
      gameMessage.textContent = "Jocul a început, poți ghici litere!";
      gameOver = false;
    } else if (d.state === "finished") {
      gameOver = true;
      gameMessage.textContent = d.endMessage || "Joc terminat.";
      if (d.endMessage && d.endMessage.startsWith("Bravo")) {
        gameMessage.classList.add("win");
      } else {
        gameMessage.classList.add("lose");
      }
      disableKeyboard();
    }
  });
});

// ===== HOST: Start Game =====
startGameBtn.addEventListener("click", async () => {
  if (myRole !== "host" || !partyCode) return;
  const word = secretWordInput.value.trim();
  if (!word) {
    partyStatus.textContent = "Introdu un cuvânt / expresie.";
    return;
  }

  originalWord = word;
  const letters = Array.from(word);
  lengths = letters.map((ch) => {
    if (ch === " ") return "space";
    if (ch === "-") return "dash";
    return "letter";
  });
  revealed = letters.map((ch) => {
    if (ch === " ") return " ";
    if (ch === "-") return "-";
    return null;
  });
  secretWordNormalized = letters.map(normalizeLetter).join("");
  wrongGuesses = 0;
  maxWrong = 7;
  gameOver = false;

  const roomRef = db.ref("rooms/" + partyCode);
  await roomRef.update({
    state: "playing",
    maxWrong,
    wrongGuesses,
    lengths,
    revealed,
    guessedLetters: "",
    originalWord,
    secretWordNormalized,
    endMessage: "",
  });

  partyStatus.textContent = "Joc pornit!";
});

// ===== GUEST: ghicit literă =====
function sendGuess(ch) {
  if (myRole !== "guest" || !partyCode || gameOver) return;
  ch = ch.toUpperCase();
  if (!/^[A-ZĂÂÎȘŞȚŢ]$/.test(ch)) return;

  const roomRef = db.ref("rooms/" + partyCode);

  roomRef.transaction((room) => {
    if (!room || room.state !== "playing") return room;

    const letter = ch;
    const norm = normalizeLetter(letter);
    const normalizedSecret = room.secretWordNormalized || "";

    let guessed = room.guessedLetters || "";
    if (guessed.includes(letter)) {
      return room; // deja ghicită
    }
    guessed += letter;

    const secretArr = Array.from(normalizedSecret);
    const revealedArr = Array.isArray(room.revealed)
      ? [...room.revealed]
      : [];
    const origArr = Array.from(room.originalWord || "");

    let found = false;
    if (secretArr.length && origArr.length) {
      secretArr.forEach((c, idx) => {
        if (c === norm && revealedArr[idx] === null) {
          revealedArr[idx] = origArr[idx];
          found = true;
        }
      });
    }

    let wrong = room.wrongGuesses || 0;
    if (!found) wrong++;

    const isWin = revealedArr.length
      ? revealedArr.every((v, idx) => {
          if (
            room.lengths[idx] === "space" ||
            room.lengths[idx] === "dash"
          )
            return true;
          return v !== null;
        })
      : false;
    const isLose = wrong >= (room.maxWrong || 7);

    let endMessage = room.endMessage || "";
    let state = room.state;

    if (isWin) {
      state = "finished";
      endMessage = "Bravo! Cuvânt ghicit!";
    } else if (isLose) {
      state = "finished";
      endMessage = `Ai pierdut. Cuvântul era: "${room.originalWord}".`;
    }

    return {
      ...room,
      guessedLetters: guessed,
      revealed: revealedArr,
      wrongGuesses: wrong,
      state,
      endMessage,
    };
  });
}

// guess prin input
guessBtn.addEventListener("click", () => {
  const ch = letterInput.value.trim();
  if (!ch) return;
  sendGuess(ch[0]);
  letterInput.value = "";
  letterInput.focus();
});

letterInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    guessBtn.click();
  }
});

// copiere cod party
copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(partyCodeDisplay.textContent);
    partyStatus.textContent = "Cod copiat!";
  } catch {
    partyStatus.textContent = "Nu am putut copia codul.";
  }
});