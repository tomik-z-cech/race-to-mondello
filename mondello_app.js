// DOM Elements
const sortSelect = document.getElementById('sort');
const branchSelect = document.getElementById('branch');
const spinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const statsContainer = document.getElementById('garage-stats');
const lastUpdatedEl = document.getElementById('last-updated');

let data = null;
let currentStats = [];
let currentBranch = null;

// Show/hide spinner
function showSpinner(show) {
    spinner.style.display = show ? 'block' : 'none';
}

// Show/hide error message
function showError(message = '') {
    errorMessage.style.display = message ? 'block' : 'none';
    errorMessage.textContent = message;
}

// Populate the branch dropdown
function populateBranchDropdown(branches) {
    branchSelect.innerHTML = '<option disabled selected value="">Select Branch</option>';
    Object.keys(branches).sort().forEach(branchName => {
        const option = document.createElement('option');
        option.value = branchName;
        option.textContent = branchName;
        branchSelect.appendChild(option);
    });
}

// Load JSON data
async function loadData(filename) {
    const response = await fetch(`data/${filename}`);
    if (!response.ok) throw new Error(`Failed to load: ${filename}`);
    return await response.json();
}

// Calculate statistics
function calculateStats(branchData, target, dayWeights) {
    const totalWeight = dayWeights.reduce((sum, w) => sum + parseFloat(w), 0);

    return branchData.garages.map(garage => {
        const spend = garage.dailySpend.map(Number);
        const total = spend.reduce((sum, val) => sum + val, 0);
        const average = totalWeight > 0 ? total / totalWeight : 0;
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

// Get progress bar color
function getColorForPercent(pct) {
    const percent = Math.min(Math.max(pct, 0), 100) / 100;
    let r, g, b;
    if (percent < 0.5) {
        const ratio = percent / 0.5;
        r = 255;
        g = Math.round(255 * ratio);
        b = 0;
    } else {
        const ratio = (percent - 0.5) / 0.5;
        r = Math.round(255 * (1 - ratio));
        g = 255;
        b = 0;
    }
    return `rgb(${r},${g},${b})`;
}

// Render stats
function renderStats(stats, lastUpdated) {
    statsContainer.innerHTML = '';

    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Last Updated: ${new Date(lastUpdated || Date.now()).toLocaleString()}`;
    }

    stats.forEach(garage => {
        const color = getColorForPercent(garage.progressPercent);
        const card = document.createElement('div');
        card.className = 'garage-card col-12 border p-3 rounded mb-4 bg-secondary';
        card.innerHTML = `
            <div class="row">
                <div class="col-12 mb-3 text-center">
                    <h3><b>${garage.name}</b></h3>
                    <p><strong>Site ID : </strong>${garage.account}</p>
                </div>
                <div class="col-6 text-center">
                    <p><strong>Lowest Spend:</strong><br> €${garage.lowest.toFixed(2)} (Day ${garage.lowestDay})</p>
                    <p><strong>Highest Spend:</strong><br> €${garage.highest.toFixed(2)} (Day ${garage.highestDay})</p>
                    <p><strong>Average Spend/Day:</strong><br> €${garage.average.toFixed(2)}</p>
                </div>
                <div class="col-6 text-center">
                    <p><strong>Total Spend:</strong><br> €${garage.total.toFixed(2)}</p>
                    <p><strong>Percentage of Target:</strong><br> ${garage.progressPercent.toFixed(2)}%</p>
                    <p><strong>Days Left to Target:</strong><br> ${garage.estDaysToTarget}</p>
                </div>
                <div class="col-12 mt-3 position-relative" style="height: 60px;">
                    <div style="position: relative; height: 30px; background-color: #444; border-radius: 15px;">
                        <img src="assets/pin.png" alt="Start Pin" style="position: absolute; left: -20px; top: 50%; transform: translateY(-50%); width: 50px; height: 60px;" />
                        <img src="assets/flag.png" alt="Finish Flag" style="position: absolute; right: -20px; top: 50%; transform: translateY(-50%); width: 50px; height: 60px;" />
                        <div class="progress-bar" role="progressbar"
                            style="width: ${garage.progressPercent}%; background-color: ${color}; height: 100%; border-radius: 15px 0 0 15px; transition: width 0.5s ease, background-color 0.5s ease;"
                            aria-valuenow="${garage.progressPercent}" aria-valuemin="0" aria-valuemax="100"></div>
                        <div style="position: absolute; top: 50%; left: calc(${garage.progressPercent}% - 20px); width: 120px; height: 120px; transform: translateY(-50%); background-image: url('assets/car.png'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
                    </div>
                </div>
            </div>`;
        statsContainer.appendChild(card);
    });
}

// Apply sort and render
function applySortAndRender(sortValue) {
    let sortedStats = [...currentStats];

    switch (sortValue) {
        case 'percent-desc': sortedStats.sort((a, b) => b.progressPercent - a.progressPercent); break;
        case 'percent-asc': sortedStats.sort((a, b) => a.progressPercent - b.progressPercent); break;
        case 'average-desc': sortedStats.sort((a, b) => b.average - a.average); break;
        case 'average-asc': sortedStats.sort((a, b) => a.average - b.average); break;
        case 'eta-asc':
            sortedStats.sort((a, b) => {
                if (a.estDaysToTarget === '∞') return 1;
                if (b.estDaysToTarget === '∞') return -1;
                return a.estDaysToTarget - b.estDaysToTarget;
            });
            break;
        case 'eta-desc':
            sortedStats.sort((a, b) => {
                if (a.estDaysToTarget === '∞') return 1;
                if (b.estDaysToTarget === '∞') return -1;
                return b.estDaysToTarget - a.estDaysToTarget;
            });
            break;
    }

    renderStats(sortedStats, data.lastUpdated);
}

// Unified update function with spinner
function updateDisplay(callback) {
    // Clear DOM first
    statsContainer.innerHTML = '';
    lastUpdatedEl.textContent = '';
    showError('');
    showSpinner(true);

    setTimeout(() => {
        callback();
        showSpinner(false);
    }, 1000);
}

// Event listeners
sortSelect.addEventListener('change', () => {
    updateDisplay(() => applySortAndRender(sortSelect.value));
});

branchSelect.addEventListener('change', () => {
    const selectedBranch = branchSelect.value;

    updateDisplay(() => {
        if (data && data.branches[selectedBranch]) {
            currentBranch = selectedBranch;
            currentStats = calculateStats(data.branches[selectedBranch], data.target, data.dayWeights);
            applySortAndRender(sortSelect.value);
            sortSelect.style.display = 'block';
        } else {
            showError('Branch data not found.');
            sortSelect.style.display = 'none';
        }
    });
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    showSpinner(true);
    showError('');
    try {
        data = await loadData('exported_data.json');
        populateBranchDropdown(data.branches);
    } catch (error) {
        console.error(error);
        showError('Failed to load data.');
    }
    showSpinner(false);
});
