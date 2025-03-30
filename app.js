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
//---------------------------------------------------
// Toggle mode function 
//----------------------------------------------------
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// initialize saved theme on load
function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}
document.addEventListener('DOMContentLoaded', applySavedTheme);

document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  registerServiceWorker();
  
  if (sessionStorage.getItem('user')) {
    PetEntry.showExerciseLog();
  } else {
    Auth.showAuth(false); // Show sign-in by default
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



/* ==================== */
/*  PetEntry Module     */
/* ==================== */
const PetEntry = (function() {
  // Constants
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'default-pet.png';
  const EMOJIS = ['😀', '😐', '😞', '😊', '😠']; // Mood emojis

  // State
  let activePetIndex = sessionStorage.getItem('activePetIndex') 
    ? parseInt(sessionStorage.getItem('activePetIndex')) 
    : null;

  // Private functions
  function getPets() {
    return JSON.parse(localStorage.getItem('pets')) || [];
  }

  function savePets(pets) {
    localStorage.setItem('pets', JSON.stringify(pets));
  }

  function generateId() {
    return crypto.randomUUID() || Math.random().toString(36).substring(2, 15);
  }

  // ====================
  // NEW: CALENDAR RENDER
  // ====================
  function renderCalendar(pet) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let calendarHTML = '<div class="calendar-grid">';
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hasExercise = pet?.exerciseEntries?.some(e => e.date === dateStr);
      const moodEntry = pet?.moodLogs?.find(m => m.date === dateStr);
      
      calendarHTML += `
        <div class="day-box" data-date="${dateStr}">
          <span class="day-number">${day}</span>
          <span class="exercise-indicator ${hasExercise ? 'exercised' : 'skipped'}"></span>
          <div class="emoji-buttons">
            ${EMOJIS.map(emoji => `
              <button class="emoji-btn ${moodEntry?.mood === emoji ? 'selected' : ''}" 
                      data-mood="${emoji}" 
                      data-date="${dateStr}">${emoji}</button>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    calendarHTML += '</div>';
    return calendarHTML;
  }

  // ========================
  // UPDATED: PET FORM RENDER
  // ========================
  function renderPetForm(editIndex = null) {
    const pets = getPets();
    const pet = editIndex !== null ? pets[editIndex] : null;
    
    document.getElementById('petFormContainer').innerHTML = `
      <form id="petForm" class="pet-form">
        <input type="hidden" id="petId" name="petId" value="${pet?.id || ''}">
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" name="petName" value="${pet?.name || ''}" required>
        </div>
        <!-- Other pet fields (image, weight, etc.) -->
      </form>
    `;
  }

  // =========================
  // NEW: SAVED PROFILES LIST
  // =========================
  function renderSavedProfiles() {
    const pets = getPets();
    return `
      <div class="saved-profiles-list">
        ${pets.map((pet, index) => `
          <div class="saved-profile ${activePetIndex === index ? 'active' : ''}">
            <img src="${pet.image || DEFAULT_IMAGE}" alt="${pet.name}">
            <h4>${pet.name}</h4>
            <div class="profile-actions">
              <button class="edit-btn" data-index="${index}">Edit</button>
              <button class="delete-btn" data-index="${index}">Delete</button>
              <button class="print-btn" data-index="${index}">Print</button>
              <button class="share-btn" data-index="${index}">Share</button>
              <button class="report-btn" data-index="${index}">Report</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ======================
  // UPDATED: DASHBOARD LAYOUT
  // ======================
  function showExerciseLog() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    AppHelper.showPage(`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Pet Exercise Tracker</h1>
          <div class="header-actions">
            <button id="addNewProfileButton" class="add-btn">+ Add Pet</button>
            <button id="toggleModeButton" class="toggle-btn">Dark Mode</button>
          </div>
        </header>

        <div class="dashboard-container">
          <!-- LEFT COLUMN (60%) -->
          <div class="left-column">
            <!-- Pet Form -->
            <div class="section">
              <h2>Pet Profile</h2>
              <div id="petFormContainer"></div>
            </div>

            <!-- NEW: Calendar -->
            <div class="section">
              <h2>Exercise Calendar</h2>
              <div id="calendarContainer"></div>
            </div>

            <!-- NEW: Saved Profiles -->
            <div class="section">
              <h2>Saved Profiles</h2>
              <div id="savedProfiles"></div>
            </div>

            <!-- Save Button -->
            <button id="saveAllButton" class="save-btn">Save All</button>
          </div>

          <!-- RIGHT COLUMN (40%) -->
          <div class="right-column">
            <!-- Mood Log -->
            <div class="section">
              <h2>Daily Mood</h2>
              <div id="moodLogContainer"></div>
            </div>

            <!-- Charts -->
            <div class="section">
              <h2>Activity Charts</h2>
              <div id="exerciseCharts"></div>
            </div>
          </div>
        </div>

        <footer>
          <button id="logoutButton" class="logout-btn">Logout</button>
        </footer>
      </div>
    `);

    // Initialize components
    renderPetForm();
    if (activePetIndex !== null) {
      const pets = getPets();
      document.getElementById('calendarContainer').innerHTML = renderCalendar(pets[activePetIndex]);
    }
    document.getElementById('savedProfiles').innerHTML = renderSavedProfiles();
    Charts.init('#exerciseCharts');
    setupEventListeners();
  }

  // ======================
  // EVENT HANDLERS
  // ======================
  function setupEventListeners() {
    // Save All Button
    document.getElementById('saveAllButton')?.addEventListener('click', () => {
      const pets = getPets();
      const pet = pets[activePetIndex] || {};
      
      // Update pet data from form
      const formData = new FormData(document.getElementById('petForm'));
      pet.name = formData.get('petName');
      // (Add other form fields)
      
      savePets(pets);
      updateDashboard();
    });

    // Emoji Button Handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const mood = e.target.dataset.mood;
        const date = e.target.dataset.date;
        // Save mood log...
      }
    });
  }

  // Public API
  return {
    showExerciseLog
  };
})();



