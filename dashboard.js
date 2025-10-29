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
    toggleAuthHeader(false);
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-banner').style.display = 'none';
    
    // Show dashboard with GRID display
    document.querySelector('.dashboard-container').style.display = 'block';

    // Show saved profiles with FLEX display (since it's flex in your CSS)
//    document.getElementById('savedProfiles').style.display = 'block'; // ← Change from 'block' to 'flex'
    
 //   document.getElementById('profileContainer').style.display = 'none';
    
loadSavedProfiles(); // This will handle empty state vs profiles
 setupEventListeners();
    loadActivePetData();
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

//==========OLD SECTION =============================
// Show create profile to show the profile form when "New Profile" is clicked  REPLACED
//=====================================================
function showCreateProfile() {
    console.log('showCreateProfile called - Using health assessment form');
    activePetIndex = null; // Reset for new profile
    
    // Use the new health assessment form instead of the old one
    showHealthAssessmentForm();
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
            // Basic Information
            type: '',
            name: '',
            image: 'https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png',
            age: '',
            weight: '',
            breed: '',
            gender: '',
            
            // Health Assessment Fields (NEW)
            bcs: '',              // Body Condition Score
            energyLevel: '',      // Energy Level
            targetWeight: '',     // Target Weight
            medicalConditions: [], // Medical Conditions array
            feedingRecommendation: '', // Feeding Recommendation
            healthNotes: ''       // Additional Health Notes
        },
        exerciseEntries: [],
        moodLogs: []
    };
}

// ===============================================
// ENHANCED WITH DYNAMIC UPDATES
// 1.HANDLE FORM SUBMIT - 
// ===============================================
// ===============================================
// HANDLE HEALTH ASSESSMENT FORM SUBMIT
// ===============================================
function handleHealthAssessmentSubmit(e) {
    e.preventDefault();
    console.log('🔄 HEALTH ASSESSMENT FORM SUBMIT INITIATED');

    try {
        // Validate form first
        const validationErrors = validateHealthAssessmentForm();
        if (validationErrors.length > 0) {
            console.error('❌ Health form validation failed:', validationErrors);
            AppHelper.showErrors(validationErrors);
            return;
        }

        // Collect form data
        const formData = collectHealthAssessmentData();
        console.log('📋 Health assessment data collected:', formData);

        // Get current pets and prepare pet data
        const pets = getPets();
        let petData;

        if (activePetIndex === null) {
            // CREATE NEW PROFILE
            console.log('🆕 Creating new profile with health assessment');
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

        // Update pet details with HEALTH ASSESSMENT data
        petData.petDetails = {
            // Basic Information
            type: formData.petType,
            name: formData.petName.trim(),
            image: formData.petImage,
            age: formData.petAge,
            weight: formData.petWeight,
            breed: formData.petBreed.trim(),
            gender: formData.petGender,
            
            // Health Assessment Fields
            bcs: formData.petBCS,
            energyLevel: formData.petEnergyLevel,
            targetWeight: formData.petTargetWeight,
            medicalConditions: formData.medicalConditions,
            feedingRecommendation: formData.feedingRecommendation,
            healthNotes: formData.healthNotes.trim()
        };

        console.log('✅ Health assessment details updated');

        // Save to storage
        if (activePetIndex === null) {
            pets.push(petData);
            activePetIndex = pets.length - 1;
        } else {
            pets[activePetIndex] = petData;
        }

        localStorage.setItem('pets', JSON.stringify(pets));
        sessionStorage.setItem('activePetIndex', activePetIndex);
        console.log('💾 Health assessment saved to storage');

        // DYNAMIC UPDATES - Refresh all components
        performDynamicUpdates(petData);

        // Show success and return to dashboard
        showSuccess(activePetIndex === null ? 'Profile created successfully!' : 'Health assessment updated successfully!');
        returnToDashboard();

        console.log('✅ HEALTH ASSESSMENT FORM SUBMIT COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('❌ CRITICAL ERROR in handleHealthAssessmentSubmit:', error);
        AppHelper.showError('Failed to save health assessment: ' + error.message);
    }
}

// ===============================================
//2. VALIDATE HEALTH ASSESSMENT FORM
// ===============================================
function validateHealthAssessmentForm() {
    console.log('🔍 Validating health assessment form...');
    const errors = [];
    
    // Required fields validation - USING HEALTH ASSESSMENT FIELD IDs
    if (!document.getElementById('healthPetType')?.value) {
        errors.push('Pet type is required');
    }
    
    const petName = document.getElementById('healthPetName')?.value.trim();
    if (!petName) {
        errors.push('Pet name is required');
    }
    
    if (!document.getElementById('healthPetAge')?.value) {
        errors.push('Pet age is required');
    }
    
    if (!document.getElementById('healthPetWeight')?.value) {
        errors.push('Current weight is required');
    }
    
    if (!document.getElementById('healthPetBreed')?.value?.trim()) {
        errors.push('Breed is required');
    }
    
    if (!document.getElementById('petBCS')?.value) {
        errors.push('Body Condition Score is required');
    }
    
    if (!document.getElementById('petEnergyLevel')?.value) {
        errors.push('Energy level is required');
    }
    
    console.log('📊 Health assessment validation results:', errors.length > 0 ? errors : 'No errors');
    return errors;
}

// ===============================================
//3. COLLECT HEALTH ASSESSMENT FORM DATA
// ===============================================
function collectHealthAssessmentData() {
    // Get medical conditions checkboxes
    const medicalCheckboxes = document.querySelectorAll('input[name="medicalConditions"]:checked');
    const medicalConditions = Array.from(medicalCheckboxes).map(cb => cb.value);
    
    // Auto-calculate feeding recommendation if not set
    let feedingRec = document.getElementById('petFeedingRecommendation')?.value;
    if (!feedingRec) {
        feedingRec = calculateFeedingRecommendation();
    }
    
    return {
        // Basic Information - USING HEALTH ASSESSMENT FIELD IDs
        petType: document.getElementById('healthPetType')?.value,
        petName: document.getElementById('healthPetName')?.value,
        petImage: document.getElementById('healthPetImagePreview')?.src,
        petAge: document.getElementById('healthPetAge')?.value,
        petWeight: document.getElementById('healthPetWeight')?.value,
        petBreed: document.getElementById('healthPetBreed')?.value,
        petGender: document.getElementById('healthPetGender')?.value,
        
        // Health Assessment Fields
        petBCS: document.getElementById('petBCS')?.value,
        petEnergyLevel: document.getElementById('petEnergyLevel')?.value,
        petTargetWeight: document.getElementById('petTargetWeight')?.value,
        medicalConditions: medicalConditions,
        feedingRecommendation: feedingRec,
        healthNotes: document.getElementById('petHealthNotes')?.value
    };
}

// ===============================================
//4. PERFORM DYNAMIC UPDATES - CORE CONNECTIVITY
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
//5. REFRESH CALENDAR HIGHLIGHTS
// ===============================================
function refreshCalendarHighlights(exerciseEntries) {
    console.log('📅 Refreshing calendar with', exerciseEntries.length, 'exercise entries');
    
    const openCalendar = document.querySelector('.mini-calendar');
    if (openCalendar && exerciseEntries.length > 0) {
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
//6. UPDATE OPEN COMPONENTS
// ===============================================
function updateOpenComponents(petData) {
    const moodContainer = document.querySelector('.mood-section');
    if (moodContainer) {
        const moodHTML = generateMoodSectionHTML(petData.moodLogs || []);
        moodContainer.innerHTML = moodHTML;
    }
}

// ===============================================
//7. GENERATE MOOD SECTION HTML
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
//8. RETURN TO DASHBOARD
// ===============================================
function returnToDashboard() {
    console.log('🏠 Returning to dashboard');
    
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('profileContainer').style.display = 'none';
    document.getElementById('profileContainer').innerHTML = '';
    
    clearTemporaryData();
}


// ===============================================
//  Load saved profiles - REFACTORED STRUCTURE
//==========================================
function loadSavedProfiles() {
    pets = getPets();
    
    if (pets.length === 0) { 
        document.getElementById('profileContainer').innerHTML = `
            <div class="empty-state">
                <p>Welcome to Pet Exercise Log! 🐾</p>
                <small>No saved profiles yet. Click "New Profile" above to create your first pet profile and start tracking exercises.</small>
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
      <!-- SECTION 1: BASIC INFO WITH QUICK STATS AND EDIT BUTTON -->
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
          
          <!-- BASIC FIELDS -->
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
          </div>
          
          <!-- EDIT DETAILS BUTTON - Top Right -->
          <div class="top-action-buttons">
            <button class="action-btn edit-details-btn" data-index="${index}" title="Edit pet details">
              ✏️ Edit Details
            </button>
          </div>
        </div>
      </div>

      <!-- SECTION 2: DAILY EXERCISE LOG SECTION -->
      <div class="daily-exercise-section">
        <div class="section-header">
          <button class="action-btn daily-log-btn" data-index="${index}" title="Log daily exercise">
            📝 Daily Log
          </button>
          <span>Exercise Tracking</span>
        </div>
        
        <div class="exercise-content">
          <!-- MINI CHARTS - 3 charts -->
          <div class="mini-charts-container">
            <div class="mini-chart" id="mini-duration-chart-${index}">
              ${generateMiniCharts(pet.exerciseEntries || [])}
            </div>
            <div class="mini-chart" id="mini-calories-chart-${index}">
              <!-- Calories chart placeholder -->
            </div>
            <div class="mini-chart" id="mini-intensity-chart-${index}">
              <!-- Intensity chart placeholder -->
            </div>
          </div>
          
          <!-- MINI CALENDAR -->
          <div class="calendar-section">
            <div class="mini-calendar" id="mini-calendar-${index}">
              ${generateMiniCalendar(pet.exerciseEntries || [])}
            </div>
          </div>
          
          <!-- MOOD LOGS -->
          <div class="mood-section">
            <div class="section-header">
              <span>😊 Recent Mood</span>
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
        </div>
      </div>

      <!-- SECTION 3: SUGGESTED EXERCISES -->
      <div class="suggested-exercises-section">
        <div class="section-header">
          <span>💡 Suggested Exercises</span>
        </div>
        <div class="suggested-exercises-list">
          ${generateSuggestedExercises(pet).map((exercise, i) => `
            <div class="suggested-exercise-item">
              <div class="exercise-info">
                <strong>${exercise.name}</strong>
                <small>${exercise.duration} min • ${exercise.intensity}</small>
                <p>${exercise.reason}</p>
              </div>
              <div class="exercise-actions">
                <button class="small-btn log-exercise-btn" data-index="${index}" data-exercise="${exercise.id}">
                  LOG
                </button>
                <button class="small-btn delete-suggestion-btn" data-index="${index}" data-exercise="${exercise.id}">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SECTION 4: ACTION BUTTONS -->
      <div class="action-buttons-section">
        <button class="action-btn select-btn" data-index="${index}" title="Select this pet">
          ${index === activePetIndex ? '✅ Selected' : '👉 Select'}
        </button>
        <button class="action-btn delete-btn" data-index="${index}" title="Delete this pet">
          🗑️ Delete
        </button>
        <button class="action-btn report-btn" data-index="${index}" title="Generate comprehensive report">
          📊 Generate Report
        </button>
      </div>
    </div>
  `}).join('');

  document.getElementById('savedProfiles').innerHTML = profilesHTML;
  setupProfileEventListeners();
}

// Helper function for suggested exercises (placeholder - we'll enhance this)
function generateSuggestedExercises(pet) {
    // This will be enhanced with smart logic based on health assessment
    const suggestions = [];
    
    if (pet.petDetails.bcs && pet.petDetails.bcs >= 4) {
        suggestions.push({
            id: 'weight_walk',
            name: 'Gentle Weight Loss Walk',
            duration: 20,
            intensity: 'Low',
            reason: 'Helps with weight management'
        });
    }
    
    if (pet.petDetails.medicalConditions && pet.petDetails.medicalConditions.includes('arthritis')) {
        suggestions.push({
            id: 'water_therapy',
            name: 'Water Therapy',
            duration: 15,
            intensity: 'Low',
            reason: 'Gentle on joints'
        });
    }
    
    // Default suggestion if none match
    if (suggestions.length === 0) {
        suggestions.push({
            id: 'daily_walk',
            name: 'Daily Walk',
            duration: 30,
            intensity: 'Medium', 
            reason: 'General health maintenance'
        });
    }
    
    return suggestions;
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

// ===============================================
// NEW HEALTH ASSESSMENT FORM FUNCTIONS
// ===============================================

// Show health assessment form (for new profiles)
function showHealthAssessmentForm() {
    console.log('🔄 Showing health assessment form');
    
    // Hide saved profiles, show form container
    document.getElementById('savedProfiles').style.display = 'none';
    document.getElementById('profileContainer').style.display = 'block';
    
    // Load the health assessment form template
    const template = document.getElementById('healthAssessmentFormTemplate');
    document.getElementById('profileContainer').innerHTML = template.innerHTML;
    
    // Set up form submission handler
    document.getElementById('completeHealthAssessmentForm').addEventListener('submit', handleHealthAssessmentSubmit);
    
    // Set up cancel button
    document.getElementById('cancelHealthAssessmentButton').addEventListener('click', function() {
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
        document.getElementById('profileContainer').innerHTML = '';
    });
    
    // Set up image upload handler
    document.getElementById('healthPetImage').addEventListener('change', handleHealthImageUpload);
    
    // Set up auto-calculation for feeding recommendation
    setupFeedingCalculation();
}

// Handle health assessment form submission
function handleHealthAssessmentSubmit(e) {
    e.preventDefault();
    console.log('🔄 Health assessment form submission');
    
    try {
        // Validate form
        const validationErrors = validateHealthAssessmentForm();
        if (validationErrors.length > 0) {
            console.error('❌ Health form validation failed:', validationErrors);
            AppHelper.showErrors(validationErrors);
            return;
        }
        
        // Collect form data
        const formData = collectHealthAssessmentData();
        console.log('📋 Health assessment data collected:', formData);
        
        // Create new pet profile
        const pets = getPets();
        if (pets.length >= MAX_PETS) {
            AppHelper.showError(`Maximum of ${MAX_PETS} profiles reached`);
            return;
        }
        
        const petData = initializeNewPetWithHealth(formData);
        
        // Save to storage
        pets.push(petData);
        activePetIndex = pets.length - 1;
        localStorage.setItem('pets', JSON.stringify(pets));
        sessionStorage.setItem('activePetIndex', activePetIndex);
        
        console.log('💾 Health assessment saved');
        
        // Show success and return to dashboard
        showSuccess('Pet profile created successfully!');
        loadSavedProfiles(); // Refresh to show new profile
        
        // Return to dashboard
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
        document.getElementById('profileContainer').innerHTML = '';
        
    } catch (error) {
        console.error('❌ Error in health assessment submission:', error);
        AppHelper.showError('Failed to save health assessment: ' + error.message);
    }
}

// Initialize new pet with health assessment data
function initializeNewPetWithHealth(formData) {
    return {
        petDetails: {
            type: formData.petType,
            name: formData.petName.trim(),
            image: formData.petImage,
            age: formData.petAge,
            weight: formData.petWeight,
            breed: formData.petBreed.trim(),
            gender: formData.petGender,
            // Health assessment fields
            bcs: formData.petBCS,
            energyLevel: formData.petEnergyLevel,
            targetWeight: formData.petTargetWeight,
            medicalConditions: formData.medicalConditions,
            feedingRecommendation: formData.feedingRecommendation,
            healthNotes: formData.healthNotes.trim()
        },
        exerciseEntries: [],
        moodLogs: []
    };
}

// Collect health assessment form data
function collectHealthAssessmentData() {
    // Get medical conditions checkboxes
    const medicalCheckboxes = document.querySelectorAll('input[name="medicalConditions"]:checked');
    const medicalConditions = Array.from(medicalCheckboxes).map(cb => cb.value);
    
    // Auto-calculate feeding recommendation if not set
    let feedingRec = document.getElementById('petFeedingRecommendation')?.value;
    if (!feedingRec) {
        feedingRec = calculateFeedingRecommendation();
    }
    
    return {
        petType: document.getElementById('healthPetType')?.value,
        petName: document.getElementById('healthPetName')?.value,
        petImage: document.getElementById('healthPetImagePreview')?.src,
        petAge: document.getElementById('healthPetAge')?.value,
        petWeight: document.getElementById('healthPetWeight')?.value,
        petBreed: document.getElementById('healthPetBreed')?.value,
        petGender: document.getElementById('healthPetGender')?.value,
        petBCS: document.getElementById('petBCS')?.value,
        petEnergyLevel: document.getElementById('petEnergyLevel')?.value,
        petTargetWeight: document.getElementById('petTargetWeight')?.value,
        medicalConditions: medicalConditions,
        feedingRecommendation: feedingRec,
        healthNotes: document.getElementById('petHealthNotes')?.value
    };
}

// Validate health assessment form
function validateHealthAssessmentForm() {
    console.log('🔍 Validating health assessment form...');
    const errors = [];
    
    // Required fields validation
    if (!document.getElementById('healthPetType')?.value) {
        errors.push('Pet type is required');
    }
    
    const petName = document.getElementById('healthPetName')?.value.trim();
    if (!petName) {
        errors.push('Pet name is required');
    }
    
    if (!document.getElementById('healthPetAge')?.value) {
        errors.push('Pet age is required');
    }
    
    if (!document.getElementById('healthPetWeight')?.value) {
        errors.push('Current weight is required');
    }
    
    if (!document.getElementById('healthPetBreed')?.value?.trim()) {
        errors.push('Breed is required');
    }
    
    if (!document.getElementById('petBCS')?.value) {
        errors.push('Body Condition Score is required');
    }
    
    if (!document.getElementById('petEnergyLevel')?.value) {
        errors.push('Energy level is required');
    }
    
    console.log('📊 Health validation results:', errors.length > 0 ? errors : 'No errors');
    return errors;
}

// Setup feeding calculation
function setupFeedingCalculation() {
    const currentWeightInput = document.getElementById('healthPetWeight');
    const targetWeightInput = document.getElementById('petTargetWeight');
    const feedingSelect = document.getElementById('petFeedingRecommendation');
    
    if (currentWeightInput && targetWeightInput && feedingSelect) {
        // Calculate when either weight field changes
        const calculateHandler = () => {
            const currentWeight = parseFloat(currentWeightInput.value);
            const targetWeight = parseFloat(targetWeightInput.value);
            
            if (currentWeight && targetWeight) {
                const recommendation = calculateFeedingRecommendation(currentWeight, targetWeight);
                feedingSelect.value = recommendation;
            }
        };
        
        currentWeightInput.addEventListener('input', calculateHandler);
        targetWeightInput.addEventListener('input', calculateHandler);
    }
}

// Calculate feeding recommendation
function calculateFeedingRecommendation(currentWeight, targetWeight) {
    if (!currentWeight || !targetWeight) return '';
    
    const weightDiff = targetWeight - currentWeight;
    const percentDiff = (weightDiff / currentWeight) * 100;
    
    if (percentDiff < -10) {
        return 'feed_less'; // Weight loss needed
    } else if (percentDiff > 10) {
        return 'feed_more'; // Weight gain needed
    } else if (Math.abs(percentDiff) <= 5) {
        return 'maintain'; // Maintain current
    } else {
        return 'diet_change'; // Significant change needed
    }
}

// Handle health form image upload
function handleHealthImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('healthPetImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
}
// ===============================================
// HEALTH ASSESSMENT EDIT FUNCTIONS
// ===============================================
// IT USES CANCEL EDIT FUNCTION FOR EXERCISE LOGGING FORM AS WELL
// Show health assessment form for editing existing profile
function showHealthAssessmentEditForm(index) {  
    console.log('🔄 showHealthAssessmentEditForm called for index:', index);
    
    try {
        if (index === undefined || index === null) {
            throw new Error('Invalid pet index provided');
        }

        const pets = getPets();
        if (!pets[index]) {
            throw new Error(`Pet not found at index: ${index}`);
        }

        const pet = pets[index];
        console.log('📝 Editing health assessment for:', pet.petDetails.name);
        
        // Set active pet
        activePetIndex = index;
        sessionStorage.setItem('activePetIndex', activePetIndex);

        // Show the form container
        document.getElementById('savedProfiles').style.display = 'none';
        document.getElementById('profileContainer').style.display = 'block';
        
        // Load the health assessment form template
        const template = document.getElementById('healthAssessmentFormTemplate');
        if (!template) {
            throw new Error('Health assessment form template not found');
        }
        
        document.getElementById('profileContainer').innerHTML = template.innerHTML;
        
        // Populate form fields with health assessment data
        setTimeout(() => populateHealthAssessmentForm(pet), 50);
        
        // Set up form submission handler
        document.getElementById('completeHealthAssessmentForm').addEventListener('submit', handleHealthAssessmentSubmit);
        
        // Set up cancel button
        document.getElementById('cancelHealthAssessmentButton').addEventListener('click', function() {
            returnToDashboard();
        });
        
        // Set up image upload handler
        document.getElementById('healthPetImage').addEventListener('change', handleHealthImageUpload);
        
        // Set up feeding calculation
        setupFeedingCalculation();
        
        console.log('✅ Health assessment edit form initialized successfully');
        
    } catch (error) {
        console.error('❌ Error in showHealthAssessmentEditForm:', error);
        AppHelper.showError(`Failed to load health assessment: ${error.message}`);
        returnToDashboard();
    }
}

// Populate health assessment form with existing data
function populateHealthAssessmentForm(pet) {  
    console.log('🔄 Populating health assessment form for:', pet.petDetails.name);
    
    const fieldMappings = {
        // Basic Information
        'healthPetType': pet.petDetails.type,
        'healthPetName': pet.petDetails.name,
        'healthPetAge': pet.petDetails.age,
        'healthPetWeight': pet.petDetails.weight,
        'healthPetBreed': pet.petDetails.breed,
        'healthPetGender': pet.petDetails.gender,
        
        // Health Assessment Fields
        'petBCS': pet.petDetails.bcs,
        'petEnergyLevel': pet.petDetails.energyLevel,
        'petTargetWeight': pet.petDetails.targetWeight,
        'petHealthNotes': pet.petDetails.healthNotes
    };

    // Populate each field
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        try {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value || '';
            }
        } catch (fieldError) {
            console.error(`❌ Error populating field ${fieldId}:`, fieldError);
        }
    });

    // Populate medical conditions checkboxes
    if (pet.petDetails.medicalConditions) {
        pet.petDetails.medicalConditions.forEach(condition => {
            const checkbox = document.querySelector(`input[name="medicalConditions"][value="${condition}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Populate feeding recommendation
    const feedingSelect = document.getElementById('petFeedingRecommendation');
    if (feedingSelect && pet.petDetails.feedingRecommendation) {
        feedingSelect.value = pet.petDetails.feedingRecommendation;
    }

    // Handle image preview
    try {
        const imagePreview = document.getElementById('healthPetImagePreview');
        if (imagePreview && pet.petDetails.image) {
            imagePreview.src = pet.petDetails.image;
        }
    } catch (imageError) {
        console.error('❌ Error setting image preview:', imageError);
    }

    console.log('✅ Health assessment form populated');
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
// ENHANCED EDIT WITH COMPLETE DATA POPULATION + DAILY LOG FORM FUNCTIONS

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
        // Check which form is currently open
        const healthForm = document.getElementById('completeHealthAssessmentForm');
        const dailyLogForm = document.getElementById('dailyLogForm');
        
        if (healthForm) {
            // Health Assessment Form checks
            if (activePetIndex === null) {
                const petName = document.getElementById('healthPetName')?.value.trim();
                const petType = document.getElementById('healthPetType')?.value;
                return !!(petName || petType);
            }
            
            const pets = getPets();
            const originalPet = pets[activePetIndex];
            if (!originalPet) return false;

            const currentFormData = getCurrentHealthFormData(); // Use health form data
            return hasHealthFormDataChanged(originalPet, currentFormData);
            
        } else if (dailyLogForm) {
            // Daily Log Form checks - always allow cancel for daily log (less critical)
            console.log('Daily log form - allowing cancel without confirmation');
            return false;
            
        } else {
            // Unknown form or no form
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error checking unsaved changes:', error);
        return false;
    }
}

// ===============================================
// 3.GET CURRENT FORM DATA FOR COMPARISON
// ===============================================
//getCurrentFormData() - Split for Each Form
// For Health Assessment Form
function getCurrentHealthFormData() {
    const formData = {
        // Basic Information
        type: document.getElementById('healthPetType')?.value || '',
        name: document.getElementById('healthPetName')?.value.trim() || '',
        age: document.getElementById('healthPetAge')?.value || '',
        weight: document.getElementById('healthPetWeight')?.value || '',
        breed: document.getElementById('healthPetBreed')?.value.trim() || '',
        gender: document.getElementById('healthPetGender')?.value || '',
        
        // Health Assessment Fields
        bcs: document.getElementById('petBCS')?.value || '',
        energyLevel: document.getElementById('petEnergyLevel')?.value || '',
        targetWeight: document.getElementById('petTargetWeight')?.value || '',
        healthNotes: document.getElementById('petHealthNotes')?.value.trim() || '',
        medicalConditions: getSelectedMedicalConditions(),
        image: document.getElementById('healthPetImagePreview')?.src || ''
    };
    
    return formData;
}

// For Daily Log Form (if needed later)
function getCurrentDailyLogFormData() {
    return {
        // Exercise fields only
        exerciseType: document.getElementById('dailyExerciseType')?.value || '',
        duration: document.getElementById('dailyExerciseDuration')?.value || '',
        date: document.getElementById('dailyExerciseDate')?.value || '',
        calories: document.getElementById('dailyCaloriesBurned')?.value || '',
        intensity: document.getElementById('dailyExerciseIntensity')?.value || '',
        exerciseNotes: document.getElementById('dailyExerciseNotes')?.value.trim() || ''
    };
}

// Helper function to get selected medical conditions
function getSelectedMedicalConditions() {
    const checkboxes = document.querySelectorAll('input[name="medicalConditions"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// ===============================================
// 4.COMPARE FORM DATA WITH ORIGINAL
// ===============================================
function hasHealthFormDataChanged(originalPet, currentFormData) {
    const originalDetails = originalPet.petDetails;
    
    const changes = [
        originalDetails.type !== currentFormData.type,
        originalDetails.name !== currentFormData.name,
        originalDetails.age !== currentFormData.age,
        originalDetails.weight !== currentFormData.weight,
        originalDetails.breed !== currentFormData.breed,
        originalDetails.gender !== currentFormData.gender,
        originalDetails.bcs !== currentFormData.bcs,
        originalDetails.energyLevel !== currentFormData.energyLevel,
        originalDetails.targetWeight !== currentFormData.targetWeight,
        originalDetails.healthNotes !== currentFormData.healthNotes,
        JSON.stringify(originalDetails.medicalConditions || []) !== JSON.stringify(currentFormData.medicalConditions || []),
        currentFormData.image !== 'https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png' && 
        currentFormData.image !== originalDetails.image
    ];
    
    const hasChanges = changes.some(change => change === true);
    console.log('📊 Health form change detection:', hasChanges ? 'Changes found' : 'No changes');
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

// =========================================================================================
// DAILY LOG FORM FUNCTIONS, THESE FUNCTIONS WORK ALONGSIDE THE EDIT LOGIC FOR DAILY LOGGING 
// ========================================================================================

// 8.Show daily log form for exercise and mood logging
function showDailyLogForm(index) {  
    console.log('🔄 showDailyLogForm called for index:', index);
    
    try {
        // Validate input and get pet data
        if (index === undefined || index === null) {
            throw new Error('Invalid pet index provided');
        }

        const pets = getPets();
        if (!pets[index]) {
            throw new Error(`Pet not found at index: ${index}`);
        }

        const pet = pets[index];
        console.log('📝 Daily logging for:', pet.petDetails.name);
        
        // Set active pet
        activePetIndex = index;
        sessionStorage.setItem('activePetIndex', activePetIndex);

        // Show the form container
        document.getElementById('savedProfiles').style.display = 'none';
        document.getElementById('profileContainer').style.display = 'block';
        
        // Load the daily log form template
        const template = document.getElementById('dailyLogFormTemplate');
        if (!template) {
            throw new Error('Daily log form template not found');
        }
        
        document.getElementById('profileContainer').innerHTML = template.innerHTML;
        
        // Set up mood tracker for daily log
        initializeDailyLogMoodTracker();
        
        // Populate form with today's date and smart defaults
        setTimeout(() => populateDailyLogForm(pet), 50);
        
        // Set up form submission handler
        document.getElementById('dailyLogForm').addEventListener('submit', handleDailyLogSubmit);
        
        // Set up cancel button
        document.getElementById('cancelDailyLogButton').addEventListener('click', function() {
            returnToDashboard();
        });
        
        console.log('✅ Daily log form initialized successfully');
        
    } catch (error) {
        console.error('❌ Error in showDailyLogForm:', error);
        AppHelper.showError(`Failed to load daily log: ${error.message}`);
        returnToDashboard();
    }
}

//9. Populate daily log form with smart defaults
function populateDailyLogForm(pet) {  
    console.log('🔄 Populating daily log form for:', pet.petDetails.name);
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dailyExerciseDate').value = today;
    
    // Set smart defaults based on pet's usual activities
    const lastExercise = pet.exerciseEntries.length > 0 ? 
        pet.exerciseEntries[pet.exerciseEntries.length - 1] : null;
    
    if (lastExercise) {
        // Pre-fill with last exercise type for convenience
        document.getElementById('dailyExerciseType').value = lastExercise.exerciseType;
        document.getElementById('dailyExerciseDuration').value = lastExercise.duration;
        document.getElementById('dailyCaloriesBurned').value = lastExercise.caloriesBurned;
        document.getElementById('dailyExerciseIntensity').value = lastExercise.intensity || 'medium';
    } else {
        // Default values for first exercise
        document.getElementById('dailyExerciseDuration').value = 30;
        document.getElementById('dailyCaloriesBurned').value = 150;
    }
    
    // Set today's mood if already logged
    const todayMood = pet.moodLogs?.find(log => log.date === today);
    if (todayMood) {
        const moodBtn = document.querySelector(`.emoji-btn[data-mood="${todayMood.mood}"]`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
        }
    }
    
    console.log('✅ Daily log form populated');
}

//10. Initialize mood tracker for daily log form
function initializeDailyLogMoodTracker() {
    console.log('Initializing daily log mood tracker...');
    
    const moodContainer = document.getElementById('dailyMoodTracker');
    if (!moodContainer) {
        console.error('Daily mood tracker container not found!');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    moodContainer.innerHTML = `
        <div class="mood-container">
            <div class="mood-selector">
                ${MOOD_OPTIONS.map(mood => `
                    <button type="button" class="emoji-btn" data-mood="${mood.value}" data-date="${today}" 
                            title="${mood.label}">
                        ${mood.emoji}
                        <span class="mood-label">${mood.label}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add event listeners for mood selection
    moodContainer.addEventListener('click', handleDailyLogMoodSelection);
}

//11. Handle mood selection in daily log form
function handleDailyLogMoodSelection(e) {
    if (e.target.classList.contains('emoji-btn') || e.target.closest('.emoji-btn')) {
        e.preventDefault();
        const btn = e.target.classList.contains('emoji-btn') ? 
                   e.target : e.target.closest('.emoji-btn');
        
        // Update button selection state
        document.querySelectorAll('.emoji-btn').forEach(btn => 
            btn.classList.remove('selected')
        );
        btn.classList.add('selected');
    }
}

// 12.Handle daily log form submission
function handleDailyLogSubmit(e) {
    e.preventDefault();
    console.log('🔄 Daily log form submission');
    
    try {
        // Validate form
        const validationErrors = validateDailyLogForm();
        if (validationErrors.length > 0) {
            console.error('❌ Daily log validation failed:', validationErrors);
            AppHelper.showErrors(validationErrors);
            return;
        }
        
        // Collect form data
        const formData = collectDailyLogData();
        console.log('📋 Daily log data collected:', formData);
        
        // Update pet data
        const pets = getPets();
        const pet = { ...pets[activePetIndex] };
        
        // Add exercise entry
        pet.exerciseEntries = pet.exerciseEntries || [];
        pet.exerciseEntries.push({
            exerciseType: formData.exerciseType,
            duration: Number(formData.duration),
            date: formData.date,
            caloriesBurned: Number(formData.calories),
            intensity: formData.intensity,
            notes: formData.exerciseNotes.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Add mood entry
        if (formData.mood !== null) {
            pet.moodLogs = pet.moodLogs || [];
            pet.moodLogs = pet.moodLogs.filter(log => log.date !== formData.date);
            pet.moodLogs.push({ 
                date: formData.date, 
                mood: formData.mood,
                timestamp: new Date().toISOString()
            });
        }
        
        // Save to storage
        pets[activePetIndex] = pet;
        localStorage.setItem('pets', JSON.stringify(pets));
        console.log('💾 Daily log saved');
        
        // Show success and return to dashboard
        showSuccess('Exercise logged successfully!');
        
        // Return to dashboard and refresh
        returnToDashboard();
        loadSavedProfiles(); // This will now show the updated calendar/charts/mood
        
        console.log('✅ Daily log completed successfully');
        
    } catch (error) {
        console.error('❌ Error in daily log submission:', error);
        AppHelper.showError('Failed to save daily log: ' + error.message);
    }
}

//13. Collect daily log form data
function collectDailyLogData() {
    // Get selected mood
    const selectedMoodBtn = document.querySelector('.emoji-btn.selected');
    const moodValue = selectedMoodBtn ? parseInt(selectedMoodBtn.dataset.mood) : null;
    
    return {
        exerciseType: document.getElementById('dailyExerciseType')?.value,
        duration: document.getElementById('dailyExerciseDuration')?.value,
        date: document.getElementById('dailyExerciseDate')?.value,
        calories: document.getElementById('dailyCaloriesBurned')?.value,
        intensity: document.getElementById('dailyExerciseIntensity')?.value,
        exerciseNotes: document.getElementById('dailyExerciseNotes')?.value,
        mood: moodValue
    };
}

// 14.Validate daily log form
function validateDailyLogForm() {
    console.log('🔍 Validating daily log form...');
    const errors = [];
    
    // Required exercise fields
    if (!document.getElementById('dailyExerciseType')?.value) {
        errors.push('Exercise type is required');
    }
    
    const duration = document.getElementById('dailyExerciseDuration')?.value;
    if (!duration || duration < 1) {
        errors.push('Valid exercise duration is required');
    }
    
    if (!document.getElementById('dailyExerciseDate')?.value) {
        errors.push('Exercise date is required');
    }
    
    const calories = document.getElementById('dailyCaloriesBurned')?.value;
    if (!calories || calories < 1) {
        errors.push('Valid calories burned is required');
    }
    
    console.log('📊 Daily log validation results:', errors.length > 0 ? errors : 'No errors');
    return errors;
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

// ===============================================
// SUGGESTED EXERCISES LOGIC
// ===============================================

// Generate smart exercise suggestions based on health assessment
function generateSuggestedExercises(pet) {
    const suggestions = [];
    const details = pet.petDetails;
    
    // Weight Management Suggestions
    if (details.bcs && details.bcs >= 4) { // Overweight or obese
        suggestions.push({
            id: 'weight_walk',
            name: 'Gentle Weight Loss Walk',
            duration: 20,
            intensity: 'Low',
            reason: 'Helps with weight management - low impact',
            type: 'walking'
        });
    }
    
    if (details.bcs && details.bcs <= 2) { // Underweight
        suggestions.push({
            id: 'strength_build',
            name: 'Strength Building Play',
            duration: 15,
            intensity: 'Medium',
            reason: 'Build muscle mass gradually',
            type: 'playing'
        });
    }
    
    // Medical Condition Based Suggestions
    if (details.medicalConditions) {
        if (details.medicalConditions.includes('arthritis')) {
            suggestions.push({
                id: 'water_therapy',
                name: 'Water Therapy',
                duration: 15,
                intensity: 'Low',
                reason: 'Gentle on arthritic joints',
                type: 'swimming'
            });
        }
        
        if (details.medicalConditions.includes('heart_condition')) {
            suggestions.push({
                id: 'gentle_walk',
                name: 'Gentle Leisurely Walk',
                duration: 10,
                intensity: 'Low',
                reason: 'Safe for heart condition',
                type: 'walking'
            });
        }
        
        if (details.medicalConditions.includes('spinal_injury') || 
            details.medicalConditions.includes('previous_fracture')) {
            suggestions.push({
                id: 'physio_walk',
                name: 'Physio-Therapy Walk',
                duration: 10,
                intensity: 'Low',
                reason: 'Controlled movement for recovery',
                type: 'walking'
            });
        }
        
        if (details.medicalConditions.includes('lameness') || 
            details.medicalConditions.includes('torn_muscle')) {
            suggestions.push({
                id: 'rest_recovery',
                name: 'Controlled Rest Period',
                duration: 5,
                intensity: 'Low',
                reason: 'Allow muscle/tissue recovery',
                type: 'playing'
            });
        }
    }
    
    // Age Based Suggestions
    if (details.age && details.age >= 7) { // Senior pets
        suggestions.push({
            id: 'senior_stroll',
            name: 'Senior Pet Stroll',
            duration: 15,
            intensity: 'Low',
            reason: 'Age-appropriate gentle exercise',
            type: 'walking'
        });
    }
    
    if (details.age && details.age <= 2) { // Young pets
        suggestions.push({
            id: 'young_play',
            name: 'Young Pet Play Session',
            duration: 25,
            intensity: 'High',
            reason: 'High energy appropriate for age',
            type: 'playing'
        });
    }
    
    // Energy Level Based Suggestions
    if (details.energyLevel === 'low') {
        suggestions.push({
            id: 'low_energy_walk',
            name: 'Short Energizing Walk',
            duration: 10,
            intensity: 'Low',
            reason: 'Gentle activity for low energy pets',
            type: 'walking'
        });
    }
    
    if (details.energyLevel === 'high' || details.energyLevel === 'very high') {
        suggestions.push({
            id: 'high_energy_run',
            name: 'Energy Burning Run',
            duration: 30,
            intensity: 'High',
            reason: 'Burns excess energy',
            type: 'running'
        });
    }
    
    // Default suggestion if none match
    if (suggestions.length === 0) {
        suggestions.push({
            id: 'daily_walk',
            name: 'Daily Maintenance Walk',
            duration: 20,
            intensity: 'Medium',
            reason: 'General health maintenance',
            type: 'walking'
        });
    }
    
    // Limit to 3 most relevant suggestions
    return suggestions.slice(0, 3);
}

// Log a suggested exercise (convert to actual exercise entry)
function logSuggestedExercise(petIndex, exerciseId) {
    const pets = getPets();
    const pet = pets[petIndex];
    const suggestions = generateSuggestedExercises(pet);
    const exercise = suggestions.find(s => s.id === exerciseId);
    
    if (!exercise) {
        AppHelper.showError('Exercise not found');
        return;
    }
    
    // Create exercise entry from suggestion
    const exerciseEntry = {
        exerciseType: exercise.type,
        duration: exercise.duration,
        date: new Date().toISOString().split('T')[0],
        caloriesBurned: calculateCaloriesFromExercise(exercise),
        intensity: exercise.intensity,
        notes: `Auto-logged: ${exercise.name} - ${exercise.reason}`,
        timestamp: new Date().toISOString()
    };
    
    // Add to pet's exercise entries
    pet.exerciseEntries = pet.exerciseEntries || [];
    pet.exerciseEntries.push(exerciseEntry);
    
    // Save and refresh
    localStorage.setItem('pets', JSON.stringify(pets));
    loadSavedProfiles(); // Refresh display
    showSuccess(`Logged: ${exercise.name}`);
}

// Calculate calories based on exercise type and duration
function calculateCaloriesFromExercise(exercise) {
    const baseCalories = {
        'walking': 5,    // calories per minute
        'running': 8,
        'swimming': 6,
        'playing': 4,
        'fetch': 5,
        'agility': 7
    };
    
    const baseRate = baseCalories[exercise.type] || 5;
    return Math.round(baseRate * exercise.duration);
}

// Delete a suggested exercise (remove from display)
function deleteSuggestion(petIndex, exerciseId) {
    // For now, just remove from display - suggestions are regenerated each time
    // In future, we could store dismissed suggestions
    const suggestionElement = document.querySelector(`[data-exercise="${exerciseId}"]`);
    if (suggestionElement) {
        suggestionElement.style.opacity = '0.5';
        setTimeout(() => {
            loadSavedProfiles(); // Refresh to regenerate suggestions
        }, 300);
    }
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

   // Edit button → Now becomes Daily Log button
  document.querySelectorAll('.daily-log-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      showDailyLogForm(index); // Changed from editPetProfile
    });
  });

  // Edit Details button (for health assessment form)
document.querySelectorAll('.edit-details-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const index = parseInt(btn.dataset.index);
    showHealthAssessmentEditForm(index); // Now uses health assessment edit
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
 
 // Suggested exercise buttons
document.querySelectorAll('.log-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const exerciseId = btn.dataset.exercise;
        logSuggestedExercise(index, exerciseId);
    });
});

document.querySelectorAll('.delete-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const exerciseId = btn.dataset.exercise;
        deleteSuggestion(index, exerciseId);
    });
});
}

