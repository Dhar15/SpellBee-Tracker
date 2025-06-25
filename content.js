function isExtensionContextValid() {
  try {
    // Try to access chrome.runtime.id to check if context is valid
    return chrome.runtime && chrome.runtime.id;
  } catch (error) {
    return false;
  }
}

function safeRuntimeMessage(message, callback, retryCount = 0) {
  if (!isExtensionContextValid()) {
    console.warn("Extension context is invalid, skipping message:", message.type);
    
    if (retryCount < 3) {
      console.log(`Attempting to recover extension context (attempt ${retryCount + 1}/3)`);
      setTimeout(() => {
        safeRuntimeMessage(message, callback, retryCount + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      console.warn("Extension context recovery failed after 3 attempts");
    }
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("SendMessage failed:", chrome.runtime.lastError.message);
        // Try to reload the page
        if (chrome.runtime.lastError.message.includes("context invalidated")) {
          console.log("Extension context invalidated - consider refreshing the page");
        }
      } else if (callback) {
        callback(response);
      }
    });
  } catch (error) {
    console.warn("Failed to send runtime message:", error.message);
  }
}

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

  const todayKey = new Date().toISOString().split("T")[0]; //Unique identifier for a puzzle each day

  safeRuntimeMessage({
    type: "saveCounts",
    key: todayKey,
    counts,
    hexLetters,
    centerLetter
  }, (res) => {
    console.log("Counts saved:", res);
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

  const todayKey = new Date().toISOString().split("T")[0]; //Unique identifier for a puzzle each day

  safeRuntimeMessage({
    type: "saveHintData",
    key: todayKey,
    hints
  }, (res) => {
    console.log("Hint data saved:", res);
  });
}

// To ensure the extension context is valid before setting up observers
function initializeExtension() {
  if (!isExtensionContextValid()) {
    console.warn("Extension context is not valid, cannot initialize");
    return;
  }

  const discoveredTextEl = document.getElementById("discoveredText");
  if (discoveredTextEl) {
    const observer = new MutationObserver(updateStartingLetterCounts);
    observer.observe(discoveredTextEl, {
      childList: true,
      subtree: true
    });
  }

  // Initial data extraction
  updateStartingLetterCounts();
  extractHintData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

window.addEventListener("load", () => {
  // Double-check on window load in case DOMContentLoaded missed anything
  if (isExtensionContextValid()) {
    updateStartingLetterCounts();
    extractHintData();
  }
});