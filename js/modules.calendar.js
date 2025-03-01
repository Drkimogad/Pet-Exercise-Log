"use strict";

const CalendarModule = (function() {
  // Function to generate the calendar and add event listeners
  function generateCalendar() {
    // Create the calendar structure (You can modify this based on your preferred design)
    const calendarContainer = document.getElementById("exerciseCalendar");
    if (!calendarContainer) {
      console.error("Calendar container not found.");
      return;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get the first and last date of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const firstDay = firstDayOfMonth.getDay();  // Day of the week (0-6, Sunday-Saturday)
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Create the calendar HTML
    let calendarHTML = `
      <h2>${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${currentYear}</h2>
      <table>
        <thead>
          <tr>
            <th>Sun</th>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
            <th>Sat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
    `;

    // Fill the calendar with empty cells until the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarHTML += "<td></td>";
    }

    // Add the days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = currentDate.getDay();

      // Create a clickable day cell
      calendarHTML += `<td class="calendar-day" data-date="${currentYear}-${currentMonth + 1}-${day}">${day}</td>`;

      // Start a new row every Saturday
      if (dayOfWeek === 6) {
        calendarHTML += "</tr><tr>";
      }
    }

    // Close the table and calendar container
    calendarHTML += "</tr></tbody></table>";

    calendarContainer.innerHTML = calendarHTML;

    // Attach event listeners to the day cells
    const dayCells = document.querySelectorAll(".calendar-day");
    dayCells.forEach(cell => {
      cell.addEventListener("click", handleDayClick);
    });
  }

  // Function to handle clicking on a day in the calendar
  function handleDayClick(event) {
    const clickedDate = event.target.dataset.date;
    console.log("Clicked date:", clickedDate);

    // Load the exercise entries for the selected date
    loadExerciseForDate(clickedDate);
  }

  // Function to load exercise entries for a specific date (assuming exercise data is stored in localStorage)
  function loadExerciseForDate(date) {
    const exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];
    const exercisesForDate = exerciseData.filter(entry => entry.date === date);

    if (exercisesForDate.length > 0) {
      console.log("Exercises for this day:", exercisesForDate);
      // You can render this data or update UI accordingly
    } else {
      console.log("No exercises found for this day.");
    }
  }

  return { generateCalendar };
})();
