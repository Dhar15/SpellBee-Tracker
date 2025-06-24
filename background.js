// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "saveCounts") {
    chrome.storage.local.set({
      startingLetterCounts: message.counts,
      hexLetters: message.hexLetters,
      centerLetter: message.centerLetter,
    }, () => {
      console.log("Data saved to chrome.storage");
    });
  }

   if (message.type === "saveHintData") {
    chrome.storage.local.set({
      hintTableData: message.hints
    });
  }
});