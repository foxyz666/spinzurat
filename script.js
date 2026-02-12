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

console.log("Încep inițializarea Firebase...");
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
console.log("Firebase initializat.");

// ===== 2) TEST conexiune DB =====
db.ref("testConnection2")
  .set({ ok: true, time: Date.now() })
  .then(() => {
    console.log("Scris în DB OK (testConnection2).");
    return db.ref("testConnection2").get();
  })
  .then((snap) => {
    console.log("Citit din DB (testConnection2):", snap.val());
  })
  .catch((err) => {
    console.error("Eroare Firebase DB la testConnection2:", err);
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent =
        "Eroare la conectarea la Firebase: " + err.message;
    }
  });

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

// ===== 5) CREATE PARTY =====
createPartyBtn.addEventListener("click", async () => {
  try {
    statusEl.textContent = "Se creează party...";
    console.log("Buton Create Party apăsat.");

    const myName = playerNameInput.value.trim() || "Anon";
    const myId = randomId();
    const partyCode = randomPartyCode();

    console.log("myName:", myName);
    console.log("myId:", myId);
    console.log("partyCode:", partyCode);

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

    console.log("Room set OK în DB la rooms/" + partyCode);
    partyCodeDisplay.textContent = partyCode;
    statusEl.textContent = "Party creat cu succes!";
  } catch (err) {
    console.error("Eroare la Create Party:", err);
    statusEl.textContent = "Eroare la Create Party: " + err.message;
  }
});
