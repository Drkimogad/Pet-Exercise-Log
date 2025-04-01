"use strict";

/* ==================== */
/*  Core Functionality  */
/* ==================== */
let deferredPrompt;

// PWA Installation Handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installButton').style.display = 'block';
});

document.getElementById('installButton').addEventListener('click', async () => {
  if (deferredPrompt) {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User:', outcome);
    deferredPrompt = null;
  }
});

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js', {
      scope: '/Pet-Exercise-Log/'
    }).then(reg => {
      console.log('Service Worker registered:', reg);
    }).catch(err => {
      console.error('SW registration failed:', err);
    });
  }
}

// Theme Management
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  Charts.updateColors();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
}

/* ==================== */
/*  Auth Module         */
/* ==================== */
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
          <form id="authForm" class="auth-form">
            ${isSignUp ? `
              <div class="form-group">
                <label for="username">Name</label>
                <input type="text" id="username" name="username" required>
              </div>` : ''}
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required minlength="8">
            </div>
            ${isSignUp ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
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
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      // Clear previous errors
      form.querySelectorAll('.error-text').forEach(el => el.remove());

      // Validation
      const errors = [];
      if (isSignUp) {
        const username = form.username?.value;
        const confirmPassword = form.confirmPassword?.value;
        
        if (!username) errors.push('Name is required');
        if (password !== confirmPassword) errors.push('Passwords must match');
      }

      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('Invalid email format');
      }

      if (password.length < 8) errors.push('Password must be at least 8 characters');

      if (errors.length > 0) {
        errors.forEach(error => {
          const errorElement = document.createElement('p');
          errorElement.className = 'error-text';
          errorElement.textContent = error;
          errorElement.style.color = 'var(--error)';
          form.appendChild(errorElement);
        });
        return;
      }

      // Process sign-up
      if (isSignUp) {
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const hashedPassword = await hashPassword(password, salt);

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push({ email, username: form.username?.value, password: hashedPassword, salt });
        localStorage.setItem('users', JSON.stringify(users));

        const successElement = document.createElement('p');
        successElement.className = 'success-text';
        successElement.textContent = 'Account created! Please sign in.';
        form.appendChild(successElement);

        setTimeout(() => showAuth(false), 1500);
        return;
      }

      // Process sign-in
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user) throw new Error('User not found');
      if (await hashPassword(password, user.salt) !== user.password) throw new Error('Invalid password');

      currentUser = { email: user.email, username: user.username, lastLogin: new Date().toISOString() };
      sessionStorage.setItem('user', JSON.stringify(currentUser));
      PetEntry.showExerciseLog();

    } catch (error) {
      const errorElement = document.createElement('p');
      errorElement.className = 'error-text';
      errorElement.textContent = error.message || 'Authentication failed';
      errorElement.style.color = 'var(--error)';
      form.appendChild(errorElement);
    }
  }

  function showAuth(isSignUp = false) {
    AppHelper.showPage(authTemplate(isSignUp));
    
    const form = document.getElementById('authForm');
    form.addEventListener('submit', (e) => handleAuthSubmit(e, isSignUp));
    
    document.getElementById('switchAuth').addEventListener('click', (e) => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  return {
    showAuth,
    logout: () => {
      sessionStorage.removeItem('user');
      showAuth(false);
    }
  };
})();

/* ==================== */
/*  App Helper          */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    document.getElementById('app').innerHTML = content;
  },
  showModal: (content) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${content}
        <button class="close-modal">Close</button>
      </div>`;
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  },
  showError: (message) => {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }
};

/* ==================== */
/*  PetEntry Module     */
/* ==================== */
const PetEntry = (function() {
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'default-pet.png';
  let activePetIndex = sessionStorage.getItem('activePetIndex') || null;

  const templates = {
    dashboard: () => `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Pet Exercise Log</h1>
          <div class="header-actions">
            <button id="addNewProfileButton" class="add-btn">+ Add Pet</button>
            <button id="toggleModeButton" class="toggle-btn">Dark Mode</button>
          </div>
        </header>

        <div class="dashboard-container">
          <div class="left-column">
            <div class="section">
              <h2>Pet Profile</h2>
              <div id="petFormContainer"></div>
            </div>
          </div>

          <div class="right-column">
            <div class="section">
              <h2>Exercise Calendar</h2>
              <div id="calendarContainer"></div>
            </div>
            <div class="section">
              <h2>Activity Charts</h2>
              <div id="exerciseCharts"></div>
            </div>
          </div>
        </div>

        <div class="saved-profiles-section">
          <h2>Saved Profiles</h2>
          <div id="savedProfiles"></div>
        </div>

        <footer>
          <button id="logoutButton" class="logout-btn">Logout</button>
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
            <img id="petImagePreview" src="${pet.image || DEFAULT_IMAGE}" 
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

        <button type="submit" class="save-btn">Save Profile</button>
      </form>`
  };

  function showExerciseLog() {
    AppHelper.showPage(templates.dashboard());
    renderPetForm();
    setupEventListeners();
    Calendar.init('#calendarContainer');
    Charts.init('#exerciseCharts');
    loadSavedProfiles();
  }

  function renderPetForm() {
    const pets = getPets();
    const pet = activePetIndex !== null ? pets[activePetIndex] : {};
    document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
  }

  function setupEventListeners() {
    document.getElementById('petForm')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
    document.getElementById('toggleModeButton')?.addEventListener('click', toggleMode);
    document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      activePetIndex = null;
      renderPetForm();
    });
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

  function handleFormSubmit(e) {
    e.preventDefault();
    const pets = getPets();
    const pet = activePetIndex !== null ? pets[activePetIndex] : {};

    pet.name = document.getElementById('petName').value;
    pet.age = document.getElementById('petAge').value;
    pet.weight = document.getElementById('petWeight').value;
    pet.image = document.getElementById('petImagePreview').src;

    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) return AppHelper.showError('Maximum pets reached');
      pets.push(pet);
      activePetIndex = pets.length - 1;
    } else {
      pets[activePetIndex] = pet;
    }

    localStorage.setItem('pets', JSON.stringify(pets));
    sessionStorage.setItem('activePetIndex', activePetIndex);
    loadSavedProfiles();
    Charts.refresh(pet.exerciseEntries || []);
  }

  function loadSavedProfiles() {
    const pets = getPets();
    const profilesHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
        <img src="${pet.image}" alt="${pet.name}">
        <h4>${pet.name}</h4>
        <div class="profile-actions">
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
          <button class="report-btn" data-index="${index}">Report</button>
        </div>
      </div>
    `).join('');

    document.getElementById('savedProfiles').innerHTML = profilesHTML;

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activePetIndex = parseInt(e.target.dataset.index);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        renderPetForm();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        pets.splice(index, 1);
        localStorage.setItem('pets', JSON.stringify(pets));
        loadSavedProfiles();
      });
    });
  }

  function getPets() {
    return JSON.parse(localStorage.getItem('pets') || '[]');
  }

  return { showExerciseLog };
})();

/* ==================== */
/*  Calendar Component  */
/* ==================== */
const Calendar = (function() {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  function init(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = generateCalendarHTML();
    setupEventListeners();
  }

  function generateCalendarHTML() {
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
          .join('')}`;

    for (let i = 0; i < startDay; i++) calendarHTML += `<div class="calendar-day empty"></div>`;
    
    for (let day = 1; day <= endDate; day++) {
      calendarHTML += `
        <div class="calendar-day">
          ${day}
          <div class="exercise-indicator"></div>
        </div>`;
    }

    calendarHTML += '</div>';
    return calendarHTML;
  }

  function setupEventListeners() {
    document.querySelector('.prev').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      init('#calendarContainer');
    });

    document.querySelector('.next').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      init('#calendarContainer');
    });
  }

  return { init };
})();

/* ==================== */
/*  Charts Component    */
/* ==================== */
const Charts = (function() {
  let durationChart, caloriesChart;

  function init(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = `
      <div class="chart-container">
        <canvas id="durationChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="caloriesChart"></canvas>
      </div>`;
  }

  function refresh(data) {
    if (!data) return;
    destroyCharts();
    
    const processed = data.reduce((acc, entry) => {
      acc.dates.push(entry.date);
      acc.duration.push(entry.duration);
      acc.calories.push(entry.caloriesBurned);
      return acc;
    }, { dates: [], duration: [], calories: [] });

    createDurationChart(processed);
    createCaloriesChart(processed);
  }

  function createDurationChart(data) {
    const ctx = document.getElementById('durationChart');
    durationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: [{
          label: 'Exercise Duration (min)',
          data: data.duration,
          borderColor: '#4bc0c0',
          tension: 0.3
        }]
      }
    });
  }

  function createCaloriesChart(data) {
    const ctx = document.getElementById('caloriesChart');
    caloriesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.dates,
        datasets: [{
          label: 'Calories Burned',
          data: data.calories,
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

