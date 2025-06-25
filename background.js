// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const key = message.key || "default";
  
  if (message.type === "saveCounts") {
    chrome.storage.local.set({
      [`counts_${key}`]: message.counts,
      [`letters_${key}`]: message.hexLetters,
      [`center_${key}`]: message.centerLetter
    }, () => sendResponse({ success: true }));
    return true; 
  }

   if (message.type === "saveHintData") {
    chrome.storage.local.set({
      [`hints_${key}`]: message.hints
    }, () => sendResponse({ success: true }));
    return true; 
  }

  if (message.ping) {
    sendResponse({ pong: true });
    return true;
  }
});

function clearOldData(daysToKeep = 7) {
  chrome.storage.local.get(null, (items) => {
    const now = new Date();
    const keysToRemove = [];

    Object.keys(items).forEach((key) => {
      const match = key.match(/_(\d{4}-\d{2}-\d{2})$/); // match date suffix
      if (match) {
        const dateStr = match[1];
        const date = new Date(dateStr);
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);

        if (diffDays > daysToKeep) {
          keysToRemove.push(key);
        }
      }
    });

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        console.log(`[Auto-Cleanup] Removed ${keysToRemove.length} old keys`, keysToRemove);
      });
    }
  });
}

clearOldData(7);