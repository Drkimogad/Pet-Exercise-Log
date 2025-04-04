import dataService from 'https://drkimogad.github.io/Pet-Exercise-Log/js/dataService.js';

const ChartsSection = (function() {
  const renderCharts = () => {
    const activePet = dataService.getActivePet();
    const exerciseEntries = activePet?.exerciseEntries || [];
    document.getElementById('exerciseCharts').innerHTML = `<canvas id="exerciseChart"></canvas>`;
    initCharts(exerciseEntries);
  };

  const initCharts = (exerciseEntries) => {
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: prepareChartData(exerciseEntries),
      options: getChartOptions()
    });
  };

  const prepareChartData = (exerciseEntries) => {
    const labels = exerciseEntries.map(entry => entry.date);
    const durationData = exerciseEntries.map(entry => entry.duration);
    const caloriesData = exerciseEntries.map(entry => entry.calories);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Duration (minutes)',
          data: durationData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Calories Burned',
          data: caloriesData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getChartOptions = () => {
    return {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  };

  const updateChartColors = () => {
    // Implement logic to update chart colors based on theme
    // Example:
    // if (document.body.classList.contains('dark-mode')) {
    //   // Update colors for dark mode
    // } else {
    //   // Update colors for light mode
    // }
  };

  return {
    renderCharts: renderCharts,
    updateChartColors: updateChartColors
  };
})();
