function renderTable() {
  const todayKey = new Date().toISOString().split("T")[0];

  chrome.storage.local.get(
    [
      `counts_${todayKey}`,
      `letters_${todayKey}`,
      `center_${todayKey}`,
      `hints_${todayKey}`
    ],
    (res) => {
      const counts = res[`counts_${todayKey}`] || {};
      const hexLetters = res[`letters_${todayKey}`]?.map(l => l.toUpperCase()) || [];
      const centerLetter = res[`center_${todayKey}`]?.toUpperCase();
      const hintCounts = res[`hints_${todayKey}`] || {};

      const tbody = document.getElementById("startBody");

      tbody.innerHTML = "";

      const otherLetters = hexLetters.filter(l => l !== centerLetter).sort();
      const orderedLetters = centerLetter ? [centerLetter, ...otherLetters] : hexLetters.sort();

      let isEmpty = true;

      orderedLetters.forEach(letter => {
        const rowCounts = counts[letter.toLowerCase()] || {};
        const row = document.createElement("tr");
        let sum = 0;

        let html = `<td><b>${letter}</b></td>`;
        for (let len = 4; len <= 10; len++) {
          const val = rowCounts[len] || 0;
          const possible = hintCounts?.[letter]?.[len] || 0;
          let className = "heat-none";

          if (possible > 0) {
            const ratio = val / possible;
            if (ratio === 1) className = "heat-full";
            else if (ratio > 0.5) className = "heat-good";
            else if (ratio > 0.25) className = "heat-mid";
            else if (ratio > 0) className = "heat-low";
          }

          html += `<td class="${className}" title="${val} of ${possible}">${val}</td>`;
          sum += val;
        }

        html += `<td><b>${sum}</b></td>`;

        const totalPossible = Object.values(hintCounts?.[letter] || {}).reduce((a, b) => a + b, 0);
        const remaining = totalPossible - sum;
        html += `<td><b>${remaining}</b></td>`;

        if (sum > 0) isEmpty = false;

        row.innerHTML = html;
        tbody.appendChild(row);
      });

      if (isEmpty) {
        const placeholderRow = document.createElement("tr");
        placeholderRow.innerHTML = `<td colspan="10" style="text-align: center;">No words guessed yet</td>`;
        tbody.appendChild(placeholderRow);
      }
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderTable();

  document.getElementById("refreshBtn").addEventListener("click", () => {
    renderTable();
  });
});