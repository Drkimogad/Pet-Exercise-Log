"use strict";

/* ==================== */
/*  Core Functionality  */
/* ==================== */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installButton').style.display = 'block'; // Show install button
});

document.getElementById('installButton').addEventListener('click', async () => {
  if (deferredPrompt) {
    await deferredPrompt.prompt(); // Now triggered by user click
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User:', outcome);
    deferredPrompt = null;
  }
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  if (sessionStorage.getItem('user')) {
    PetEntry.showExerciseLog();
  } else {
    Auth.showAuth();
  }
});

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
      </div>
    `;
  }

  async function handleAuthSubmit(e, isSignUp) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      // Clear previous errors
      const errorElements = form.querySelectorAll('.error-text');
      errorElements.forEach(el => el.remove());

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

      // Process successful sign-up (but don't log in yet)
      if (isSignUp) {
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const hashedPassword = await hashPassword(password, salt);

        // Store user data (could use localStorage for persistence)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push({
          email,
          username: form.username?.value,
          password: hashedPassword,
          salt
        });
        localStorage.setItem('users', JSON.stringify(users));

        // Show success message and switch to sign-in
        const successElement = document.createElement('p');
        successElement.className = 'success-text';
        successElement.textContent = 'Account created! Please sign in.';
        successElement.style.color = 'var(--success)';
        form.appendChild(successElement);

        // Switch to sign-in after 1.5 seconds
        setTimeout(() => showAuth(false), 1500);
        return;
      }

      // Process sign-in
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await hashPassword(password, user.salt);
      if (hashedPassword !== user.password) {
        throw new Error('Invalid password');
      }

      // Successful login
      currentUser = {
        email: user.email,
        username: user.username,
        lastLogin: new Date().toISOString()
      };

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

  function logout() {
    sessionStorage.removeItem('user');
    currentUser = null;
    showAuth(false);
  }

  return {
    showAuth,
    logout
  };
})();

/* ==================== */
/*  PetEntry Module     */
/* ==================== */
// Constants and Variables
const MAX_PETS = 10; // Max number of pet profiles allowed
const DEFAULT_IMAGE = 'default-pet.png'; // Default pet image if not provided
let activePetIndex = sessionStorage.getItem('activePetIndex') 
  ? parseInt(sessionStorage.getItem('activePetIndex')) 
  : null; // Track currently active pet

function getPets() {
  // Retrieve pet data from local storage, or return an empty array if none exists
  return JSON.parse(localStorage.getItem('pets')) || [];
}

function savePets(pets) {
  // Save updated pet data to local storage
  localStorage.setItem('pets', JSON.stringify(pets));
}

function showExerciseLog() {
  // Render the main exercise log dashboard
  AppHelper.showPage(`
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Pet Exercise Tracker</h1>
        <button id="logoutButton" class="logout-btn">Logout</button>
      </header>
      <div class="dashboard-grid">
        <div class="left-column">
          <div class="section">
            <div class="section-header">
              <h2>Pet Profiles</h2>
              <button id="addNewProfileButton" class="add-btn">+ Add Pet</button>
            </div>
            <div id="petFormContainer"></div>
            <div id="savedProfiles" class="profiles-grid"></div>
          </div>
        </div>
        <div class="right-column">
          <div class="section">
            <h2>Exercise Calendar</h2>
            <div id="exerciseCalendar"></div>
          </div>
          <div class="section">
            <h2>Activity Charts</h2>
            <div id="exerciseCharts"></div>
          </div>
          <div class="section">
            <h2>Mood Logs</h2>
            <div id="moodLogContainer"></div>
          </div>
        </div>
      </div>
    </div>
  `);
  
  // Add event listeners
  document.getElementById('logoutButton').addEventListener('click', Auth.logout);
  document.getElementById('toggleModeButton').addEventListener('click', toggleMode);
  
  // Initialize various components and listeners after rendering
  loadSavedProfiles();
  renderPetForm();
  Calendar.init('#exerciseCalendar');
  Charts.init('#exerciseCharts');
  renderMoodLog();
  setupEventListeners();

  if (activePetIndex !== null) {
    updateDashboard(); // Update dashboard if a pet is already selected
  }
}

function setupEventListeners() {
  // Add event listeners for form submissions and button clicks
  document.addEventListener('submit', e => {
    if (e.target.matches('#petForm')) handlePetFormSubmit(e);
    if (e.target.matches('#exerciseForm')) handleExerciseSubmit(e);
    if (e.target.matches('#moodForm')) handleMoodLogSubmit(e);
  });

  document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);

  document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
    activePetIndex = null; // Reset active pet index to allow new pet entry
    renderPetForm();
  });
}

function handlePetFormSubmit(e) {
  e.preventDefault(); // Prevent default form submission
  const formData = new FormData(e.target); // Collect form data
  const pets = getPets();
  const petId = formData.get('petId') || generateId(); // Generate ID if not provided

  // Create or update pet profile object
  const petData = {
    id: petId,
    name: formData.get('petName'),
    image: formData.get('petImage') || DEFAULT_IMAGE,
    characteristics: formData.get('characteristics'),
    weightHistory: [{
      date: new Date().toISOString().split('T')[0],
      kg: parseFloat(formData.get('currentWeight')),
      condition: formData.get('bodyCondition')
    }],
    exerciseEntries: [],
    moodLogs: [],
    monthlyReports: []
  };

  const existingIndex = pets.findIndex(p => p.id === petId);
  if (existingIndex >= 0) {
    // Update existing profile, retaining exercise, mood, and report data
    petData.exerciseEntries = pets[existingIndex].exerciseEntries;
    petData.moodLogs = pets[existingIndex].moodLogs;
    petData.monthlyReports = pets[existingIndex].monthlyReports;
    pets[existingIndex] = petData;
    activePetIndex = existingIndex;
  } else {
    if (pets.length >= MAX_PETS) return AppHelper.showError('Maximum profiles reached');
    pets.push(petData); // Add new pet profile to the list
    activePetIndex = pets.length - 1;
  }

  savePets(pets); // Save updated pet data to local storage
  sessionStorage.setItem('activePetIndex', activePetIndex);
  loadSavedProfiles(); // Refresh pet profiles display
  renderPetForm(); // Reset and render pet form
}

// Handle exercise log form submission
function handleExerciseSubmit(e) {
  e.preventDefault();
  if (activePetIndex === null) return; // Skip if no active pet selected

  const formData = new FormData(e.target);
  const pets = getPets();
  const pet = pets[activePetIndex];

  pet.exerciseEntries.unshift({
    exerciseType: formData.get('exerciseType'),
    duration: parseInt(formData.get('duration')),
    date: formData.get('date') || new Date().toISOString().split('T')[0],
    caloriesBurned: parseInt(formData.get('caloriesBurned'))
  });

  savePets(pets);
  updateDashboard(); // Refresh the dashboard after updating exercise log
}

// Handle mood log submission and update local storage
function handleMoodLogSubmit(e) {
  e.preventDefault();
  if (activePetIndex === null) return;

  const formData = new FormData(e.target);
  const pets = getPets();
  const pet = pets[activePetIndex];

  pet.moodLogs.unshift({
    mood: formData.get('mood'),
    date: new Date().toISOString().split('T')[0]
  });

  savePets(pets);
  renderMoodLog(); // Refresh mood log display
}

// Render mood log for the currently selected pet
function renderMoodLog() {
  if (activePetIndex === null) return;
  const pets = getPets();
  const pet = pets[activePetIndex];

  document.getElementById('moodLogContainer').innerHTML = `
    <form id="moodForm" class="mood-form">
      <div class="form-group">
        <label for="mood">Log Mood</label>
        <select id="mood" name="mood" required>
          <option value="happy">Happy</option>
          <option value="playful">Playful</option>
          <option value="calm">Calm</option>
          <option value="anxious">Anxious</option>
          <option value="tired">Tired</option>
        </select>
      </div>
      <button type="submit" class="log-btn">Log Mood</button>
    </form>
    <ul class="mood-log-list">
      ${pet.moodLogs.map(log => `<li>${log.date}: ${log.mood}</li>`).join('')}
    </ul>
  `;
}


/* ==================== */
/*  Charts Module       */
/* ==================== */
const Charts = (function() {
  let durationChart, activityChart;

  function init(selector) {
    document.querySelector(selector).innerHTML = `
      <div class="chart-container">
        <canvas id="durationChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="activityChart"></canvas>
      </div>
    `;
  }

  function refresh(entries = []) {
    if (durationChart) durationChart.destroy();
    if (activityChart) activityChart.destroy();

    if (entries.length === 0) {
      document.querySelector('#exerciseCharts').innerHTML = `
        <div class="no-data">
          <p>No exercise data available</p>
          <p>Log activities to see charts</p>
        </div>
      `;
      return;
    }

    // Process data
    const dates = [...new Set(entries.map(e => e.date))].sort();
    const durationData = dates.map(date => 
      entries.filter(e => e.date === date).reduce((sum, e) => sum + e.duration, 0)
    );

    const activityCounts = entries.reduce((acc, e) => {
      acc[e.exerciseType] = (acc[e.exerciseType] || 0) + 1;
      return acc;
    }, {});

    // Duration Chart
    const durationCtx = document.getElementById('durationChart').getContext('2d');
    durationChart = new Chart(durationCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Exercise Duration (min)',
          data: durationData,
          borderColor: '#4bc0c0',
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.1)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });

    // Activity Chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(activityCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(activityCounts),
        datasets: [{
          data: Object.values(activityCounts),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  return { init, refresh };
})();


/* ==================== */
/*  Helper Functions    */
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
      </div>
    `;
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    document.body.appendChild(modal);
  },
  showError: (message) => {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => {
      document.body.removeChild(error);
    }, 3000);
  },
  showErrors: (messages) => {
    AppHelper.showModal(`
      <h3>Errors</h3>
      <ul>
        ${messages.map(m => `<li>${m}</li>`).join('')}
      </ul>
    `);
  }
};

// Toggle mode function 
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Apply saved theme on load
function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  registerServiceWorker();
  
  if (sessionStorage.getItem('user')) {
    PetEntry.showExerciseLog();
  } else {
    Auth.showAuth(false); // Show sign-in by default
  }
});
