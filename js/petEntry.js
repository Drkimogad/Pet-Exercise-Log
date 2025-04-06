// petEntry.js

// Importing helper functions from other modules
import { signIn, signOut, getCurrentUser } from './auth.js';  // auth handling
import { getPetData, savePetData } from './dataService.js';  // data handling
import { updateCharts } from './charts.js';  // chart updates
import { saveProfile } from './savedProfiles.js';  // saving profiles

// setting up main logic //
// Function to sign the user in
function handleSignIn() {
  signIn();  // Calls signIn function from auth.js
}

// Function to sign out
function handleSignOut() {
  signOut();  // Calls signOut function from auth.js
}

// Handling getting the current user
function loadCurrentUser() {
  const user = getCurrentUser();  // Calls getCurrentUser function from auth.js
  if (user) {
    console.log("User logged in:", user);
  } else {
    console.log("No user logged in.");
  }
}

// For displaying and saving pet data
function loadPetData() {
  const petData = getPetData();  // Calls getPetData function from dataService.js
  console.log("Pet Data:", petData);
}

function savePetDataHandler(data) {
  savePetData(data);  // Calls savePetData function from dataService.js
  updateCharts();  // Call to update charts after saving data
}

// Function to handle profile saving
function saveUserProfile(profileData) {
  saveProfile(profileData);  // Calls saveProfile function from savedProfiles.js
}

// Event Listeners//
// Add event listeners for the buttons
document.querySelector("#signInButton").addEventListener("click", handleSignIn);
document.querySelector("#signOutButton").addEventListener("click", handleSignOut);
document.querySelector("#savePetDataButton").addEventListener("click", () => {
  const petData = collectPetData();  // Function that collects pet data (from a form, etc.)
  savePetDataHandler(petData);
});
document.querySelector("#saveUserProfileButton").addEventListener("click", () => {
  const profileData = collectProfileData();  // Function that collects user profile data
  saveUserProfile(profileData);
});
//  ========//
const PetEntry = (function() {
  const CONFIG = {
    DEFAULT_IMAGE: 'default-pet.png',
    EMOJIS: ['😀', '😐', '😞', '😊', '😠'],
    EXERCISE_LEVELS: ['high', 'medium', 'low'],
    FAVORITE_EXERCISES: ['running', 'swimming', 'fetch', 'walking', 'playing'],
    ACTIVITY_TYPES: ['running_park', 'around_block', 'swimming', 'house_play', 'companion_play'],
    LOCATIONS: ['park', 'backyard', 'indoors', 'beach', 'trail']
  };

  const templates = {
    petForm: (pet = {}) => `
      <form id="petForm" class="pet-form">
        <input type="hidden" id="petId" value="${pet.id || crypto.randomUUID()}">
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" value="${pet.name || ''}" required>
        </div>
        <div class="form-group">
          <label for="petImage">Pet Image</label>
          <div class="image-upload">
            <input type="file" id="petImage" accept="image/*">
            <img id="petImagePreview" src="${pet.image || CONFIG.DEFAULT_IMAGE}" alt="Pet Preview" style="max-width: 150px;">
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
            ${['healthy', 'diabetic', 'arthritic', 'hepatic', 'renal', 'digestive', 'dental'].map(status => `<option value="${status}" ${pet.healthStatus === status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petAllergies">Allergies</label>
          <select id="petAllergies">
            ${['', 'allergic rhinitis', 'nuts', 'skin allergy', 'contact dermatitis'].map(allergy => `<option value="${allergy}" ${pet.allergies === allergy ? 'selected' : ''}>${allergy || 'None'}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petExerciseLevel">Exercise Level</label>
          <select id="petExerciseLevel" required>
            ${CONFIG.EXERCISE_LEVELS.map(level => `<option value="${level}" ${pet.exerciseLevel === level ? 'selected' : ''}>${level.charAt(0).toUpperCase() + level.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petFavoriteExercise">Favorite Exercise</label>
          <select id="petFavoriteExercise">
            ${CONFIG.FAVORITE_EXERCISES.map(ex => `<option value="${ex}" ${pet.favoriteExercise === ex ? 'selected' : ''}>${ex.charAt(0).toUpperCase() + ex.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petLastActivity">Last Activity</label>
          <select id="petLastActivity">
            ${CONFIG.ACTIVITY_TYPES.map(act => `<option value="${act}" ${pet.lastActivity === act ? 'selected' : ''}>${act.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petExerciseLocation">Exercise Location</label>
          <select id="petExerciseLocation">
            ${CONFIG.LOCATIONS.map(loc => `<option value="${loc}" ${pet.exerciseLocation === loc ? 'selected' : ''}>${loc.charAt(0).toUpperCase() + loc.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petDate">Date</label>
          <input type="date" id="petDate" value="${pet.date || new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label for="petExerciseDuration">Exercise Duration (minutes)</label>
          <input type="number" id="petExerciseDuration" value="${pet.exerciseDuration || '30'}" min="0" required>
        </div>
        <div class="form-group">
          <label for="petCalories">Calories Burnt</label>
          <input type="number" id="petCalories" value="${pet.calories || '150'}" min="0" required>
        </div>
        <div class="form-group mood-selector">
          <label>Today's Mood:</label>
          <div class="mood-options">
            ${CONFIG.EMOJIS.map((emoji, index) => `<button type="button" class="emoji-btn ${pet.mood === index ? 'selected' : ''}" data-mood="${index}" data-date="${new Date().toISOString().split('T')[0]}">${emoji}</button>`).join('')}
          </div>
        </div>
        <button type="submit" class="save-pet-btn">${pet.id ? 'Update Pet' : 'Add New Pet'}</button>
      </form>`
  };

  const renderPetForm = (pet = {}) => {
    document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
    attachImageUploadHandler();
    attachFormSubmitHandler();
    attachMoodSelectionListeners();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('petImagePreview').src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const attachImageUploadHandler = () => {
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
  };

  const attachFormSubmitHandler = () => {
    const form = document.getElementById('petForm');
    form?.addEventListener('submit', handlePetFormSubmit);
  };

  const handlePetFormSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const petId = form.petId.value;
    const name = form.petName.value;
    const image = document.getElementById('petImagePreview').src === CONFIG.DEFAULT_IMAGE ? null : document.getElementById('petImagePreview').src;
    const characteristics = form.petCharacteristics.value;
    const age = parseInt(form.petAge.value);
    const weight = parseInt(form.petWeight.value);
    const healthStatus = form.petHealthStatus.value;
    const allergies = form.petAllergies.value;
    const exerciseLevel = form.petExerciseLevel.value;
    const favoriteExercise = form.petFavoriteExercise.value;
    const lastActivity = form.petLastActivity.value;
    const exerciseLocation = form.petExerciseLocation.value;
    const date = form.petDate.value;
    const exerciseDuration = parseInt(form.petExerciseDuration.value);
    const calories = parseInt(form.petCalories.value);
    const mood = form.querySelector('.mood-options button.selected')?.dataset.mood ? parseInt(form.querySelector('.mood-options button.selected').dataset.mood) : null;

    const newPetData = {
      id: petId,
      name,
      image,
      characteristics,
      age,
      weight,
      healthStatus,
      allergies,
      exerciseLevel,
      favoriteExercise,
      lastActivity,
      exerciseLocation,
      exerciseEntries: [{ date, duration: exerciseDuration, calories }],
      moodLogs: mood !== null ? [{ date, mood }] : []
    };

    const pets = dataService.getPets();
    const existingPetIndex = pets.findIndex(pet => pet.id === petId);

    if (existingPetIndex !== -1) {
      pets[existingPetIndex] = {
        ...pets[existingPetIndex],
        ...newPetData,
        exerciseEntries: [
          ...(pets[existingPetIndex].exerciseEntries || []).filter(entry => entry.date !== date),
          { date, duration: exerciseDuration, calories }
        ],
        moodLogs: [
          ...(pets[existingPetIndex].moodLogs || []).filter(log => log.date !== date),
          ...(mood !== null ? [{ date, mood }] : [])
        ]
      };
      dataService.savePets(pets);
    } else {
      dataService.addPet(newPetData);
    }

    SavedProfilesSection.renderSavedProfiles();
    CalendarSection.renderCalendar();
    MoodLogsSection.renderMoodLogs();
    ChartsSection.renderCharts(dataService.getActivePet()?.exerciseEntries || []);

    // Optionally clear the form or provide feedback
    form.reset();
    document.getElementById('petImagePreview').src = CONFIG.DEFAULT_IMAGE;
  };

  const attachMoodSelectionListeners = () => {
    const moodOptions = document.querySelector('.mood-options');
    moodOptions?.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
      }
    });
  };

  const initDashboard = () => {
    console.log('Dashboard Initialized');
    SavedProfilesSection.renderSavedProfiles();
    renderPetForm(); // Render an empty form for adding a new pet
    CalendarSection.renderCalendar();
    MoodLogsSection.renderMoodLogs();
    ChartsSection.renderCharts(dataService.getActivePet()?.exerciseEntries || []);
    // Potentially load other dashboard sections here
  };

  return {
    renderPetForm: renderPetForm,
    initDashboard: initDashboard
  };
})();

export { PetEntry };
