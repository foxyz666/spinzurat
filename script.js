// ===== UTIL: log în pagină + consolă =====
function addDebug(msg) {
  console.log(msg);
  const pre = document.getElementById("debug-log");
  if (pre) {
    pre.textContent += msg + "\n";
  }
}

// ===== 1) CONFIG FIREBASE - DATELE TALE =====
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

addDebug("Încep inițializarea Firebase...");
firebase.initializeApp(firebaseConfig);
addDebug("Firebase.initializeApp() apelat.");

let db;
try {
  db = firebase.database();
  addDebug("firebase.database() OK.");
} catch (err) {
  addDebug("Eroare la firebase.database(): " + err.message);
}

// ===== 2) TEST conexiune DB =====
if (db) {
  db.ref("testConnection2")
    .set({ ok: true, time: Date.now() })
    .then(() => {
      addDebug("Scris în DB OK (testConnection2).");
      return db.ref("testConnection2").get();
    })
    .then((snap) => {
      addDebug("Citit din DB (testConnection2): " + JSON.stringify(snap.val()));
    })
    .catch((err) => {
      addDebug("Eroare Firebase DB la testConnection2: " + err.message);
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.textContent =
          "Eroare la conectarea la Firebase: " + err.message;
      }
    });
} else {
  addDebug("DB NU este inițializat (db este null).");
}

// ===== 3) Utilitare =====
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

// ===== 4) DOM =====
const playerNameInput = document.getElementById("player-name-input");
const createPartyBtn = document.getElementById("create-party-btn");
const statusEl = document.getElementById("status");
const partyCodeDisplay = document.getElementById("party-code-display");

// Verificăm că am luat elementele
if (!playerNameInput) addDebug("NU găsesc #player-name-input");
if (!createPartyBtn) addDebug("NU găsesc #create-party-btn");
if (!statusEl) addDebug("NU găsesc #status");
if (!partyCodeDisplay) addDebug("NU găsesc #party-code-display");

// ===== 5) CREATE PARTY =====
if (createPartyBtn) {
  createPartyBtn.addEventListener("click", async () => {
    addDebug("CLICK pe Create Party.");
    try {
      if (!db) {
        addDebug("db este null, nu pot crea party.");
        statusEl.textContent =
          "Eroare internă: baza de date nu este inițializată.";
        return;
      }

      statusEl.textContent = "Se creează party...";

      const myName = playerNameInput.value.trim() || "Anon";
      const myId = randomId();
      const partyCode = randomPartyCode();

      addDebug("myName: " + myName);
      addDebug("myId: " + myId);
      addDebug("partyCode: " + partyCode);

      const roomRef = db.ref("rooms/" + partyCode);

      await roomRef.set({
        hostId: myId,
        createdAt: Date.now(),
        players: {
          [myId]: {
            id: myId,
            name: myName,
            role: "host",
          },
        },
      });

      addDebug("Room set OK în DB la rooms/" + partyCode);
      partyCodeDisplay.textContent = partyCode;
      statusEl.textContent = "Party creat cu succes!";
    } catch (err) {
      addDebug("Eroare la Create Party: " + err.message);
      statusEl.textContent = "Eroare la Create Party: " + err.message;
    }
  });
} else {
  addDebug("createPartyBtn este null, nu pot atașa handlerul de click.");
}
