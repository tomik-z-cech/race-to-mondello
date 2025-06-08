// app.js

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
  
  function renderStats(stats, lastUpdated) {
    const container = document.getElementById('garage-stats');
    container.innerHTML = '';
  
    document.getElementById('last-updated').textContent = `Last Updated: ${new Date(lastUpdated).toLocaleString()}`;
  
    stats.forEach(garage => {
      const card = document.createElement('div');
      card.className = 'garage-card';
      card.innerHTML = `
        <h3>${garage.name}</h3>
        <p>Account: ${garage.account}</p>
        <p>Total Spend: €${garage.total.toFixed(2)}</p>
        <p>Avg/Day: €${garage.average.toFixed(2)}</p>
        <p>Highest Spend: €${garage.highest} (Day ${garage.highestDay})</p>
        <p>Lowest Spend: €${garage.lowest} (Day ${garage.lowestDay})</p>
        <p>Estimated Days to Target: ${garage.estDaysToTarget}</p>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" style="width: ${garage.progressPercent}%; background: linear-gradient(to right, red, yellow, green);"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }
  
  loadData()
    .then(data => {
      const stats = calculateStats(data);
      renderStats(stats, data.lastUpdated);
    })
    .catch(error => {
      console.error('Failed to load or render data:', error);
    });
  