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

// loading content //
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

// petentry//
const PetEntry = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = '/images/default-pet.png'; 
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
    </div>`,
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
 // ------------------------------------------
// load saved pet profiles //
// --------------------------------------------
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

  // Select button event
  document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activePetIndex = parseInt(btn.dataset.index);
      sessionStorage.setItem('activePetIndex', activePetIndex);
      updateDashboard(getPets()[activePetIndex]);
    });
  });

  // Edit button event
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activePetIndex = parseInt(btn.dataset.index);
      sessionStorage.setItem('activePetIndex', activePetIndex);
      // Refresh the pet form with current pet details for editing
      AppHelper.refreshComponent('petFormContainer');
    });
  });

  // Delete button event
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const pets = PetEntry.getPets();
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

  // Monthly Report button event
  document.querySelectorAll('.monthly-report-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      openMonthlyReport(index);
    });
  });

  // Print Profile button event
  document.querySelectorAll('.print-profile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      printProfile(index);
    });
//------------------------------------------//

function openMonthlyReport(index) {
  const pets = getPets();
  const pet = pets[index];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Build HTML for archived monthly reports.
  let archivedReportsHTML = '';
  if (pet.monthlyReports && pet.monthlyReports.length > 0) {
    archivedReportsHTML = pet.monthlyReports.map(report => {
      const monthName = new Date(report.year, report.month).toLocaleString('default', { month: 'long' });
      return `
        <div class="archived-report">
          <h3>Archived Report: ${monthName} ${report.year}</h3>
          <ul>
            ${report.entries.map(e => `<li>${e.date}: ${e.exerciseType} (${e.duration} min, ${e.caloriesBurned} cal)</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');
  }

  // Filter current month's entries.
  const currentEntries = pet.exerciseEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const reportHTML = `
    <div class="monthly-report">
      <h2>Monthly Report for ${pet.petDetails.name}</h2>
      <div class="pet-details-report">
        <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}">
        <p>${pet.petDetails.characteristics}</p>
      </div>
      <div class="current-report">
        <h3>Current Month: ${currentMonthName} ${currentYear}</h3>
        <div class="monthly-calendar" id="monthlyCalendar">
          ${currentEntries.length ? `<ul>${currentEntries.map(e => `<li>${e.date} - ${e.exerciseType} (${e.duration} min, ${e.caloriesBurned} cal)</li>`).join('')}</ul>` : '<p>No exercises recorded this month.</p>'}
        </div>
        <div class="monthly-charts" id="monthlyCharts">
          <h3>Exercise Trends</h3>
          <div class="chart">
            <canvas id="monthlyDurationChart"></canvas>
          </div>
          <div class="chart">
            <canvas id="monthlyActivityChart"></canvas>
          </div>
        </div>
      </div>
      <div class="archived-reports">
        <h3>Archived Monthly Reports</h3>
        ${archivedReportsHTML ? archivedReportsHTML : '<p>No archived reports.</p>'}
      </div>
      <div class="report-controls">
        <button id="exportReportBtn">Export Report</button>
        <button id="backToDashboardBtn">Back to Dashboard</button>
      </div>
    </div>
  `;
  AppHelper.showPage(reportHTML);

  // Initialize charts only if there are current entries.
  if (currentEntries.length) {
    initMonthlyCharts(currentEntries);
  }

  document.getElementById('backToDashboardBtn')?.addEventListener('click', () => {
    PetEntry.showExerciseLog();
  });
  document.getElementById('exportReportBtn')?.addEventListener('click', () => {
    alert('Export functionality coming soon!');
  });
}

// Export functionality //
document.getElementById('exportReportBtn')?.addEventListener('click', () => {
  const reportElement = document.querySelector('.monthly-report');
  if (!reportElement) {
    alert('Monthly report not found!');
    return;
  }
  html2canvas(reportElement).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    // Using jsPDF from the global window.jspdf namespace
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('monthly_report.pdf');
  }).catch(error => {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF.');
  });
});

// initialize monthly charts //
function initMonthlyCharts(data) {
  // Process data for duration and activity charts
  const durationData = data.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.duration;
    return acc;
  }, {});
  const activitiesData = data.reduce((acc, e) => {
    acc[e.exerciseType] = (acc[e.exerciseType] || 0) + 1;
    return acc;
  }, {});

  // Create monthly duration chart (line chart)
  const ctxDuration = document.getElementById('monthlyDurationChart');
  new Chart(ctxDuration, {
    type: 'line',
    data: {
      labels: Object.keys(durationData).sort(),
      datasets: [{
        label: 'Total Duration (min)',
        data: Object.keys(durationData).sort().map(date => durationData[date]),
        borderColor: '#4bc0c0',
        tension: 0.3
      }]
    }
  });

  // Create monthly activity chart (doughnut chart)
  const ctxActivity = document.getElementById('monthlyActivityChart');
  new Chart(ctxActivity, {
    type: 'doughnut',
    data: {
      labels: Object.keys(activitiesData),
      datasets: [{
        data: Object.values(activitiesData),
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
      }]
    }
  });
}

//---------------------------------------------------
// reorganize these functions in one section//
//--------------------------------------------------
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
  // (If you prefer, you can move the export functionality inside this function)
}

// -------------------------------------// what functions these are?
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

// toggle mode //
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  Charts.updateColors();
  Calendar.refresh(PetEntry.getActivePet()?.exerciseEntries || []);
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
  getActivePet: () => {
    const pets = JSON.parse(localStorage.getItem('pets') || '[]');
    return activePetIndex !== null ? pets[activePetIndex] : null;
  }
}
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
          <form id="dayExerciseForm">
            <input type="hidden" name="date" value="${date}">
            <div class="form-group">
              <label for="exerciseTypeDay">Type</label>
              <select id="exerciseTypeDay" required>
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="swimming">Swimming</option>
                <option value="playing">Playing</option>
              </select>
            </div>
            <div class="form-group">
              <label for="exerciseDurationDay">Duration (min)</label>
              <input type="number" id="exerciseDurationDay" min="1" required>
            </div>
            <div class="form-group">
              <label for="caloriesBurnedDay">Calories</label>
              <input type="number" id="caloriesBurnedDay" min="1" required>
            </div>
            <button type="submit" class="add-exercise-btn">Add Exercise</button>
          </form>
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listener for the form submission
    document.getElementById('dayExerciseForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const exerciseType = document.getElementById('exerciseTypeDay').value;
      const duration = Number(document.getElementById('exerciseDurationDay').value);
      const caloriesBurned = Number(document.getElementById('caloriesBurnedDay').value);
      const newEntry = {
        date: date,
        exerciseType,
        duration,
        caloriesBurned
      };
      // Get the active pet and update its exercise entries
      const activePet = PetEntry.getActivePet();
      if (activePet) {
        activePet.exerciseEntries.push(newEntry);
        // Update local storage for persistence
        const pets = PetEntry.getPets();
        const activeIndex = parseInt(sessionStorage.getItem('activePetIndex'));
        pets[activeIndex] = activePet;
        localStorage.setItem('pets', JSON.stringify(pets));
        Calendar.refresh(activePet.exerciseEntries);
      }
      document.querySelector('.calendar-modal').remove();
    });
    
    // Close modal event listener
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
  
  // ========================
  // PET FORM RENDER   to be added to the top pet form and enhance it. 
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
to be updated from the top section


  // ======================
  // DASHBOARD LAYOUT   I NEED THIS DASHBOARD LAYOUT TO REMAIN BUT ENHANCED
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

    // Initialize components/ TO BE UPDATED BASED ON THE TOP PARTS OF THE CODE
    renderPetForm();
    const pets = getPets();
    if (activePetIndex !== null && pets[activePetIndex]) {
      document.getElementById('calendarContainer').innerHTML = renderCalendar(pets[activePetIndex]);
    }
    document.getElementById('savedProfiles').innerHTML = renderSavedProfiles();
    Charts.init('#exerciseCharts');
    setupEventListeners();
  }

// Helper to update the dashboard view
  function updateDashboard() {
    showExerciseLog();
    // Refresh the charts with the latest data
    const pets = getPets();
    if (activePetIndex !== null && pets[activePetIndex]) {
      Charts.refresh(pets[activePetIndex].exerciseEntries || []);
    }
  }
  
  // ======================
  // MONTHLY REPORT RENDER  IF IT'S A DUPLICATE REMOVE THIS ONE!
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

      // Handle Image Upload
      const petImageInput = document.getElementById('petImage');
      const file = petImageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          pet.image = e.target.result; // Store base64 data
          savePetDataAndContinue(pets, pet);
        };
        reader.readAsDataURL(file);
      } else {
        pet.image = pet.image || DEFAULT_IMAGE; // Keep existing or default
        savePetDataAndContinue(pets, pet);
      }
    });

    function savePetDataAndContinue(pets, pet) {
      if (activePetIndex === null) {
        pets.push(pet);
        activePetIndex = pets.length - 1;
        sessionStorage.setItem('activePetIndex', activePetIndex);
      } else {
        pets[activePetIndex] = pet;
      }

      savePets(pets);
      updateDashboard();
    }

    // Helper to update the dashboard view
    function updateDashboard() {
      showExerciseLog();
    }

    // Exercise Toggle Handler added
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('exercise-toggle')) {
        const date = e.target.dataset.date;
        const pets = getPets();
        let pet = pets[activePetIndex] || {};
        pet.exerciseEntries = pet.exerciseEntries || [];

        const existingEntryIndex = pet.exerciseEntries.findIndex(entry => entry.date === date);
        const wasExercised = e.target.classList.contains('exercised');

        if (existingEntryIndex > -1) {
          pet.exerciseEntries.splice(existingEntryIndex, 1); // Remove existing entry
          if (!wasExercised) {
            pet.exerciseEntries.push({ date: date, exercised: true }); // Add if toggling to exercised
          }
        } else {
          pet.exerciseEntries.push({ date: date, exercised: true }); // Add new entry as exercised
        }

        pets[activePetIndex] = pet;
        savePets(pets);
        updateDashboard(); // Re-render the dashboard to update the calendar
      }
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

  // Public API
  return {
    showExerciseLog
  };
})();

/*-------------------------------------------------*/
//4// Charts
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

// ----- End of second half of app.js -----
