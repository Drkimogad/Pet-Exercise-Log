

/* ==================== */
/* PetEntry Module      */
/* ==================== */
 const PetEntry = (function() {
  // SECTION 1: CONSTANTS AND CONFIGURATION
  const CONFIG = {
    MAX_PETS: 10,
    DEFAULT_IMAGE: 'default-pet.png',
    EMOJIS: ['😀', '😐', '😞', '😊', '😠'],
    EXERCISE_LEVELS: ['high', 'medium', 'low'],
    FAVORITE_EXERCISES: ['running', 'swimming', 'fetch', 'walking', 'playing'],
    ACTIVITY_TYPES: [
      'running_park', 
      'around_block', 
      'swimming', 
      'house_play', 
      'companion_play'
    ],
    LOCATIONS: ['park', 'backyard', 'indoors', 'beach', 'trail']
  };

  // SECTION 2: STATE MANAGEMENT
  let state = {
    activePetIndex: sessionStorage.getItem('activePetIndex') 
      ? parseInt(sessionStorage.getItem('activePetIndex')) 
      : null,
    darkMode: localStorage.getItem('darkMode') === 'true'
  };

  // SECTION 3: TEMPLATES
  const templates = {
    dashboard: () => `
      <div class="dashboard ${state.darkMode ? 'dark-mode' : ''}">
        <header class="dashboard-header">
          <h1>Pet Exercise Log</h1>
          <div class="header-actions">
            <button id="addNewProfileButton" class="add-btn">+ Add Pet</button>
            <button id="toggleModeButton" class="toggle-btn">
              ${state.darkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </header>

        <div class="dashboard-container">
          <div class="section">
            <h2>Pet Profile</h2>
            <div id="petFormContainer"></div>
          </div>

          <div class="section">
            <h2>Daily Mood Logs</h2>
            <div id="moodLogs"></div>
          </div>

          <div class="section">
            <h2>Exercise Calendar</h2>
            <div id="calendarContainer"></div>
          </div>

          <div class="section">
            <h2>Activity Charts</h2>
            <div id="exerciseCharts"></div>
          </div>

          <div class="section">
            <h2>Saved Profiles</h2>
            <div id="savedProfiles"></div>
          </div>
        </div>

        <button id="saveAllButton" class="save-btn">Save All</button>
        <button id="logoutButton" class="logout-btn">Logout</button>
        
        <footer>
          <p>© ${new Date().getFullYear()} Pet Exercise Log. All rights reserved.</p>
        </footer>
      </div>`,

    petForm: (pet = {}) => `
      <form id="petForm" class="pet-form">
        <input type="hidden" id="petId" value="${pet.id || crypto.randomUUID()}">
        
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" value="${pet.name || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="petImage">Pet Image</label>
          <div class="image-upload">
            <input type="file" id="petImage" accept="image/*">
            <img id="petImagePreview" src="${pet.image || CONFIG.DEFAULT_IMAGE}" 
                 alt="Pet Preview" style="max-width: 150px;">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="petAge">Age</label>
            <input type="number" id="petAge" value="${pet.age || ''}" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="petWeight">Weight</label>
            <input type="number" id="petWeight" value="${pet.weight || ''}" min="0" required>
          </div>
        </div>

        <div class="form-group">
          <label for="petExerciseLevel">Exercise Level</label>
          <select id="petExerciseLevel" required>
            ${CONFIG.EXERCISE_LEVELS.map(level => `
              <option value="${level}" ${pet.exerciseLevel === level ? 'selected' : ''}>
                ${level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="petFavoriteExercise">Favorite Exercise</label>
          <select id="petFavoriteExercise">
            ${CONFIG.FAVORITE_EXERCISES.map(ex => `
              <option value="${ex}" ${pet.favoriteExercise === ex ? 'selected' : ''}>
                ${ex.charAt(0).toUpperCase() + ex.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="petLastActivity">Last Activity</label>
          <select id="petLastActivity">
            ${CONFIG.ACTIVITY_TYPES.map(act => `
              <option value="${act}" ${pet.lastActivity === act ? 'selected' : ''}>
                ${act.replace('_', ' ').split(' ').map(s => 
                  s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="petExerciseLocation">Exercise Location</label>
          <select id="petExerciseLocation">
            ${CONFIG.LOCATIONS.map(loc => `
              <option value="${loc}" ${pet.exerciseLocation === loc ? 'selected' : ''}>
                ${loc.charAt(0).toUpperCase() + loc.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- RESTORED FIELDS -->
        <div class="form-group">
          <label for="petDate">Date</label>
          <input type="date" id="petDate" value="${pet.date || new Date().toISOString().split('T')[0]}" required>
        </div>
        
        <div class="form-group">
          <label for="petExerciseDuration">Exercise Duration (minutes)</label>
          <input type="number" id="petExerciseDuration" 
                value="${pet.exerciseDuration || '30'}" min="0" required>
        </div>
        
        <div class="form-group">
          <label for="petCalories">Calories Burnt</label>
          <input type="number" id="petCalories" 
                value="${pet.calories || '150'}" min="0" required>
        </div>

        <div class="form-group mood-selector">
          <label>Today's Mood:</label>
          <div class="mood-options">
            ${CONFIG.EMOJIS.map((emoji, index) => `
              <button type="button" class="emoji-btn ${pet.mood === index ? 'selected' : ''}" 
                      data-mood="${index}" data-date="${new Date().toISOString().split('T')[0]}">
                ${emoji}
              </button>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="save-btn">Save Profile</button>
      </form>`
  };

// In PetEntry.showExerciseLog():
function showExerciseLog() {
  AppHelper.showPage(templates.dashboard());
  render.petForm();
  
  // Initialize all sections
  initMoodLogs();
  initCalendar();
  initCharts();
  render.savedProfiles();
}

function initMoodLogs() {
  const pets = dataService.getPets();
  const activePet = dataService.getActivePet();
  if (activePet) {
    document.getElementById('moodLogs').innerHTML = `
      <div class="mood-container">
        ${activePet.moodLogs?.map(log => `
          <div class="mood-entry">
            <span>${new Date(log.date).toLocaleDateString()}</span>
            <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
          </div>
        `).join('') || '<p>No mood entries yet</p>'}
      </div>`;
  }
}

function initCalendar() {
  // Initialize your calendar component here
  document.getElementById('calendarContainer').innerHTML = `
    <div class="calendar">
      <!-- Calendar implementation -->
    </div>`;
}


   
  // SECTION 4: UTILITY FUNCTIONS
  const utils = {
    generateId: () => crypto.randomUUID() || Math.random().toString(36).substring(2, 15),
    
    formatDate: (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        });
      } catch (e) {
        console.error('Date formatting error:', e);
        return dateStr;
      }
    },
    
    validatePet: (pet) => {
      const errors = [];
      if (!pet.name) errors.push('Pet name is required');
      if (!pet.age || pet.age < 0) errors.push('Valid age is required');
      if (!pet.weight || pet.weight < 0) errors.push('Valid weight is required');
      if (!pet.exerciseLevel) errors.push('Exercise level is required');
      if (!pet.date) errors.push('Date is required');
      if (!pet.exerciseDuration || pet.exerciseDuration < 0) errors.push('Valid duration is required');
      if (!pet.calories || pet.calories < 0) errors.push('Valid calories is required');
      return errors.length ? errors : null;
    },
    
    handleError: (error, context = '') => {
      console.error(`Error in ${context}:`, error);
      AppHelper.showError(`Operation failed: ${error.message}`);
    }
  };

  // SECTION 5: DATA MANAGEMENT
  const dataService = {
    cache: null,
    getPets: () => {
      try {
        if (!dataService.cache) {
          dataService.cache = JSON.parse(localStorage.getItem('pets')) || [];
        }
        return [...dataService.cache];
      } catch (e) {
        utils.handleError(e, 'getPets');
        return [];
      }
    },
    
    savePets: (pets) => {
      try {
        if (pets.length > CONFIG.MAX_PETS) {
          throw new Error(`Maximum of ${CONFIG.MAX_PETS} pets allowed`);
        }
        dataService.cache = pets;
        localStorage.setItem('pets', JSON.stringify(pets));
        console.log('Pets data saved');
      } catch (e) {
        utils.handleError(e, 'savePets');
      }
    },
    
    getActivePet: () => {
      const pets = dataService.getPets();
      return state.activePetIndex !== null ? pets[state.activePetIndex] : null;
    }
  };

  // SECTION 6: RENDER FUNCTIONS
  const render = {
    petForm: (editIndex = null) => {
      try {
        const pets = dataService.getPets();
        const pet = editIndex !== null ? pets[editIndex] : {};
        document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
      } catch (e) {
        utils.handleError(e, 'renderPetForm');
      }
    },
    
    savedProfiles: () => {
      try {
        const pets = dataService.getPets();
        const html = `
          <div class="saved-profiles-list">
            ${pets.map((pet, index) => `
              <div class="saved-profile ${state.activePetIndex === index ? 'active' : ''}">
                <img src="${pet.image || CONFIG.DEFAULT_IMAGE}" alt="${pet.name}">
                <h4>${pet.name}</h4>
                <div class="profile-actions">
                  <button class="edit-btn" data-index="${index}">Edit</button>
                  <button class="delete-btn" data-index="${index}">Delete</button>
                  <button class="print-btn" data-index="${index}">Print</button>
                </div>
              </div>
            `).join('')}
          </div>`;
        document.getElementById('savedProfiles').innerHTML = html;
      } catch (e) {
        utils.handleError(e, 'renderSavedProfiles');
      }
    },
    
    moodLogs: () => {
      try {
        const activePet = dataService.getActivePet();
        if (activePet) {
          document.getElementById('moodLogs').innerHTML = `
            <div class="mood-container">
              ${activePet.moodLogs?.map(log => `
                <div class="mood-entry">
                  <span>${utils.formatDate(log.date)}</span>
                  <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
                </div>
              `).join('') || '<p>No mood entries yet</p>'}
            </div>`;
        }
      } catch (e) {
        utils.handleError(e, 'renderMoodLogs');
      }
    },
    
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

  // SECTION 7: EVENT HANDLERS
  const handlers = {
    handleImageUpload: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('petImagePreview').src = event.target.result;
      };
      reader.onerror = (e) => utils.handleError(e, 'imageUpload');
      reader.readAsDataURL(file);
    },
    
    handleFormSubmit: (e) => {
      e.preventDefault();
      try {
        const pets = dataService.getPets();
        let pet = state.activePetIndex !== null 
          ? pets[state.activePetIndex] 
          : { id: utils.generateId(), exerciseEntries: [], moodLogs: [] };
        
        // Get form values
        pet.name = document.getElementById('petName').value;
        pet.age = parseInt(document.getElementById('petAge').value);
        pet.weight = parseFloat(document.getElementById('petWeight').value);
        pet.image = document.getElementById('petImagePreview').src;
        pet.exerciseLevel = document.getElementById('petExerciseLevel').value;
        pet.favoriteExercise = document.getElementById('petFavoriteExercise').value;
        pet.lastActivity = document.getElementById('petLastActivity').value;
        pet.exerciseLocation = document.getElementById('petExerciseLocation').value;
        pet.date = document.getElementById('petDate').value;
        pet.exerciseDuration = parseInt(document.getElementById('petExerciseDuration').value);
        pet.calories = parseInt(document.getElementById('petCalories').value);
        
        // Validate
        const errors = utils.validatePet(pet);
        if (errors) return AppHelper.showError(errors.join('\n'));
        
        // Save
        if (state.activePetIndex === null) {
          pets.push(pet);
          state.activePetIndex = pets.length - 1;
        } else {
          pets[state.activePetIndex] = pet;
        }
        
        dataService.savePets(pets);
        sessionStorage.setItem('activePetIndex', state.activePetIndex);
        render.savedProfiles();
        render.moodLogs();
        Charts.refresh(pets[state.activePetIndex].exerciseEntries || []);
      } catch (e) {
        utils.handleError(e, 'formSubmit');
      }
    },
    
    handleMoodSelection: (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const mood = parseInt(e.target.dataset.mood);
        const date = e.target.dataset.date;
        const pets = dataService.getPets();
        let pet = pets[state.activePetIndex] || {};
        
        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
        pet.moodLogs.push({ date, mood });
        
        pets[state.activePetIndex] = pet;
        dataService.savePets(pets);
        
        // Update UI
        document.querySelectorAll('.emoji-btn').forEach(btn => 
          btn.classList.remove('selected')
        );
        e.target.classList.add('selected');
        render.moodLogs();
      }
    },
    
    handleCalendarNavigation: () => {
      // Implement month navigation
      document.getElementById('prevMonth')?.addEventListener('click', () => {
        // Previous month logic
        updateCalendar();
      });
      
      document.getElementById('nextMonth')?.addEventListener('click', () => {
        // Next month logic
        updateCalendar();
      });
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

  // SECTION 9: INITIALIZATION
  function initEventListeners() {
    // Form Events
    document.getElementById('petForm')?.addEventListener('submit', handlers.handleFormSubmit);
    document.getElementById('petImage')?.addEventListener('change', handlers.handleImageUpload);
    
    // Mood Logs
    document.addEventListener('click', handlers.handleMoodSelection);
    
    // Calendar
    handlers.handleCalendarNavigation();
    
    // Button Events
    document.getElementById('toggleModeButton')?.addEventListener('click', toggleMode);
    document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      state.activePetIndex = null;
      render.petForm();
    });
    
    // Dynamic Events
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-btn')) {
        state.activePetIndex = parseInt(e.target.dataset.index);
        sessionStorage.setItem('activePetIndex', state.activePetIndex);
        render.petForm(state.activePetIndex);
      }
      
      if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pets = dataService.getPets();
        if (confirm(`Delete ${pets[index].name}?`)) {
          pets.splice(index, 1);
          dataService.savePets(pets);
          render.savedProfiles();
        }
      }
    });
  }

  function toggleMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    document.body.classList.toggle('dark-mode');
    
    const toggleBtn = document.getElementById('toggleModeButton');
    if (toggleBtn) {
      toggleBtn.textContent = state.darkMode ? 'Light Mode' : 'Dark Mode';
    }
    
    Charts.updateColors();
  }

  // SECTION 10: PUBLIC API
  return {
    showExerciseLog: () => {
      AppHelper.showPage(templates.dashboard());
      render.petForm();
      render.moodLogs();
      render.calendar();
      initEventListeners();
      
      const activePet = dataService.getActivePet();
      if (activePet) {
        Charts.refresh(activePet.exerciseEntries || []);
      }


/* ==================== */
/* Charts Module        */
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
        acc[e.date] = (acc[e.date] || 0) + e.duration;
        return acc;
      }, {}),
      calories: data.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + e.caloriesBurned;
        return acc;
      }, {}),
      activities: data.reduce((acc, e) => {
        acc[e.exerciseType] = (acc[e.exerciseType] || 0) + 1;
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
      // Initialize charts when visible
      const chartsSection = document.getElementById('exerciseCharts');
      if (chartsSection) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            Charts.init('#exerciseCharts');
            if (activePet) {
              Charts.refresh(activePet.exerciseEntries || []);
            }
            observer.disconnect();
          }
        });
        observer.observe(chartsSection);
      }
    },
    
    updateDashboard: () => {
      this.showExerciseLog();
    }
  };
})();
      
/* ==================== */
/* App Initialization   */
/* ==================== */
document.addEventListener('DOMContentLoaded', () => {
  PetEntry.showExerciseLog();
});
