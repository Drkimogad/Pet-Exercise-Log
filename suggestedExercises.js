// =================================================================
// COMPLETE IMPLEMENTATION OF SUGGESTED EXERCISES IN PETCARD
/*
generate suggested exercise
    ↓
logSuggestedExercise() or dismiss them 
    ↓
Updates exerciseEntries ✅
Updates suggestionSettings.logged ✅  
Updates UI (button to "LOGGED ✅") ✅
    ↓
CALL NEW FUNCTION: getLoggedSuggestedExercises() 🆕
    ↓
refreshOpenReports() ✅


logSuggestedExercise() → filterLoggedDismissedExercises() → update report
deleteSuggestion() → filterLoggedDismissedExercises() → update report  
page refresh → filterLoggedDismissedExercises() → update UI

*/
const FAVORITE_EXERCISES = ['walking', 'running', 'swimming', 'playing', 'fetch', 'agility'];
// FOR SUGGESTED EXERCISES LOG AND CLOSE BUTTONS
// Add to top of dashboard.js for dismissed suggestions 
const DISMISSED_SUGGESTIONS_KEY = 'dismissedSuggestions';
// Add to top with other global variables
const LOGGED_SUGGESTIONS_KEY = 'loggedSuggestions';

// In suggestedExercises.js - ADD THESE CONSTANTS AT TOP
const SUGGESTION_SELECTORS = {
    logBtn: '.log-exercise-btn',
    deleteBtn: '.delete-suggestion-btn', 
    suggestionItem: '.suggested-exercise-item'
};

// ADD FALLBACK FOR MISSING FUNCTIONS
function safeCall(funcName, ...args) {
    if (typeof window[funcName] === 'function') {
        return window[funcName](...args);
    }
    console.warn(`Function ${funcName} not available`);
    return null;
}

/* 
 Generate smart exercise suggestions based on health assessment
*/
async function generateSuggestedExercises(pet, petIndex = null) { // ← ADD ASYNC HERE
    // 🛡️ BACKWARD COMPATIBILITY: Find index if not provided
    if (petIndex === null) {
        const pets = await getPets(); // ← ADD AWAIT HERE
        petIndex = pets.findIndex(p => p.id === pet.id);
        console.log('🔍 Auto-resolved petIndex:', petIndex, 'for pet:', pet.petDetails?.name);
    }
    
    // 🛡️ SAFETY CHECK
    if (petIndex === -1) {
        console.warn('Pet not found in pets array, using index 0');
        petIndex = 0;
    }

        // 🎯 ADD DEBUG LOGS HERE:
    console.log('🔍 SUGGESTIONS DEBUG: Generating suggestions for pet:', pet.petDetails.name);
    console.log('🔍 SUGGESTIONS DEBUG: Pet index:', petIndex);

    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_SUGGESTIONS_KEY) || '{}')[petIndex] || [];
    const logged = JSON.parse(localStorage.getItem(LOGGED_SUGGESTIONS_KEY) || '{}')[petIndex] || [];
    console.log('🔍 SUGGESTIONS DEBUG: Dismissed from localStorage:', dismissed);
    console.log('🔍 SUGGESTIONS DEBUG: Logged from localStorage:', logged);
    
    // Use pet.petDetails instead of undefined 'details'
    const details = pet.petDetails;
    // Add this safety check:
    if (!details) {
    console.warn('No pet details found for suggestions');
    return []; // Return empty array if no details
}
    
    const suggestions = [];
    
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
    console.log('🔍 SUGGESTIONS DEBUG: Generated suggestions:', suggestions.map(s => s.id));

    
     // SINGLE RETURN STATEMENT - return ALL suggestions, limit to 3 for display NO FILTERING ANYMORE
      return suggestions.slice(0, 3);
}

//=======================================================
  //2. Log a suggested exercise
//===============================================
async function logSuggestedExercise(petIndex, exerciseId) {
    const pets = await getPets();
    const pet = pets[petIndex];
    const suggestions = await generateSuggestedExercises(pet);
    const exercise = suggestions.find(s => s.id === exerciseId);
    
    if (!exercise) {
        showError('Exercise not found');
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

// 🆕 ONLY SAVE THE EXERCISE ENTRY, NOT SUGGESTION SETTINGS
      if (window.petDataService) {
        await window.petDataService.savePet(pet);
       } else {
      localStorage.setItem('pets', JSON.stringify(pets));
      }
    
  // Refresh displays
// Refresh displays
if (typeof loadSavedProfiles === 'function') {
    await loadSavedProfiles();
}

if (typeof updateGoalsOnExerciseLogged === 'function') {
    updateGoalsOnExerciseLogged(petIndex);
}

if (typeof refreshTimelineIfOpen === 'function') {
    refreshTimelineIfOpen();
}

// 🆕 ADD REPORT REFRESH
if (pet && typeof refreshOpenReports === 'function') {
    await refreshOpenReports(pet.id);
}

// 🆕 CENTRALIZED TRACKING WITH 'log' ACTION
if (typeof trackLoggedDismissedExercises === 'function') {
    await trackLoggedDismissedExercises(petIndex, 'log', exerciseId);
}

if (typeof showSuccess === 'function') {
    showSuccess(`Logged: ${exercise.name}`);
 }
} // closes function????

//========================================================================
// 3. Delete a suggested exercise (remove from display) updated
//==================================================================
/* 🎯 Now It's Just 3 Simple Steps:
Call tracking with 'delete' action
Refresh report
Log success */
async function deleteSuggestion(petIndex, exerciseId) {
    console.log(`🗑️ Deleting suggestion ${exerciseId} for pet ${petIndex}`);
    
    // 🆕 ONLY THIS LINE NEEDED - CENTRALIZED TRACKING HANDLES EVERYTHING
    await trackLoggedDismissedExercises(petIndex, 'delete', exerciseId);
    
    // 🆕 ADD REPORT REFRESH
    const pets = await getPets();
    const pet = pets[petIndex];
    if (pet) {
        await refreshOpenReports(pet.id);
    }
    
    console.log(`✅ Suggestion ${exerciseId} dismissed for pet ${petIndex}`);
}

//=========================================================================
// 4. 🆕 CENTRALIZED TRACKING FOR LOGGED AND DISMISSED SUGGESTIONS
//====================================================================
/*
logSuggestedExercise() → trackLoggedDismissedExercises(exerciseId, 'log') ✅✅✅✅✅
deleteSuggestion() → trackLoggedDismissedExercises(exerciseId, 'delete') 
*/
async function trackLoggedDismissedExercises(petIndex, action = 'track', exerciseId = null) {
    const pets = await getPets();
    const pet = pets[petIndex];
    if (!pet) return null;
        // 🛡️ ENSURE DATA STRUCTURE EXISTS
    if (!pet.suggestionSettings) {
        pet.suggestionSettings = { dismissed: [], logged: [] };
    }
    if (!Array.isArray(pet.suggestionSettings.dismissed)) {
        pet.suggestionSettings.dismissed = [];
    }
    if (!Array.isArray(pet.suggestionSettings.logged)) {
        pet.suggestionSettings.logged = [];
    }
    
    // Initialize suggestionSettings if missing
    pet.suggestionSettings = pet.suggestionSettings || { dismissed: [], logged: [] };
    
    // 🆕 HANDLE ACTIONS (log, delete, or just track)
    if (action === 'log' && exerciseId) {
        // Add to logged array if not already there
        if (!pet.suggestionSettings.logged.includes(exerciseId)) {
            pet.suggestionSettings.logged.push(exerciseId);
            console.log('✅ Added to logged:', exerciseId);
        }
    } 
    else if (action === 'delete' && exerciseId) {
        // Add to dismissed array if not already there
        if (!pet.suggestionSettings.dismissed.includes(exerciseId)) {
            pet.suggestionSettings.dismissed.push(exerciseId);
            console.log('✅ Added to dismissed:', exerciseId);
        }
    }
    
    // 🆕 SAVE UPDATES TO FIRESTORE
    if (action === 'log' || action === 'delete') {
        if (window.petDataService) {
            await window.petDataService.savePet(pet);
        } else {
            localStorage.setItem('pets', JSON.stringify(pets));
        }
        
        // 🆕 UPDATE LOCALSTORAGE FOR BACKWARD COMPATIBILITY
        if (action === 'log') {
            const logged = JSON.parse(localStorage.getItem(LOGGED_SUGGESTIONS_KEY) || '{}');
            if (!logged[petIndex]) logged[petIndex] = [];
            if (!logged[petIndex].includes(exerciseId)) {
                logged[petIndex].push(exerciseId);
                localStorage.setItem(LOGGED_SUGGESTIONS_KEY, JSON.stringify(logged));
            }
        }
        else if (action === 'delete') {
            const dismissed = JSON.parse(localStorage.getItem(DISMISSED_SUGGESTIONS_KEY) || '{}');
            if (!dismissed[petIndex]) dismissed[petIndex] = [];
            if (!dismissed[petIndex].includes(exerciseId)) {
                dismissed[petIndex].push(exerciseId);
                localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify(dismissed));
            }
        }
    }
    
    // UPDATE UI
    // In trackLoggedDismissedExercises() - USE THE CONSTANTS
const petCard = document.querySelector(`[data-pet-index="${petIndex}"]`);
if (petCard) {
    const suggestionItems = petCard.querySelectorAll(SUGGESTION_SELECTORS.suggestionItem);

        
        suggestionItems.forEach(item => {
            const logBtn = item.querySelector('.log-exercise-btn');
            const deleteBtn = item.querySelector('.delete-suggestion-btn');
            const itemExerciseId = logBtn?.dataset.exercise || deleteBtn?.dataset.exercise;
            
            if (!itemExerciseId) return;
            
            // Update logged state
            if (pet.suggestionSettings.logged.includes(itemExerciseId)) {
                if (logBtn) {
                    logBtn.textContent = 'LOGGED ✅';
                    logBtn.disabled = true;
                    logBtn.style.opacity = '0.7';
                }
            }
            
            // Update dismissed state
            if (pet.suggestionSettings.dismissed.includes(itemExerciseId)) {
                item.style.display = 'none';
            }
        });
    }
    
    // 🆕 RETURN DATA FOR REPORTS
    return {
        logged: pet.suggestionSettings.logged,
        dismissed: pet.suggestionSettings.dismissed,
        loggedExercises: []  // Will be populated by report function
    };
}

// Initialize logged suggestions
function initializeLoggedSuggestions() {
    if (!localStorage.getItem(LOGGED_SUGGESTIONS_KEY)) {
        localStorage.setItem(LOGGED_SUGGESTIONS_KEY, JSON.stringify({}));
    }
}

// Initialize dismissed suggestions if not exists
function initializeDismissedSuggestions() {
    if (!localStorage.getItem(DISMISSED_SUGGESTIONS_KEY)) {
        localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify({}));
    }
}

