"use strict";

// Global variables
let pets = [];
let activePetIndex = null;
const MAX_PETS = 10;
const DEFAULT_IMAGE = 'https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png';
const FAVORITE_EXERCISES = ['walking', 'running', 'swimming', 'playing', 'fetch', 'agility'];
const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other'];
const ENERGY_LEVELS = ['low', 'medium', 'high', 'very high'];
const HEALTH_STATUSES = ['excellent', 'good', 'fair', 'poor', 'under treatment'];

// Calendar variables
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let exerciseData = [];

// Charts variables
let durationChart = null;
let caloriesChart = null; 
let intensityChart = null;
let activityChart = null; // If you use activity chart elsewhere

 
const MOOD_EMOJIS = ['😀', '😊', '😐', '😞', '😠', '🤢', '😤', '😔', '😴', '😰'];

// Mood options
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



// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('user')) {
        showExerciseLog();
    }
});

// ==================== PET ENTRY FUNCTIONS ====================
function showExerciseLog() {
        console.log('showExerciseLog called'); // ← ADD THIS
    // Hide auth and show dashboard
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-banner').style.display = 'none';
    document.querySelector('.dashboard-container').style.display = 'block';

    // Show saved profiles, hide the form container initially
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('profileContainer').style.display = 'none';
    
    loadSavedProfiles();
    setupEventListeners();
    // Load active pet data after profiles are loaded
    loadActivePetData(); // ADD THIS LINE
}


// Setup event listeners
function setupEventListeners() {
        console.log('setupEventListeners called'); // ← ADD THIS

    document.getElementById('logoutButton').addEventListener('click', logout);
    
    const newProfileBtn = document.getElementById('addNewProfileButton');
    console.log('New Profile button:', newProfileBtn); // ← ADD THIS
    if (newProfileBtn) {
        newProfileBtn.addEventListener('click', function() {
            console.log('New Profile button clicked!'); // ← ADD THIS
            showCreateProfile();
        });
    }
    
    document.getElementById('toggleModeButton').addEventListener('click', toggleDarkMode);
}

//=======================================
// Show create profile to show the profile form when "New Profile" is clicked
//=====================================================
function showCreateProfile() {
    console.log('showCreateProfile called');

        // ADD THIS LINE:
    activePetIndex = null; // ← Reset to create new profile instead of editing existing
 
    // Hide saved profiles, show form container
    document.getElementById('savedProfiles').style.display = 'none';
    document.getElementById('profileContainer').style.display = 'block';
    
    // Load the profile form template
    const template = document.getElementById('profileFormTemplate');
    console.log('Template found:', template);
    
    // DEBUG: Check if template has content
    console.log('Template innerHTML length:', template.innerHTML.length);
    
    document.getElementById('profileContainer').innerHTML = template.innerHTML;
     // SET UP MOOD TRACKER WITH EVENT LISTENERS
    initializeMoodTracker();
    
    // DEBUG: Check if elements exist after inserting template
    setTimeout(() => {
        console.log('Calendar element exists:', !!document.getElementById('exerciseCalendar'));
        console.log('Mood tracker element exists:', !!document.getElementById('moodTracker'));
        console.log('Duration chart container exists:', !!document.getElementById('durationChartContainer'));
    }, 100);
    
    // Set up form submission handler
    document.getElementById('completeProfileForm').addEventListener('submit', handleFormSubmit);
    
    // Set up cancel button
    document.getElementById('cancelButton').addEventListener('click', function() {
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
        document.getElementById('profileContainer').innerHTML = '';
    });
    
    // Set today's date as default for exercise
    document.getElementById('exerciseDate').value = new Date().toISOString().split('T')[0];    
    // Initialize image upload handler
    document.getElementById('petImage').addEventListener('change', handleImageUpload);
    
    initializeDashboard();
}

//==================================================
// Initialize dashboard and it's related Initializations
//=====================================================
function initializeDashboard() {
    initializeCalendar();    // Handles empty or data state internally
    initializeCharts();      // Handles empty or data state internally
    initializeMoodTracker(); // Handles empty or data state internally Updated
}


// move it outside handleFormSubmit and initialized in it.
// it retrieves everything via the helper
    function initializeNewPet() {
    return {
        petDetails: {
            type: '',
            name: '',
            image: 'https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png',
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
        moodLogs: []
    };
}

// ===============================================
// ENHANCED WITH DYNAMIC UPDATES
// 1.HANDLE FORM SUBMIT - 
// ===============================================
function handleFormSubmit(e) {
    e.preventDefault();
    console.log('🔄 FORM SUBMIT INITIATED - Starting dynamic update process');

    try {
        // Validate form first
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            console.error('❌ Form validation failed:', validationErrors);
            AppHelper.showErrors(validationErrors);
            return;
        }

        // Collect form data
        const formData = collectFormData();
        console.log('📋 Form data collected:', formData);

        // Get current pets and prepare pet data
        const pets = getPets();
        let petData;

        if (activePetIndex === null) {
            // CREATE NEW PROFILE
            console.log('🆕 Creating new profile');
            if (pets.length >= MAX_PETS) {
                AppHelper.showError(`Maximum of ${MAX_PETS} profiles reached`);
                return;
            }
            petData = initializeNewPet();
        } else {
            // UPDATE EXISTING PROFILE
            console.log('📝 Updating existing profile at index:', activePetIndex);
            petData = { ...pets[activePetIndex] };
        }

        // Update pet details with form data
        petData.petDetails = {
            type: formData.petType,
            name: formData.petName.trim(),
            image: formData.petImage,
            age: formData.petAge,
            weight: formData.petWeight,
            breed: formData.petBreed.trim(),
            gender: formData.petGender,
            color: formData.petColor.trim(),
            microchip: formData.petMicrochip.trim(),
            energyLevel: formData.petEnergyLevel,
            healthStatus: formData.petHealthStatus,
            vetInfo: formData.petVetInfo.trim(),
            vaccinations: formData.petVaccinations.trim(),
            medications: formData.petMedications.trim(),
            allergies: formData.petAllergies.trim(),
            diet: formData.petDiet.trim(),
            behavior: formData.petBehavior.trim(),
            favoriteExercise: formData.petFavoriteExercise,
            notes: formData.petNotes.trim()
        };

        console.log('✅ Pet details updated');

        // Handle exercise data - CUMULATIVE UPDATES
        if (formData.exerciseType && formData.duration && formData.date && formData.calories) {
            const newExerciseEntry = {
                exerciseType: formData.exerciseType,
                duration: Number(formData.duration),
                date: formData.date,
                caloriesBurned: Number(formData.calories),
                intensity: formData.exerciseIntensity,
                notes: formData.exerciseNotes.trim()
            };

            // Initialize exerciseEntries array if it doesn't exist
            petData.exerciseEntries = petData.exerciseEntries || [];
            
            // Add new exercise entry (cumulative - don't replace existing)
            petData.exerciseEntries.push(newExerciseEntry);
            console.log('💪 New exercise entry added. Total exercises:', petData.exerciseEntries.length);
        }

        // Handle mood data - CUMULATIVE UPDATES
// In handleFormSubmit(), right before calling saveTemporaryMoodData:
console.log('🔍 MOOD DEBUG - Before saveTemporaryMoodData:');
console.log(' - activePetIndex:', activePetIndex);
console.log(' - window.tempMoodLogs:', window.tempMoodLogs);
console.log(' - petData.moodLogs (before):', petData.moodLogs);

petData = saveTemporaryMoodData(petData);

console.log('🔍 MOOD DEBUG - After saveTemporaryMoodData:');
console.log(' - petData.moodLogs (after):', petData.moodLogs);
     console.log('😊 Mood data processed. Total mood entries:', petData.moodLogs ? petData.moodLogs.length : 0);

        // Handle temporary exercise data
        petData = saveTemporaryExerciseData(petData);

        // Save to storage
        if (activePetIndex === null) {
            pets.push(petData);
            activePetIndex = pets.length - 1;
        } else {
            pets[activePetIndex] = petData;
        }

        localStorage.setItem('pets', JSON.stringify(pets));
        sessionStorage.setItem('activePetIndex', activePetIndex);
        console.log('💾 Data saved to storage');

        // DYNAMIC UPDATES - Refresh all components
        performDynamicUpdates(petData);

        // Show success and return to dashboard
        showSuccess(activePetIndex === null ? 'Profile created successfully!' : 'Profile updated successfully!');
        returnToDashboard();

        console.log('✅ FORM SUBMIT COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('❌ CRITICAL ERROR in handleFormSubmit:', error);
        AppHelper.showError('Failed to save profile: ' + error.message);
    }
}

// ===============================================
// 2.VALIDATE FORM - COMPREHENSIVE VALIDATION
// ===============================================
function validateForm() {
    console.log('🔍 Validating form...');
    const errors = [];
    
    // Required fields validation
    if (!document.getElementById('petType')?.value) {
        errors.push('Pet type is required');
    }
    
    const petName = document.getElementById('petName')?.value.trim();
    if (!petName) {
        errors.push('Pet name is required');
    }
    
    // Exercise validation (if exercise data is provided)
    const exerciseType = document.getElementById('exerciseType')?.value;
    const duration = document.getElementById('exerciseDuration')?.value;
    const date = document.getElementById('exerciseDate')?.value;
    const calories = document.getElementById('caloriesBurned')?.value;
    
    // If any exercise field is filled, all required ones must be filled
    if (exerciseType || duration || date || calories) {
        if (!exerciseType) errors.push('Exercise type is required when logging exercise');
        if (!duration || duration < 1) errors.push('Valid exercise duration is required');
        if (!date) errors.push('Exercise date is required');
        if (!calories || calories < 1) errors.push('Valid calories burned is required');
    }
    
    console.log('📊 Validation results:', errors.length > 0 ? errors : 'No errors');
    return errors;
}

// ===============================================
// 3.COLLECT FORM DATA
// ===============================================
function collectFormData() {
    return {
        petType: document.getElementById('petType')?.value,
        petName: document.getElementById('petName')?.value,
        petImage: document.getElementById('petImagePreview')?.src,
        petAge: document.getElementById('petAge')?.value,
        petWeight: document.getElementById('petWeight')?.value,
        petBreed: document.getElementById('petBreed')?.value,
        petGender: document.getElementById('petGender')?.value,
        petColor: document.getElementById('petColor')?.value,
        petMicrochip: document.getElementById('petMicrochip')?.value,
        petEnergyLevel: document.getElementById('petEnergyLevel')?.value,
        petHealthStatus: document.getElementById('petHealthStatus')?.value,
        petVetInfo: document.getElementById('petVetInfo')?.value,
        petVaccinations: document.getElementById('petVaccinations')?.value,
        petMedications: document.getElementById('petMedications')?.value,
        petAllergies: document.getElementById('petAllergies')?.value,
        petDiet: document.getElementById('petDiet')?.value,
        petBehavior: document.getElementById('petBehavior')?.value,
        petFavoriteExercise: document.getElementById('petFavoriteExercise')?.value,
        petNotes: document.getElementById('petNotes')?.value,
        exerciseType: document.getElementById('exerciseType')?.value,
        duration: document.getElementById('exerciseDuration')?.value,
        date: document.getElementById('exerciseDate')?.value,
        calories: document.getElementById('caloriesBurned')?.value,
        exerciseIntensity: document.getElementById('exerciseIntensity')?.value,
        exerciseNotes: document.getElementById('exerciseNotes')?.value
    };
}

// ===============================================
// 4.PERFORM DYNAMIC UPDATES - CORE CONNECTIVITY
// ===============================================
function performDynamicUpdates(petData) {
    console.log('🔄 Performing dynamic updates for all components');
    
    try {
        // 1. Update saved profiles (pet cards)
        loadSavedProfiles();
        console.log('✅ Pet cards updated');
        
        // 2. Update dashboard components if we're on the active pet
        const currentActiveIndex = parseInt(sessionStorage.getItem('activePetIndex'));
        if (currentActiveIndex === activePetIndex) {
            updateDashboard(petData);
            console.log('✅ Dashboard components updated');
        }
        
        // 3. Force refresh of calendar highlights
        refreshCalendarHighlights(petData.exerciseEntries || []);
        console.log('✅ Calendar highlights refreshed');
        
        // 4. Update any open modal or preview components
        updateOpenComponents(petData);
        console.log('✅ Open components refreshed');
        
    } catch (error) {
        console.error('❌ Error during dynamic updates:', error);
        // Don't throw - we still want the save to complete
    }
}

// ===============================================
// 5.REFRESH CALENDAR HIGHLIGHTS
// ===============================================
function refreshCalendarHighlights(exerciseEntries) {
    // This will ensure any open calendar shows the new exercise data
    // The calendar in saved profiles will update via loadSavedProfiles()
    console.log('📅 Refreshing calendar with', exerciseEntries.length, 'exercise entries');
    
    // If there's a specific calendar component open, refresh it
    const openCalendar = document.querySelector('.mini-calendar');
    if (openCalendar && exerciseEntries.length > 0) {
        // Trigger a re-render of the mini calendar
        const calendarContainer = openCalendar.closest('.calendar-section');
        if (calendarContainer) {
            const petIndex = calendarContainer.closest('.profile-card')?.dataset.petIndex;
            if (petIndex !== undefined) {
                const pets = getPets();
                const pet = pets[petIndex];
                if (pet) {
                    calendarContainer.querySelector('.mini-calendar').innerHTML = 
                        generateMiniCalendar(pet.exerciseEntries || []);
                }
            }
        }
    }
}

// ===============================================
// 6.UPDATE OPEN COMPONENTS
// ===============================================
function updateOpenComponents(petData) {
    // Update any other open UI components that might need refreshing
    const moodContainer = document.querySelector('.mood-section');
    if (moodContainer) {
        // Re-render mood section with updated data
        const moodHTML = generateMoodSectionHTML(petData.moodLogs || []);
        moodContainer.innerHTML = moodHTML;
    }
}

// ===============================================
// 7.GENERATE MOOD SECTION HTML
// ===============================================
function generateMoodSectionHTML(moodLogs) {
    return `
        <h5>😊 Recent Mood</h5>
        ${moodLogs && moodLogs.length > 0 ? 
            moodLogs.slice(-3).map(log => {
                const mood = MOOD_OPTIONS.find(m => m.value === log.mood) || MOOD_OPTIONS[0];
                return `
                    <div class="mood-entry-small">
                        <span class="mood-emoji-small">${mood.emoji}</span>
                        <span class="mood-date-small">${formatDate(log.date)}</span>
                    </div>
                `;
            }).join('') : 
            '<p class="no-moods">No mood entries</p>'
        }
    `;
}

// ===============================================
// 8.RETURN TO DASHBOARD
// ===============================================
function returnToDashboard() {
    console.log('🏠 Returning to dashboard');
    
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('profileContainer').style.display = 'none';
    document.getElementById('profileContainer').innerHTML = '';
    
    // Clear any temporary data
    clearTemporaryData();
}

// ===============================================
//  Load saved profiles - FINAL STRUCTURE
//==========================================
function loadSavedProfiles() {
    pets = getPets();
    console.log('🔍 MOOD DEBUG - Total pets:', pets.length);
    pets.forEach((pet, i) => {
        console.log(`🔍 Pet ${i}: ${pet.petDetails.name}, Mood logs:`, pet.moodLogs);
    });

    if (pets.length === 0) {
        document.getElementById('savedProfiles').innerHTML = `
            <div class="no-profiles-message">
                <p>No saved profiles yet. Click "New Profile" to create one!</p>
            </div>`;
        return;
    }
    
    const profilesHTML = pets.map((pet, index) => {
        // Calculate exercise stats
        const totalSessions = pet.exerciseEntries.length;
        const totalDuration = pet.exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const totalCalories = pet.exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
        const avgDuration = totalSessions > 0 ? (totalDuration / totalSessions).toFixed(1) : 0;
        
        return `
    <div class="profile-card ${index === activePetIndex ? 'active' : ''}" data-pet-index="${index}">
      <!-- SECTION 1: BASIC INFO -->
      <div class="basic-info-section">
        <div class="profile-image-container">
          <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}" class="profile-image">
        </div>
        <div class="basic-info-content">
          <!-- QUICK STATS - Top Right -->
          <div class="quick-stats-section">
            <div class="quick-stat">
              <span class="quick-stat-icon">⏱️</span>
              <span class="quick-stat-value">${totalDuration}m</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-icon">🔥</span>
              <span class="quick-stat-value">${totalCalories}</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-icon">📈</span>
              <span class="quick-stat-value">${totalSessions}</span>
            </div>
          </div>
          
          <!-- BASIC FIELDS - Free Floating -->
          <div class="basic-fields">
            <div class="field-item">
              <span class="field-icon">🐶</span>
              <span class="field-text">${pet.petDetails.name || 'Unknown'}</span>
            </div>
            <div class="field-item">
              <span class="field-icon">🏷️</span>
              <span class="field-text">${pet.petDetails.breed || 'Mixed'}</span>
            </div>
            <div class="field-item">
              <span class="field-icon">⚖️</span>
              <span class="field-text">${pet.petDetails.weight || '?'} ${pet.petDetails.weight ? 'lbs' : ''}</span>
            </div>
            <div class="field-item">
              <span class="field-icon">🎂</span>
              <span class="field-text">${pet.petDetails.age || '?'} ${pet.petDetails.age ? 'years' : ''}</span>
            </div>
            <div class="field-item">
              <span class="field-icon">♂️</span>
              <span class="field-text">${pet.petDetails.gender || 'Unknown'}</span>
            </div>
            ${pet.petDetails.color ? `
            <div class="field-item">
              <span class="field-icon">🎨</span>
              <span class="field-text">${pet.petDetails.color}</span>
            </div>
            ` : ''}
            ${pet.petDetails.energyLevel ? `
            <div class="field-item">
              <span class="field-icon">⚡</span>
              <span class="field-text">${pet.petDetails.energyLevel}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- SECTION 2: MEDICAL INFO -->
      <div class="medical-info-section">
        <div class="section-header">
          <span>⚕️</span>
          <span>Medical & Vital Information</span>
        </div>
        <div class="medical-grid">
          <div class="medical-item health-item">
            <span class="medical-icon">❤️</span>
            <div class="medical-content">
              <div class="medical-label">Health</div>
              <div class="medical-value health-${pet.petDetails.healthStatus || 'unknown'}">
                ${pet.petDetails.healthStatus ? pet.petDetails.healthStatus.charAt(0).toUpperCase() + pet.petDetails.healthStatus.slice(1) : 'Not set'}
              </div>
            </div>
          </div>
          <div class="medical-item vaccine-item">
            <span class="medical-icon">💉</span>
            <div class="medical-content">
              <div class="medical-label">Vaccines</div>
              <div class="medical-value ${pet.petDetails.vaccinations ? 'vaccine-complete' : 'meds-none'}">
                ${pet.petDetails.vaccinations ? 'Up to date' : 'Not recorded'}
              </div>
            </div>
          </div>
          <div class="medical-item meds-item">
            <span class="medical-icon">💊</span>
            <div class="medical-content">
              <div class="medical-label">Medications</div>
              <div class="medical-value ${pet.petDetails.medications ? 'vaccine-complete' : 'meds-none'}">
                ${pet.petDetails.medications ? 'Current' : 'None'}
              </div>
            </div>
          </div>
          <div class="medical-item chip-item">
            <span class="medical-icon">🔍</span>
            <div class="medical-content">
              <div class="medical-label">Microchip</div>
              <div class="medical-value ${pet.petDetails.microchip ? 'chip-yes' : 'meds-none'}">
                ${pet.petDetails.microchip ? 'Installed' : 'None'}
              </div>
            </div>
          </div>
          ${pet.petDetails.allergies ? `
          <div class="medical-item allergy-item">
            <span class="medical-icon">🌡️</span>
            <div class="medical-content">
              <div class="medical-label">Allergies</div>
              <div class="medical-value">${pet.petDetails.allergies}</div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- SECTION 3: PET'S ACTIVITY -->
      <div class="pets-activity-section">
        <div class="section-header">
          <span>🏃‍♂️</span>
          <span>Pet's Activity</span>
        </div>
        <div class="activity-content">
          <!-- EXERCISE DETAILS - Left -->
          <div class="exercise-details">
            <div class="exercise-stat">
              <div class="exercise-number">${totalSessions}</div>
              <div class="exercise-label">Total Sessions</div>
            </div>
            <div class="exercise-stat">
              <div class="exercise-number">${avgDuration}m</div>
              <div class="exercise-label">Avg Duration</div>
            </div>
            <div class="exercise-stat">
              <div class="exercise-number">${totalCalories}</div>
              <div class="exercise-label">Total Calories</div>
            </div>
          </div>
          
          <!-- MINI CALENDAR - Right -->
          <div class="calendar-section">
            <div class="mini-calendar" id="mini-calendar-${index}">
              ${generateMiniCalendar(pet.exerciseEntries || [])}
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 4: MOOD SECTION -->
      <div class="mood-section">
        <div class="section-header">
          <span>😊</span>
          <span>Recent Mood</span>
        </div>
        <div class="mood-entries">
          ${pet.moodLogs && pet.moodLogs.length > 0 ? 
            pet.moodLogs.slice(-3).map(log => {
              const mood = MOOD_OPTIONS.find(m => m.value === log.mood) || MOOD_OPTIONS[0];
              return `
                <div class="mood-entry">
                  <span class="mood-emoji">${mood.emoji}</span>
                  <span class="mood-date">${formatDate(log.date)}</span>
                </div>
              `;
            }).join('') : 
            '<p class="no-moods">No mood entries yet</p>'
          }
        </div>
      </div>

      <!-- SECTION 5: ACTION BUTTONS -->
      <div class="action-buttons-section">
        <button class="action-btn select-btn" data-index="${index}" title="Select this pet">
          ${index === activePetIndex ? '✅ Selected' : '👉 Select'}
        </button>
        <button class="action-btn edit-btn" data-index="${index}" title="Edit pet details">
          ✏️ Edit
        </button>
        <button class="action-btn delete-btn" data-index="${index}" title="Delete this pet">
          🗑️ Delete
        </button>
        <button class="action-btn share-btn" data-index="${index}" title="Share pet profile">
          📤 Share
        </button>
      </div>

      <!-- SECTION 6: REPORT BUTTON -->
      <div class="report-section">
        <button class="report-btn" data-index="${index}" title="Generate comprehensive report">
          📊 GENERATE REPORT
        </button>
      </div>
    </div>
  `}).join('');

  document.getElementById('savedProfiles').innerHTML = profilesHTML;
  setupProfileEventListeners();
}



//=====================================================
// UPDATE DASHBOARD FUNCTION
// Also update your updateDashboard function to handle these components:
function updateDashboard(petData) {
    console.log('Updating dashboard for:', petData.petDetails.name);
    
    // Update calendar with exercise data
    if (petData.exerciseEntries && petData.exerciseEntries.length > 0) {
        refreshCalendar(petData.exerciseEntries);
    } else {
        initializeEmptyCalendar();
    }
    
    // Update mood tracker
    if (petData.moodLogs && petData.moodLogs.length > 0) {
        updateMoodTracker(petData.moodLogs);
    } else {
       // initializeEmptyMoodTracker();
         initializeMoodTracker(); // ← CALL YOUR EXISTING FUNCTION
    }
    
    // Update charts with exercise data
    if (petData.exerciseEntries && petData.exerciseEntries.length > 0) {
        updateCharts(petData.exerciseEntries);
    } else {
        initializeEmptyCharts();
    }
    
    // Refresh profile list
    loadSavedProfiles();
}

function updateMoodTracker(moodLogs) {
    const moodContainer = document.querySelector('.mood-tracker-container');
    if (!moodContainer) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayMood = moodLogs.find(log => log.date === today);
    
    // Update mood history section
    const moodHistory = moodContainer.querySelector('.mood-history');
    if (moodHistory) {
        if (moodLogs.length > 0) {
            moodHistory.innerHTML = moodLogs.map(log => {
                const mood = MOOD_OPTIONS.find(m => m.value === log.mood) || MOOD_OPTIONS[0];
                return `
                    <div class="mood-entry">
                        <span class="mood-date">${formatDate(log.date)}</span>
                        <span class="mood-emoji">${mood.emoji}</span>
                        <span class="mood-label">${mood.label}</span>
                    </div>
                `;
            }).join('');
        } else {
            moodHistory.innerHTML = '<p class="no-entries">No mood entries yet</p>';
        }
    }
    
    // Update today's mood selection
    moodContainer.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (todayMood && parseInt(btn.dataset.mood) === todayMood.mood) {
            btn.classList.add('selected');
        }
    });
}

// Load active petdata. verify if it is needed still
function loadActivePetData() {
    const savedIndex = sessionStorage.getItem('activePetIndex');
    if (savedIndex !== null) {
      activePetIndex = parseInt(savedIndex);
      const petData = getPets()[activePetIndex];
      if (petData) updateDashboard(petData);
    }
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
            generateReport(pet); // ← This should call your report function
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

//===========================================================
   //      PROFILE ACTION FUNCTIONS
//==========================================================
// SELECT PROFILE TO VIEW AND WORK WITH WITHOUT EDITTING MODE
function selectPetProfile(index) {
  activePetIndex = index;
  sessionStorage.setItem('activePetIndex', activePetIndex);
  updateDashboard(getPets()[activePetIndex]);
  loadSavedProfiles(); // Refresh to show selected state
}

//===========================================
// ENHANCED WITH COMPLETE DATA POPULATION

// 1.EDIT PET PROFILE 
// ===============================================
function editPetProfile(index) {  
    console.log('🔄 editPetProfile called for index:', index);
    
    try {
        // Validate input
        if (index === undefined || index === null) {
            throw new Error('Invalid pet index provided');
        }

        const pets = getPets();
        if (!pets[index]) {
            throw new Error(`Pet not found at index: ${index}`);
        }

        const pet = pets[index];
        console.log('📝 Loading pet data:', pet.petDetails.name);
        
        // Set active pet and store in session
        activePetIndex = index;
        sessionStorage.setItem('activePetIndex', activePetIndex);

        // Show the form container
        document.getElementById('savedProfiles').style.display = 'none';
        document.getElementById('profileContainer').style.display = 'block';
        
        // Load the form template
        const template = document.getElementById('profileFormTemplate');
        if (!template) {
            throw new Error('Profile form template not found');
        }
        
        document.getElementById('profileContainer').innerHTML = template.innerHTML;
        // SET UP MOOD TRACKER WITH EVENT LISTENERS
    initializeMoodTracker();
        
        // Populate form fields with a small delay to ensure DOM is ready
        setTimeout(() => populateFormFields(pet), 50);
        
        // Update form for edit mode
        setupEditModeForm();
        
        console.log('✅ Edit form initialized successfully');
        
    } catch (error) {
        console.error('❌ Error in editPetProfile:', error);
        AppHelper.showError(`Failed to load pet profile: ${error.message}`);
        // Return to dashboard on error
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
    }
}

// 2.POPULATE FORM FIELDS - COMPREHENSIVE DATA LOADING
function populateFormFields(pet) {  
    console.log('🔄 populateFormFields called for:', pet.petDetails.name);
    
    const fieldMappings = {
        // Basic Information
        'petType': pet.petDetails.type,
        'petName': pet.petDetails.name,
        'petAge': pet.petDetails.age,
        'petWeight': pet.petDetails.weight,
        'petBreed': pet.petDetails.breed,
        'petGender': pet.petDetails.gender,
        'petColor': pet.petDetails.color,
        'petEnergyLevel': pet.petDetails.energyLevel,
        
        // Medical Information
        'petHealthStatus': pet.petDetails.healthStatus,
        'petMicrochip': pet.petDetails.microchip,
        'petVetInfo': pet.petDetails.vetInfo,
        'petVaccinations': pet.petDetails.vaccinations,
        'petMedications': pet.petDetails.medications,
        'petAllergies': pet.petDetails.allergies,
        
        // Lifestyle & Behavior
        'petDiet': pet.petDetails.diet,
        'petBehavior': pet.petDetails.behavior,
        'petFavoriteExercise': pet.petDetails.favoriteExercise,
        'petNotes': pet.petDetails.notes,
        
        // Exercise Information (latest entry or empty)
        'exerciseType': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].exerciseType : 'walking',
        'exerciseDuration': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].duration : '',
        'exerciseDate': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].date : new Date().toISOString().split('T')[0],
        'caloriesBurned': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].caloriesBurned : '',
        'exerciseIntensity': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].intensity : 'medium',
        'exerciseNotes': pet.exerciseEntries.length > 0 ? pet.exerciseEntries[pet.exerciseEntries.length - 1].notes : ''
    };

    let populatedCount = 0;
    let errorCount = 0;

    // Populate each field
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        try {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.type === 'select-one') {
                    element.value = value || '';
                } else if (element.type === 'textarea') {
                    element.value = value || '';
                } else {
                    element.value = value || '';
                }
                populatedCount++;
            } else {
                console.warn(`⚠️ Form field not found: ${fieldId}`);
                errorCount++;
            }
        } catch (fieldError) {
            console.error(`❌ Error populating field ${fieldId}:`, fieldError);
            errorCount++;
        }
    });

    // Handle image preview
    try {
        const imagePreview = document.getElementById('petImagePreview');
        if (imagePreview && pet.petDetails.image) {
            imagePreview.src = pet.petDetails.image;
        }
    } catch (imageError) {
        console.error('❌ Error setting image preview:', imageError);
    }

    console.log(`✅ Form population complete: ${populatedCount} fields populated, ${errorCount} errors`);
}

// 3.SETUP EDIT MODE FORM - UPDATE UI FOR EDITING
function setupEditModeForm() {   
    console.log('🔄 Setting up edit mode form');
    
    try {
        // Update form title and button text
        const saveButton = document.getElementById('saveProfileButton');
        if (saveButton) {
            saveButton.textContent = 'Update Profile';
            saveButton.innerHTML = '💾 Update Profile'; // With icon for better UX
        }

        // Set up form submission handler
        const form = document.getElementById('completeProfileForm');
        if (form) {
            // Remove any existing listeners to prevent duplicates
            form.replaceWith(form.cloneNode(true));
            // Re-get the form after clone
            const newForm = document.getElementById('completeProfileForm');
            newForm.addEventListener('submit', handleFormSubmit);
        }

        // Set up enhanced cancel button
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.innerHTML = '❌ Cancel Edit';
            cancelButton.addEventListener('click', cancelEdit);
        }

        // Set up image upload handler
        const imageInput = document.getElementById('petImage');
        if (imageInput) {
            imageInput.addEventListener('change', handleImageUpload);
        }

        console.log('✅ Edit mode form setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up edit mode form:', error);
        throw error; // Re-throw to be handled by caller
    }
}

//============================================================
// UNIFIED CANCELLATION WITH CONFIRMATION

// 1.CANCEL EDIT -
// ===============================================
function cancelEdit() {
    console.log('🔄 cancelEdit called');
    
    try {
        // Check if form has unsaved changes
        if (hasUnsavedChanges()) {
            const confirmCancel = confirm(
                '⚠️ You have unsaved changes!\n\nAre you sure you want to cancel? Your changes will be lost.'
            );
            
            if (!confirmCancel) {
                console.log('🚫 Cancel operation aborted by user');
                return; // User chose to stay in edit mode
            }
        }

        // Perform cancellation
        performCancellation();
        
    } catch (error) {
        console.error('❌ Error in cancelEdit:', error);
        // Fallback: force return to dashboard even on error
        forceReturnToDashboard();
    }
}

// ===============================================
// 2.CHECK FOR UNSAVED CHANGES
// ===============================================
function hasUnsavedChanges() {
    console.log('🔍 Checking for unsaved changes...');
    
    try {
        // If we're creating a new profile (no active pet), check if form has any data
        if (activePetIndex === null) {
            const petName = document.getElementById('petName')?.value.trim();
            const petType = document.getElementById('petType')?.value;
            return !!(petName || petType); // Return true if any data exists
        }
        
        // If we're editing an existing profile, compare with original data
        const pets = getPets();
        const originalPet = pets[activePetIndex];
        if (!originalPet) return false;

        const currentFormData = getCurrentFormData();
        return hasFormDataChanged(originalPet, currentFormData);
        
    } catch (error) {
        console.error('❌ Error checking unsaved changes:', error);
        return false; // Default to no changes on error
    }
}

// ===============================================
// 3.GET CURRENT FORM DATA FOR COMPARISON
// ===============================================
function getCurrentFormData() {
    const formData = {
        // Basic Information
        type: document.getElementById('petType')?.value || '',
        name: document.getElementById('petName')?.value.trim() || '',
        age: document.getElementById('petAge')?.value || '',
        weight: document.getElementById('petWeight')?.value || '',
        breed: document.getElementById('petBreed')?.value.trim() || '',
        gender: document.getElementById('petGender')?.value || '',
        color: document.getElementById('petColor')?.value.trim() || '',
        energyLevel: document.getElementById('petEnergyLevel')?.value || '',
        
        // Medical Information
        healthStatus: document.getElementById('petHealthStatus')?.value || '',
        microchip: document.getElementById('petMicrochip')?.value.trim() || '',
        vetInfo: document.getElementById('petVetInfo')?.value.trim() || '',
        vaccinations: document.getElementById('petVaccinations')?.value.trim() || '',
        medications: document.getElementById('petMedications')?.value.trim() || '',
        allergies: document.getElementById('petAllergies')?.value.trim() || '',
        
        // Lifestyle & Behavior
        diet: document.getElementById('petDiet')?.value.trim() || '',
        behavior: document.getElementById('petBehavior')?.value.trim() || '',
        favoriteExercise: document.getElementById('petFavoriteExercise')?.value || '',
        notes: document.getElementById('petNotes')?.value.trim() || '',
        
        // Image (simplified check)
        image: document.getElementById('petImagePreview')?.src || ''
    };
    
    return formData;
}

// ===============================================
// 4.COMPARE FORM DATA WITH ORIGINAL
// ===============================================
function hasFormDataChanged(originalPet, currentFormData) {
    const originalDetails = originalPet.petDetails;
    
    // Compare each field
    const changes = [
        originalDetails.type !== currentFormData.type,
        originalDetails.name !== currentFormData.name,
        originalDetails.age !== currentFormData.age,
        originalDetails.weight !== currentFormData.weight,
        originalDetails.breed !== currentFormData.breed,
        originalDetails.gender !== currentFormData.gender,
        originalDetails.color !== currentFormData.color,
        originalDetails.energyLevel !== currentFormData.energyLevel,
        originalDetails.healthStatus !== currentFormData.healthStatus,
        originalDetails.microchip !== currentFormData.microchip,
        originalDetails.vetInfo !== currentFormData.vetInfo,
        originalDetails.vaccinations !== currentFormData.vaccinations,
        originalDetails.medications !== currentFormData.medications,
        originalDetails.allergies !== currentFormData.allergies,
        originalDetails.diet !== currentFormData.diet,
        originalDetails.behavior !== currentFormData.behavior,
        originalDetails.favoriteExercise !== currentFormData.favoriteExercise,
        originalDetails.notes !== currentFormData.notes,
        // Image comparison (simplified - just check if different from default)
        currentFormData.image !== 'https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png' && 
        currentFormData.image !== originalDetails.image
    ];
    
    const hasChanges = changes.some(change => change === true);
    console.log('📊 Form change detection:', hasChanges ? 'Changes found' : 'No changes');
    
    return hasChanges;
}

// ===============================================
// 5.PERFORM CANCELLATION - CLEAN RETURN TO DASHBOARD
// ===============================================
function performCancellation() {
    console.log('🔄 Performing cancellation...');
    
    try {
        // Clear any temporary data
        clearTemporaryData();
        
        // Reset active pet index if we were creating new
        if (activePetIndex === null) {
            console.log('🧹 Clearing new profile session data');
            sessionStorage.removeItem('activePetIndex');
        }
        
        // Return to dashboard view
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
        document.getElementById('profileContainer').innerHTML = '';
        
        // Refresh the profiles to ensure current data is shown
        loadSavedProfiles();
        
        console.log('✅ Cancellation completed successfully');
        showSuccess('Edit cancelled'); // Optional: show confirmation message
        
    } catch (error) {
        console.error('❌ Error during cancellation:', error);
        throw error; // Re-throw to be handled by caller
    }
}

// ===============================================
// 6.CLEAR TEMPORARY DATA
// ===============================================
function clearTemporaryData() {
    console.log('🧹 Clearing temporary data...');
    
    try {
        // Clear any temporary exercise entries
        if (window.tempExerciseEntries) {
            window.tempExerciseEntries = [];
        }
        
        // Clear any temporary mood logs
        if (window.tempMoodLogs) {
            window.tempMoodLogs = [];
        }
        
        console.log('✅ Temporary data cleared');
        
    } catch (error) {
        console.error('❌ Error clearing temporary data:', error);
    }
}

// ===============================================
// 7.FORCE RETURN TO DASHBOARD (ERROR FALLBACK)
// ===============================================
function forceReturnToDashboard() {
    console.warn('🚨 Force returning to dashboard due to error');
    
    // Emergency fallback - ensure we always return to a usable state
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('profileContainer').style.display = 'none';
    document.getElementById('profileContainer').innerHTML = '';
    
    // Reload profiles to reset state
    setTimeout(() => {
        loadSavedProfiles();
    }, 100);
    
    AppHelper.showError('Returned to dashboard due to an error');
}



//=========================================
     // DELETE FUNCTION 
//====================================
function deletePetProfile(index) {
  if (confirm('Are you sure you want to delete this pet profile? This action cannot be undone.')) {
    const pets = getPets();
    pets.splice(index, 1);
    localStorage.setItem('pets', JSON.stringify(pets));
    
    if (activePetIndex === index) {
      activePetIndex = null;
      sessionStorage.removeItem('activePetIndex');
     document.getElementById('petFormContainer').innerHTML = document.getElementById('profileFormTemplate').innerHTML;
    }
    
    loadSavedProfiles();
    showSuccess('Profile deleted successfully'); // verify
  }
}

//=========================================
  // SHARE PROFILE FUNCTION
//========================================
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


// Get pets from localStorage
//It retrieves ALL saved pet profiles from the browser's localStorage.
function getPets() {
    return JSON.parse(localStorage.getItem('pets') || '[]');
}

//===============================
  // Toggle dark mode
//===========================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

//=========================
  // Handle image upload
//==========================
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('petImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
}



//===============================================
   //     Mood Logs functionality
//==========================================
// ===============================================
// MOOD TRACKER - Unified Initialization Function
// ===============================================
function initializeMoodTracker() {
    console.log('Initializing mood tracker...');
    
    const moodContainer = document.getElementById('moodTracker');
    if (!moodContainer) {
        console.error('Mood tracker container not found!');
        return;
    }

    // Check if we're creating new profile or editing existing
    if (activePetIndex === null) {
        // NEW PROFILE: Initialize empty mood tracker with temporary storage
        console.log('New profile - initializing empty mood tracker');
        initializeNewProfileMoodTracker(moodContainer);
    } else {
        // EDITING EXISTING PROFILE: Load existing mood data
        console.log('Editing profile - loading existing mood data');
        initializeExistingProfileMoodTracker(moodContainer);
    }
}

// ===============================================
// NEW PROFILE: Temporary mood storage implementation
// ===============================================
function initializeNewProfileMoodTracker(moodContainer) {
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize temporary mood storage for new profile
    window.tempMoodLogs = [];
    
    moodContainer.innerHTML = `
        <div class="mood-container">
            <h3>Today's Mood</h3>
            <div class="mood-selector">
                ${MOOD_OPTIONS.map(mood => `
                    <button type="button" class="emoji-btn" data-mood="${mood.value}" data-date="${today}" 
                            title="${mood.label}">
                        ${mood.emoji}
                        <span class="mood-label">${mood.label}</span>
                    </button>
                `).join('')}
            </div>
            
            <h3>Mood History</h3>
            <div class="mood-history">
                <p class="no-entries">No mood entries yet. Select a mood for today!</p>
            </div>
        </div>
    `;
    
    // Add event listeners for NEW profile mood selection
    moodContainer.addEventListener('click', handleNewProfileMoodSelection);
}

// ===============================================
// EXISTING PROFILE: Load from pets data
// ===============================================
function initializeExistingProfileMoodTracker(moodContainer) {
    const pets = getPets();
    const activePet = pets[activePetIndex];
    const moodLogs = activePet.moodLogs || [];
    const today = new Date().toISOString().split('T')[0];
    const todayMood = moodLogs.find(log => log.date === today);
    
    moodContainer.innerHTML = `
        <div class="mood-container">
            <h3>Today's Mood</h3>
            <div class="mood-selector">
                ${MOOD_OPTIONS.map(mood => `
                    <button type="button" class="emoji-btn ${todayMood && todayMood.mood === mood.value ? 'selected' : ''}" 
                            data-mood="${mood.value}" data-date="${today}" 
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
    
    // Add event listeners for EXISTING profile mood selection
    moodContainer.addEventListener('click', handleExistingProfileMoodSelection);
}

// ===============================================
// NEW PROFILE: Mood selection handler (temporary)
// ===============================================
function handleNewProfileMoodSelection(e) {
    if (e.target.classList.contains('emoji-btn') || e.target.closest('.emoji-btn')) {
        e.preventDefault(); // Prevent form submission
        const btn = e.target.classList.contains('emoji-btn') ? 
                   e.target : e.target.closest('.emoji-btn');
        
        const moodValue = parseInt(btn.dataset.mood);
        const date = btn.dataset.date;
        
        // Update temporary storage
        window.tempMoodLogs = window.tempMoodLogs.filter(log => log.date !== date);
        window.tempMoodLogs.push({ 
            date: date, 
            mood: moodValue,
            timestamp: new Date().toISOString()
        });
        
        // Update UI only (no localStorage writes)
        updateMoodUI(btn, window.tempMoodLogs);
        console.log('Temporary mood stored:', window.tempMoodLogs);
    }
}

// ===============================================
// EXISTING PROFILE: Mood selection handler (permanent)
// ===============================================
function handleExistingProfileMoodSelection(e) {
    if (e.target.classList.contains('emoji-btn') || e.target.closest('.emoji-btn')) {
        e.preventDefault(); // Prevent form submission
        const btn = e.target.classList.contains('emoji-btn') ? 
                   e.target : e.target.closest('.emoji-btn');
        
        const moodValue = parseInt(btn.dataset.mood);
        const date = btn.dataset.date;
        
        const pets = getPets();
        let pet = { ...pets[activePetIndex] };
        
        // Initialize or update moodLogs array
        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(log => log.date !== date);
        pet.moodLogs.push({ 
            date: date, 
            mood: moodValue,
            timestamp: new Date().toISOString()
        });
        
        // Save to localStorage
        pets[activePetIndex] = pet;
        localStorage.setItem('pets', JSON.stringify(pets));
        
        // Update UI
        updateMoodUI(btn, pet.moodLogs);
        console.log('Mood saved to localStorage for pet:', activePetIndex);
    }
}

// ===============================================
// UNIVERSAL: UI update function (for both scenarios)
// ===============================================
function updateMoodUI(selectedBtn, moodLogs) {
    const date = selectedBtn.dataset.date;
    
    // Update button selection state
    document.querySelectorAll('.emoji-btn').forEach(btn => 
        btn.classList.remove('selected')
    );
    selectedBtn.classList.add('selected');
    
    // Update mood history display
    const moodHistory = document.querySelector('.mood-history');
    if (moodHistory) {
        moodHistory.innerHTML = moodLogs.length > 0 ? moodLogs.map(log => {
            const mood = MOOD_OPTIONS.find(m => m.value === log.mood) || MOOD_OPTIONS[0];
            return `
                <div class="mood-entry">
                    <span class="mood-date">${formatDate(log.date)}</span>
                    <span class="mood-emoji">${mood.emoji}</span>
                    <span class="mood-label">${mood.label}</span>
                </div>
            `;
        }).join('') : '<p class="no-entries">No mood entries yet</p>';
    }
}

// ===============================================
// Save temporary mood data to pet profile - ENHANCED
// We need to ensure both new and existing profile moods are properly saved.
// ===============================================
function saveTemporaryMoodData(petData) {
    console.log('💾 Saving mood data to pet profile...');
    
    // Initialize moodLogs array if it doesn't exist
    petData.moodLogs = petData.moodLogs || [];
    
    // Handle temporary mood logs (new profiles)
    if (window.tempMoodLogs && window.tempMoodLogs.length > 0) {
        console.log('📥 Adding temporary mood logs:', window.tempMoodLogs);
        
        // Merge temporary logs with existing, avoiding duplicates
        window.tempMoodLogs.forEach(tempLog => {
            const existingIndex = petData.moodLogs.findIndex(log => log.date === tempLog.date);
            if (existingIndex !== -1) {
                // Update existing entry
                petData.moodLogs[existingIndex] = tempLog;
            } else {
                // Add new entry
                petData.moodLogs.push(tempLog);
            }
        });
        
        // Clear temporary storage
        window.tempMoodLogs = [];
    }
    
    // For existing profiles, ensure any mood selections made in the form are preserved
    // This handles the case where users select moods in edit mode without using temp storage
    const moodContainer = document.getElementById('moodTracker');
    if (moodContainer && activePetIndex !== null) {
        const selectedMoodBtn = moodContainer.querySelector('.emoji-btn.selected');
        if (selectedMoodBtn) {
            const moodValue = parseInt(selectedMoodBtn.dataset.mood);
            const date = selectedMoodBtn.dataset.date;
            
            console.log('📥 Adding current form mood selection:', { moodValue, date });
            
            // Add or update this mood entry
            const existingIndex = petData.moodLogs.findIndex(log => log.date === date);
            const moodEntry = { 
                date: date, 
                mood: moodValue,
                timestamp: new Date().toISOString()
            };
            
            if (existingIndex !== -1) {
                petData.moodLogs[existingIndex] = moodEntry;
            } else {
                petData.moodLogs.push(moodEntry);
            }
        }
    }
    
    // Sort mood logs by date (newest first)
    petData.moodLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('✅ Final mood data:', petData.moodLogs);
    return petData;
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






// Calendar functionality
// Add the Helper Function
function generateMiniCalendar(exerciseEntries) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    let calendarHTML = `<div class="mini-calendar-grid">`;
    
    // Day headers
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
        calendarHTML += `<div class="mini-calendar-header">${day}</div>`;
    });
    
    // Empty days
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="mini-calendar-day empty"></div>`;
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasExercise = exerciseEntries.some(entry => entry.date === dateStr);
        
        calendarHTML += `
            <div class="mini-calendar-day ${hasExercise ? 'has-exercise' : ''} ${day === today.getDate() ? 'today' : ''}">
                ${day}
            </div>
        `;
    }
    
    calendarHTML += `</div>`;
    return calendarHTML;
}
// ===============================================
// CALENDAR - Unified Initialization Function
// ===============================================
function initializeCalendar() {
    console.log('Initializing calendar...');
    
    const calendarContainer = document.getElementById('exerciseCalendar');
    if (!calendarContainer) {
        console.error('Calendar container not found!');
        return;
    }

    // Check if we're creating new profile or editing existing
    if (activePetIndex === null) {
        // NEW PROFILE: Initialize empty calendar
        console.log('New profile - initializing empty calendar');
        initializeNewProfileCalendar(calendarContainer);
    } else {
        // EDITING EXISTING PROFILE: Load existing exercise data
        console.log('Editing profile - loading existing exercise data');
        initializeExistingProfileCalendar(calendarContainer);
    }
}

// ===============================================
// NEW PROFILE: Empty calendar implementation
// ===============================================
function initializeNewProfileCalendar(container) {
    // Initialize temporary exercise storage for new profile
    window.tempExerciseEntries = [];
    
    // Set empty exercise data
    exerciseData = [];
    
    // Generate the actual calendar UI (not just empty message)
    generateCalendar(container);
}

// ===============================================
// EXISTING PROFILE: Load from pets data
// ===============================================
function initializeExistingProfileCalendar(container) {
    const pets = getPets();
    const activePet = pets[activePetIndex];
    const exerciseEntries = activePet.exerciseEntries || [];
    
    // Set global exercise data for calendar generation
    exerciseData = exerciseEntries;
    
    // Generate the actual calendar with data
    generateCalendar(container);
}

// ===============================================
// Generate calendar with exercise data
// ===============================================
function generateCalendar(container = null) {
    const targetContainer = container || document.querySelector('.calendar');
    if (!targetContainer) {
        console.error('Calendar container not found for generation');
        return;
    }

    const date = new Date(currentYear, currentMonth, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const startDay = date.getDay();
    const endDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    let calendarHTML = `
        <div class="calendar-header">
            <button type="button" class="nav-btn prev">←</button>
            <h2>${monthName} ${currentYear}</h2>
            <button type="button" class="nav-btn next">→</button>
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

    // Actual days with exercise data
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
    targetContainer.innerHTML = calendarHTML;
    addCalendarEventListeners();
}

// ===============================================
// Calendar event listeners
// ===============================================
function addCalendarEventListeners() {
    // Navigation buttons
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

    // Day click handlers
    document.querySelectorAll('.calendar-day:not(.empty):not(.header)').forEach(day => {
        day.addEventListener('click', () => {
            const entries = exerciseData.filter(e => e.date === day.dataset.date);
            showDayModal(day.dataset.date, entries);
        });
    });
}

// ===============================================
// Day modal functionality
// ===============================================
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
                <button type="button" class="add-exercise-btn" data-date="${date}">Add Exercise</button>
                <button type="button" class="close-modal-btn">Close</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add exercise button handler
    document.querySelector('.add-exercise-btn').addEventListener('click', (e) => {
        handleAddExercise(e.target.dataset.date);
        document.querySelector('.calendar-modal').remove();
    });
    
    // Close button handler
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        document.querySelector('.calendar-modal').remove();
    });
}

// ===============================================
// Add exercise handler (different for new vs existing profiles)
// ===============================================
function handleAddExercise(date) {
    if (activePetIndex === null) {
        // NEW PROFILE: Add to temporary storage
        if (!window.tempExerciseEntries) window.tempExerciseEntries = [];
        window.tempExerciseEntries.push({
            date: date,
            exerciseType: 'walking',
            duration: 30,
            caloriesBurned: 150,
            intensity: 'medium',
            notes: 'Added from calendar'
        });
        console.log('Exercise added to temporary storage:', window.tempExerciseEntries);
    } else {
        // EXISTING PROFILE: Add to localStorage
        const pets = getPets();
        const pet = pets[activePetIndex];
        pet.exerciseEntries = pet.exerciseEntries || [];
        pet.exerciseEntries.push({
            date: date,
            exerciseType: 'walking',
            duration: 30,
            caloriesBurned: 150,
            intensity: 'medium',
            notes: 'Added from calendar'
        });
        localStorage.setItem('pets', JSON.stringify(pets));
        refreshCalendar(pet.exerciseEntries);
    }
}

// ===============================================
// Refresh calendar with new data
// ===============================================
function refreshCalendar(data) {
    exerciseData = data || [];
    generateCalendar();
}

// ===============================================
// Save temporary exercise data to pet profile (call this on form submit)
// ===============================================
function saveTemporaryExerciseData(petData) {
    if (window.tempExerciseEntries && window.tempExerciseEntries.length > 0) {
        petData.exerciseEntries = window.tempExerciseEntries;
        console.log('Temporary exercise data saved to pet profile:', petData.exerciseEntries);
        // Clear temporary storage
        window.tempExerciseEntries = [];
    }
    return petData;
}





// Charts functionality
// add helper function 
function generateMiniCharts(exerciseEntries) {
    if (!exerciseEntries || exerciseEntries.length === 0) {
        return '<p class="no-charts-data">No exercise data yet</p>';
    }
    
    // Calculate simple stats for mini display
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    const avgDuration = (totalDuration / exerciseEntries.length).toFixed(1);
    
    return `
        <div class="mini-charts-stats">
            <div class="mini-stat">
                <div class="mini-stat-value">${totalDuration}m</div>
                <div class="mini-stat-label">Total Duration</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${totalCalories}</div>
                <div class="mini-stat-label">Total Calories</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">${avgDuration}m</div>
                <div class="mini-stat-label">Avg/Session</div>
            </div>
        </div>
    `;
}
// ===============================================
// CHARTS - Unified Initialization Function
// ===============================================
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Check if chart containers exist
    const durationContainer = document.getElementById('durationChartContainer');
    const caloriesContainer = document.getElementById('caloriesChartContainer');
    const intensityContainer = document.getElementById('intensityChartContainer');
    
    if (!durationContainer || !caloriesContainer || !intensityContainer) {
        console.error('Chart containers not found!');
        return;
    }

    // Check if we're creating new profile or editing existing
    if (activePetIndex === null) {
        // NEW PROFILE: Initialize empty charts
        console.log('New profile - initializing empty charts');
        initializeNewProfileCharts();
    } else {
        // EDITING EXISTING PROFILE: Load existing exercise data
        console.log('Editing profile - loading existing exercise data for charts');
        initializeExistingProfileCharts();
    }
}


// ===============================================
// Create empty charts (place this RIGHT HERE)
// ===============================================
function createEmptyCharts() {
    // Duration chart
    const durationCtx = document.getElementById('durationChart');
    if (durationCtx) {
        durationChart = new Chart(durationCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Duration (min)',
                    data: [],
                    borderColor: '#4bc0c0',
                    tension: 0.3
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Exercise Duration Over Time'
                    }
                }
            }
        });
    }
    
    // Calories chart
    const caloriesCtx = document.getElementById('caloriesChart');
    if (caloriesCtx) {
        caloriesChart = new Chart(caloriesCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Calories Burned',
                    data: [],
                    backgroundColor: '#cc65fe'
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Calories Burned Over Time'
                    }
                }
            }
        });
    }
    
    // Intensity chart
    const intensityCtx = document.getElementById('intensityChart');
    if (intensityCtx) {
        intensityChart = new Chart(intensityCtx, {
            type: 'pie',
            data: {
                labels: ['Low', 'Medium', 'High'],
                datasets: [{
                    data: [0, 0, 0],
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
}

// ===============================================
// NEW PROFILE: Empty charts implementation
// ===============================================
function initializeNewProfileCharts() {
    // Initialize temporary exercise storage for charts if not already set
    if (!window.tempExerciseEntries) window.tempExerciseEntries = [];
    
    // Destroy any existing charts first
    destroyCharts();
    
    // Create empty chart placeholders
    createEmptyCharts();
    
    // Show empty state messages
    showChartEmptyStates();
}


// ===============================================
// EXISTING PROFILE: Load from pets data
// ===============================================
function initializeExistingProfileCharts() {
    const pets = getPets();
    const activePet = pets[activePetIndex];
    const exerciseEntries = activePet.exerciseEntries || [];
    
    if (exerciseEntries.length > 0) {
        // Has data - render actual charts
        refreshChartsWithData(exerciseEntries);
    } else {
        // No data - show empty state
        initializeNewProfileCharts();
    }
}

// ===============================================
// Show empty state messages for charts
// ===============================================
function showChartEmptyStates() {
    const chartContainers = [
        { id: 'durationChartContainer', title: 'Duration Chart', type: 'line' },
        { id: 'caloriesChartContainer', title: 'Calories Chart', type: 'bar' },
        { id: 'intensityChartContainer', title: 'Intensity Chart', type: 'pie' }
    ];
    
    chartContainers.forEach(container => {
        const element = document.getElementById(container.id);
        if (element) {
            // Create or update empty state message
            let emptyState = element.querySelector('.empty-state');
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                element.appendChild(emptyState);
            }
            emptyState.innerHTML = `
                <p>📊 ${container.title}</p>
                <small>Add exercise data to see charts</small>
            `;
        }
    });
}

// ===============================================
// Refresh charts with exercise data
// ===============================================
function refreshChartsWithData(data) {
    if (!data || !data.length) {
        initializeNewProfileCharts();
        return;
    }
    
    // Hide empty state messages
    document.querySelectorAll('.empty-state').forEach(el => el.style.display = 'none');
    
    // Destroy existing charts and create new ones with data
    destroyCharts();
    
    const processed = processChartData(data);
    createDurationChart(processed);
    createCaloriesChart(processed);
    createIntensityChart(processed);
}

// ===============================================
// Update charts when new exercise data is available
// ===============================================
function updateCharts() {
    if (activePetIndex === null) {
        // NEW PROFILE: Use temporary data
        if (window.tempExerciseEntries && window.tempExerciseEntries.length > 0) {
            refreshChartsWithData(window.tempExerciseEntries);
        }
    } else {
        // EXISTING PROFILE: Use data from localStorage
        const pets = getPets();
        const activePet = pets[activePetIndex];
        const exerciseEntries = activePet.exerciseEntries || [];
        
        if (exerciseEntries.length > 0) {
            refreshChartsWithData(exerciseEntries);
        } else {
            initializeNewProfileCharts();
        }
    }
}

// ===============================================
// Process chart data (unchanged from your original)
// ===============================================
function processChartData(data) {
    return {
        labels: [...new Set(data.map(e => e.date))].sort(),
        duration: data.reduce((acc, e) => {
            acc[e.date] = (acc[e.date] || 0) + e.duration;
            return acc;
        }, {}),
        calories: data.reduce((acc, e) => {
            acc[e.date] = (acc[edate] || 0) + e.caloriesBurned;
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

// ===============================================
// Individual chart creation functions (unchanged from your original)
// ===============================================
function createIntensityChart(data) {
    const ctx = document.getElementById('intensityChart');
    if (!ctx) return;
    
    intensityChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data.intensity),
            datasets: [{
                data: Object.values(data.intensity),
                backgroundColor: ['#36a2eb', '#ffce56', '#ff6384', '#4bc0c0', '#cc65fe']
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Exercise Intensity Distribution'
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createDurationChart(data) {
    const ctx = document.getElementById('durationChart');
    if (!ctx) return;
    
    durationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data.duration),
            datasets: [{
                label: 'Total Duration (min)',
                data: Object.values(data.duration),
                borderColor: '#4bc0c0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createCaloriesChart(data) {
    const ctx = document.getElementById('caloriesChart');
    if (!ctx) return;
    
    caloriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data.calories),
            datasets: [{
                label: 'Calories Burned',
                data: Object.values(data.calories),
                backgroundColor: '#cc65fe'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ===============================================
// Chart utility functions (unchanged from your original)
// ===============================================
function destroyCharts() {
    if (durationChart) durationChart.destroy();
    if (caloriesChart) caloriesChart.destroy();
    if (intensityChart) intensityChart.destroy();
    durationChart = null;
    caloriesChart = null;
    intensityChart = null;
}

function updateChartColors() {
    const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#374151';
    Chart.defaults.color = textColor;
    if (durationChart) durationChart.update();
    if (caloriesChart) caloriesChart.update();
    if (intensityChart) intensityChart.update();
}

// ===============================================
// Save temporary chart data (already handled by exercise data saving)
// ===============================================
// Note: Charts use the same temporary exercise data as the calendar
// No separate saving function needed - uses window.tempExerciseEntries 







// Report generation functionality
function generateReport(pet) {
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
                ${generatePetDetailsHTML(pet)}
                ${generateExerciseSummaryHTML(pet.exerciseEntries)}
                ${generateExerciseCalendarHTML(pet)}
                ${pet.moodLogs && pet.moodLogs.length > 0 ? generateMoodCalendarHTML(pet) : ''}
                ${pet.exerciseEntries && pet.exerciseEntries.length > 0 ? generateExerciseChartsHTML(pet.exerciseEntries) : ''}
                <div class="button-container">
                    <button onclick="window.print()">Print Report</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
        </html>
    `);
    reportWindow.document.close();
}

function generatePetDetailsHTML(pet) {
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
}

function generateExerciseCalendarHTML(pet) {
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
}


// AND ADD THIS HELPER FUNCTION IN THE REPORT:
function getMoodEmojiFromValue(value) {
    const emojiMap = {0: '😀', 1: '😊', 2: '😐', 3: '😞', 4: '😠', 5: '🤢', 6: '😤', 7: '😔', 8: '😴', 9: '😰'};
    return emojiMap[value] || '❓';
}
function generateMoodCalendarHTML(pet) {
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
        `; // ← ADDED CLOSING BACKTICK HERE
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
        moodHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
        const moodEmoji = moodEntry ? getMoodEmojiFromValue(moodEntry.mood) : '';
        moodHtml += `<div class="calendar-day mood-emoji">${moodEmoji}</div>`;
    }
    
    moodHtml += '</div>';
    return moodHtml;
}

function generateExerciseChartsHTML(exerciseEntries) {
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
}

function generateExerciseSummaryHTML(exerciseEntries) {
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
}

