"use strict";

// ✅ Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

// ✅ Function to show the sign-in page
function showSignIn() {
    document.addEventListener("DOMContentLoaded", () => {
        const authContainer = document.getElementById("auth-container");
        if (authContainer) {
            authContainer.style.display = "block";
        } else {
            console.warn("⚠️ Auth container not found in the DOM. Check if #auth-container exists in index.html.");
        }
    });
}

// ✅ Run on page load
document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();

    // Apply dark mode if enabled
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Check if user is logged in
    if (sessionStorage.getItem('user')) {
        if (typeof PetEntry !== "undefined" && typeof PetEntry.showExerciseLog === "function") {
            PetEntry.showExerciseLog();
        } else {
            console.error("❌ PetEntry or showExerciseLog function is missing!");
        }
    } else {
        showSignIn();
    }
});


// appHelper
const AppHelper = (function() {
  const appContainer = document.getElementById('app');
  const components = {};

  return {
    showPage: (html) => appContainer.innerHTML = html,
    renderComponent: (id, html) => {
      const target = document.getElementById(id);
      if (target) target.innerHTML = html;
      return !!target;
    },
    updateSection: (id, content) => AppHelper.renderComponent(id, content),
    registerComponent: (id, renderFn) => components[id] = renderFn,
    refreshComponent: (id) => components[id] && AppHelper.renderComponent(id, components[id]()),
    showError: (msg) => {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = msg;
      appContainer.appendChild(error);
      setTimeout(() => error.remove(), 5000);
    },
    showErrors: (msgs) => msgs.forEach(msg => AppHelper.showError(msg))
  };
})();

const Auth = (function() {
  let currentUser = null;

  async function hashPassword(pass, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt ? pass + salt : pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function authTemplate(isSignUp) {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>${isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <form id="authForm">
            ${isSignUp ? `
              <div class="form-group">
                <label for="username">Name</label>
                <input type="text" id="username" required>
              </div>` : ''}
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required minlength="8">
            </div>
            ${isSignUp ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" required>
              </div>` : ''}
            <button type="submit" class="auth-btn">${isSignUp ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <div class="auth-switch">
            ${isSignUp ? 'Have an account?' : 'New user?'}
            <a href="#" id="switchAuth">${isSignUp ? 'Sign In' : 'Sign Up'}</a>
          </div>
        </div>
      </div>`;
  }

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

    const errors = [];
    if (isSignUp && !formData.username?.trim()) errors.push('Name required');
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) errors.push('Invalid email');
    if (formData.password.length < 8) errors.push('Password must be 8+ chars');
    if (isSignUp && formData.password !== formData.confirmPassword) errors.push('Passwords mismatch');

    if (errors.length) return AppHelper.showErrors(errors);

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
      const userData = {
        ...(isSignUp && { username: formData.username }),
        email: formData.email,
        password: await hashPassword(formData.password, salt),
        salt,
        lastLogin: new Date().toISOString()
      };
      
      currentUser = userData;
      sessionStorage.setItem('user', JSON.stringify(userData));
      isSignUp ? showAuth(false) : PetEntryModule.showExerciseLog();
    } catch (error) {
      AppHelper.showError('Authentication failed');
      console.error(error);
    }
  }

  function showAuth(isSignUp = false) {
    AppHelper.showPage(authTemplate(isSignUp));
    document.getElementById('authForm').addEventListener('submit', e => handleAuthSubmit(e, isSignUp));
    document.getElementById('switchAuth').addEventListener('click', e => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  return {
    showAuth,
    logout: () => {
      sessionStorage.removeItem('user');
      AppHelper.showPage('<div class="logout-message">Logged out</div>');
      setTimeout(() => showAuth(false), 2000);
    }
  };
})();

const PetEntry = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7dEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAAAAADgNhG4AAE0mNlCAAAAAElFTkSuQmCC';

  const templates = {
    dashboard: () => `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
          <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
        </header>
        <main class="dashboard-main">
          <section class="form-section" id="petFormContainer"></section>
          <section class="data-section">
            <div class="calendar-container" id="exerciseCalendar"></div>
            <div class="charts-container" id="exerciseCharts"></div>
          </section>
        </main>
        <aside class="saved-profiles" id="savedProfiles"></aside>
      </div>`,
    
    petForm: () => `
      <form id="exerciseForm" class="pet-form card">
        <fieldset class="pet-details">
          <legend>${activePetIndex === null ? 'New Pet' : 'Update Pet'}</legend>
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
          <legend>Add Exercise</legend>
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
      </form>`
  };

  function showExerciseLog() {
    AppHelper.showPage(templates.dashboard());
    AppHelper.registerComponent('petFormContainer', () => templates.petForm());
    AppHelper.refreshComponent('petFormContainer');
    
    Calendar.init('#exerciseCalendar');
    Charts.init('#exerciseCharts');
    setupEventListeners();
    loadSavedProfiles();
    loadActivePetData();
  }

  function setupEventListeners() {
    document.getElementById('exerciseForm')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
    document.getElementById('toggleModeButton')?.addEventListener('click', toggleDarkMode);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      activePetIndex = null;
      AppHelper.refreshComponent('petFormContainer');
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
      petName: document.getElementById('petName').value,
      petImage: document.getElementById('petImagePreview').src,
      characteristics: document.getElementById('petCharacteristics').value,
      exerciseType: document.getElementById('exerciseType').value,
      duration: document.getElementById('exerciseDuration').value,
      date: document.getElementById('exerciseDate').value,
      calories: document.getElementById('caloriesBurned').value
    };

    const errors = [];
    if (!formData.petName.trim()) errors.push('Pet name required');
    if (formData.duration < 1) errors.push('Invalid duration');
    if (formData.calories < 1) errors.push('Invalid calories');
    if (errors.length) return AppHelper.showErrors(errors);

    const pets = getPets();
    const petData = activePetIndex !== null ? pets[activePetIndex] : {
      petDetails: { name: '', image: DEFAULT_IMAGE, characteristics: '' },
      exerciseEntries: []
    };

    petData.petDetails = {
      name: formData.petName,
      image: formData.petImage,
      characteristics: formData.characteristics
    };

    petData.exerciseEntries.push({
      exerciseType: formData.exerciseType,
      duration: Number(formData.duration),
      date: formData.date,
      caloriesBurned: Number(formData.calories)
    });

    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) return AppHelper.showError('Maximum profiles reached');
      pets.push(petData);
      activePetIndex = pets.length - 1;
    } else {
      pets[activePetIndex] = petData;
    }

    localStorage.setItem('pets', JSON.stringify(pets));
    sessionStorage.setItem('activePetIndex', activePetIndex);
    updateDashboard(petData);
  }

  function updateDashboard(petData) {
    CalendarModule.refresh(petData.exerciseEntries);
    ChartsModule.refresh(petData.exerciseEntries);
    loadSavedProfiles();
    AppHelper.refreshComponent('petFormContainer');
  }

  function loadSavedProfiles() {
    const pets = getPets();
    const profilesHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
        <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}">
        <h4>${pet.petDetails.name}</h4>
        <button class="select-btn" data-index="${index}">
          ${index === activePetIndex ? 'Selected' : 'Select'}
        </button>
      </div>
    `).join('');

    AppHelper.renderComponent('savedProfiles', profilesHTML);
    document.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = parseInt(btn.dataset.index);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        updateDashboard(getPets()[activePetIndex]);
      });
    });
  }

  function loadActivePetData() {
    const savedIndex = sessionStorage.getItem('activePetIndex');
    if (savedIndex !== null) {
      activePetIndex = parseInt(savedIndex);
      const petData = getPets()[activePetIndex];
      if (petData) updateDashboard(petData);
    }
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    ChartsModule.updateColors();
    CalendarModule.refresh(getActivePet()?.exerciseEntries || []);
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

  return {
    showExerciseLog,
    getPets: () => JSON.parse(localStorage.getItem('pets') || '[]'),
    getActivePet: () => activePetIndex !== null ? this.getPets()[activePetIndex] : null
  };
})();

const Calendar = (function() {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let exerciseData = [];

  function init(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = '<div class="calendar"></div>';
    generateCalendar();
  }

  function generateCalendar() {
    const container = document.querySelector('.calendar');
    if (!container) return;

    const date = new Date(currentYear, currentMonth, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const startDay = date.getDay();
    const endDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    let calendarHTML = `
      <div class="calendar-header">
        <button class="nav-btn prev">←</button>
        <h2>${monthName} ${currentYear}</h2>
        <button class="nav-btn next">→</button>
      </div>
      <div class="calendar-grid">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .map(day => `<div class="calendar-day header">${day}</div>`)
          .join('')}
    `;

    // Empty days
    for (let i = 0; i < startDay; i++) {
      calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    // Actual days
    for (let day = 1; day <= endDate; day++) {
      const paddedMonth = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${paddedMonth}-${String(day).padStart(2, '0')}`;
      const count = exerciseData.filter(e => e.date === dateStr).length;
      calendarHTML += `
        <div class="calendar-day ${count ? 'has-exercise' : ''}" data-date="${dateStr}">
          ${day}
          ${count ? `<div class="exercise-count">${count}</div>` : ''}
        </div>
      `;
    }

    calendarHTML += '</div>';
    container.innerHTML = calendarHTML;
    addEventListeners();
  }

  function addEventListeners() {
    document.querySelector('.prev')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      generateCalendar();
    });

    document.querySelector('.next')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      generateCalendar();
    });

    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        const entries = exerciseData.filter(e => e.date === day.dataset.date);
        showDayModal(day.dataset.date, entries);
      });
    });
  }

  function showDayModal(date, entries) {
    const modalHTML = `
      <div class="calendar-modal">
        <div class="modal-content">
          <h3>Exercises for ${date}</h3>
          ${entries.length ? entries.map(e => `
            <div class="exercise-entry">
              <span>${e.exerciseType}</span>
              <span>${e.duration} mins</span>
              <span>${e.caloriesBurned} cal</span>
            </div>
          `).join('') : '<p>No exercises</p>'}
          <button class="add-exercise-btn" data-date="${date}">Add Exercise</button>
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.querySelector('.add-exercise-btn').addEventListener('click', (e) => {
      PetEntry.getActivePet().exerciseEntries.push({
        date: e.target.dataset.date,
        exerciseType: 'walking',
        duration: 30,
        caloriesBurned: 150
      });
      Calendar.refresh(PetEntry.getActivePet().exerciseEntries);
      document.querySelector('.calendar-modal').remove();
    });
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
      document.querySelector('.calendar-modal').remove();
    });
  }

  function refresh(data) {
    exerciseData = data || [];
    generateCalendar();
  }

  return { init, refresh };
})();

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

 // end of code
