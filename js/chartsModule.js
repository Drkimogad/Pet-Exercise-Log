"use strict";

const ChartsModule = (function() {
  let durationChart = null;
  let caloriesChart = null;
  let activityChart = null;
  let currentExerciseData = []; // UPDATED: store current exercise data for re-rendering
  const chartConfig = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: { 
      x: { ticks: { color: '#374151' } }, // UPDATED: add x scale for tick color
      y: { beginAtZero: true, ticks: { color: '#374151' } }
    }
  };

  function init(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error("Charts container not found");
      return;
    }
    
    container.innerHTML = `
      <div class="charts-grid">
        <div class="chart-container">
          <canvas id="durationChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="activityChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="caloriesChart"></canvas>
        </div>
      </div>
    `;
  }

  function refresh(exerciseData) {
    currentExerciseData = exerciseData; // UPDATED: update current data
    destroyCharts();
    const processedData = processData(exerciseData);
    createCharts(processedData);
  }

  function processData(data) {
    return {
      labels: [...new Set(data.map(entry => entry.date))].sort(),
      duration: aggregateData(data, 'duration'),
      calories: aggregateData(data, 'caloriesBurned'),
      activities: groupByActivity(data)
    };
  }

  function aggregateData(data, field) {
    return data.reduce((acc, entry) => {
      const date = entry.date;
      acc[date] = (acc[date] || 0) + Number(entry[field]);
      return acc;
    }, {});
  }

  function groupByActivity(data) {
    return data.reduce((acc, entry) => {
      acc[entry.exerciseType] = (acc[entry.exerciseType] || 0) + 1;
      return acc;
    }, {});
  }

  function createCharts(processedData) {
    const ctxDuration = document.getElementById('durationChart');
    const ctxCalories = document.getElementById('caloriesChart');
    const ctxActivity = document.getElementById('activityChart');

    // Duration Chart (Line)
    durationChart = new Chart(ctxDuration, {
      type: 'line',
      data: {
        labels: Object.keys(processedData.duration),
        datasets: [{
          label: 'Total Exercise Duration (min)',
          data: Object.values(processedData.duration),
          borderColor: '#4bc0c0',
          tension: 0.2,
          fill: true
        }]
      },
      options: chartConfig
    });

    // Activity Distribution Chart (Doughnut)
    activityChart = new Chart(ctxActivity, {
      type: 'doughnut',
      data: {
        labels: Object.keys(processedData.activities),
        datasets: [{
          label: 'Activity Distribution',
          data: Object.values(processedData.activities),
          backgroundColor: [
            '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'
          ]
        }]
      },
      options: {
        ...chartConfig,
        plugins: { legend: { position: 'right' } }
      }
    });

    // Calories Chart (Bar)
    caloriesChart = new Chart(ctxCalories, {
      type: 'bar',
      data: {
        labels: Object.keys(processedData.calories),
        datasets: [{
          label: 'Calories Burned',
          data: Object.values(processedData.calories),
          backgroundColor: '#cc65fe',
          borderColor: '#9966ff',
          borderWidth: 1
        }]
      },
      options: chartConfig
    });
  }

  function destroyCharts() {
    if (durationChart) durationChart.destroy();
    if (caloriesChart) caloriesChart.destroy();
    if (activityChart) activityChart.destroy();
  }

  function updateColors() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#374151';
    
    Chart.defaults.color = textColor;
    chartConfig.scales.x.ticks.color = textColor;
    chartConfig.scales.y.ticks.color = textColor;
    
    // UPDATED: Re-render charts using the stored currentExerciseData.
    refresh(currentExerciseData);
  }

  return {
    init,
    refresh,
    updateColors,
    destroyCharts
  };
})();
