"use strict";

/* ==================== */
/* 1  Core Functionality  */
/* ==================== */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
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

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
}

/* ==================== */
/* 2  Theme Management    */
/* ==================== */
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  Charts.updateColors();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

/* ==================== */
/* 3  Initialization      */
/* ==================== */
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  registerServiceWorker();
  
  if (sessionStorage.getItem('user')) {
    PetEntry.showExerciseLog();
  } else {
    Auth.showAuth(false);
  }
});

/* ==================== */
/*  4 Auth Module         */
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
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      form.querySelectorAll('.error-text').forEach(el => el.remove());

      const email = form.email.value;
      const password = form.password.value;
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
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  }

  function showAuth(isSignUp = false) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = '';
    appContainer.style.opacity = 0;
    appContainer.innerHTML = authTemplate(isSignUp);
    setTimeout(() => appContainer.style.opacity = 1, 50);
    
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
/* 5 App Helper          */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    const app = document.getElementById('app');
    app.style.opacity = 0;
    app.innerHTML = content;
    setTimeout(() => app.style.opacity = 1, 50);
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
/* PetEntry Module      */
/* ==================== */
const PetEntry = (function() {
  const CONFIG = {
    MAX_PETS: 10,
    DEFAULT_IMAGE: 'default-pet.png',
    EMOJIS: ['😀', '😐', '😞', '😊', '😠'],
    EXERCISE_LEVELS: ['high', 'medium', 'low'],
    FAVORITE_EXERCISES: ['running', 'swimming', 'fetch', 'walking', 'playing'],
    ACTIVITY_TYPES: ['running_park', 'around_block', 'swimming', 'house_play', 'companion_play'],
    LOCATIONS: ['park', 'backyard', 'indoors', 'beach', 'trail']
  };

  let state = {
    activePetIndex: sessionStorage.getItem('activePetIndex') 
      ? parseInt(sessionStorage.getItem('activePetIndex')) 
      : null,
    darkMode: localStorage.getItem('darkMode') === 'true'
  };

  const dataService = {
    cache: null,
    getPets: () => {
      try {
        if (!dataService.cache) {
          dataService.cache = JSON.parse(localStorage.getItem('pets')) || [];
        }
        return [...dataService.cache];
      } catch (e) {
        console.error('Error getting pets:', e);
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
        console.error('Error saving pets:', e);
      }
    },
    getActivePet: () => {
      const pets = dataService.getPets();
      return state.activePetIndex !== null ? pets[state.activePetIndex] : null;
    }
  };

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
        </div>

        <div class="section">
          <h2>Saved Profiles</h2>
          <div id="savedProfiles"></div>
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

        <button type="submit" class="save-btn">Save Profile</button>
      </form>`
  };

  const render = {
    petForm: (editIndex = null) => {
      try {
        const pets = dataService.getPets();
        const pet = editIndex !== null ? pets[editIndex] : {};
        document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
      } catch (e) {
        console.error('Error rendering pet form:', e);
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
        console.error('Error rendering saved profiles:', e);
      }
    }
  };

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('petImagePreview').src = event.target.result;
    };
    reader.onerror = (e) => console.error('Image upload error:', e);
    reader.readAsDataURL(file);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const pets = dataService.getPets();
      let pet = state.activePetIndex !== null ? pets[state.activePetIndex] : { id: crypto.randomUUID() };
      
      pet.name = document.getElementById('petName').value;
      pet.age = parseInt(document.getElementById('petAge').value);
      pet.weight = parseFloat(document.getElementById('petWeight').value);
      pet.image = document.getElementById('petImagePreview').src;
      pet.exerciseLevel = document.getElementById('petExerciseLevel').value;
      pet.favoriteExercise = document.getElementById('petFavoriteExercise').value;
      pet.lastActivity = document.getElementById('petLastActivity').value;
      pet.exerciseLocation = document.getElementById('petExerciseLocation').value;
      
      if (!pet.name || !pet.age || !pet.weight || !pet.exerciseLevel) {
        throw new Error('Please fill all required fields');
      }
      
      if (state.activePetIndex === null) {
        pets.push(pet);
        state.activePetIndex = pets.length - 1;
      } else {
        pets[state.activePetIndex] = pet;
      }
      
      dataService.savePets(pets);
      sessionStorage.setItem('activePetIndex', state.activePetIndex);
      render.savedProfiles();
      
      const chartsSection = document.getElementById('exerciseCharts');
      if (chartsSection) {
        Charts.refresh(pet.exerciseEntries || []);
      }
    } catch (error) {
      AppHelper.showError(error.message);
    }
  }

  function initCharts() {
    const chartsSection = document.getElementById('exerciseCharts');
    if (chartsSection) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          Charts.init('#exerciseCharts');
          const activePet = dataService.getActivePet();
          if (activePet) {
            Charts.refresh(activePet.exerciseEntries || []);
          }
          observer.disconnect();
        }
      });
      observer.observe(chartsSection);
    }
  }

  function setupEventListeners() {
    document.getElementById('petForm')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
    document.getElementById('toggleModeButton')?.addEventListener('click', toggleMode);
    document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      state.activePetIndex = null;
      render.petForm();
    });
    
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
    document.getElementById('toggleModeButton').textContent = 
      state.darkMode ? 'Light Mode' : 'Dark Mode';
    Charts.updateColors();
  }

  return {
    showExerciseLog: () => {
      AppHelper.showPage(templates.dashboard());
      render.petForm();
      setupEventListeners();
      initCharts();
      render.savedProfiles();
    },
    updateDashboard: () => {
      this.showExerciseLog();
    }
  };
})();

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

/* ==================== */
/* App Initialization   */
/* ==================== */
document.addEventListener('DOMContentLoaded', () => {
  PetEntry.showExerciseLog();
});
