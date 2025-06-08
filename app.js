const SHEET_ID = 'your_google_sheet_id_here';
const GARAGES_RANGE = 'garagesJune';
const CALENDAR_RANGE = 'calendarJune';
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:`;

// Helper to fetch and parse sheet data
async function fetchSheetData(range) {
  const response = await fetch(`${API_URL}${range}?key=YOUR_API_KEY`);
  const data = await response.json();
  return data.values;
}

function updateLastModified(dateStr) {
  const date = new Date(dateStr);
  document.getElementById('last-updated').textContent = `Last updated: ${date.toLocaleString()}`;
}

function createGarageCard(garage) {
  const card = document.createElement('div');
  card.className = 'col-md-6 col-lg-4';

  card.innerHTML = `
    <div class="card">
      <h5 class="card-title">${garage.name}</h5>
      <p>Total: €${garage.total.toFixed(2)} / €${garage.target}</p>
      <p>Average/day: €${garage.avg.toFixed(2)}</p>
      <p>Highest: €${garage.highest.amount.toFixed(2)} (${garage.highest.date})</p>
      <p>Lowest: €${garage.lowest.amount.toFixed(2)} (${garage.lowest.date})</p>
      <p>ETA: ${garage.etaDate}</p>
      <div class="progress-wrapper">
        <div class="progress-icons">
          <span>📍</span><span>🏎️</span>
        </div>
        <div class="progress-bar-custom" style="width: ${garage.percent}%"></div>
        <div class="car-icon" style="left: ${garage.percent}%">🏎️</div>
      </div>
    </div>
  `;

  return card;
}

function renderGarages(garages) {
  const list = document.getElementById('garage-list');
  list.innerHTML = '';
  garages.forEach(garage => list.appendChild(createGarageCard(garage)));
}

// Example stub - Replace with actual processing
function processData(garageData, calendarData, target) {
  // Stub: each garage has name + dummy values
  const garages = garageData[0].map((name, i) => {
    const spends = garageData.slice(2).map(row => parseFloat(row[i]) || 0);
    const total = spends.reduce((a, b) => a + b, 0);
    const avg = total / spends.length;
    const highest = Math.max(...spends);
    const lowest = Math.min(...spends);
    const highestDay = spends.indexOf(highest) + 1;
    const lowestDay = spends.lastIndexOf(lowest) + 1;
    const percent = Math.min((total / target) * 100, 100);
    const remaining = target - total;
    const etaDays = avg > 0 ? Math.ceil(remaining / avg) : '∞';
    const today = new Date();
    const etaDate = avg > 0 ? new Date(today.setDate(today.getDate() + etaDays)).toLocaleDateString() : 'Never';

    return {
      name,
      total,
      avg,
      highest: { amount: highest, date: `Jun ${highestDay}` },
      lowest: { amount: lowest, date: `Jun ${lowestDay}` },
      percent,
      etaDays,
      etaDate,
      target,
    };
  });

  return garages;
}

function sortGarages(garages, sortOption) {
  const [key, dir] = sortOption.split('-');
  garages.sort((a, b) => {
    let valA, valB;
    if (key === 'percent') {
      valA = a.percent;
      valB = b.percent;
    } else if (key === 'average') {
      valA = a.avg;
      valB = b.avg;
    } else if (key === 'eta') {
      valA = a.etaDays;
      valB = b.etaDays;
    }
    return dir === 'asc' ? valA - valB : valB - valA;
  });
  return garages;
}

async function init() {
  const garageData = await fetchSheetData(GARAGES_RANGE);
  const calendarData = await fetchSheetData(CALENDAR_RANGE);
  const target = parseFloat(calendarData[0][3]);

  const garages = processData(garageData, calendarData, target);

  let currentSort = 'percent-desc';
  renderGarages(sortGarages([...garages], currentSort));

  document.getElementById('sort').addEventListener('change', (e) => {
    const sorted = sortGarages([...garages], e.target.value);
    renderGarages(sorted);
  });

  // Optional: hardcoded last update or fetch metadata with Sheets API
  updateLastModified(new Date());
}

init();
