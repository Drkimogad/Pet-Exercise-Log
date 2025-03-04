"use strict";

const CalendarModule = (function() {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let exerciseData = [];

  function init(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error("Calendar container not found");
      return;
    }
    container.innerHTML = '<div class="calendar-container"></div>';
    this.generateCalendar();
  }

  function generateCalendar() {
    const container = document.querySelector('.calendar-container');
    const date = new Date(currentYear, currentMonth, 1);
    
    const calendarHTML = `
      <div class="calendar-header">
        <button class="nav-btn prev-month">←</button>
        <h2>${date.toLocaleString('default', { month: 'long' })} ${currentYear}</h2>
        <button class="nav-btn next-month">→</button>
      </div>
      <div class="calendar-grid">
        ${this.generateDayHeaders()}
        ${this.generateCalendarDays()}
      </div>
    `;
    
    container.innerHTML = calendarHTML;
    this.addEventListeners();
    this.highlightExerciseDays();
  }

  function generateDayHeaders() {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(day => `<div class="calendar-header-day">${day}</div>`)
      .join('');
  }

  function generateCalendarDays() {
    const startDay = new Date(currentYear, currentMonth, 1).getDay();
    const endDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    let daysHTML = '';
    
    // Empty days from previous month
    for (let i = 0; i < startDay; i++) {
      daysHTML += `<div class="calendar-day empty"></div>`;
    }

    // Current month days
    for (let day = 1; day <= endDate; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const exerciseCount = this.getExerciseCountForDate(dateString);
      daysHTML += `
        <div class="calendar-day" data-date="${dateString}">
          ${day}
          ${exerciseCount > 0 ? `<div class="exercise-indicator">${exerciseCount}</div>` : ''}
        </div>
      `;
    }

    return daysHTML;
  }

  function getExerciseCountForDate(date) {
    return exerciseData.filter(entry => entry.date === date).length;
  }

  function highlightExerciseDays() {
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      const count = this.getExerciseCountForDate(day.dataset.date);
      day.classList.toggle('has-exercise', count > 0);
    });
  }

  function addEventListeners() {
    document.querySelector('.prev-month').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      this.generateCalendar();
    });

    document.querySelector('.next-month').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      this.generateCalendar();
    });

    document.querySelector('.calendar-grid').addEventListener('click', (e) => {
      const dayElement = e.target.closest('.calendar-day:not(.empty)');
      if (dayElement) {
        this.handleDayClick(dayElement.dataset.date);
      }
    });
  }

  function handleDayClick(date) {
    const entries = exerciseData.filter(entry => entry.date === date);
    this.showDayModal(date, entries);
  }

  function showDayModal(date, entries) {
    const modalHTML = `
      <div class="calendar-modal">
        <div class="modal-content">
          <h3>Exercises for ${date}</h3>
          ${entries.length > 0 ? 
            entries.map(entry => `
              <div class="exercise-entry">
                <span>${entry.exerciseType}</span>
                <span>${entry.duration} mins</span>
              </div>
            `).join('') : 
            '<p>No exercises recorded</p>'
          }
          <button class="add-exercise-btn" data-date="${date}">Add Exercise</button>
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.querySelector('.add-exercise-btn').addEventListener('click', (e) => {
      PetEntryModule.showEntryForm(e.target.dataset.date);
      this.closeModal();
    });

    document.querySelector('.close-modal-btn').addEventListener('click', this.closeModal);
  }

  function closeModal() {
    document.querySelector('.calendar-modal')?.remove();
  }

  function refresh(data) {
    exerciseData = data;
    this.generateCalendar();
  }

  return {
    init,
    generateCalendar,
    refresh,
    handleDayClick,
    closeModal
  };
})();
