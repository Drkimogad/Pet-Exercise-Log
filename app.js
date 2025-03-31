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
  // CALENDAR RENDER
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
  // PET FORM RENDER
  // ========================
  function renderPetForm(editIndex = null) {
    const pets = getPets();
    const pet = editIndex !== null ? pets[editIndex] : {};
    
    document.getElementById('petFormContainer').innerHTML = `
      <form id="petForm" class="pet-form">
        <input type="hidden" id="petId" name="petId" value="${pet.id || generateId()}">
        
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" name="petName" value="${pet.name || ''}" required>
        </div>
        
        <!-- Image Upload with Placeholder -->
        <div class="form-group">
          <label for="petImage">Pet Image</label>
          <input type="file" id="petImage" name="petImage" accept="image/*">
          <img id="petImagePreview" src="${pet.image || DEFAULT_IMAGE}" alt="Pet Image" style="max-width:100px; display:block; margin-top:8px;">
        </div>
        
        <!-- Age Field -->
        <div class="form-group">
          <label for="petAge">Age</label>
          <input type="number" id="petAge" name="petAge" value="${pet.age || ''}" min="0" required>
        </div>
        
        <!-- Weight Field -->
        <div class="form-group">
          <label for="petWeight">Weight</label>
          <input type="number" id="petWeight" name="petWeight" value="${pet.weight || ''}" min="0" required>
        </div>
        
        <!-- Body Condition -->
        <div class="form-group">
          <label for="petCondition">Body Condition</label>
          <select id="petCondition" name="petCondition" required>
            <option value="">Select Condition</option>
            <option value="under weight" ${pet.condition === 'under weight' ? 'selected' : ''}>Under Weight</option>
            <option value="lean" ${pet.condition === 'lean' ? 'selected' : ''}>Lean</option>
            <option value="over weight" ${pet.condition === 'over weight' ? 'selected' : ''}>Over Weight</option>
            <option value="obese" ${pet.condition === 'obese' ? 'selected' : ''}>Obese</option>
          </select>
        </div>
        
        <!-- Medical History -->
        <div class="form-group">
          <label for="petMedicalHistory">Medical History</label>
          <textarea id="petMedicalHistory" name="petMedicalHistory" rows="3">${pet.medicalHistory || ''}</textarea>
        </div>
        
        <!-- Exercise Level -->
        <div class="form-group">
          <label for="petExerciseLevel">Exercise Level</label>
          <input type="text" id="petExerciseLevel" name="petExerciseLevel" value="${pet.exerciseLevel || ''}" required>
        </div>
        
        <!-- Date Field -->
        <div class="form-group">
          <label for="petDate">Date</label>
          <input type="date" id="petDate" name="petDate" value="${pet.date || ''}" required>
        </div>
        
        <!-- Exercise Duration in Minutes -->
        <div class="form-group">
          <label for="petExerciseDuration">Exercise Duration (minutes)</label>
          <input type="number" id="petExerciseDuration" name="petExerciseDuration" value="${pet.exerciseDuration || ''}" min="0" required>
        </div>
        
        <!-- Calories Burnt -->
        <div class="form-group">
          <label for="petCalories">Calories Burnt</label>
          <input type="number" id="petCalories" name="petCalories" value="${pet.calories || ''}" min="0" required>
        </div>
      </form>
    `;
  }

  // =========================
  // SAVED PROFILES LIST
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
  // DASHBOARD LAYOUT
  // ======================
function showExerciseLog() {
    const user = JSON.parse(sessionStorage.getItem('user'));

    AppHelper.showPage(`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Pet Exercise Log</h1>
          <div class="header-actions">
            <button id="addNewProfileButton" class="add-btn">+ Add Pet</button>
            <button id="toggleModeButton" class="toggle-btn">Dark Mode</button>
          </div>
        </header>

        <div class="dashboard-container"> <div class="left-column">
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
              <h2>Daily Mood</h2>
              <div id="moodLogContainer"></div>
            </div>
            <div class="section">
              <h2>Activity Charts</h2>
              <div id="exerciseCharts"></div>
            </div>
          </div>
        </div>
        <button id="saveAllButton" class="save-btn">Save All</button>
        </div>

        <div class="section">
            <h2>Saved Profiles</h2>
            <div id="savedProfiles"></div>
          </div>

        <footer>
          <button id="logoutButton" class="logout-btn">Logout</button>
        </footer>
      </div>
    `);

    // Initialize components
    renderPetForm();
    const pets = getPets();
    if (activePetIndex !== null && pets[activePetIndex]) {
      document.getElementById('calendarContainer').innerHTML = renderCalendar(pets[activePetIndex]);
    }
    document.getElementById('savedProfiles').innerHTML = renderSavedProfiles();
    Charts.init('#exerciseCharts');
    setupEventListeners();
  }
  
  // ======================
  // MONTHLY REPORT RENDER
  // ======================
  function renderMonthlyReport(pet, month, year) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let reportHTML = `
      <div class="monthly-report">
        <h2>Monthly Report for ${pet.name} (${month + 1}/${year})</h2>
        <div class="pet-details">
          <p><strong>Age:</strong> ${pet.age}</p>
          <p><strong>Weight:</strong> ${pet.weight}</p>
          <p><strong>Condition:</strong> ${pet.condition}</p>
          <p><strong>Medical History:</strong> ${pet.medicalHistory || 'N/A'}</p>
        </div>
        <div class="report-calendar">`;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hasExercise = pet?.exerciseEntries?.some(e => e.date === dateStr);
      reportHTML += `<div class="report-day" style="display:inline-block;width:30px;height:30px;margin:2px;background:${hasExercise ? '#00D4FF' : '#F87171'};"></div>`;
    }
    reportHTML += `</div>
      <div class="report-charts">
        <h3>Activity Charts</h3>
        <div id="reportCharts"><p>Charts go here.</p></div>
      </div>
      <div class="report-summary">
        <h3>Exercise Summary</h3>
        <p>Total Days: ${daysInMonth}</p>
        <p>Exercise Days: ${pet.exerciseEntries ? pet.exerciseEntries.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === month && d.getFullYear() === year;
        }).length : 0}</p>
      </div>
      <div class="report-actions" style="margin-top:20px;"> 
        <button id="exportReport" class="add-btn">Export</button>
        <button id="backToDashboard" class="logout-btn">Back to Dashboard</button>
      </div>
    </div>
    `;
    
    const reportWindow = window.open("", "_blank", "width=800,height=600");
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();

    reportWindow.document.getElementById('backToDashboard').addEventListener('click', () => {
      reportWindow.close();
    });
    reportWindow.document.getElementById('exportReport').addEventListener('click', () => {
      alert('Export functionality coming soon.');
    });
  }

  // ======================
  // EVENT HANDLERS
  // ======================
  function setupEventListeners() {
    // Save All Button
    document.getElementById('saveAllButton')?.addEventListener('click', () => {
      const pets = getPets();
      let pet = pets[activePetIndex] || {};
      
      // Update pet data from form
      const formData = new FormData(document.getElementById('petForm'));
      pet.name = formData.get('petName');
      pet.id = formData.get('petId');
      pet.age = formData.get('petAge');
      pet.weight = formData.get('petWeight');
      pet.condition = formData.get('petCondition');
      pet.medicalHistory = formData.get('petMedicalHistory');
      pet.exerciseLevel = formData.get('petExerciseLevel');
      pet.date = formData.get('petDate');
      pet.exerciseDuration = formData.get('petExerciseDuration');
      pet.calories = formData.get('petCalories');
      
      // (Image handling logic can be added here as needed)
      
      if (activePetIndex === null) {
        pets.push(pet);
        activePetIndex = pets.length - 1;
        sessionStorage.setItem('activePetIndex', activePetIndex);
      } else {
        pets[activePetIndex] = pet;
      }
      
      savePets(pets);
      updateDashboard();
    });

    // Emoji Button Handler for Mood Log
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const mood = e.target.dataset.mood;
        const date = e.target.dataset.date;
        const pets = getPets();
        let pet = pets[activePetIndex] || {};
        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
        pet.moodLogs.push({ date, mood });
        pets[activePetIndex] = pet;
        savePets(pets);
        e.target.parentElement.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
      }
    });

    // Edit Button Handler
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        activePetIndex = index;
        sessionStorage.setItem('activePetIndex', activePetIndex);
        renderPetForm(index);
      });
    });

    // Delete Button Handler
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        if (confirm(`Are you sure you want to delete ${pets[index].name}?`)) {
          pets.splice(index, 1);
          if (activePetIndex === index) {
            activePetIndex = null;
            sessionStorage.removeItem('activePetIndex');
          }
          savePets(pets);
          updateDashboard();
        }
      });
    });

    // Print Button Handler
    document.querySelectorAll('.print-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        const pet = pets[index];
        const printWindow = window.open("", "_blank", "width=600,height=400");
        printWindow.document.write(`
          <html>
            <head><title>Print Pet Profile</title></head>
            <body>
              <h2>${pet.name}</h2>
              <img src="${pet.image || DEFAULT_IMAGE}" alt="${pet.name}" style="max-width:200px;">
              <p><strong>Age:</strong> ${pet.age}</p>
              <p><strong>Weight:</strong> ${pet.weight}</p>
              <p><strong>Condition:</strong> ${pet.condition}</p>
              <p><strong>Medical History:</strong> ${pet.medicalHistory || 'N/A'}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      });
    });

    // Share Button Handler
    document.querySelectorAll('.share-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        const pet = pets[index];
        alert(`Share functionality for ${pet.name} coming soon.`);
      });
    });

    // Report Button Handler in Saved Profiles
    document.querySelectorAll('.report-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        const pet = pets[index];
        const now = new Date();
        renderMonthlyReport(pet, now.getMonth(), now.getFullYear());
      });
    });
  }

  // Helper to update the dashboard view
  function updateDashboard() {
    showExerciseLog();
  }

  // Public API
  return {
    showExerciseLog
  };
})();
/*-------------------------------------------------*/
// Charts
/*-------------------------------------------------*/
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
