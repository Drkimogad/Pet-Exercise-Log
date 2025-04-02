//---------------- COMPLETE app.js ----------------//
"use strict";

/* ==================== */
/* 1. Core Functionality */
/* ==================== */
let deferredPrompt;
let installButtonAdded = false;

window.addEventListener('beforeinstallprompt', (e) => {
  if (installButtonAdded) return;
  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.createElement('button');
  installBtn.id = 'installButton';
  installBtn.textContent = 'Install App';
  installBtn.className = 'install-btn';
  installBtn.style.display = 'block';

  const footer = document.querySelector('footer');
  if (footer) footer.prepend(installBtn);
  installButtonAdded = true;
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
}

/* ==================== */
/* 2. Theme Management */
/* ==================== */
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
  
  const toggleBtn = document.getElementById('toggleModeButton');
  if (toggleBtn) toggleBtn.textContent = body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
  
  if (typeof Charts !== 'undefined') Charts.updateColors();
}

function applySavedTheme() {
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
}

/* ==================== */
/* 3. Auth Module */
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

      // Validation logic
      const email = form.email.value;
      const password = form.password.value;
      const errors = [];

      if (isSignUp) {
        const username = form.username?.value;
        const confirmPassword = form.confirmPassword?.value;
        if (!username) errors.push('Name is required');
        if (password !== confirmPassword) errors.push('Passwords must match');
      }

      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) errors.push('Invalid email format');
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

        AppHelper.showSuccess('Account created! Please sign in.');
        showAuth(false);
        return;
      }

      // Sign-in logic
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      if (!user) throw new Error('User not found');
      if (await hashPassword(password, user.salt) !== user.password) throw new Error('Invalid password');

      currentUser = { 
        email: user.email, 
        username: user.username, 
        lastLogin: new Date().toISOString() 
      };
      sessionStorage.setItem('user', JSON.stringify(currentUser));
      PetEntry.initDashboard();
      
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
    appContainer.innerHTML = authTemplate(isSignUp);
    
    const form = document.getElementById('authForm');
    form?.addEventListener('submit', (e) => handleAuthSubmit(e, isSignUp));
    
    document.getElementById('switchAuth')?.addEventListener('click', (e) => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  return {
    showAuth,
    logout: () => {
      sessionStorage.removeItem('user');
      showAuth(false);
    },
    toggleMode
  };
})();

/* ==================== */
/* 4. App Helper */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    const app = document.getElementById('app');
    app.style.opacity = 0;
    setTimeout(() => {
      app.innerHTML = content;
      app.style.opacity = 1;
    }, 50);
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
  },

  showSuccess: (message) => {
    const success = document.createElement('div');
    success.className = 'success-message';
    success.textContent = message;
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 3000);
  }
};

/* ==================== */
/* 5. PetEntry Module */
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

// SECTION 2: STATE MANAGEMENT
let state = {
  activePetIndex: sessionStorage.getItem('activePetIndex') 
    ? parseInt(sessionStorage.getItem('activePetIndex'))
    : null,
  darkMode: localStorage.getItem('darkMode') === 'true'
};

// Add this right after state initialization
const initialPetStructure = () => ({
  id: crypto.randomUUID(),
  name: '',
  age: 0,
  weight: 0,
  image: CONFIG.DEFAULT_IMAGE,
  characteristics: '',
  healthStatus: 'healthy',
  exerciseEntries: [], // <-- Add this array
  moodLogs: [] // <-- Add this array
});

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

        <div class="dashboard-grid">
          <div class="grid-item form-section" id="petFormContainer"></div>
          <div class="grid-item calendar-section" id="calendarContainer"></div>
          <div class="grid-item mood-section" id="moodLogs"></div>
          <div class="grid-item charts-section" id="exerciseCharts"></div>
          <div class="grid-item profiles-section" id="savedProfiles"></div>
        </div>

        <button id="saveAllButton" class="save-btn">Save All & Update</button>
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
        <!-- Include all other form fields from original code -->
                <div class="form-group">
          <label for="petImage">Pet Image</label>
          <div class="image-upload">
            <input type="file" id="petImage" accept="image/*">
            <img id="petImagePreview" src="${pet.image || CONFIG.DEFAULT_IMAGE}"
                 alt="Pet Preview" style="max-width: 150px;">
          </div>
        </div>
        <div class="form-group">
          <label for="petCharacteristics">Characteristics</label>
          <textarea id="petCharacteristics" rows="3">${pet.characteristics || ''}</textarea>
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
          <label for="petHealthStatus">Health Status</label>
          <select id="petHealthStatus">
            <option value="healthy" ${pet.healthStatus === 'healthy' ? 'selected' : ''}>Healthy</option>
            <option value="diabetic" ${pet.healthStatus === 'diabetic' ? 'selected' : ''}>Diabetic</option>
            <option value="arthritic" ${pet.healthStatus === 'arthritic' ? 'selected' : ''}>Arthritic</option>
            <option value="hepatic" ${pet.healthStatus === 'hepatic' ? 'selected' : ''}>Hepatic</option>
            <option value="renal" ${pet.healthStatus === 'renal' ? 'selected' : ''}>Renal</option>
            <option value="digestive" ${pet.healthStatus === 'digestive' ? 'selected' : ''}>Digestive</option>
            <option value="dental" ${pet.healthStatus === 'dental' ? 'selected' : ''}>Dental</option>
          </select>
        </div>

        <div class="form-group">
          <label for="petAllergies">Allergies</label>
          <select id="petAllergies">
            <option value="" ${pet.allergies === '' ? 'selected' : ''}>None</option>
            <option value="allergic rhinitis" ${pet.allergies === 'allergic rhinitis' ? 'selected' : ''}>Allergic Rhinitis</option>
            <option value="nuts" ${pet.allergies === 'nuts' ? 'selected' : ''}>Nuts</option>
            <option value="skin allergy" ${pet.allergies === 'skin allergy' ? 'selected' : ''}>Skin Allergy</option>
            <option value="contact dermatitis" ${pet.allergies === 'contact dermatitis' ? 'selected' : ''}>Contact Dermatitis</option>
          </select>
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

        <div class="form-group">
          <label for="petDate">Date</label>
          <input type="date" id="petDate" value="${pet.date || new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label for="petExerciseDuration">Exercise Duration (minutes)</label>
          <input type="number" id="petExerciseDuration"
                 value="${pet.exerciseDuration || '30'}" min="0" required>
        </div>

        <div class="form-group">
          <label for="petCalories">Calories Burnt</label>
          <input type="number" id="petCalories"
                 value="${pet.calories || '150'}" min="0" required>
        </div>
//* this should be added to exercise enteries*//
{
  exerciseEntries: [{
    date: "YYYY-MM-DD",
    duration: Number,
    calories: Number
  }],
  moodLogs: [{
    date: "YYYY-MM-DD",
    mood: 0-4
  }]
}
        <div class="form-group mood-selector">
          <label>Today's Mood:</label>
          <div class="mood-options">
            ${CONFIG.EMOJIS.map((emoji, index) => `
              <button type="button" class="emoji-btn ${pet.mood === index ? 'selected' : ''}"
                      data-mood="${index}" data-date="${new Date().toISOString().split('T')[0]}">
                ${emoji}
              </button>
            `).join('')}
          </div>
        </div>
      </form>`
  };

   // SECTION 4: UTILITY FUNCTIONS
  const utils = {
    generateId: () => crypto.randomUUID() || Math.random().toString(36).substring(2, 15),

    formatDate: (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      } catch (e) {
        console.error('Date formatting error:', e);
        return dateStr;
      }
    },

    validatePet: (pet) => {
      const errors = [];
      if (!pet.name) errors.push('Pet name is required');
      if (!pet.age || pet.age < 0) errors.push('Valid age is required');
      if (!pet.weight || pet.weight < 0) errors.push('Valid weight is required');
      if (!pet.exerciseLevel) errors.push('Exercise level is required');
      if (!pet.date) errors.push('Date is required');
      if (!pet.exerciseDuration || pet.exerciseDuration < 0) errors.push('Valid duration is required');
      if (!pet.calories || pet.calories < 0) errors.push('Valid calories is required');
      return errors.length ? errors : null;
    },

    handleError: (error, context = '') => {
      console.error(`Error in ${context}:`, error);
      AppHelper.showError(`Operation failed: ${error.message}`);
    }
  };

  // SECTION 5: DATA MANAGEMENT
// SECTION 5: DATA MANAGEMENT
const dataService = {
  cache: null,
  getPets: () => {
    try {
      if (!dataService.cache) {
        dataService.cache = JSON.parse(localStorage.getItem('pets')) || [];
      }
      return [...dataService.cache];
    } catch (e) {
      utils.handleError(e, 'getPets');
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
      utils.handleError(e, 'savePets');
    }
  },

  getActivePet: () => {
    const pets = dataService.getPets();
    const pet = state.activePetIndex !== null 
      ? pets[state.activePetIndex]
      : { 
          id: utils.generateId(), 
          exerciseEntries: [], 
          moodLogs: [],
          // Add other default fields
          name: '',
          age: 0,
          weight: 0,
          image: CONFIG.DEFAULT_IMAGE,
          characteristics: '',
          healthStatus: 'healthy',
          exerciseLevel: 'medium',
          favoriteExercise: 'walking',
          lastActivity: 'around_block',
          exerciseLocation: 'park'
        };

    // Ensure arrays exist
    pet.exerciseEntries = pet.exerciseEntries || [];
    pet.moodLogs = pet.moodLogs || [];
    return pet;
  }
};
  // SECTION 6: RENDER FUNCTIONS
  const render = {
    petForm: (editIndex = null) => {
      try {
        const pets = dataService.getPets();
        const pet = editIndex !== null ? pets[editIndex] : {};
        document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
      } catch (e) {
        utils.handleError(e, 'renderPetForm');
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
                  <button class="btn qr-btn" data-index="${index}">🔲 QR Code</button>
                  <button class="share" data-index="${index}">Share</button>
                </div>
              </div>
            `).join('')}
          </div>`;
        document.getElementById('savedProfiles').innerHTML = html;
      } catch (e) {
        utils.handleError(e, 'renderSavedProfiles');
      }
    },

    moodLogs: () => {
      try {
        const activePet = dataService.getActivePet();
        if (activePet) {
          document.getElementById('moodLogs').innerHTML = `
            <div class="mood-container">
              ${activePet.moodLogs?.map(log => `
                <div class="mood-entry">
                  <span>${utils.formatDate(log.date)}</span>
                  <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
                </div>
              `).join('') || '<p>No mood entries yet</p>'}
            </div>`;
        }
      } catch (e) {
        utils.handleError(e, 'renderMoodLogs');
      }
    },

    calendar: () => {
      try {
        document.getElementById('calendarContainer').innerHTML = `
          <div class="calendar">
            <div class="calendar-header">
              <button id="prevMonth">&lt;</button>
              <h3 id="currentMonth">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <button id="nextMonth">&gt;</button>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
          </div>`;

        // Initialize calendar grid
        updateCalendar();
      } catch (e) {
        utils.handleError(e, 'renderCalendar');
      }
    }
  };

  // SECTION 7: EVENT HANDLERS
// SECTION 7: EVENT HANDLERS
const handlers = {
  handleFormSubmit: (e) => {
    e.preventDefault();
    try {
      const pets = dataService.getPets();
      let pet = state.activePetIndex !== null
        ? pets[state.activePetIndex]
        : dataService.getActivePet();

      // Create exercise entry
      const exerciseEntry = {
        date: document.getElementById('petDate').value,
        duration: parseInt(document.getElementById('petExerciseDuration').value),
        calories: parseInt(document.getElementById('petCalories').value)
      };

      // Update or add exercise entry
      const existingIndex = pet.exerciseEntries.findIndex(e => e.date === exerciseEntry.date);
      if (existingIndex > -1) {
        pet.exerciseEntries[existingIndex] = exerciseEntry;
      } else {
        pet.exerciseEntries.push(exerciseEntry);
      }

      // Update basic pet info
      pet.name = document.getElementById('petName').value;
      pet.age = parseInt(document.getElementById('petAge').value);
      pet.weight = parseFloat(document.getElementById('petWeight').value);
      pet.image = document.getElementById('petImagePreview').src;
      pet.exerciseLevel = document.getElementById('petExerciseLevel').value;
      pet.favoriteExercise = document.getElementById('petFavoriteExercise').value;
      pet.lastActivity = document.getElementById('petLastActivity').value;
      pet.exerciseLocation = document.getElementById('petExerciseLocation').value;

      // Validate
      const errors = utils.validatePet(pet);
      if (errors) return AppHelper.showError(errors.join('\n'));

      // Save
      if (state.activePetIndex === null) {
        pets.push(pet);
        state.activePetIndex = pets.length - 1;
      } else {
        pets[state.activePetIndex] = pet;
      }

      dataService.savePets(pets);
      sessionStorage.setItem('activePetIndex', state.activePetIndex);
      render.savedProfiles();
      render.moodLogs();
      Charts.refresh(pet.exerciseEntries);
    } catch (e) {
      utils.handleError(e, 'formSubmit');
    }
  },
    handleMoodSelection: (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const mood = parseInt(e.target.dataset.mood);
        const date = e.target.dataset.date;
        const pets = dataService.getPets();
        let pet = pets[state.activePetIndex] || {};

        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
        pet.moodLogs.push({ date, mood });

        pets[state.activePetIndex] = pet;
        dataService.savePets(pets);

        // Update UI
        document.querySelectorAll('.emoji-btn').forEach(btn =>
          btn.classList.remove('selected')
        );
        e.target.classList.add('selected');
        render.moodLogs();
      }
    },

    handleCalendarNavigation: () => {
      // Implement month navigation
      document.getElementById('prevMonth')?.addEventListener('click', () => {
        // Previous month logic
        updateCalendar();
      });

      document.getElementById('nextMonth')?.addEventListener('click', () => {
        // Next month logic
        updateCalendar();
      });
    }
  };

  // SECTION 8: CALENDAR FUNCTIONS
  function updateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
      calendarGrid.innerHTML = '';

      // Add day headers
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
      });

      // Add empty cells for days before first day
      for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
      }

      // Add days
      const activePet = dataService.getActivePet();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        // Highlight days with exercise
        if (activePet?.exerciseEntries?.some(e => e.date === dateStr)) {
          dayCell.classList.add('has-exercise');
        }

        calendarGrid.appendChild(dayCell);
      }
    }
  }

  // SECTION 9: INITIALIZATION
  function initMoodLogs() {
    const pets = dataService.getPets();
    const activePet = dataService.getActivePet();
    if (activePet) {
      document.getElementById('moodLogs').innerHTML = `
        <div class="mood-container">
          ${activePet.moodLogs?.map(log => `
            <div class="mood-entry">
              <span>${new Date(log.date).toLocaleDateString()}</span>
              <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
            </div>
          `).join('') || '<p>No mood entries yet</p>'}
        </div>`;
    }
  }
  
  function initEventListeners() {
    // Form Events
    document.getElementById('petForm')?.addEventListener('submit', handlers.handleFormSubmit);
    document.getElementById('petImage')?.addEventListener('change', handlers.handleImageUpload);

    // Mood Logs
    document.addEventListener('click', handlers.handleMoodSelection);

    // Calendar
    handlers.handleCalendarNavigation();

    // Button Events
    document.getElementById('toggleModeButton')?.addEventListener('click', toggleMode);
    document.getElementById('logoutButton')?.addEventListener('click', Auth.logout);
    document.getElementById('addNewProfileButton')?.addEventListener('click', () => {
      state.activePetIndex = null;
      render.petForm();
    });

// Inside PetEntry's initEventListeners
document.addEventListener('click', (e) => {
  if (e.target.closest('.qr-btn')) {
    const index = e.target.dataset.index;
    const pet = dataService.getPets()[index];
    generatePetQR(pet);
  }
  
  if (e.target.closest('.report-btn')) {
    const index = e.target.dataset.index;
    const pet = dataService.getPets()[index];
    ReportGenerator.generatePDF(pet);
  }
});
    
    // Dynamic Events
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

    const toggleBtn = document.getElementById('toggleModeButton');
    if (toggleBtn) {
      toggleBtn.textContent = state.darkMode ? 'Light Mode' : 'Dark Mode';
    }

    Charts.updateColors();
  }

  //* show exercise log*//
  function initDashboard() {
    AppHelper.showPage(templates.dashboard());
    render.petForm();
    render.moodGrid();
    render.calendar();
    initEventListeners();
    Charts.init('#exerciseCharts');
  }

  return {
    initDashboard,
    showExerciseLog: initDashboard,
    updateDashboard: initDashboard
  };
})();

//* QR code *//
// Inside PetEntry module
function generatePetQR(petData) {
  const qrContent = JSON.stringify({
    name: petData.name,
    age: petData.age,
    lastExercise: petData.exerciseEntries.slice(-1)[0] || 'No recent exercise',
    healthStatus: petData.healthStatus
  });

  const qrContainer = document.createElement('div');
  new QRCode(qrContainer, {
    text: qrContent,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  AppHelper.showModal(`
    <h3>${petData.name}'s QR Code</h3>
    <div class="qr-wrapper">${qrContainer.innerHTML}</div>
    <p class="qr-instructions">Scan to view basic pet info</p>
  `);
}

/* ==================== */
/* 6. Charts Module */
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
      </div>`;
  }

  // ... [Include all Charts functionality from previous implementation] ...
  
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

  return {
    init,
    refresh,
    updateColors
  };
})();

/* ==================== */
/* Report Generator     */
/* ==================== */
const ReportGenerator = (function() {
  async function generatePDF(petData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    let yPos = margin;

    // Add header
    doc.setFontSize(22);
    doc.text(`${petData.name}'s Monthly Report`, margin, yPos);
    yPos += 15;

    // Add pet info
    doc.setFontSize(12);
    doc.text(`Age: ${petData.age} | Weight: ${petData.weight}`, margin, yPos);
    yPos += 10;
    
    // Add calendar
    const calendar = await html2canvas(document.querySelector('#calendarContainer'));
    doc.addImage(calendar, 'PNG', margin, yPos, 180, 80);
    yPos += 90;

    // Add charts
    const charts = await html2canvas(document.querySelector('#exerciseCharts'));
    doc.addImage(charts, 'PNG', margin, yPos, 180, 80);
    yPos += 90;

    // Add summary
    doc.setFontSize(16);
    doc.text('Monthly Summary:', margin, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`- Exercise Days: ${petData.exerciseEntries.length}`, margin, yPos);
    yPos += 7;
    doc.text(`- Total Minutes: ${petData.exerciseEntries.reduce((acc, e) => acc + e.duration, 0)}`, margin, yPos);
    yPos += 7;
    doc.text(`- Calories Burned: ${petData.exerciseEntries.reduce((acc, e) => acc + e.calories, 0)}`, margin, yPos);

    // Save PDF
    doc.save(`${petData.name}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  return { generatePDF };
})();

/* ==================== */
/* 7. Initialization */
/* ==================== */
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  registerServiceWorker();

  if (!sessionStorage.getItem('user')) {
    Auth.showAuth(true);
  } else {
    PetEntry.initDashboard();
  }
});
