"use strict";

let deferredPrompt; // Store the install event

// ✅ Automatically Show Install Banner
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

// Add this near the top of your app.js, after your other constants
const MOOD_EMOJIS = ['😀', '😊', '😐', '😞', '😠', '🤢', '😤', '😔', '😴', '😰'];

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

// ✅ Fixed showSignIn (no nested DOMContentLoaded)
function showSignIn() {
    const authContainer = document.getElementById("auth-container");
    if (authContainer) {
        authContainer.style.display = "block";
    } else {
        console.warn("⚠️ Auth container not found");
    }
}

// ✅ Run on page load
document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();

    // Apply dark mode if enabled
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Check if user is logged in
    if (sessionStorage.getItem('user')) {
    if (typeof PetEntry !== "undefined" && typeof PetEntry.showExerciseLog === "function") {
        PetEntry.showExerciseLog();
    } else {
        console.error("❌ PetEntry or showExerciseLog function is missing!");
    }
    } else {
        Auth.showAuth();
    }
}); // <-- Closing brace for DOMContentLoaded

// appHelper
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

// authentication//
const Auth = (function() {
  let currentUser = null;

  async function hashPassword(pass, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt ? pass + salt : pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

//=============================================
// auth template signup function
//===============================================
function authTemplate(isSignUp) {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h2>${isSignUp ? 'Create Account' : 'Sign In'}</h2>
        <form id="authForm">
          ${isSignUp ? `
            <div class="form-group">
              <label for="username">Name</label>
              <input type="text" id="username" required autocomplete="name">
            </div>` : ''}
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required minlength="8" autocomplete="current-password">
          </div>
          ${isSignUp ? `
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" required autocomplete="new-password">
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


//=========================================
// Hanle auth submit function
//========================================  
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
    console.log('Stored user data:', JSON.parse(sessionStorage.getItem('user')));
    
    // FIXED: Check if PetEntry exists before calling it
    if (typeof PetEntry !== 'undefined' && PetEntry.showExerciseLog) {
      PetEntry.showExerciseLog();
    } else {
      console.error('PetEntry module not available');
      AppHelper.showError('Failed to load dashboard. Please refresh the page.');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    AppHelper.showError('Authentication failed. Please try again.');
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

//=================================
//Add This Helper Method to PetEntry:
//==================================
function initializeNewPet() {
  return {
    petDetails: { 
      type: '',
      name: '', 
      image: DEFAULT_IMAGE, 
      age: '',
      weight: '',
      breed: '',
      gender: '',
      color: '',
      microchip: '',
      energyLevel: '',
      healthStatus: '',
      vetInfo: '',
      vaccinations: '',
      medications: '',
      allergies: '',
      diet: '',
      behavior: '',
      favoriteExercise: '',
      notes: ''
    },
    exerciseEntries: [],
    moodLogs: []  // Ensure moodLogs array is initialized
  };
}
//===================================
    // petentry UPDATED
//======================
const PetEntry = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = '/images/default-pet.png';
  const FAVORITE_EXERCISES = ['walking', 'running', 'swimming', 'playing', 'fetch', 'agility'];
  const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other'];
  const ENERGY_LEVELS = ['low', 'medium', 'high', 'very high'];
  const HEALTH_STATUSES = ['excellent', 'good', 'fair', 'poor', 'under treatment'];
    
  const templates = {
    dashboard: () => `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
          <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
          <button id="logoutButton" class="icon-btn">🚪 Logout</button>
        </header>
        <main class="dashboard-main">
          <section class="form-section" id="petFormContainer"></section>
          <section class="data-section">
            <div class="calendar-container" id="exerciseCalendar"></div>
            <div class="charts-container" id="exerciseCharts"></div>
            <div class="mood-container" id="moodLogs"></div> <!-- ADD THIS LINE -->
          </section>
        </main>
        <aside class="saved-profiles" id="savedProfiles"></aside>
      </div>`,
    
    petForm: (pet = {}) => {
      const petDetails = pet.petDetails || {};
      return `
      <form id="exerciseForm" class="pet-form card">
        <fieldset class="pet-details">
          <legend>${activePetIndex === null ? 'New Pet' : 'Update Pet'}</legend>
          
          <div class="form-group">
            <label for="petType">Pet Type *</label>
            <select id="petType" required>
              <option value="">Select Type</option>
              ${PET_TYPES.map(type => `
                <option value="${type}" ${petDetails.type === type ? 'selected' : ''}>
                  ${type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="petName">Name *</label>
            <input type="text" id="petName" value="${petDetails.name || ''}" required>
          </div>
          
          <div class="form-group">
            <label>Image</label>
            <div class="image-upload">
              <input type="file" id="petImage" accept="image/*">
              <img id="petImagePreview" src="${petDetails.image || DEFAULT_IMAGE}" alt="Pet Preview">
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="petAge">Age (years)</label>
              <input type="number" id="petAge" min="0" step="0.1" value="${petDetails.age || ''}">
            </div>
            
            <div class="form-group">
              <label for="petWeight">Weight (lbs or kg)</label>
              <input type="number" id="petWeight" min="0" step="0.1" value="${petDetails.weight || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="petBreed">Breed</label>
            <input type="text" id="petBreed" value="${petDetails.breed || ''}" placeholder="e.g., Labrador, Siamese">
          </div>
          
          <div class="form-group">
            <label for="petGender">Gender</label>
            <select id="petGender">
              <option value="">Select Gender</option>
              <option value="male" ${petDetails.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${petDetails.gender === 'female' ? 'selected' : ''}>Female</option>
              <option value="unknown" ${petDetails.gender === 'unknown' ? 'selected' : ''}>Unknown</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="petColor">Color/Markings</label>
            <input type="text" id="petColor" value="${petDetails.color || ''}" placeholder="e.g., Black with white paws">
          </div>
          
          <div class="form-group">
            <label for="petMicrochip">Microchip ID</label>
            <input type="text" id="petMicrochip" value="${petDetails.microchip || ''}" placeholder="15-digit microchip number">
          </div>
          
          <div class="form-group">
            <label for="petEnergyLevel">Energy Level</label>
            <select id="petEnergyLevel">
              <option value="">Select Energy Level</option>
              ${ENERGY_LEVELS.map(level => `
                <option value="${level}" ${petDetails.energyLevel === level ? 'selected' : ''}>
                  ${level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="petHealthStatus">Health Status</label>
            <select id="petHealthStatus">
              <option value="">Select Health Status</option>
              ${HEALTH_STATUSES.map(status => `
                <option value="${status}" ${petDetails.healthStatus === status ? 'selected' : ''}>
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="petVetInfo">Veterinarian Information</label>
            <textarea id="petVetInfo" rows="2" placeholder="Vet name, clinic, and contact info">${petDetails.vetInfo || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petVaccinations">Vaccination Records</label>
            <textarea id="petVaccinations" rows="2" placeholder="Vaccination types and dates">${petDetails.vaccinations || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petMedications">Medications</label>
            <textarea id="petMedications" rows="2" placeholder="Current medications and dosage">${petDetails.medications || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petAllergies">Allergies/Sensitivities</label>
            <textarea id="petAllergies" rows="2" placeholder="Food, environmental, or medication allergies">${petDetails.allergies || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petDiet">Diet & Feeding Schedule</label>
            <textarea id="petDiet" rows="2" placeholder="What, how much, and when they eat">${petDetails.diet || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petBehavior">Temperament & Behavior</label>
            <textarea id="petBehavior" rows="2" placeholder="General behavior, training, socialization">${petDetails.behavior || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="petFavoriteExercise">Favorite Exercise/Activity</label>
            <select id="petFavoriteExercise">
              <option value="">Select Favorite</option>
              ${FAVORITE_EXERCISES.map(exercise => `
                <option value="${exercise}" ${petDetails.favoriteExercise === exercise ? 'selected' : ''}>
                  ${exercise.charAt(0).toUpperCase() + exercise.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="petNotes">Additional Notes</label>
            <textarea id="petNotes" rows="3" placeholder="Any other important information">${petDetails.notes || ''}</textarea>
          </div>
        </fieldset>
        
        <fieldset class="exercise-entry">
          <legend>Add Exercise</legend>
          <div class="form-grid">
            <div class="form-group">
              <label for="exerciseType">Type</label>
              <select id="exerciseType" required>
                ${FAVORITE_EXERCISES.map(exercise => `
                  <option value="${exercise}">${exercise.charAt(0).toUpperCase() + exercise.slice(1)}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="exerciseDuration">Duration (min)</label>
              <input type="number" id="exerciseDuration" min="1" required>
            </div>
            <div class="form-group">
              <label for="exerciseDate">Date</label>
              <input type="date" id="exerciseDate" required>
            </div>
            <div class="form-group">
              <label for="caloriesBurned">Calories Burned</label>
              <input type="number" id="caloriesBurned" min="1" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="exerciseIntensity">Intensity Level</label>
            <select id="exerciseIntensity">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="exerciseNotes">Exercise Notes</label>
            <textarea id="exerciseNotes" rows="2" placeholder="Weather conditions, route, behavior during exercise"></textarea>
          </div>
          
          <button type="submit" class="primary-btn">
             ${activePetIndex === null ? 'Create Complete Profile' : 'Add Exercise & Update Profile'}
           </button>
          
        </fieldset>
      </form>`;
    }
  };

//==================
 // show exercise log function     UPDATED
 //========================
function showExerciseLog() {
  AppHelper.showPage(templates.dashboard());
  
  // Get current pet data if editing existing pet
  const pets = PetEntry.getPets();
  const currentPet = activePetIndex !== null && pets[activePetIndex] ? pets[activePetIndex] : {};
  
  AppHelper.registerComponent('petFormContainer', () => templates.petForm(currentPet));
  AppHelper.refreshComponent('petFormContainer');
  
  Calendar.init('#exerciseCalendar');
  Charts.init('#exerciseCharts');
  
  // Initialize mood logs if available
  if (typeof MoodLogs !== 'undefined' && MoodLogs.renderMoodLogs) {
    MoodLogs.renderMoodLogs();
  }
  
  setupEventListeners();
  loadSavedProfiles();
  loadActivePetData();
}
//===============================
// Setup eventlisteners function 
//===========≈===================
function setupEventListeners() {
  // Use event delegation for dynamically created buttons
  document.addEventListener('click', function(e) {
    // Logout button handler
    if (e.target.id === 'logoutButton' || e.target.closest('#logoutButton')) {
      e.preventDefault();
      Auth.logout();
    }
    
    // New Profile button handler
    if (e.target.id === 'addNewProfileButton' || e.target.closest('#addNewProfileButton')) {
      e.preventDefault();
      activePetIndex = null;
      AppHelper.refreshComponent('petFormContainer');
      
      // Also clear any selected state in profiles
      loadSavedProfiles();
    }
  });

  // Existing form and image listeners (they work because they're re-attached on refresh)
  document.getElementById('exerciseForm')?.addEventListener('submit', handleFormSubmit);
  document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
  document.getElementById('toggleModeButton')?.addEventListener('click', toggleDarkMode);
}
    
//==================================
    // HANDLEFORM SUBMIT 
//===========================
  function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect all form data
    const formData = {
      petType: document.getElementById('petType').value,
      petName: document.getElementById('petName').value,
      petImage: document.getElementById('petImagePreview').src,
      petAge: document.getElementById('petAge').value,
      petWeight: document.getElementById('petWeight').value,
      petBreed: document.getElementById('petBreed').value,
      petGender: document.getElementById('petGender').value,
      petColor: document.getElementById('petColor').value,
      petMicrochip: document.getElementById('petMicrochip').value,
      petEnergyLevel: document.getElementById('petEnergyLevel').value,
      petHealthStatus: document.getElementById('petHealthStatus').value,
      petVetInfo: document.getElementById('petVetInfo').value,
      petVaccinations: document.getElementById('petVaccinations').value,
      petMedications: document.getElementById('petMedications').value,
      petAllergies: document.getElementById('petAllergies').value,
      petDiet: document.getElementById('petDiet').value,
      petBehavior: document.getElementById('petBehavior').value,
      petFavoriteExercise: document.getElementById('petFavoriteExercise').value,
      petNotes: document.getElementById('petNotes').value,
      exerciseType: document.getElementById('exerciseType').value,
      duration: document.getElementById('exerciseDuration').value,
      date: document.getElementById('exerciseDate').value,
      calories: document.getElementById('caloriesBurned').value,
      exerciseIntensity: document.getElementById('exerciseIntensity').value,
      exerciseNotes: document.getElementById('exerciseNotes').value
    };
    

      
    // Validate required fields
    const errors = [];
    if (!formData.petType) errors.push('Pet type is required');
    if (!formData.petName.trim()) errors.push('Pet name is required');
    if (formData.duration < 1) errors.push('Invalid duration');
    if (formData.calories < 1) errors.push('Invalid calories');
    if (errors.length) return AppHelper.showErrors(errors);

    const pets = getPets();
    const petData = activePetIndex !== null ? pets[activePetIndex] : initializeNewPet();
      // it retrieves everything via the helper

    // Update pet details with all form fields
    petData.petDetails = {
      type: formData.petType,
      name: formData.petName,
      image: formData.petImage,
      age: formData.petAge,
      weight: formData.petWeight,
      breed: formData.petBreed,
      gender: formData.petGender,
      color: formData.petColor,
      microchip: formData.petMicrochip,
      energyLevel: formData.petEnergyLevel,
      healthStatus: formData.petHealthStatus,
      vetInfo: formData.petVetInfo,
      vaccinations: formData.petVaccinations,
      medications: formData.petMedications,
      allergies: formData.petAllergies,
      diet: formData.petDiet,
      behavior: formData.petBehavior,
      favoriteExercise: formData.petFavoriteExercise,
      notes: formData.petNotes
    };

    // Add exercise entry with new fields
// Only add exercise if we're updating an existing profile
if (activePetIndex !== null) {
  petData.exerciseEntries.push({
    exerciseType: formData.exerciseType,
    duration: Number(formData.duration),
    date: formData.date,
    caloriesBurned: Number(formData.calories),
    intensity: formData.exerciseIntensity,
    notes: formData.exerciseNotes
  });
}

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
    
//============================================
    // UPDATE DASHBOARD
//=====================================
function updateDashboard(petData) {
  Calendar.refresh(petData.exerciseEntries || []);
  Charts.refresh(petData.exerciseEntries || []);
  if (typeof MoodLogs !== 'undefined' && MoodLogs.renderMoodLogs) {
    MoodLogs.renderMoodLogs();
  }
  loadSavedProfiles();
  AppHelper.refreshComponent('petFormContainer');
}

//=================================
// LOAD SAVED PROFILES.  enhanced 
//===========================
//=================================
// LOAD SAVED PROFILES - Enhanced with full CRUD operations
//===========================
function loadSavedProfiles() {
  const pets = getPets();
  const profilesHTML = pets.map((pet, index) => `
    <div class="profile-card ${index === activePetIndex ? 'active' : ''}" data-pet-index="${index}">
      <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}">
      <div class="profile-info">
        <h4>${pet.petDetails.name}</h4>
        <p>Type: ${pet.petDetails.type ? pet.petDetails.type.charAt(0).toUpperCase() + pet.petDetails.type.slice(1) : 'Unknown'}</p>
        <p>Breed: ${pet.petDetails.breed || 'Unknown'}</p>
        <p>Age: ${pet.petDetails.age || 'Unknown'} years</p>
        <p>Weight: ${pet.petDetails.weight || 'Unknown'}</p>
        <div class="profile-stats">
          <span class="stat-badge">${pet.exerciseEntries.length} exercises</span>
          ${pet.moodLogs ? `<span class="stat-badge">${pet.moodLogs.length} moods</span>` : ''}
        </div>
      </div>
      <div class="profile-actions">
        <button class="select-btn" data-index="${index}" title="Select this pet">
          ${index === activePetIndex ? '✅ Selected' : '👉 Select'}
        </button>
        <button class="edit-btn" data-index="${index}" title="Edit pet details">
          ✏️ Edit
        </button>
        <button class="delete-btn" data-index="${index}" title="Delete this pet">
          🗑️ Delete
        </button>
        <button class="report-btn" data-index="${index}" title="Generate report">
          📊 Report
        </button>
        <button class="share-btn" data-index="${index}" title="Share pet profile">
          📤 Share
        </button>
      </div>
    </div>
  `).join('');

  AppHelper.renderComponent('savedProfiles', profilesHTML);
  
  // Add event listeners for all buttons
  setupProfileEventListeners();
}

//=================================
// SETUP PROFILE EVENT LISTENERS
//===========================
function setupProfileEventListeners() {
  // Select button
  document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      selectPetProfile(index);
    });
  });

  // Edit button
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      editPetProfile(index);
    });
  });

  // Delete button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      deletePetProfile(index);
    });
  });

  // Report button
  document.querySelectorAll('.report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      const pet = getPets()[index];
      if (pet) {
        Report.generatePDF(pet);
      }
    });
  });

  // Share button
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      sharePetProfile(index);
    });
  });

  // Click anywhere on card to select
  document.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-actions')) {
        const index = parseInt(card.dataset.petIndex);
        selectPetProfile(index);
      }
    });
  });
}

//=================================
// PROFILE ACTION FUNCTIONS
//===========================
function selectPetProfile(index) {
  activePetIndex = index;
  sessionStorage.setItem('activePetIndex', activePetIndex);
  updateDashboard(getPets()[activePetIndex]);
  loadSavedProfiles(); // Refresh to show selected state
}

function editPetProfile(index) {
  activePetIndex = index;
  sessionStorage.setItem('activePetIndex', activePetIndex);
  
  // Load the pet data into the form
  const pet = getPets()[index];
  if (pet) {
    AppHelper.refreshComponent('petFormContainer');
    
    // Fill form fields with existing data (you may need to add this functionality)
    setTimeout(() => {
      if (document.getElementById('petName')) {
        document.getElementById('petName').value = pet.petDetails.name || '';
        document.getElementById('petType').value = pet.petDetails.type || '';
        document.getElementById('petAge').value = pet.petDetails.age || '';
        document.getElementById('petWeight').value = pet.petDetails.weight || '';
        document.getElementById('petBreed').value = pet.petDetails.breed || '';
        document.getElementById('petGender').value = pet.petDetails.gender || '';
        document.getElementById('petColor').value = pet.petDetails.color || '';
        document.getElementById('petCharacteristics').value = pet.petDetails.characteristics || '';
        document.getElementById('petDiet').value = pet.petDetails.diet || '';
        document.getElementById('petHealthStatus').value = pet.petDetails.healthStatus || '';
        document.getElementById('petAllergies').value = pet.petDetails.allergies || '';
        document.getElementById('petBehavior').value = pet.petDetails.behavior || '';
        document.getElementById('petFavoriteExercise').value = pet.petDetails.favoriteExercise || '';
        document.getElementById('petNotes').value = pet.petDetails.notes || '';
        
        if (pet.petDetails.image && document.getElementById('petImagePreview')) {
          document.getElementById('petImagePreview').src = pet.petDetails.image;
        }
      }
    }, 100);
  }
}

function deletePetProfile(index) {
  if (confirm('Are you sure you want to delete this pet profile? This action cannot be undone.')) {
    const pets = getPets();
    pets.splice(index, 1);
    localStorage.setItem('pets', JSON.stringify(pets));
    
    if (activePetIndex === index) {
      activePetIndex = null;
      sessionStorage.removeItem('activePetIndex');
      AppHelper.refreshComponent('petFormContainer');
    }
    
    loadSavedProfiles();
    AppHelper.showError('Profile deleted successfully');
  }
}

function sharePetProfile(index) {
  const pet = getPets()[index];
  if (!pet) return;
  
  const shareData = {
    title: `${pet.petDetails.name}'s Profile`,
    text: `Check out ${pet.petDetails.name}'s pet profile on Pet Exercise Log!`,
    url: window.location.href
  };
  
  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log('Profile shared successfully'))
      .catch(error => console.log('Error sharing:', error));
  } else {
    // Fallback: copy to clipboard
    const profileText = `Pet: ${pet.petDetails.name}\nType: ${pet.petDetails.type}\nBreed: ${pet.petDetails.breed}\nAge: ${pet.petDetails.age}`;
    navigator.clipboard.writeText(profileText)
      .then(() => {
        AppHelper.showError('Profile details copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        AppHelper.showError('Sharing not supported on this browser');
      });
  }
}

    

//===============================
    // ACTVE PET DATA
//==============================
  function loadActivePetData() {
    const savedIndex = sessionStorage.getItem('activePetIndex');
    if (savedIndex !== null) {
      activePetIndex = parseInt(savedIndex);
      const petData = getPets()[activePetIndex];
      if (petData) updateDashboard(petData);
    }
  }
// toggle mode //
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    Charts.updateColors();
    Calendar.refresh(getActivePet()?.exerciseEntries || []);
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
  getActivePetIndex: () => activePetIndex,
  getActivePet: () => activePetIndex !== null ? this.getPets()[activePetIndex] : null,
  initializeNewPet  // Add this if you need it externally
};
})();


//=====================================
   //     MOOD LOGS
//=======================================
// MOODLOGS - Enhanced Version
const MoodLogs = (function() {
  const MOOD_OPTIONS = [
    { value: 0, emoji: '😀', label: 'Happy' },
    { value: 1, emoji: '😊', label: 'Content' },
    { value: 2, emoji: '😐', label: 'Neutral' },
    { value: 3, emoji: '😞', label: 'Sad' },
    { value: 4, emoji: '😠', label: 'Angry' },
    { value: 5, emoji: '🤢', label: 'Sick' },
    { value: 6, emoji: '😤', label: 'Aggressive' },
    { value: 7, emoji: '😔', label: 'Depressed' },
    { value: 8, emoji: '😴', label: 'Tired' },
    { value: 9, emoji: '😰', label: 'Anxious' }
  ];

  function renderMoodLogs() {
    const activePetIndex = PetEntry.getActivePetIndex();
    const pets = PetEntry.getPets();
    
    if (activePetIndex !== null && pets[activePetIndex]) {
      const activePet = pets[activePetIndex];
      const moodLogs = activePet.moodLogs || [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const html = `
        <div class="mood-container">
          <h3>Today's Mood</h3>
          <div class="mood-selector">
            ${MOOD_OPTIONS.map(mood => `
              <button class="emoji-btn" data-mood="${mood.value}" data-date="${today}" 
                      title="${mood.label}">
                ${mood.emoji}
                <span class="mood-label">${mood.label}</span>
              </button>
            `).join('')}
          </div>
          
          <h3>Mood History</h3>
          <div class="mood-history">
            ${moodLogs.length > 0 ? moodLogs.map(log => {
              const mood = MOOD_OPTIONS.find(m => m.value === log.mood) || MOOD_OPTIONS[0];
              return `
                <div class="mood-entry">
                  <span class="mood-date">${formatDate(log.date)}</span>
                  <span class="mood-emoji">${mood.emoji}</span>
                  <span class="mood-label">${mood.label}</span>
                </div>
              `;
            }).join('') : '<p class="no-entries">No mood entries yet</p>'}
          </div>
        </div>
      `;
      
      const moodContainer = document.getElementById('moodLogs');
      if (moodContainer) {
        moodContainer.innerHTML = html;
        attachMoodSelectionHandler();
        
        // Highlight today's mood if already logged
        const todayMood = moodLogs.find(log => log.date === today);
        if (todayMood) {
          const todayBtn = moodContainer.querySelector(`.emoji-btn[data-mood="${todayMood.mood}"]`);
          if (todayBtn) todayBtn.classList.add('selected');
        }
      }
    }
  }

  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateStr;
    }
  }

  function handleMoodSelection(e) {
    if (e.target.classList.contains('emoji-btn') || 
        e.target.closest('.emoji-btn')) {
      
      const btn = e.target.classList.contains('emoji-btn') ? 
                 e.target : e.target.closest('.emoji-btn');
      
      const moodValue = parseInt(btn.dataset.mood);
      const date = btn.dataset.date;
      
      const activePetIndex = PetEntry.getActivePetIndex();
      const pets = PetEntry.getPets();
      
      if (activePetIndex !== null && pets[activePetIndex]) {
        // Create a copy to avoid direct mutation
        const updatedPets = [...pets];
        let pet = { ...updatedPets[activePetIndex] };
        
        // Initialize moodLogs array if it doesn't exist
        pet.moodLogs = pet.moodLogs || [];
        
        // Remove any existing mood log for today
        pet.moodLogs = pet.moodLogs.filter(log => log.date !== date);
        
        // Add the new mood log
        pet.moodLogs.push({ 
          date: date, 
          mood: moodValue,
          timestamp: new Date().toISOString()
        });
        
        // Sort by date (newest first)
        pet.moodLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        updatedPets[activePetIndex] = pet;
        
        // Save back to localStorage
        localStorage.setItem('pets', JSON.stringify(updatedPets));
        
        // Update UI
        document.querySelectorAll('.emoji-btn').forEach(btn => 
          btn.classList.remove('selected')
        );
        btn.classList.add('selected');
        
        // Re-render mood logs
        renderMoodLogs();
      }
    }
  }

  function attachMoodSelectionHandler() {
    const moodContainer = document.getElementById('moodLogs');
    if (moodContainer) {
      moodContainer.addEventListener('click', handleMoodSelection);
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Check if mood logs container exists and user is logged in
    if (document.getElementById('moodLogs') && sessionStorage.getItem('user')) {
      setTimeout(renderMoodLogs, 100); // Small delay to ensure pets are loaded
    }
  });

  return {
    renderMoodLogs: renderMoodLogs
  };
})();

//============================================
// REPORT GENERATOR - Add this after MoodLogs
//============================================
const Report = (function() {
  const generatePDF = (pet) => {
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <html>
        <head>
          <title>Monthly Pet Report: ${pet.petDetails.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1, h2 { text-align: center; color: #301934; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            .calendar-grid { 
              display: grid; 
              grid-template-columns: repeat(7, 1fr); 
              gap: 5px; 
              margin: 15px 0;
            }
            .calendar-day { 
              padding: 10px; 
              border: 1px solid #ddd; 
              text-align: center;
              min-height: 40px;
            }
            .mood-emoji { font-size: 1.5em; }
            .chart-container { width: 100%; height: 300px; margin: 20px 0; }
            .summary-stats { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin: 20px 0;
            }
            .stat-box { 
              background: #f0f0f0; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center;
            }
            .button-container { 
              text-align: center; 
              margin: 20px 0;
            }
            button { 
              padding: 10px 20px; 
              margin: 0 10px; 
              background: #301934; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
            }
            button:hover { background: #4a235a; }
          </style>
        </head>
        <body>
          <h1>Monthly Pet Report: ${pet.petDetails.name}</h1>
          ${generatePetDetails(pet)}
          ${generateExerciseSummary(pet.exerciseEntries)}
          ${generateExerciseCalendar(pet)}
          ${pet.moodLogs && pet.moodLogs.length > 0 ? generateMoodCalendar(pet) : ''}
          ${pet.exerciseEntries && pet.exerciseEntries.length > 0 ? generateExerciseCharts(pet.exerciseEntries) : ''}
          <div class="button-container">
            <button onclick="window.print()">Print Report</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const generatePetDetails = (pet) => {
    return `
      <div>
        <h2>Pet Details</h2>
        <table>
          <tr><th>Name</th><th>Age</th><th>Weight</th><th>Breed</th><th>Gender</th></tr>
          <tr>
            <td>${pet.petDetails.name || 'N/A'}</td>
            <td>${pet.petDetails.age || 'N/A'}</td>
            <td>${pet.petDetails.weight || 'N/A'}</td>
            <td>${pet.petDetails.breed || 'N/A'}</td>
            <td>${pet.petDetails.gender || 'N/A'}</td>
          </tr>
        </table>
      </div>
    `;
  };

  const generateExerciseCalendar = (pet) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    let calendarHtml = `
      <h2>Exercise Calendar - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <div class="calendar-grid">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
        `<div class="calendar-day" style="font-weight:bold;">${day}</div>`
      ).join('')}
    `;
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
      calendarHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hasExercise = pet.exerciseEntries?.some(entry => entry.date === dateStr);
      calendarHtml += `<div class="calendar-day">${day} ${hasExercise ? '✅' : ''}</div>`;
    }
    
    calendarHtml += '</div>';
    return calendarHtml;
  };

  const generateMoodCalendar = (pet) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    let moodHtml = `
      <h2>Mood Calendar - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <div class="calendar-grid">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
        `<div class="calendar-day" style="font-weight:bold;">${day}</div>`
      ).join('')}
    `;
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
      moodHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
      const moodEmoji = moodEntry ? MOOD_EMOJIS[moodEntry.mood] || '❓' : '';
      moodHtml += `<div class="calendar-day mood-emoji">${moodEmoji}</div>`;
    }
    
    moodHtml += '</div>';
    return moodHtml;
  };

  const generateExerciseCharts = (exerciseEntries) => {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    
    const labels = [...new Set(exerciseEntries.map(entry => entry.date))].sort();
    const durationData = labels.map(date => 
      exerciseEntries.filter(entry => entry.date === date)
                     .reduce((sum, entry) => sum + entry.duration, 0)
    );
    
    const caloriesData = labels.map(date => 
      exerciseEntries.filter(entry => entry.date === date)
                     .reduce((sum, entry) => sum + entry.caloriesBurned, 0)
    );

    return `
      <h2>Exercise Charts</h2>
      <div class="chart-container">
        <canvas id="durationChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="caloriesChart"></canvas>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        setTimeout(function() {
          new Chart(document.getElementById('durationChart').getContext('2d'), { 
            type: 'bar', 
            data: { 
              labels: ${JSON.stringify(labels)}, 
              datasets: [{ 
                label: 'Duration (minutes)', 
                data: ${JSON.stringify(durationData)}, 
                backgroundColor: 'rgba(54, 162, 235, 0.5)', 
                borderColor: 'rgba(54, 162, 235, 1)', 
                borderWidth: 1 
              }] 
            }, 
            options: { 
              responsive: true,
              scales: { y: { beginAtZero: true } } 
            } 
          });
          
          new Chart(document.getElementById('caloriesChart').getContext('2d'), { 
            type: 'line', 
            data: { 
              labels: ${JSON.stringify(labels)}, 
              datasets: [{ 
                label: 'Calories Burned', 
                data: ${JSON.stringify(caloriesData)}, 
                backgroundColor: 'rgba(255, 99, 132, 0.2)', 
                borderColor: 'rgba(255, 99, 132, 1)', 
                borderWidth: 2,
                tension: 0.3
              }] 
            }, 
            options: { 
              responsive: true,
              scales: { y: { beginAtZero: true } } 
            } 
          });
        }, 100);
      </script>
    `;
  };

  const generateExerciseSummary = (exerciseEntries) => {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    
    const totalDays = new Set(exerciseEntries.map(entry => entry.date)).size;
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    const avgDuration = totalDuration / exerciseEntries.length;
    const avgCalories = totalCalories / exerciseEntries.length;

    return `
      <h2>Exercise Summary</h2>
      <div class="summary-stats">
        <div class="stat-box">
          <h3>${totalDays}</h3>
          <p>Days Exercised</p>
        </div>
        <div class="stat-box">
          <h3>${totalDuration} min</h3>
          <p>Total Duration</p>
        </div>
        <div class="stat-box">
          <h3>${totalCalories}</h3>
          <p>Total Calories</p>
        </div>
        <div class="stat-box">
          <h3>${avgDuration.toFixed(1)} min</h3>
          <p>Avg. per Session</p>
        </div>
        <div class="stat-box">
          <h3>${avgCalories.toFixed(0)}</h3>
          <p>Avg. Calories</p>
        </div>
        <div class="stat-box">
          <h3>${exerciseEntries.length}</h3>
          <p>Total Sessions</p>
        </div>
      </div>
    `;
  };

  return {
    generatePDF: generatePDF
  };
})();

//======================================
        // Calendar //
//=================================
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
    
//========================================
//SHOW DAY MODAL FUNCTION    UPDATED
//==================================
  function showDayModal(date, entries) {
    const modalHTML = `
      <div class="calendar-modal">
        <div class="modal-content">
          <h3>Exercises for ${date}</h3>
          ${entries.length ? entries.map(e => `
            <div class="exercise-entry">
              <h4>${e.exerciseType.charAt(0).toUpperCase() + e.exerciseType.slice(1)}</h4>
              <p>Duration: ${e.duration} mins</p>
              <p>Calories: ${e.caloriesBurned} cal</p>
              <p>Intensity: ${e.intensity || 'Not specified'}</p>
              ${e.notes ? `<p>Notes: ${e.notes}</p>` : ''}
            </div>
          `).join('') : '<p>No exercises</p>'}
          <button class="add-exercise-btn" data-date="${date}">Add Exercise</button>
          <button class="close-modal-btn">Close</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.querySelector('.add-exercise-btn').addEventListener('click', (e) => {
      PetEntry.getActivePet().exerciseEntries.push({
        date: e.target.dataset.date,
        exerciseType: 'walking',
        duration: 30,
        caloriesBurned: 150,
        intensity: 'medium'
      });
      Calendar.refresh(PetEntry.getActivePet().exerciseEntries);
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


//=======================================
// Everything related to CHARTS IS HERE
            // Charts //
//=============================================
    const Charts = (function() {
  let durationChart, caloriesChart, activityChart, intensityChart;

// ================================================
// INIT SELECTOR FUNCTION                UPDATED
//====================================================
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
          <div class="chart">
            <canvas id="intensityChart"></canvas>
          </div>
        `;
      }


//====================================
// REFRESH DATA FUNCTION     UPDATED
//=====================================
      function refresh(data) {
        if (!data.length) return;
        destroyCharts();
        
        const processed = processData(data);
        createDurationChart(processed);
        createActivityChart(processed);
        createCaloriesChart(processed);
        createIntensityChart(processed);
      }

//=========================================
// PROCESS DATA FUNCTION
//===========================
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
          }, {}),
          intensity: data.reduce((acc, e) => {
            acc[e.intensity] = (acc[e.intensity] || 0) + 1;
            return acc;
          }, {})
        };
      }

//==========================================
// NEW FUNCTION FOR INTENSITY RECENTLY ADDED
//============================================
      function createIntensityChart(data) {
        const ctx = document.getElementById('intensityChart');
        if (!ctx) return;
        
        intensityChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: Object.keys(data.intensity),
            datasets: [{
              data: Object.values(data.intensity),
              backgroundColor: ['#36a2eb', '#ffce56', '#ff6384']
            }]
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: 'Exercise Intensity Distribution'
              }
            }
          }
        });
      }


//===========================================
// CREATE DURATION CHART FUNCTION
//======================================
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
        
//===========================================
// DESTROYER CHART FUNCTION         UPDATED
//============================================
      function destroyCharts() {
        if (durationChart) durationChart.destroy();
        if (activityChart) activityChart.destroy();
        if (caloriesChart) caloriesChart.destroy();
        if (intensityChart) intensityChart.destroy();
      }

        
//============================================
// COLOR FUNCTION              UPDATED
//=====================================================
      function updateColors() {
        const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#374151';
        Chart.defaults.color = textColor;
        if (durationChart) durationChart.update();
        if (activityChart) activityChart.update();
        if (caloriesChart) caloriesChart.update();
        if (intensityChart) intensityChart.update();
      }

      return { init, refresh, updateColors };  
    })(); // ✅ Properly close IIFE
