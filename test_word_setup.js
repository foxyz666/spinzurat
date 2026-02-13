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

// Simulate setting "Plaja"
const word = "Plaja";
const letters = Array.from(word);
const lengths = letters.map((ch) => (ch === " " ? "space" : ch === "-" ? "dash" : "letter"));
const revealed = letters.map((ch) => {
  if (ch === " ") return " ";
  if (ch === "-") return "-";
  return "";
});
const normalized = letters.map(normalizeLetter).join("");

console.log("Word:", word);
console.log("Letters:", letters);
console.log("Lengths:", lengths);
console.log("Revealed:", revealed);
console.log("Normalized:", normalized);
console.log("Normalized array:", Array.from(normalized));
