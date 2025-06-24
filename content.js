function updateStartingLetterCounts() {
  const wordElements = document.querySelectorAll("#discoveredText li p");
  const hexLetters = Array.from(document.querySelectorAll("#hexGrid p"))
    .map(p => p.textContent.trim().toLowerCase());

  const centerEl = document.querySelector("#center-letter p");
  const centerLetter = centerEl ? centerEl.textContent.trim().toLowerCase() : null;

  if (!wordElements.length || !hexLetters.length) return;

  const counts = {};

  // Initialize counts for each hex letter and word length
  hexLetters.forEach(letter => {
    counts[letter] = { total: 0 };
    for (let len = 4; len <= 10; len++) {
      counts[letter][len] = 0;
    }
  });

  wordElements.forEach(el => {
    const word = el.textContent.trim().toLowerCase();
    const len = word.length;
    const startingLetter = word[0];

    if (len >= 4 && len <= 10 && hexLetters.includes(startingLetter)) {
      counts[startingLetter][len]++;
      counts[startingLetter].total++;
    }
  });

  chrome.runtime.sendMessage({
    type: "saveCounts",
    counts,
    hexLetters,
    centerLetter
  });
}

function extractHintData() {
  const hintTable = document.querySelector(".block-hints");
  if (!hintTable) return;

  const rows = hintTable.querySelectorAll("tbody tr");
  const hints = {};

  rows.forEach(row => {
    const cells = row.querySelectorAll("td, th");
    const letter = cells[0]?.textContent.trim().toUpperCase();
    if (!letter || letter === "∑") return;

    hints[letter] = {};
    for (let i = 1; i <= 7; i++) {
      const len = i + 3;
      const val = cells[i]?.textContent.trim();
      if (val && val !== "-") {
        hints[letter][len] = parseInt(val, 10);
      }
    }
  });

  chrome.runtime.sendMessage({
    type: "saveHintData",
    hints
  });
}

const observer = new MutationObserver(updateStartingLetterCounts);
observer.observe(document.getElementById("discoveredText"), {
  childList: true,
  subtree: true
});

window.addEventListener("load", () => {
  updateStartingLetterCounts();
  extractHintData(); 
});
