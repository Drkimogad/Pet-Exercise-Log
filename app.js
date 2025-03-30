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
const PetEntry = (function() {
  // Constants
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'default-pet.png';
  
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
        <div class="form-group">
          <label for="petImage">Image URL</label>
          <input type="text" id="petImage" name="petImage" value="${pet?.image || ''}">
        </div>
        <div class="form-group">
          <label for="characteristics">Characteristics</label>
          <textarea id="characteristics" name="characteristics">${pet?.characteristics || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="currentWeight">Current Weight (kg)</label>
          <input type="number" id="currentWeight" name="currentWeight" 
                 value="${pet?.weightHistory?.[0]?.kg || ''}" step="0.1" required>
        </div>
        <div class="form-group">
          <label for="bodyCondition">Body Condition</label>
          <select id="bodyCondition" name="bodyCondition" required>
            <option value="underweight" ${pet?.weightHistory?.[0]?.condition === 'underweight' ? 'selected' : ''}>Underweight</option>
            <option value="ideal" ${(!pet || pet?.weightHistory?.[0]?.condition === 'ideal') ? 'selected' : ''}>Ideal</option>
            <option value="overweight" ${pet?.weightHistory?.[0]?.condition === 'overweight' ? 'selected' : ''}>Overweight</option>
          </select>
        </div>
        <button type="submit" class="save-btn">${pet ? 'Update Profile' : 'Save Profile'}</button>
        ${pet ? '<button type="button" id="cancelEdit" class="cancel-btn">Cancel</button>' : ''}
      </form>
    `;

    if (pet) {
      document.getElementById('cancelEdit').addEventListener('click', () => {
        activePetIndex = null;
        renderPetForm();
      });
    }
  }

  function loadSavedProfiles() {
    const pets = getPets();
    const container = document.getElementById('savedProfiles');
    
    container.innerHTML = pets.map((pet, index) => `
      <div class="profile-card ${activePetIndex === index ? 'active' : ''}" data-index="${index}">
        <img src="${pet.image || DEFAULT_IMAGE}" alt="${pet.name}">
        <h3>${pet.name}</h3>
        <p>${pet.characteristics?.substring(0, 30)}${pet.characteristics?.length > 30 ? '...' : ''}</p>
        <div class="profile-actions">
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="select-btn" data-index="${index}">Select</button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activePetIndex = parseInt(e.target.dataset.index);
        renderPetForm(activePetIndex);
      });
    });

    document.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activePetIndex = parseInt(e.target.dataset.index);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        updateDashboard();
      });
    });
  }

  function updateDashboard() {
    if (activePetIndex === null) return;
    
    const pets = getPets();
    const pet = pets[activePetIndex];
    
    // Update any dashboard elements that show pet-specific data
    document.querySelectorAll('.pet-name-display').forEach(el => {
      el.textContent = pet.name;
    });
    
    // Refresh exercise log and charts
    renderExerciseLog();
    Charts.refresh(pet.exerciseEntries);
    renderMoodLog();
  }

  function renderExerciseLog() {
    if (activePetIndex === null) return;
    
    const pets = getPets();
    const pet = pets[activePetIndex];
    const container = document.getElementById('exerciseLogContainer');
    
    if (!container) return;
    
    container.innerHTML = `
      <h3>Exercise Log for ${pet.name}</h3>
      <form id="exerciseForm" class="exercise-form">
        <div class="form-group">
          <label for="exerciseType">Activity</label>
          <select id="exerciseType" name="exerciseType" required>
            <option value="walk">Walk</option>
            <option value="run">Run</option>
            <option value="play">Play</option>
            <option value="swim">Swim</option>
          </select>
        </div>
        <div class="form-group">
          <label for="duration">Duration (minutes)</label>
          <input type="number" id="duration" name="duration" min="1" required>
        </div>
        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        <button type="submit" class="log-btn">Log Activity</button>
      </form>
      <div class="exercise-entries">
        ${pet.exerciseEntries.map(entry => `
          <div class="exercise-entry">
            <span class="entry-date">${entry.date}</span>
            <span class="entry-activity">${entry.exerciseType}</span>
            <span class="entry-duration">${entry.duration} min</span>
          </div>
        `).join('')}
      </div>
    `;
  }

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

  function handlePetFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pets = getPets();
    const petId = formData.get('petId') || generateId();

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
      petData.exerciseEntries = pets[existingIndex].exerciseEntries;
      petData.moodLogs = pets[existingIndex].moodLogs;
      petData.monthlyReports = pets[existingIndex].monthlyReports;
      pets[existingIndex] = petData;
      activePetIndex = existingIndex;
    } else {
      if (pets.length >= MAX_PETS) return AppHelper.showError('Maximum profiles reached');
      pets.push(petData);
      activePetIndex = pets.length - 1;
    }

    savePets(pets);
    sessionStorage.setItem('activePetIndex', activePetIndex);
    loadSavedProfiles();
    renderPetForm();
    updateDashboard();
  }

  function handleExerciseSubmit(e) {
    e.preventDefault();
    if (activePetIndex === null) return;

    const formData = new FormData(e.target);
    const pets = getPets();
    const pet = pets[activePetIndex];

    pet.exerciseEntries.unshift({
      exerciseType: formData.get('exerciseType'),
      duration: parseInt(formData.get('duration')),
      date: formData.get('date') || new Date().toISOString().split('T')[0],
      caloriesBurned: calculateCaloriesBurned(
        formData.get('exerciseType'),
        parseInt(formData.get('duration')),
        pet.weightHistory[0]?.kg
      )
    });

    savePets(pets);
    updateDashboard();
  }

  function handleMoodLogSubmit(e) {
    e.preventDefault();
    if (activePetIndex === null) return;

    const formData = new FormData(e.target);
    const pets = getPets();
    const pet = pets[activePetIndex];

    pet.moodLogs.unshift({
      mood: formData.get('mood'),
      date: new Date().toISOString().split('T')[0],
      notes: formData.get('notes') || ''
    });

    savePets(pets);
    renderMoodLog();
  }

  function calculateCaloriesBurned(exerciseType, duration, weight) {
    if (!weight) return 0;
    
    const METs = {
      walk: 3,
      run: 7,
      play: 5,
      swim: 6
    };
    
    const met = METs[exerciseType] || 3;
    return Math.round((met * 3.5 * weight * duration) / 200);
  }

  function setupEventListeners() {
    document.addEventListener('submit', e => {
      if (e.target.matches('#petForm')) handlePetFormSubmit(e);
      if (e.target.matches('#exerciseForm')) handleExerciseSubmit(e);
      if (e.target.matches('#moodForm')) handleMoodLogSubmit(e);
    });

    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      activePetIndex = null;
      renderPetForm();
    });
  }

  // Public API
  return {
    showExerciseLog: function() {
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
                <h2>Exercise Log</h2>
                <div id="exerciseLogContainer"></div>
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
      
      document.getElementById('logoutButton').addEventListener('click', Auth.logout);
      setupEventListeners();
      loadSavedProfiles();
      renderPetForm();
      Charts.init('#exerciseCharts');
      
      if (activePetIndex !== null) {
        updateDashboard();
      }
    }
  };
})();

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
