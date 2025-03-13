"use strict";

let deferredPrompt; // Store the install event

// ✅ Automatically Show Install Banner
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;

  // Automatically show the prompt after a short delay
  setTimeout(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log(choiceResult.outcome === 'accepted' ? 'User accepted install' : 'User dismissed install');
        deferredPrompt = null; // Reset after use
      } catch (error) {
        console.error('Auto Install prompt failed:', error);
      }
    }
  }, 2000); // 2-second delay before auto prompt

  // Also enable manual install button
  const installButton = document.getElementById('installButton');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;
          console.log(choiceResult.outcome === 'accepted' ? 'User accepted install' : 'User dismissed install');
        } catch (error) {
          console.error('Manual Install failed:', error);
        } finally {
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      }
    });
  }
});

// ✅ Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js', {
      scope: '/Pet-Exercise-Log/'
    }).then(reg => {
      console.log('Service Worker registered with scope:', reg.scope);
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  }
}

// ✅ Fixed showSignIn (no nested DOMContentLoaded)
function showSignIn() {
  const authContainer = document.getElementById("auth-container");
  if (authContainer) {
    authContainer.style.display = "block";
  } else {
    console.warn("⚠️ Auth container not found");
  }
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
    Auth.showAuth();
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

// Authentication //
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
      console.log('Stored user data:', JSON.parse(sessionStorage.getItem('user')));
      isSignUp ? showAuth(false) : PetEntry.showExerciseLog(); // Changed PetEntryModule to PetEntry
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

// PetEntry //
const PetEntry = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = '/images/default-pet.png';

  // The method to get the list of pets from localStorage
  const getPets = () => {
    try {
      return JSON.parse(localStorage.getItem('pets') || '[]');
    } catch (e) {
      console.error('Error parsing pets from localStorage', e);
      return [];
    }
  };

  const templates = {
    dashboard: () => `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
          <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
          <button id="logoutButton" class="icon-btn">Logout</button>
        </header>
        <main class="dashboard-main">
          <section class="form-section" id="petFormContainer"></section>
          <section class="data-section">
            <div class="calendar-container" id="exerciseCalendar"></div>
            <div class="charts-container" id="exerciseCharts"></div>
          </section>
        </main>
        <aside class="saved-profiles" id="savedProfiles"></aside>
      </div>
    `,
    petForm: () => {
      const pet = activePetIndex !== null ? PetEntry.getPets()[activePetIndex] : null;
      return `
        <form id="exerciseForm" class="pet-form card">
          <fieldset class="pet-details">
            <legend>${activePetIndex === null ? 'New Pet' : 'Update Pet'}</legend>
            <div class="form-group">
              <label for="petName">Name</label>
              <input type="text" id="petName" value="${pet ? pet.petDetails.name : ''}" required>
            </div>
            <div class="form-group">
              <label>Image</label>
              <div class="image-upload">
                <input type="file" id="petImage" accept="image/*">
                <img id="petImagePreview" src="${pet ? pet.petDetails.image : DEFAULT_IMAGE}" alt="Pet Preview">
              </div>
            </div>
            <div class="form-group">
              <label for="petCharacteristics">Description</label>
              <textarea id="petCharacteristics" rows="3">${pet ? pet.petDetails.characteristics : ''}</textarea>
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
                <input type="date" id="exerciseDate" value="${new Date().toISOString().split('T')[0]}" required>
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
      `;
    }
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
    document.getElementById('logoutButton')?.addEventListener('click', () => {
      Auth.logout();
    });
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
      exerciseEntries: [],
      monthlyReports: []  // <-- New property for archived reports
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
    Calendar.refresh(petData.exerciseEntries);
    Charts.refresh(petData.exerciseEntries);
    loadSavedProfiles();
    AppHelper.refreshComponent('petFormContainer');
  }

  // --- Add Profile Control (Save, Edit, Delete, Reports) ---

  // load saved pet profiles //
  function loadSavedProfiles() {
    const pets = getPets();
    const profilesHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
        <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}">
        <h4>${pet.petDetails.name}</h4>
        <button class="select-btn" data-index="${index}">${index === activePetIndex ? 'Selected' : 'Select'}</button>
        <div class="profile-controls">
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
          <button class="monthly-report-btn" data-index="${index}">Monthly Report</button>
          <button class="print-profile-btn" data-index="${index}">Print Profile</button>
        </div>
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

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = parseInt(btn.dataset.index);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        AppHelper.refreshComponent('petFormContainer');
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const pets = getPets();
        pets.splice(index, 1);
        localStorage.setItem('pets', JSON.stringify(pets));
        if (activePetIndex === index) {
          activePetIndex = null;
          sessionStorage.removeItem('activePetIndex');
        } else if (activePetIndex > index) {
          activePetIndex--;
          sessionStorage.setItem('activePetIndex', activePetIndex);
        }
        loadSavedProfiles();
        if (activePetIndex !== null) {
          updateDashboard(pets[activePetIndex]);
        }
      });
    });

    document.querySelectorAll('.monthly-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        openMonthlyReport(index);
      });
    });

    document.querySelectorAll('.print-profile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        printProfile(index);
      });
    });
  }

  // Function to generate monthly report
  function openMonthlyReport(index) {
    const pets = getPets();
    const pet = pets[index];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const reportHTML = `
      <div class="monthly-report">
        <h2>Monthly Report for ${pet.petDetails.name}</h2>
        <div id="monthlyCalendar">
          <!-- Calendar with ticked days goes here -->
        </div>
        <div id="monthlyCharts">
          <!-- Two charts displaying exercise trends go here -->
        </div>
        <button id="exportReportBtn">Export Report</button>
        <button id="backToDashboardBtn">Back to Dashboard</button>
      </div>
    `;
    AppHelper.showPage(reportHTML);
    document.getElementById('backToDashboardBtn')?.addEventListener('click', () => {
      PetEntry.showExerciseLog();
    });
  }

  // Function to print pet profile
  function printProfile(index) {
    const pets = getPets();
    const pet = pets[index];
    const printContent = `
      <div>
        <h2>Pet Profile: ${pet.petDetails.name}</h2>
        <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}">
        <p>${pet.petDetails.characteristics}</p>
        <h3>Exercise Entries:</h3>
        <ul>
          ${pet.exerciseEntries.map(e => `<li>${e.date}: ${e.exerciseType} for ${e.duration} minutes, ${e.caloriesBurned} calories</li>`).join('')}
        </ul>
      </div>
    `;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }

  // Return the necessary public methods
  return {
    showExerciseLog,
    getPets, // Make sure this is accessible
    getActivePet: () => activePetIndex !== null ? getPets()[activePetIndex] : null
  };
})();


// Calendar //
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

  return { init, refresh };
})();

// Charts
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

// Initialize dashboard and other components
PetEntry.showExerciseLog();
