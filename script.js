"use strict";

document.addEventListener('DOMContentLoaded', () => {
  ServiceWorkerModule.registerServiceWorker();
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  if (sessionStorage.getItem('user')) {
    PetEntryModule.showExerciseLog();
  } else {
    AuthModule.showSignIn();
  }
});
// appHelper.js 
"use strict";

const AppHelper = (function() {
  // Cache DOM references
  const appContainer = document.getElementById('app');
  const components = {};

  function showPage(pageHTML) {
    appContainer.innerHTML = pageHTML;
  }

  // New component management system
  function renderComponent(componentId, html) {
    const target = document.getElementById(componentId);
    if (target) {
      target.innerHTML = html;
      return true;
    }
    return false;
  }

  // Dynamic section updater
  function updateSection(sectionId, content) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.innerHTML = content;
      return true;
    }
    return false;
  }

  // Component registration system
  function registerComponent(id, renderCallback) {
    components[id] = renderCallback;
  }

  // Refresh specific component
  function refreshComponent(id) {
    if (components[id]) {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = components[id]();
      }
    }
  }

  // Show error
  function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    appContainer.appendChild(errorContainer);
    setTimeout(() => {
      errorContainer.remove();
    }, 5000);
  }

  // Show errors
  function showErrors(messages) {
    messages.forEach(message => showError(message));
  }

  return {
    showPage,
    renderComponent,
    updateSection,
    registerComponent,
    refreshComponent,
    showError,
    showErrors
  };
})();

// authModule.js 
"use strict";

const AuthModule = (function() {
  // Private state
  let currentUser = null;
  
  // Enhanced password hashing with salt
  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const saltedPass = salt ? password + salt : password;
    const data = encoder.encode(saltedPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Unified auth form template
  function authTemplate(isSignUp) {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>${isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <form id="authForm">
            ${isSignUp ? `
              <div class="form-group">
                <label for="username">Pet Owner Name</label>
                <input type="text" id="username" required>
              </div>
            ` : ''}
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <!-- UPDATED: Removed pattern and hints -->
              <input type="password" id="password" required minlength="8">
            </div>

            ${isSignUp ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" required>
              </div>
            ` : ''}

            <button type="submit" class="auth-btn">
              ${isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div class="auth-switch">
            ${isSignUp ? 'Already have an account?' : 'New user?'}
            <a href="#" id="switchAuth">${isSignUp ? 'Sign In' : 'Create Account'}</a>
          </div>
        </div>
      </div>
    `;
  }

  // Form validation
  function validateForm(formData, isSignUp) {
    const errors = [];
    
    if (isSignUp) {
      if (!formData.username?.trim()) {
        errors.push('Name is required');
      }
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }

    // UPDATED: Removed uppercase, lowercase, and number restrictions
    if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  }

  // Handle auth success
  function handleAuthSuccess(userData, isSignUp) {
    currentUser = userData;
    sessionStorage.setItem('user', JSON.stringify(userData));
    if (isSignUp) {
      showAuth(false); // Redirect to sign in form after successful sign up
    } else {
      // If you add a DashboardModule later, you can call its init function here.
      // For now, we use PetEntryModule directly.
      PetEntryModule.showExerciseLog();
    }
  }

  // Unified auth handler
  async function handleAuthSubmit(e, isSignUp) {
    e.preventDefault();
    
    const formData = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      ...(isSignUp && {
        username: document.getElementById('username').value,
        confirmPassword: document.getElementById('confirmPassword')?.value
      })
    };

    const errors = validateForm(formData, isSignUp);
    if (errors.length > 0) {
      AppHelper.showErrors(errors);
      return;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
      const hashedPassword = await hashPassword(formData.password, salt);
      
      const userData = {
        ...(isSignUp && { username: formData.username }),
        email: formData.email,
        password: hashedPassword,
        salt,
        lastLogin: new Date().toISOString()
      };

      handleAuthSuccess(userData, isSignUp);
    } catch (error) {
      AppHelper.showError('Authentication failed. Please try again.');
      console.error('Auth error:', error);
    }
  }

  // Show auth view
  function showAuth(isSignUp = false) {
    AppHelper.showPage(authTemplate(isSignUp));

    document.getElementById('authForm').addEventListener('submit', (e) => {
      handleAuthSubmit(e, isSignUp);
    });

    document.getElementById('switchAuth').addEventListener('click', (e) => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  // Check auth status
  function checkAuth() {
    return sessionStorage.getItem('user') !== null;
  }

  // Logout
  function logout() {
    sessionStorage.removeItem('user');
    currentUser = null;
    AppHelper.showPage('<div class="logout-message">Successfully logged out</div>');
    setTimeout(() => showAuth(false), 2000);
  }

  return {
    showAuth,
    checkAuth,
    logout,
    getCurrentUser: () => currentUser
  };
})();

// "use strict";

const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7dEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAAAAADgNhG4AAE0mNlCAAAAAElFTkSuQmCC';

  // HTML Templates
  const templates = {
    dashboard: () => `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
          <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
        </header>

        <main class="dashboard-main">
          <section class="form-section" id="petFormContainer">
            ${templates.petForm()}
          </section>

          <section class="data-section">
            <div class="calendar-container" id="exerciseCalendar"></div>
            <div class="charts-container"></div>
          </section>
        </main>

        <aside class="saved-profiles" id="savedProfiles"></aside>
      </div>
    `,

    petForm: () => `
      <form id="exerciseForm" class="pet-form card">
        <fieldset class="pet-details">
          <legend>Pet Profile</legend>
          <div class="form-group">
            <label for="petName">Name</label>
            <input type="text" id="petName" required>
          </div>
          <div class="form-group">
            <label>Image</label>
            <div class="image-upload">
              <input type="file" id="petImage" accept="image/*">
              <img id="petImagePreview" src="${DEFAULT_IMAGE}" alt="Pet Preview">
            </div>
          </div>
          <div class="form-group">
            <label for="petCharacteristics">Description</label>
            <textarea id="petCharacteristics" rows="3"></textarea>
          </div>
        </fieldset>

        <fieldset class="exercise-entry">
          <legend>New Exercise</legend>
          <div class="form-grid">
            <div class="form-group">
              <label for="exerciseType">Type</label>
              <select id="exerciseType" required>
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="swimming">Swimming</option>
                <option value="playing">Playing</option>
              </select>
            </div>
            <div class="form-group">
              <label for="exerciseDuration">Duration (min)</label>
              <input type="number" id="exerciseDuration" min="1" required>
            </div>
            <div class="form-group">
              <label for="exerciseDate">Date</label>
              <input type="date" id="exerciseDate" required>
            </div>
            <div class="form-group">
              <label for="caloriesBurned">Calories</label>
              <input type="number" id="caloriesBurned" min="1" required>
            </div>
          </div>
          <button type="submit" class="primary-btn">
            ${activePetIndex === null ? 'Create Profile' : 'Add Exercise'}
          </button>
        </fieldset>
      </form>
    `
  };

  // Core Functions
  function showExerciseLog() {
    AppHelper.showPage(templates.dashboard());
    initializeModules();
    setupEventListeners();
    loadSavedProfiles();
    loadActivePetData();
  }

  function initializeModules() {
    CalendarModule.init('#exerciseCalendar');
    ChartsModule.init('.charts-container');
  }

  function setupEventListeners() {
    document.getElementById('exerciseForm').addEventListener('submit', (e) => {
      handleFormSubmit(e);
    });
    document.getElementById('petImage').addEventListener('change', (e) => {
      handleImageUpload(e);
    });
    document.getElementById('toggleModeButton').addEventListener('click', toggleDarkMode);
    document.getElementById('addNewProfileButton').addEventListener('click', resetForm);
  }

  // Data Handling
  function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = validateFormData({
        petName: document.getElementById('petName').value,
        petImage: document.getElementById('petImagePreview').src,
        characteristics: document.getElementById('petCharacteristics').value,
        exerciseType: document.getElementById('exerciseType').value,
        duration: document.getElementById('exerciseDuration').value,
        date: document.getElementById('exerciseDate').value,
        calories: document.getElementById('caloriesBurned').value
      });

      const updatedPet = processPetData(formData);
      savePetData(updatedPet);
      updateDashboard(updatedPet);

    } catch (error) {
      AppHelper.showError(error.message);
    }
  }

  function validateFormData(data) {
    const errors = [];
    if (!data.petName.trim()) errors.push('Pet name is required');
    if (data.duration < 1) errors.push('Duration must be at least 1 minute');
    if (data.calories < 1) errors.push('Calories burned must be at least 1');
    if (!data.date) errors.push('Date is required');

    if (errors.length > 0) throw new Error(errors.join('\n'));
    return data;
  }

  function processPetData(formData) {
    const currentPet = getActivePet() || {
      petDetails: { name: '', image: DEFAULT_IMAGE, characteristics: '' },
      exerciseEntries: []
    };

    return {
      petDetails: {
        ...currentPet.petDetails,
        name: formData.petName,
        image: formData.petImage,
        characteristics: formData.characteristics
      },
      exerciseEntries: [
        ...currentPet.exerciseEntries,
        {
          exerciseType: formData.exerciseType,
          duration: Number(formData.duration),
          date: formData.date,
          caloriesBurned: Number(formData.calories)
        }
      ]
    };
  }

  function savePetData(petData) {
    const pets = getPets();
    
    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) throw new Error('Maximum pet profiles reached');
      pets.push(petData);
      activePetIndex = pets.length - 1;
    } else {
      pets[activePetIndex] = petData;
    }

    localStorage.setItem('pets', JSON.stringify(pets));
    sessionStorage.setItem('activePetIndex', activePetIndex);
  }

  // Dashboard Integration
  function updateDashboard(petData) {
    CalendarModule.refresh(petData.exerciseEntries);
    ChartsModule.refresh(petData.exerciseEntries);
    loadSavedProfiles();
    // UPDATED: Refresh the pet form section using AppHelper helper.
    AppHelper.refreshComponent('#petFormContainer', templates.petForm());
  }

  function loadActivePetData() {
    const savedIndex = sessionStorage.getItem('activePetIndex');
    if (savedIndex !== null) {
      activePetIndex = parseInt(savedIndex, 10);
      const petData = getPets()[activePetIndex];
      if (petData) updateDashboard(petData);
    }
  }

  // Profile Management
  function loadSavedProfiles() {
    const pets = getPets();
    const profilesHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
        <img src="${pet.petDetails.image || DEFAULT_IMAGE}" alt="${pet.petDetails.name}">
        <h4>${pet.petDetails.name}</h4>
        <button class="select-btn" data-index="${index}">
          ${index === activePetIndex ? 'Selected' : 'Select'}
        </button>
      </div>
    `).join('');

    AppHelper.renderComponent('#savedProfiles', profilesHTML);
    addProfileEventListeners();
  }

  function addProfileEventListeners() {
    document.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = parseInt(btn.dataset.index, 10);
        loadActivePetData();
      });
    });
  }

  // Utility Functions
  function resetForm() {
    activePetIndex = null;
    sessionStorage.removeItem('activePetIndex');
    AppHelper.refreshComponent('#petFormContainer', templates.petForm());
    loadSavedProfiles();
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    ChartsModule.updateColors();
    CalendarModule.refresh(CalendarModule && CalendarModule.refresh ? [] : []); // UPDATED: trigger a calendar refresh if needed.
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('petImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // New function to allow showing the entry form from Calendar modal
  function showEntryForm(date) {
    // Pre-fill the exercise date field with the selected date from the calendar.
    document.getElementById('exerciseDate').value = date;
    // Optionally, you could scroll or focus the form.
    document.getElementById('exerciseForm').scrollIntoView({ behavior: 'smooth' });
  }

  // Public API
  return {
    showExerciseLog,
    getPets: () => JSON.parse(localStorage.getItem("pets")) || [],
    getActivePet: () => activePetIndex !== null ? JSON.parse(localStorage.getItem("pets"))[activePetIndex] : null,
    showEntryForm // Expose the new function for calendar integration
  };
})();

// calendarModule.js 
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
    generateCalendar(); // UPDATED: removed "this." prefix
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
        ${generateDayHeaders()}
        ${generateCalendarDays()}
      </div>
    `;
    
    container.innerHTML = calendarHTML;
    addEventListeners();
    highlightExerciseDays();
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
      const exerciseCount = getExerciseCountForDate(dateString);
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
      const count = getExerciseCountForDate(day.dataset.date);
      day.classList.toggle('has-exercise', count > 0);
    });
  }

  function addEventListeners() {
    // UPDATED: Use arrow functions so that the module context is maintained.
    document.querySelector('.prev-month').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      generateCalendar();
    });

    document.querySelector('.next-month').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      generateCalendar();
    });

    document.querySelector('.calendar-grid').addEventListener('click', (e) => {
      const dayElement = e.target.closest('.calendar-day:not(.empty)');
      if (dayElement) {
        handleDayClick(dayElement.dataset.date);
      }
    });
  }

  function handleDayClick(date) {
    const entries = exerciseData.filter(entry => entry.date === date);
    showDayModal(date, entries);
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
      // UPDATED: Reference PetEntryModule directly.
      PetEntryModule.showEntryForm(e.target.dataset.date);
      closeModal();
    });

    document.querySelector('.close-modal-btn').addEventListener('click', closeModal);
  }

  function closeModal() {
    document.querySelector('.calendar-modal')?.remove();
  }

  function refresh(data) {
    exerciseData = data;
    generateCalendar();
  }

  return {
    init,
    generateCalendar,
    refresh,
    handleDayClick,
    closeModal
  };
})();

// chartsModule.js 
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

// serviceWorkerModule.js 
"use strict";

const ServiceWorkerModule = (function() {
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    }
  }

  return { registerServiceWorker };
})();





