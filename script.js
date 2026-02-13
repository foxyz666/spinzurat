// =======================
// Firebase config (AL TĂU)
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyCLJDyC8iLxQjsK6VrrMOtzj5ukfmuARC8",
  authDomain: "spanzuratoarea-online.firebaseapp.com",
  databaseURL: "https://spanzuratoarea-online-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spanzuratoarea-online",
  storageBucket: "spanzuratoarea-online.firebasestorage.app",
  messagingSenderId: "698255636308",
  appId: "1:698255636308:web:225201554f9fadd634bac1",
  measurementId: "G-MNBDW17ZL3",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =======================
// Game constants
// =======================
const MAX_WRONG = 7;
const PART_IDS = ["p0", "p1", "p2", "p3", "p4", "p5"];
const LOBBY_COUNTDOWN_MS = 5000;

// =======================
// Helpers
// =======================
function rid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function partyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function normalizeChar(ch) {
  const map = { "ă": "a", "â": "a", "î": "i", "ș": "s", "ş": "s", "ț": "t", "ţ": "t" };
  ch = (ch || "").toLowerCase();
  return map[ch] || ch;
}
function isAZ(ch) {
  return /^[A-Z]$/.test(ch);
}
function now() {
  return Date.now();
}

// =======================
// DOM
// =======================
const lobbyScreen = document.getElementById("lobby-screen");
const gameScreen = document.getElementById("game-screen");

const nameInput = document.getElementById("name-input");
const expireSelect = document.getElementById("expire-select");
const roundsSelect = document.getElementById("rounds-select");

const createBtn = document.getElementById("create-btn");
const showJoinBtn = document.getElementById("show-join-btn");
const joinPanel = document.getElementById("join-panel");
const joinCodeInput = document.getElementById("join-code-input");
const joinBtn = document.getElementById("join-btn");

const hostPanel = document.getElementById("host-panel");
const codeEl = document.getElementById("code-el");
const copyBtn = document.getElementById("copy-btn");

const playersList = document.getElementById("players-list");
const lobbyStatus = document.getElementById("lobby-status");

const gameCode = document.getElementById("game-code");
const roundEl = document.getElementById("round-el");
const chooserEl = document.getElementById("chooser-el");
const guesserEl = document.getElementById("guesser-el");
const gamePlayers = document.getElementById("game-players");

const wrongEl = document.getElementById("wrong-el");
const maxwrongEl = document.getElementById("maxwrong-el");

const wordEl = document.getElementById("word");
const msgEl = document.getElementById("msg");

const chooserBox = document.getElementById("chooser-box");
const guesserBox = document.getElementById("guesser-box");
const wordInput = document.getElementById("word-input");
const setWordBtn = document.getElementById("set-word-btn");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");
const keyboard = document.getElementById("keyboard");

const nextRoundBtn = document.getElementById("next-round-btn");

// =======================
// App state
// =======================
let myId = null;
let myName = null;
let code = null;
let ref = null;

let countdownTimer = null;

function show(screen) {
  [lobbyScreen, gameScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function setStatus(el, text, cls = "") {
  el.className = "status" + (cls ? ` ${cls}` : "");
  el.textContent = text || "";
}

function renderPlayers(ul, playersObj) {
  ul.innerHTML = "";
  const arr = playersObj ? Object.values(playersObj) : [];
  for (const p of arr) {
    const li = document.createElement("li");
    li.textContent = p.name;
    ul.appendChild(li);
  }
}

function renderWord(lengths, revealed) {
  wordEl.innerHTML = "";
  for (let i = 0; i < (lengths || []).length; i++) {
    const t = lengths[i];
    const d = document.createElement("div");
    if (t === "space") {
      d.className = "slot space";
      d.textContent = "";
    } else if (t === "dash") {
      d.className = "slot dash";
      d.textContent = "-";
    } else {
      d.className = "slot";
      const ch = revealed?.[i] || "";
      d.textContent = ch ? ch.toUpperCase() : "";
    }
    wordEl.appendChild(d);
  }
}

function renderHangman(wrong) {
  PART_IDS.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("show", idx < wrong);
  });
}

function buildKeyboard(guessed = "", status = {}) {
  keyboard.innerHTML = "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of letters) {
    const b = document.createElement("button");
    b.className = "key";
    b.textContent = ch;
    if ((guessed || "").includes(ch)) {
      b.disabled = true;
      if (status[ch] === "correct") b.classList.add("correct");
      if (status[ch] === "wrong") b.classList.add("wrong");
    }
    b.addEventListener("click", () => sendGuess(ch));
    keyboard.appendChild(b);
  }
}

function stopCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

function startCountdownUI(endsAt) {
  stopCountdown();
  countdownTimer = setInterval(() => {
    const left = endsAt - now();
    const sec = Math.max(0, Math.ceil(left / 1000));
    setStatus(lobbyStatus, `Jocul începe în ${sec} secunde...`);
    if (left <= 0) stopCountdown();
  }, 200);
}

// =======================
// Create / Join
// =======================
showJoinBtn.addEventListener("click", () => {
  joinPanel.classList.toggle("hidden");
});

createBtn.addEventListener("click", async () => {
  myName = (nameInput.value || "").trim() || "Anon";
  myId = myId || rid();

  const expireMin = Number(expireSelect.value) || 10;
  const rounds = Number(roundsSelect.value) || 7;

  code = partyCode();
  ref = db.ref("rooms/" + code);

  await ref.set({
    createdAt: now(),
    expiresAt: now() + expireMin * 60 * 1000,
    expireMin,
    totalRounds: rounds,
    round: 1,

    state: "lobby", // lobby | choosing | playing | finished
    countdownEndsAt: null,

    hostId: myId,
    chooserId: null,     // devine guest
    guesserId: myId,     // host ghicește primul

    maxWrong: MAX_WRONG,
    wrong: 0,

    originalWord: "",
    secretNormalized: "",
    lengths: [],
    revealed: [],          // string[]; "" = hidden
    guessed: "",           // "ABCD"
    letterStatus: {},      // {A: "wrong"|"correct"}

    msg: "Lobby creat. Așteaptă încă un jucător...",
    msgType: "",

    players: {
      [myId]: { id: myId, name: myName },
    },
  });

  codeEl.textContent = code;
  hostPanel.classList.remove("hidden");
  joinPanel.classList.add("hidden");
  show(lobbyScreen);
  setStatus(lobbyStatus, "Party creat. Trimite codul prietenului tău.");

  attach();
});

joinBtn.addEventListener("click", async () => {
  myName = (nameInput.value || "").trim() || "Anon";
  myId = myId || rid();

  const c = (joinCodeInput.value || "").trim().toUpperCase();
  if (!c) return setStatus(lobbyStatus, "Introdu un cod.", "bad");

  code = c;
  ref = db.ref("rooms/" + code);

  const snap = await ref.get();
  if (!snap.exists()) return setStatus(lobbyStatus, "Party-ul nu există.", "bad");

  const room = snap.val();
  if (room?.expiresAt && now() > room.expiresAt) return setStatus(lobbyStatus, "Party-ul a expirat.", "bad");

  await ref.child("players/" + myId).set({ id: myId, name: myName });

  await ref.transaction((r) => {
    if (!r) return r;
    if (!r.chooserId) r.chooserId = myId; // primul guest devine chooser
    r.state = "lobby";
    return r;
  });

  hostPanel.classList.add("hidden");
  joinPanel.classList.add("hidden");
  show(lobbyScreen);
  setStatus(lobbyStatus, "Conectat! Așteaptă startul...");

  attach();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(codeEl.textContent);
    setStatus(lobbyStatus, "Cod copiat!", "good");
  } catch {
    setStatus(lobbyStatus, "Nu am putut copia codul.", "bad");
  }
});

// =======================
// Listener
// =======================
function attach() {
  if (!ref) return;

  ref.on("value", (s) => {
    const room = s.val();
    if (!room) return;

    if (room.expiresAt && now() > room.expiresAt) {
      stopCountdown();
      show(lobbyScreen);
      setStatus(lobbyStatus, "Party-ul a expirat.", "bad");
      return;
    }

    const isHost = room.hostId === myId;
    const playersCount = room.players ? Object.keys(room.players).length : 0;

    // LOBBY
    if (room.state === "lobby") {
      show(lobbyScreen);
      renderPlayers(playersList, room.players || {});
      if (isHost) {
        hostPanel.classList.remove("hidden");
        codeEl.textContent = code || "";
      }

      if (playersCount < 2) {
        stopCountdown();
        setStatus(lobbyStatus, "Lobby: așteaptă încă un jucător...");
      } else {
        // start countdown only once (host)
        if (isHost && !room.countdownEndsAt) {
          ref.update({
            countdownEndsAt: now() + LOBBY_COUNTDOWN_MS,
            msg: "Jocul începe în 5 secunde...",
            msgType: "",
          });
        }

        if (room.countdownEndsAt) {
          startCountdownUI(room.countdownEndsAt);

          if (room.countdownEndsAt - now() <= 0 && isHost) {
            ref.update({
              state: "choosing",
              countdownEndsAt: null,
              msg: "Chooser alege cuvântul.",
              msgType: "",
            });
          }
        }
      }
      return;
    }

    // GAME UI
    stopCountdown();
    show(gameScreen);

    gameCode.textContent = code || "";
    roundEl.textContent = String(room.round || 1);

    renderPlayers(gamePlayers, room.players || {});
    chooserEl.textContent = room.players?.[room.chooserId]?.name || "(?)";
    guesserEl.textContent = room.players?.[room.guesserId]?.name || "(?)";

    wrongEl.textContent = String(room.wrong || 0);
    maxwrongEl.textContent = String(room.maxWrong || MAX_WRONG);
    renderHangman(room.wrong || 0);

    renderWord(room.lengths || [], room.revealed || []);

    msgEl.className = "status";
    msgEl.textContent = room.msg || "";
    if (room.msgType === "good") msgEl.classList.add("good");
    if (room.msgType === "bad") msgEl.classList.add("bad");

    const isChooser = room.chooserId === myId;
    const isGuesser = room.guesserId === myId;

    chooserBox.classList.toggle("hidden", !(room.state === "choosing" && isChooser));
    guesserBox.classList.toggle("hidden", !(room.state === "playing" && isGuesser));

    if (room.state === "playing" && isGuesser) {
      buildKeyboard(room.guessed || "", room.letterStatus || {});
      letterInput.disabled = false;
      guessBtn.disabled = false;
    } else {
      keyboard.innerHTML = "";
      letterInput.disabled = true;
      guessBtn.disabled = true;
    }

    nextRoundBtn.classList.toggle("hidden", !(room.state === "finished" && isHost));
  });
}

// =======================
// Choosing (chooser sets word)
// =======================
setWordBtn.addEventListener("click", async () => {
  if (!ref) return;

  const w = (wordInput.value || "").trim();
  if (!w) return;

  await ref.transaction((room) => {
    if (!room) return room;
    if (room.state !== "choosing") return room;
    if (room.chooserId !== myId) return room;

    const letters = Array.from(w);
    const lengths = letters.map((ch) => (ch === " " ? "space" : ch === "-" ? "dash" : "letter"));
    const revealed = letters.map((ch) => {
      if (ch === " ") return " ";
      if (ch === "-") return "-";
      return ""; // hidden
    });

    const secretNormalized = letters.map(normalizeChar).join("");

    room.originalWord = w;
    room.secretNormalized = secretNormalized;
    room.lengths = lengths;
    room.revealed = revealed;

    room.wrong = 0;
    room.guessed = "";
    room.letterStatus = {};

    room.state = "playing";
    room.msg = "Jocul a început! Guesser ghicește.";
    room.msgType = "";

    return room;
  });

  wordInput.value = "";
});

// =======================
// Playing (guesser guesses)
// =======================
function sendGuess(letter) {
  if (!ref) return;

  ref.transaction((room) => {
    if (!room) return room;
    if (room.state !== "playing") return room;
    if (room.guesserId !== myId) return room;

    const L = String(letter || "").toUpperCase();
    if (!isAZ(L)) return room;

    let guessed = room.guessed || "";
    const status = room.letterStatus || {};
    if (guessed.includes(L)) return room;

    guessed += L;

    const secret = String(room.secretNormalized || "");
    const original = String(room.originalWord || "");

    const secretArr = Array.from(secret);
    const origArr = Array.from(original);

    // ensure revealed is same length and no holes
    const revealed = Array.isArray(room.revealed) ? [...room.revealed] : [];
    while (revealed.length < secretArr.length) revealed.push("");

    const norm = normalizeChar(L);

    let found = false;
    for (let i = 0; i < secretArr.length; i++) {
      const alreadyShown = typeof revealed[i] === "string" && revealed[i].length > 0;
      if (secretArr[i] === norm && !alreadyShown) {
        revealed[i] = origArr[i];
        found = true;
      }
    }

    let wrong = room.wrong || 0;
    if (!found) wrong++;

    status[L] = found ? "correct" : "wrong";

    // win check
    const lengths = room.lengths || [];
    const isWin =
      lengths.length === secretArr.length &&
      lengths.every((t, idx) => (t === "space" || t === "dash") ? true : (revealed[idx] && revealed[idx].length > 0));

    const isLose = wrong >= (room.maxWrong || MAX_WRONG);

    room.guessed = guessed;
    room.letterStatus = status;
    room.revealed = revealed;
    room.wrong = wrong;

    if (isWin) {
      room.state = "finished";
      room.msg = "Guesser a câștigat! Apasă următoarea rundă.";
      room.msgType = "good";
    } else if (isLose) {
      room.state = "finished";
      room.msg = `Guesser a pierdut! Cuvântul era: "${room.originalWord}".`;
      room.msgType = "bad";
    } else {
      room.msg = found ? `Corect: ${L}` : `Greșit: ${L}`;
      room.msgType = found ? "good" : "bad";
    }

    return room;
  });
}

guessBtn.addEventListener("click", () => {
  const c = (letterInput.value || "").trim().toUpperCase();
  if (!c) return;
  sendGuess(c[0]);
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
// Next round (host)
// =======================
nextRoundBtn.addEventListener("click", async () => {
  if (!ref) return;

  await ref.transaction((room) => {
    if (!room) return room;
    if (room.state !== "finished") return room;
    if (room.hostId !== myId) return room;

    const currentRound = room.round || 1;
    const total = room.totalRounds || 7;

    if (currentRound >= total) {
      room.msg = `Joc încheiat! S-au jucat ${total} runde.`;
      room.msgType = "";
      return room;
    }

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
    room.wrong = 0;
    room.guessed = "";
    room.letterStatus = {};
    room.msg = "Rundă nouă! Chooser alege cuvântul.";
    room.msgType = "";

    return room;
  });
});