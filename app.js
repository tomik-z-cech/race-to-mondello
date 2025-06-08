// app.js

let currentStats = []; // keep current stats in global scope

document.getElementById('sort').addEventListener('change', (e) => {
  const sortValue = e.target.value;
  let sortedStats = [...currentStats];

  switch(sortValue) {
    case 'percent-desc':
      sortedStats.sort((a,b) => b.progressPercent - a.progressPercent);
      break;
    case 'percent-asc':
      sortedStats.sort((a,b) => a.progressPercent - b.progressPercent);
      break;
    case 'average-desc':
      sortedStats.sort((a,b) => b.average - a.average);
      break;
    case 'average-asc':
      sortedStats.sort((a,b) => a.average - b.average);
      break;
    case 'eta-asc':
      sortedStats.sort((a,b) => {
        if (a.estDaysToTarget === '∞') return 1;
        if (b.estDaysToTarget === '∞') return -1;
        return a.estDaysToTarget - b.estDaysToTarget;
      });
      break;
    case 'eta-desc':
      sortedStats.sort((a,b) => {
        if (a.estDaysToTarget === '∞') return 1;
        if (b.estDaysToTarget === '∞') return -1;
        return b.estDaysToTarget - a.estDaysToTarget;
      });
      break;
  }

  renderStats(sortedStats, data.lastUpdated);
});

async function loadData() {
    const response = await fetch('mondello_june.json');
    const data = await response.json();
    return data;
  }
  
  function calculateStats(data) {
    const target = data.target;
    const dayWeights = data.dayWeights;
    const currentDay = Object.keys(dayWeights).filter(d => d <= 8);
    const totalWeight = currentDay.reduce((sum, day) => sum + parseFloat(dayWeights[day]), 0);
  
    return data.garages.map(garage => {
      const spend = garage.dailySpend;
      const total = spend.reduce((sum, val) => sum + val, 0);
      const average = total / totalWeight;
      const highest = Math.max(...spend);
      const lowest = Math.min(...spend);
      const highestIndex = spend.indexOf(highest);
      const lowestIndex = spend.lastIndexOf(lowest);
  
      const remaining = target - total;
      const estDaysToTarget = average > 0 ? Math.ceil(remaining / average) : '∞';
  
      return {
        ...garage,
        total,
        average,
        highest,
        highestDay: highestIndex + 1,
        lowest,
        lowestDay: lowestIndex + 1,
        progressPercent: Math.min((total / target) * 100, 100),
        estDaysToTarget
      };
    });
  }
  
  // Helper function to interpolate color based on percent 0-100
function getColorForPercent(pct) {
    // Convert pct (0-100) to range 0-1
    const percent = Math.min(Math.max(pct, 0), 100) / 100;
  
    let r, g, b;
  
    if (percent < 0.5) {
      // Red to Yellow (0 to 0.5)
      // Red: 255,0,0; Yellow: 255,255,0
      const ratio = percent / 0.5;
      r = 255;
      g = Math.round(255 * ratio);
      b = 0;
    } else {
      // Yellow to Green (0.5 to 1)
      // Yellow: 255,255,0; Green: 0,255,0
      const ratio = (percent - 0.5) / 0.5;
      r = Math.round(255 * (1 - ratio));
      g = 255;
      b = 0;
    }
  
    return `rgb(${r},${g},${b})`;
  }
  
  function renderStats(stats, lastUpdated) {
    const container = document.getElementById('garage-stats');
    if (!container) {
      console.error('Container #garage-stats not found in DOM');
      return;
    }
    container.innerHTML = '';
  
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last Updated: ${new Date(lastUpdated).toLocaleString()}`;
    }
  
    stats.forEach((garage, index) => {
      const color = getColorForPercent(garage.progressPercent);
  
      const card = document.createElement('div');
      card.className = 'garage-card col-12 border p-3 rounded mb-4 bg-secondary';
  
      card.innerHTML = `
        <div class="row">
          <!-- Garage name and account -->
          <div class="col-12 mb-3">
            <h3>${garage.name}</h3>
            <p>Account: ${garage.account}</p>
          </div>
  
          <!-- Left and Right columns -->
          <div class="col-6">
            <p><strong>Lowest Spend:</strong> €${garage.lowest.toFixed(2)} (Day ${garage.lowestDay})</p>
            <p><strong>Highest Spend:</strong> €${garage.highest.toFixed(2)} (Day ${garage.highestDay})</p>
            <p><strong>Average Spend/Day:</strong> €${garage.average.toFixed(2)}</p>
          </div>
  
          <div class="col-6">
            <p><strong>Total Spend:</strong> €${garage.total.toFixed(2)}</p>
            <p><strong>Percentage of Target:</strong> ${garage.progressPercent.toFixed(2)}%</p>
            <p><strong>Days Left to Target:</strong> ${garage.estDaysToTarget}</p>
          </div>
  
          <!-- Race car progress bar with start and finish icons -->
          <div class="col-12 mt-3 position-relative" style="height: 60px;">
            <div style="position: relative; height: 30px; background-color: #444; border-radius: 15px;">
              <!-- Start icon -->
              <img 
                src="your-start-pin.png" 
                alt="Start Pin" 
                style="position: absolute; left: -20px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px;"
              />
              <!-- Finish icon -->
              <img 
                src="your-checker-flag.png" 
                alt="Finish Flag" 
                style="position: absolute; right: -20px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px;"
              />
              <!-- Progress bar fill -->
              <div 
                class="progress-bar" 
                role="progressbar" 
                style="
                  width: ${garage.progressPercent}%; 
                  background-color: ${color};
                  height: 100%;
                  border-radius: 15px 0 0 15px;
                  transition: width 0.5s ease, background-color 0.5s ease;
                "
                aria-valuenow="${garage.progressPercent}" 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
  
              <!-- Race car icon positioned -->
              <div style="
                position: absolute; 
                top: 50%; 
                left: calc(${garage.progressPercent}% - 20px); 
                width: 40px; 
                height: 40px; 
                transform: translateY(-50%);
                background-image: url('https://cdn-icons-png.flaticon.com/512/743/743131.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                ">
              </div>
            </div>
          </div>
        </div>
      `;
  
      container.appendChild(card);
    });
  }

let data = null;  // store loaded data globally

document.addEventListener('DOMContentLoaded', () => {
  loadData()
    .then(loadedData => {
      data = loadedData;
      currentStats = calculateStats(data);
      renderStats(currentStats, data.lastUpdated);
    })
    .catch(error => {
      console.error('Failed to load or render data:', error);
    });
});