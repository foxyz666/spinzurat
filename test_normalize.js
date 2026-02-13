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

// Test with "Plaja"
const word = "Plaja";
const letters = Array.from(word);
const normalized = letters.map(normalizeLetter).join("");

console.log("Word:", word);
console.log("Letters:", letters);
console.log("Normalized:", normalized);

// Test guessing "P"
const guessLetter = "P";
const norm = normalizeLetter(guessLetter);
console.log("\nGuessing:", guessLetter);
console.log("Normalized guess:", norm);

// Check if found
const secretArr = Array.from(normalized);
console.log("Secret array:", secretArr);
console.log("First letter matches?", secretArr[0] === norm);
