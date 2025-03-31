"use strict";

/* ==================== */
/* Core Functionality  */
/* ==================== */
let deferredPrompt;

//  ✅ Automatically Show Install Banner
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

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
    // Apply dark mode if enabled
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
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
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  Charts.updateColors();
  Calendar.refresh(PetEntry.getActivePet()?.exerciseEntries || []);
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
/* Auth Module         */
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
/* Helper Functions    */
/* ==================== */
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

/* ==================== */
/* PetEntry Module     */
/* ==================== */
const PetEntry = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = '/images/default-pet.png';
  const EMOJIS = ['😀', '😐', '😞', '😊', '😠'];

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
      monthlyReports: []
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

function openMonthlyReport(index) {
  const pets = getPets();
  const pet = pets[index];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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

document.getElementById('exportReportBtn')?.addEventListener('click', () => {
  const reportElement = document.querySelector('.monthly-report');
  if (!reportElement) {
    alert('Monthly report not found!');
    return;
  }
  html2canvas(reportElement).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
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

function initMonthlyCharts(data) {
  const durationData = data.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.duration;
    return acc;
  }, {});
  const activitiesData = data.reduce((acc, e) => {
    acc[e.exerciseType] = (acc[e.exerciseType] || 0) + 1;
    return acc;
  }, {});

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
};
})();

/* Calendar */
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

    for (let i = 0; i < startDay; i++) {
      calendarHTML += `<div class="calendar-day empty"></div>`;
    }

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
      const activePet = PetEntry.getActivePet();
      if (activePet) {
        activePet.exerciseEntries.push(newEntry);
        const pets = PetEntry.getPets();
        const activeIndex = parseInt(sessionStorage.getItem('activePetIndex'));
        pets[activeIndex] = activePet;
        localStorage.setItem('pets', JSON.stringify(pets));
        Calendar.refresh(activePet.exerciseEntries);
      }
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

/* Charts */
const Charts = (function() {
  let durationChart, caloriesChart, activityChart;

  function init(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = `
      <div class="chart">
        <canvas id="durationChart"></canvas>
      </div>
      <div
