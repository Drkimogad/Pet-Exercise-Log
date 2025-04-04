import dataService from './dataService.js';

const ReportGenerator = (function() {
  const generatePDF = (pet) => {
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Monthly Pet Report: ${pet.name}</title>
          <style>
            body { font-family: sans-serif; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
            .calendar-day { padding: 5px; }
            .mood-emoji { font-size: 1.5em; }
            .chart-container { width: 100%; height: 300px; }
          </style>
        </head>
        <body>
          <h1>Monthly Pet Report: ${pet.name}</h1>
          ${generatePetDetails(pet)}
          ${generateExerciseCalendar(pet)}
          ${generateMoodCalendar(pet)}
          ${generateExerciseCharts(pet.exerciseEntries)}
          ${generateExerciseSummary(pet.exerciseEntries)}
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Back to Dashboard</button>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const generatePetDetails = (pet) => {
    return `
      <div>
        <h2>Pet Details</h2>
        <p><strong>Name:</strong> ${pet.name}</p>
        <p><strong>Age:</strong> ${pet.age}</p>
        <p><strong>Weight:</strong> ${pet.weight}</p>
      </div>
    `;
  };

  const generateExerciseCalendar = (pet) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let calendarHtml = '<h2>Exercise Calendar</h2><div class="calendar-grid">';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hasExercise = pet.exerciseEntries?.some(entry => entry.date === dateStr);
      calendarHtml += `<div class="calendar-day">${day} ${hasExercise ? '✅' : '❌'}</div>`;
    }
    calendarHtml += '</div>';
    return calendarHtml;
  };

  const generateMoodCalendar = (pet) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let moodHtml = '<h2>Mood Calendar</h2><div class="calendar-grid">';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
      const moodEmoji = moodEntry ? CONFIG.EMOJIS[moodEntry.mood] : '';
      moodHtml += `<div class="calendar-day mood-emoji">${moodEmoji}</div>`;
    }
    moodHtml += '</div>';
    return moodHtml;
  };

  const generateExerciseCharts = (exerciseEntries) => {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    const labels = exerciseEntries.map(entry => entry.date);
    const durationData = exerciseEntries.map(entry => entry.duration);
    const caloriesData = exerciseEntries.map(entry => entry.calories);

    return `
      <h2>Exercise Charts</h2>
      <div class="chart-container">
        <canvas id="durationChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="caloriesChart"></canvas>
      </div>
      <script>
        new Chart(document.getElementById('durationChart').getContext('2d'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Duration (minutes)', data: ${JSON.stringify(durationData)}, backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        new Chart(document.getElementById('caloriesChart').getContext('2d'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Calories Burned', data: ${JSON.stringify(caloriesData)}, backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
      </script>
    `;
  };

  const generateExerciseSummary = (exerciseEntries) => {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    const totalDays = exerciseEntries.length;
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = exerciseEntries.reduce((sum, entry) => sum + entry.calories, 0);

    return `
      <h2>Exercise Summary</h2>
      <p><strong>Total Days:</strong> ${totalDays}</p>
      <p><strong>Total Duration:</strong> ${totalDuration} minutes</p>
      <p><strong>Total Calories:</strong> ${totalCalories} calories</p>
    `;
  };

  return {
    generatePDF: generatePDF
  };
})();
