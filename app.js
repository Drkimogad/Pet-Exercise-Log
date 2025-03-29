"use strict";

/* ==================== */
/*  Core Functionality  */
/* ==================== */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log(choiceResult.outcome === 'accepted' ? 'User accepted install' : 'User dismissed install');
        deferredPrompt = null;
      } catch (error) {
        console.error('Auto Install prompt failed:', error);
      }
    }
  }, 2000);
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW failed:', err));
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
      isSignUp ? showAuth(false) : PetEntry.showExerciseLog();
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

/* ==================== */
/*  PetEntry Module     */
/* ==================== */
const PetEntry = (function() {
  const ACTIVITY_ICONS = {
    fetch: "🦮", swimming: "🏊", tug: "🦴", running: "🏃", agility: "⛳"
  };
  let activePetIndex = null;
  const MAX_PETS = 5;
  const DEFAULT_IMAGE = '/images/default-pet.png';

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  function getPets() {
    const pets = JSON.parse(localStorage.getItem('pets') || '[]');
    return pets.map(pet => ({
      id: pet.id || generateId(),
      name: pet.name || pet.petDetails?.name || 'Unnamed',
      image: pet.image || pet.petDetails?.image || DEFAULT_IMAGE,
      characteristics: pet.characteristics || pet.petDetails?.characteristics || '',
      weightHistory: pet.weightHistory || [],
      exerciseEntries: pet.exerciseEntries || [],
      monthlyReports: pet.monthlyReports || []
    }));
  }

  function savePets(pets) {
    localStorage.setItem('pets', JSON.stringify(pets));
  }

  function showExerciseLog() {
    AppHelper.showPage(`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Pet Exercise Tracker</h1>
          <button id="logoutButton" class="logout-btn">Logout</button>
        </header>
        
        <div class="dashboard-grid">
          <!-- Left Column -->
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
          
          <!-- Right Column -->
          <div class="right-column">
            <div class="section">
              <h2>Exercise Calendar</h2>
              <div id="exerciseCalendar"></div>
            </div>
            <div class="section">
              <h2>Activity Charts</h2>
              <div id="exerciseCharts"></div>
            </div>
          </div>
        </div>
      </div>
    `);
    
    loadSavedProfiles();
    renderPetForm();
    Calendar.init('#exerciseCalendar');
    Charts.init('#exerciseCharts');
    setupEventListeners();
    
    if (activePetIndex !== null) {
      updateDashboard();
    }
  }

  function setupEventListeners() {
    document.addEventListener('submit', e => {
      if (e.target.matches('#petForm')) handlePetFormSubmit(e);
      if (e.target.matches('#exerciseForm')) handleExerciseSubmit(e);
    });
    
    document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      activePetIndex = null;
      renderPetForm();
    });
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
      monthlyReports: []
    };

    const existingIndex = pets.findIndex(p => p.id === petId);
    if (existingIndex >= 0) {
      petData.exerciseEntries = pets[existingIndex].exerciseEntries;
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
      caloriesBurned: parseInt(formData.get('caloriesBurned'))
    });

    savePets(pets);
    updateDashboard();
  }

  function loadSavedProfiles() {
    const pets = getPets();
    document.getElementById('savedProfiles').innerHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}" data-id="${pet.id}">
        <img src="${pet.image}" alt="${pet.name}" class="pet-avatar">
        <div class="pet-info">
          <h3>${pet.name}</h3>
          <div class="pet-stats">
            <span>${pet.exerciseEntries?.length || 0} activities</span>
            ${pet.weightHistory?.length ? `<span>${pet.weightHistory[0].kg} kg</span>` : ''}
          </div>
        </div>
        <div class="pet-actions">
          <button class="btn-select" data-index="${index}">Select</button>
          <button class="btn-edit" data-id="${pet.id}">Edit</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-select').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = parseInt(btn.dataset.index);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        updateDashboard();
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = getPets().findIndex(p => p.id === btn.dataset.id);
        sessionStorage.setItem('activePetIndex', activePetIndex);
        renderPetForm();
      });
    });
  }

  function renderPetForm() {
    const pet = activePetIndex !== null ? getPets()[activePetIndex] : null;
    document.getElementById('petFormContainer').innerHTML = `
      <form id="petForm" class="pet-form">
        <input type="hidden" name="petId" value="${pet?.id || ''}">
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" name="petName" value="${pet?.name || ''}" required>
        </div>
        <div class="form-group">
          <label for="currentWeight">Weight (kg)</label>
          <input type="number" step="0.1" id="currentWeight" name="currentWeight" 
                 value="${pet?.weightHistory?.[0]?.kg || ''}" required>
        </div>
        <div class="form-group">
          <label for="bodyCondition">Body Condition</label>
          <select id="bodyCondition" name="bodyCondition">
            <option ${pet?.weightHistory?.[0]?.condition === 'underweight' ? 'selected' : ''}>underweight</option>
            <option ${!pet?.weightHistory?.[0]?.condition || pet?.weightHistory?.[0]?.condition === 'ideal' ? 'selected' : ''}>ideal</option>
            <option ${pet?.weightHistory?.[0]?.condition === 'overweight' ? 'selected' : ''}>overweight</option>
          </select>
        </div>
        <div class="form-group">
          <label for="characteristics">Characteristics</label>
          <textarea id="characteristics" name="characteristics">${pet?.characteristics || ''}</textarea>
        </div>
        <button type="submit" class="save-btn">${pet ? 'Update' : 'Create'} Profile</button>
      </form>
      ${pet ? `
        <form id="exerciseForm" class="exercise-form">
          <h3>Log Exercise</h3>
          <div class="form-group">
            <label for="exerciseType">Activity</label>
            <select id="exerciseType" name="exerciseType" required>
              <option value="walk">Walk</option>
              <option value="run">Run</option>
              <option value="swim">Swim</option>
              <option value="play">Play</option>
            </select>
          </div>
          <div class="form-group">
            <label for="duration">Duration (minutes)</label>
            <input type="number" id="duration" name="duration" min="1" required>
          </div>
          <div class="form-group">
            <label for="caloriesBurned">Calories Burned</label>
            <input type="number" id="caloriesBurned" name="caloriesBurned" min="1" required>
          </div>
          <div class="form-group">
            <label for="date">Date</label>
            <input type="date" id="date" name="date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <button type="submit" class="log-btn">Log Activity</button>
        </form>
      ` : ''}
    `;
  }

  function updateDashboard() {
    if (activePetIndex === null) return;
    const pet = getPets()[activePetIndex];
    Calendar.refresh(pet.exerciseEntries);
    Charts.refresh(pet.exerciseEntries);
  }

  function loadActivePetData() {
    activePetIndex = parseInt(sessionStorage.getItem('activePetIndex')) || null;
    if (activePetIndex !== null) {
      updateDashboard();
      renderPetForm();
    }
  }

  return {
    showExerciseLog,
    getPets,
    savePets
  };
})();

/* ==================== */
/*  Calendar Module     */
/* ==================== */
const Calendar = (function() {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let exerciseData = [];

  function init(selector) {
    document.querySelector(selector).innerHTML = '<div class="calendar"></div>';
    generateCalendar();
  }

  function refresh(entries) {
    exerciseData = entries || [];
    generateCalendar();
  }

  function generateCalendar() {
    const date = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDay = date.getDay();

    let calendarHTML = `
      <div class="calendar-header">
        <button class="prev-month">←</button>
        <h2>${date.toLocaleString('default', { month: 'long' })} ${currentYear}</h2>
        <button class="next-month">→</button>
      </div>
      <div class="calendar-grid">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
          <div class="calendar-day-header">${day}</div>
        `).join('')}
    `;

    // Empty days
    for (let i = 0; i < startDay; i++) {
      calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayExercises = exerciseData.filter(e => e.date === dateStr);
      
      calendarHTML += `
        <div class="calendar-day ${dayExercises.length ? 'has-activity' : ''}" data-date="${dateStr}">
          ${day}
          ${dayExercises.length ? `<div class="activity-count">${dayExercises.length}</div>` : ''}
        </div>
      `;
    }

    document.querySelector('.calendar').innerHTML = calendarHTML;

    // Event listeners
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

    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date;
        const exercises = exerciseData.filter(e => e.date === date);
        if (exercises.length) {
          AppHelper.showModal(`
            <h3>Activities on ${date}</h3>
            <ul>
              ${exercises.map(e => `
                <li>${e.exerciseType} - ${e.duration} mins (${e.caloriesBurned} cal)</li>
              `).join('')}
            </ul>
          `);
        }
      });
    });
  }

  return { init, refresh };
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
