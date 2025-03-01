"use strict";

const ChartsModule = (function() {
  // Function to render the dashboard charts (duration & calories burned)
  function renderDashboardCharts() {
    // Get the canvas elements for the charts
    const durationChartCanvas = document.getElementById("durationChartDashboard");
    const caloriesChartCanvas = document.getElementById("caloriesChartDashboard");

    if (!durationChartCanvas || !caloriesChartCanvas) {
      console.error("Charts' canvas elements not found.");
      return;
    }

    // Example data for the charts (you should replace this with actual data)
    const exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];

    const durationData = exerciseData.map(entry => entry.duration);  // Duration in minutes
    const caloriesData = exerciseData.map(entry => entry.caloriesBurned);  // Calories burned

    // Configuration for the Duration chart
    const durationChartConfig = {
      type: "bar",  // Type of chart (Bar chart in this case)
      data: {
        labels: exerciseData.map(entry => entry.date),  // Dates of exercises
        datasets: [{
          label: "Exercise Duration (min)",
          data: durationData,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Configuration for the Calories chart
    const caloriesChartConfig = {
      type: "line",  // Type of chart (Line chart for calories burned)
      data: {
        labels: exerciseData.map(entry => entry.date),  // Dates of exercises
        datasets: [{
          label: "Calories Burned",
          data: caloriesData,
          fill: false,
          borderColor: "rgba(153, 102, 255, 1)",
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Create the charts
    new Chart(durationChartCanvas, durationChartConfig);
    new Chart(caloriesChartCanvas, caloriesChartConfig);
  }

  return { renderDashboardCharts };
})();
