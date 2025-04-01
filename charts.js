/* ==================== */
/* 5  App Helper          */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    const app = document.getElementById('app');
    app.style.opacity = 0;
    app.innerHTML = content;
    setTimeout(() => app.style.opacity = 1, 50);
  },
  showModal: (content) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${content}
        <button class="close-modal">Close</button>
      </div>`;
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  },
  showError: (message) => {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }
};

/* ==================== */
/* 6  Charts Module        */
/* ==================== */
const Charts = (function() {
  let durationChart, caloriesChart, activityChart;

  function init(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = `
      <div class="chart">
        <canvas id="durationChart"></canvas>
      </div>
      <div class="chart">
        <canvas id="activityChart"></canvas>
      </div>
      <div class="chart">
        <canvas id="caloriesChart"></canvas>
      </div>
    `;
  }

  function refresh(data) {
    if (!data.length) return;
    destroyCharts();

    const processed = processData(data);
    createDurationChart(processed);
    createActivityChart(processed);
    createCaloriesChart(processed);
  }

  function processData(data) {
    return {
      labels: [...new Set(data.map(e => e.date))].sort(),
      duration: data.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + e.exerciseDuration;
        return acc;
      }, {}),
      calories: data.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + e.calories;
        return acc;
      }, {}),
      activities: data.reduce((acc, e) => {
        acc[e.petLastActivity] = (acc[e.petLastActivity] || 0) + 1;
        return acc;
      }, {})
    };
  }

  function createDurationChart(data) {
    const ctx = document.getElementById('durationChart');
    durationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(data.duration),
        datasets: [{
          label: 'Total Duration (min)',
          data: Object.values(data.duration),
          borderColor: '#4bc0c0',
          tension: 0.3
        }]
      }
    });
  }

  function createActivityChart(data) {
    const ctx = document.getElementById('activityChart');
    activityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(data.activities),
        datasets: [{
          data: Object.values(data.activities),
          backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
        }]
      }
    });
  }

  function createCaloriesChart(data) {
    const ctx = document.getElementById('caloriesChart');
    caloriesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data.calories),
        datasets: [{
          label: 'Calories Burned',
          data: Object.values(data.calories),
          backgroundColor: '#cc65fe'
        }]
      }
    });
  }

  function destroyCharts() {
    if (durationChart) durationChart.destroy();
    if (activityChart) activityChart.destroy();
    if (caloriesChart) caloriesChart.destroy();
  }

  function updateColors() {
    const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#374151';
    Chart.defaults.color = textColor;
    if (durationChart) durationChart.update();
    if (activityChart) activityChart.update();
    if (caloriesChart) caloriesChart.update();
  }

  return { init, refresh, updateColors };
})();

/* ==================== */
/* 7  PetEntry Module      */
/* ==================== */
const PetEntry = (function() {
  // ... (Previous parts of PetEntry Module from Code Block 2) ...

  // SECTION 6: RENDER FUNCTIONS (Partial - Calendar)
  const render = {
    calendar: () => {
      try {
        document.getElementById('calendarContainer').innerHTML = `
          <div class="calendar">
            <div class="calendar-header">
              <button id="prevMonth">&lt;</button>
              <h3 id="currentMonth">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <button id="nextMonth">&gt;</button>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
          </div>`;

        // Initialize calendar grid
        updateCalendar();
      } catch (e) {
        utils.handleError(e, 'renderCalendar');
      }
    }
  };

  // SECTION 8: CALENDAR FUNCTIONS
  function updateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
      calendarGrid.innerHTML = '';

      // Add day headers
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
      });

      // Add empty cells for days before first day
      for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
      }

      // Add days
      const activePet = dataService.getActivePet();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        // Highlight days with exercise
        if (activePet?.exerciseEntries?.some(e => e.date === dateStr)) {
          dayCell.classList.add('has-exercise');
        }

        calendarGrid.appendChild(dayCell);
      }
    }
  }

  // ... (Rest of PetEntry Module from Code Block 2, including initEventListeners and showExerciseLog) ...
})();
