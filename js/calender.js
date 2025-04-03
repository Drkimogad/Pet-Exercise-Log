
const CalendarSection = (function() {
  const renderCalendar = () => {
    document.getElementById('calendarContainer').innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <button id="prevMonth">&lt;</button>
          <h3 id="currentMonth">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <button id="nextMonth">&gt;</button>
        </div>
        <div class="calendar-grid" id="calendarGrid"></div>
      </div>`;
    updateCalendar();
    attachCalendarNavigationHandlers();
  };

  const updateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
      calendarGrid.innerHTML = '';
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
      });
      for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
      }
      // Assuming 'dataService' and 'getActivePet' are available globally or passed as arguments
      const activePet = dataService.getActivePet();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        if (activePet?.exerciseEntries?.some(e => e.date === dateStr)) {
          dayCell.classList.add('has-exercise');
        }
        calendarGrid.appendChild(dayCell);
      }
    }
  };

  const attachCalendarNavigationHandlers = () => {
    document.getElementById('prevMonth')?.addEventListener('click', updateCalendar);
    document.getElementById('nextMonth')?.addEventListener('click', updateCalendar);
  };

  return {
    renderCalendar: renderCalendar
  };
})();
