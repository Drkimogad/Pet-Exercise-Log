// dashboard.js - Reorganized with Functional Grouping Approach

//Make initDashboard globally accessible
window.initDashboard = initDashboard;
// ============ CONSTANTS & CONFIGURATION ============
const CONFIG = {
    DEFAULT_IMAGE: 'default-pet.png',
    EMOJIS: ['😀', '😐', '😞', '😊', '😠'],
    EXERCISE_LEVELS: ['high', 'medium', 'low'],
    FAVORITE_EXERCISES: ['running', 'swimming', 'fetch', 'walking', 'playing'],
    ACTIVITY_TYPES: ['running_park', 'around_block', 'swimming', 'house_play', 'companion_play'],
    LOCATIONS: ['park', 'backyard', 'indoors', 'beach', 'trail']
};

// ============ PET ENTRY/TEMPLATE FUNCTIONS ============
const templates = {
  petForm: (pet = {}) => `
    <form id="petForm" class="pet-form">
      <h3>${pet.id ? "Update Pet Profile" : "Create Pet Profile"}</h3>

      <!-- Basic Info -->
      <label for="petName">Name *</label>
      <input type="text" id="petName" name="petName" value="${pet.name || ''}" required />

      <label for="petImage">Photo</label>
      <input type="file" id="petImage" name="petImage" accept="image/*" />
      <img id="petImagePreview" src="${pet.imageUrl || CONFIG.DEFAULT_IMAGE}" alt="Pet Image Preview" />

      <label for="petAge">Age (years)</label>
      <input type="number" id="petAge" name="petAge" min="0" step="0.1" value="${pet.age || ''}" />

      <label for="petWeight">Weight (lbs or kg)</label>
      <input type="number" id="petWeight" name="petWeight" min="0" step="0.1" value="${pet.weight || ''}" />

      <label for="petBreed">Breed</label>
      <input type="text" id="petBreed" name="petBreed" value="${pet.breed || ''}" />

      <label for="petGender">Gender</label>
      <select id="petGender" name="petGender">
        <option value="">Select Gender</option>
        <option value="male" ${pet.gender === 'male' ? 'selected' : ''}>Male</option>
        <option value="female" ${pet.gender === 'female' ? 'selected' : ''}>Female</option>
      </select>

      <!-- Health & Behavior -->
      <label for="petDiet">Diet</label>
      <textarea id="petDiet" name="petDiet" placeholder="What and how much do they eat?">${pet.diet || ''}</textarea>

      <label for="petHealthStatus">Health Status</label>
      <input type="text" id="petHealthStatus" name="petHealthStatus" value="${pet.healthStatus || ''}" />

      <label for="petAllergies">Allergies</label>
      <input type="text" id="petAllergies" name="petAllergies" value="${pet.allergies || ''}" />

      <label for="petBehavior">General Behavior</label>
      <select id="petBehavior" name="petBehavior">
        <option value="">Select Behavior</option>
        <option value="friendly" ${pet.behavior === 'friendly' ? 'selected' : ''}>Friendly</option>
        <option value="aggressive" ${pet.behavior === 'aggressive' ? 'selected' : ''}>Aggressive</option>
        <option value="skittish" ${pet.behavior === 'skittish' ? 'selected' : ''}>Skittish</option>
        <option value="playful" ${pet.behavior === 'playful' ? 'selected' : ''}>Playful</option>
        <option value="anxious" ${pet.behavior === 'anxious' ? 'selected' : ''}>Anxious</option>
        <option value="calm" ${pet.behavior === 'calm' ? 'selected' : ''}>Calm</option>
      </select>

      <label for="petFavoriteExercise">Favorite Exercise</label>
      <select id="petFavoriteExercise" name="petFavoriteExercise">
        <option value="">Select Favorite</option>
        ${CONFIG.FAVORITE_EXERCISES.map(exercise => `
          <option value="${exercise}" ${pet.favoriteExercise === exercise ? 'selected' : ''}>${exercise.charAt(0).toUpperCase() + exercise.slice(1)}</option>
        `).join('')}
      </select>

      <button type="submit">${pet.id ? "Update Profile" : "Save Profile"}</button>
    </form>
  `
};




function renderPetForm(pet = {}) {
    document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
    attachImageUploadHandler();
    attachFormSubmitHandler();
    attachMoodSelectionListeners();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('petImagePreview').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function attachImageUploadHandler() {
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
}

function attachFormSubmitHandler() {
    const form = document.getElementById('petForm');
    form?.addEventListener('submit', handlePetFormSubmit);
}

function handlePetFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // --- GET VALUES FROM THE UPDATED FORM ---
    const name = form.petName.value;
    const image = document.getElementById('petImagePreview').src === CONFIG.DEFAULT_IMAGE ? null : document.getElementById('petImagePreview').src;
    // characteristics field removed, replaced by more specific fields
    const age = parseInt(form.petAge.value) || 0; // Added fallback for parsing
    const weight = parseInt(form.petWeight.value) || 0; // Added fallback for parsing
    // --- NEW PROFILE FIELDS ---
    const breed = form.petBreed.value;
    const gender = form.petGender.value;
    const diet = form.petDiet.value;
    const healthStatus = form.petHealthStatus.value;
    const allergies = form.petAllergies.value;
    const behavior = form.petBehavior.value;
    const favoriteExercise = form.petFavoriteExercise.value;
    // --- END OF NEW FIELDS ---

    // --- REMOVED LINES: Getting values for daily log fields ---
    // const exerciseLevel = form.petExerciseLevel.value;
    // const lastActivity = form.petLastActivity.value;
    // const exerciseLocation = form.petExerciseLocation.value;
    // const date = form.petDate.value;
    // const exerciseDuration = parseInt(form.petExerciseDuration.value);
    // const calories = parseInt(form.petCalories.value);
    // const mood = form.querySelector('.mood-options button.selected')?.dataset.mood ? parseInt(form.querySelector('.mood-options button.selected').dataset.mood) : null;
    // --- END OF REMOVED LINES ---

    // Check if we are updating an existing pet or creating a new one
    const pets = getPets();
    const activePetIndex = getActivePetIndex();
    const isEditing = activePetIndex !== null;

    const newPetData = {
        // If editing, keep the old ID, otherwise generate a new one
        id: isEditing ? pets[activePetIndex].id : crypto.randomUUID(),
        name,
        imageUrl: image, // Changed key from 'image' to 'imageUrl' for clarity
        // characteristics removed from here
        age,
        weight,
        // --- NEW PROFILE FIELDS ADDED TO THE OBJECT ---
        breed,
        gender,
        diet,
        healthStatus,
        allergies,
        behavior,
        favoriteExercise,
        // --- END OF NEW FIELDS ---

        // --- Initialize or preserve arrays for future daily logs ---
        // If editing, keep the existing logs, otherwise start with empty arrays
        exerciseEntries: isEditing ? (pets[activePetIndex].exerciseEntries || []) : [],
        moodLogs: isEditing ? (pets[activePetIndex].moodLogs || []) : [],
        bcsLogs: isEditing ? (pets[activePetIndex].bcsLogs || []) : [] // Added for Body Condition Score
        // --- REMOVED: Creating a new exercise/mood entry from this form ---
        // exerciseEntries: [{ date, duration: exerciseDuration, calories }],
        // moodLogs: mood !== null ? [{ date, mood }] : []
    };

    if (isEditing) {
        // Update the existing pet with the new profile data
        pets[activePetIndex] = {
            ...pets[activePetIndex], // Keep all existing data (including logs!)
            ...newPetData  // Overwrite with the new profile data
        };
        savePets(pets);
    } else {
        // Add the new pet to the array
        addPet(newPetData);
    }

    // Update the UI
    renderSavedProfiles();
    // The calendar and charts rely on the log arrays, which we just preserved.
    renderCalendar();
    renderMoodLogs();
    renderCharts(getActivePet()?.exerciseEntries || []);

    // Reset the form and image preview
    form.reset();
    document.getElementById('petImagePreview').src = CONFIG.DEFAULT_IMAGE;
}

    const pets = getPets();
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
        savePets(pets);
    } else {
        addPet(newPetData);
    }

    renderSavedProfiles();
    renderCalendar();
    renderMoodLogs();
    renderCharts(getActivePet()?.exerciseEntries || []);
    
    form.reset();
    document.getElementById('petImagePreview').src = CONFIG.DEFAULT_IMAGE;
}


// ============ MOOD LOGS FUNCTIONS ============
function renderMoodLogs() {
    const activePet = getActivePet();
    if (activePet) {
        document.getElementById('moodLogs').innerHTML = `
            <div class="mood-container">
                ${activePet.moodLogs?.map(log => `
                    <div class="mood-entry">
                        <span>${formatDate(log.date)}</span>
                        <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
                    </div>
                `).join('') || '<p>No mood entries yet</p>'}
            </div>`;
    }
    attachMoodSelectionHandler();
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error('Date formatting error:', e);
        return dateStr;
    }
}

function handleMoodSelection(e) {
    if (e.target.classList.contains('emoji-btn')) {
        const mood = parseInt(e.target.dataset.mood);
        const date = e.target.dataset.date;
        const activePetIndex = getActivePetIndex();
        const pets = getPets();
        if (activePetIndex !== null && pets[activePetIndex]) {
            let pet = { ...pets[activePetIndex] };
            pet.moodLogs = pet.moodLogs || [];
            pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
            pet.moodLogs.push({ date, mood });
            pets[activePetIndex] = pet;
            savePets(pets);
            document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            renderMoodLogs();
        }
    }
}

function attachMoodSelectionHandler() {
    document.addEventListener('click', handleMoodSelection);
}
function attachMoodSelectionListeners() {
    const moodOptions = document.querySelector('.mood-options');
    moodOptions?.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-btn')) {
            document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
}

function addPet(petData) {
    const pets = getPets();
    pets.push(petData);
    savePets(pets);
}


function formatDisplayDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateStr;
  }
}
// ============ CALENDAR FUNCTIONS ============
function renderCalendar() {
    document.getElementById('calendarContainer').innerHTML = `
        <div class="calendar">
            <div class="calendar-header">
                <button id="prevMonth">&lt;</button>
                <h3 id="currentMonth">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button id="nextMonth">&gt;</button>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
        </div>`;
    updateCalendar();
    attachCalendarNavigationHandlers();
}

function updateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.innerHTML = '';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }
        const activePet = getActivePet();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            if (activePet?.exerciseEntries?.some(e => e.date === dateStr)) {
                dayCell.classList.add('has-exercise');
            }
            calendarGrid.appendChild(dayCell);
        }
    }
}

function attachCalendarNavigationHandlers() {
    document.getElementById('prevMonth')?.addEventListener('click', updateCalendar);
    document.getElementById('nextMonth')?.addEventListener('click', updateCalendar);
}

// ============ CHARTS FUNCTIONS ============
function renderCharts() {
    const activePet = getActivePet();
    const exerciseEntries = activePet?.exerciseEntries || [];
    document.getElementById('exerciseCharts').innerHTML = `<canvas id="exerciseChart"></canvas>`;
    initCharts(exerciseEntries);
}

function initCharts(exerciseEntries) {
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: prepareChartData(exerciseEntries),
        options: getChartOptions()
    });
}

function prepareChartData(exerciseEntries) {
    const labels = exerciseEntries.map(entry => entry.date);
    const durationData = exerciseEntries.map(entry => entry.duration);
    const caloriesData = exerciseEntries.map(entry => entry.calories);

    return {
        labels: labels,
        datasets: [
            {
                label: 'Duration (minutes)',
                data: durationData,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Calories Burned',
                data: caloriesData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };
}

function getChartOptions() {
    return {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };
}

function updateChartColors() {
    // Implement logic to update chart colors based on theme
}

// ============ SAVED PROFILES FUNCTIONS ============
function renderSavedProfiles() {
    const pets = getPets();
    const activePetIndex = getActivePetIndex();
    
    const html = `
        <div class="saved-profiles-list">
            ${pets.map((pet, index) => `
                <div class="saved-profile ${activePetIndex === index ? 'active' : ''}">
                    <img src="${pet.image || 'default-pet.png'}" alt="${pet.name}">
                    <h4>${pet.name}</h4>
                    <div class="profile-actions">
                        <button class="edit-btn" data-index="${index}">Edit</button>
                        <button class="delete-btn" data-index="${index}">Delete</button>
                        <button class="print-btn" data-index="${index}">Print</button>
                        <button class="qr-btn" data-index="${index}">🔲 QR Code</button>
                        <button class="share-btn" data-index="${index}">Share</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    document.getElementById('savedProfiles').innerHTML = html;

    attachProfileActionHandlers();
}

function handleProfileAction(e) {
    if (e.target.classList.contains('edit-btn')) {
        const index = parseInt(e.target.dataset.index);
        setActivePetIndex(index);
        renderPetForm(getPets()[index]);
    } else if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pets = getPets();
        if (confirm(`Delete ${pets[index].name}?`)) {
            pets.splice(index, 1);
            savePets(pets);
            renderSavedProfiles();
            if (getActivePetIndex() === index) {
                setActivePetIndex(null);
                renderPetForm();
            }
        }
    } else if (e.target.classList.contains('qr-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pet = getPets()[index];
        generatePetQR(pet);
    } else if (e.target.classList.contains('print-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pet = getPets()[index];
        generatePDF(pet);
    } else if (e.target.classList.contains('share-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pet = getPets()[index];
        sharePetProfile(pet);
    }
}

function attachProfileActionHandlers() {
    document.addEventListener('click', handleProfileAction);
}

function sharePetProfile(pet) {
    if (navigator.share) {
        navigator.share({
            title: `Pet Profile: ${pet.name}`,
            text: `Check out ${pet.name}'s profile!`,
            url: window.location.href,
        }).then(() => console.log('Shared successfully'))
            .catch(error => console.error('Error sharing:', error));
    } else {
        alert('Sharing not supported on this device');
    }
}

function generatePetQR(pet) {
    alert(`QR code functionality for ${pet.name} will be implemented here.`);
}

// ============ REPORT FUNCTIONS ============
function generatePDF(pet) {
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
            <head>
                <title>Monthly Pet Report: ${pet.name}</title>
                <style>
                    body { font-family: sans-serif; }
                    h1, h2 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
                    .calendar-day { padding: 5px; }
                    .mood-emoji { font-size: 1.5em; }
                    .chart-container { width: 100%; height: 300px; }
                </style>
            </head>
            <body>
                <h1>Monthly Pet Report: ${pet.name}</h1>
                ${generatePetDetails(pet)}
                ${generateExerciseCalendar(pet)}
                ${generateMoodCalendar(pet)}
                ${generateExerciseCharts(pet.exerciseEntries)}
                ${generateExerciseSummary(pet.exerciseEntries)}
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Back to Dashboard</button>
            </body>
        </html>
    `);
    reportWindow.document.close();
}

function generatePetDetails(pet) {
    return `
        <div>
            <h2>Pet Details</h2>
            <p><strong>Name:</strong> ${pet.name}</p>
            <p><strong>Age:</strong> ${pet.age}</p>
            <p><strong>Weight:</strong> ${pet.weight}</p>
        </div>
    `;
}

function generateExerciseCalendar(pet) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let calendarHtml = '<h2>Exercise Calendar</h2><div class="calendar-grid">';
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const hasExercise = pet.exerciseEntries?.some(entry => entry.date === dateStr);
        calendarHtml += `<div class="calendar-day">${day} ${hasExercise ? '✅' : '❌'}</div>`;
    }
    calendarHtml += '</div>';
    return calendarHtml;
}

function generateMoodCalendar(pet) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let moodHtml = '<h2>Mood Calendar</h2><div class="calendar-grid">';
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
        const moodEmoji = moodEntry ? CONFIG.EMOJIS[moodEntry.mood] : '';
        moodHtml += `<div class="calendar-day mood-emoji">${moodEmoji}</div>`;
    }
    moodHtml += '</div>';
    return moodHtml;
}

function generateExerciseCharts(exerciseEntries) {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    const labels = exerciseEntries.map(entry => entry.date);
    const durationData = exerciseEntries.map(entry => entry.duration);
    const caloriesData = exerciseEntries.map(entry => entry.calories);

    return `
        <h2>Exercise Charts</h2>
        <div class="chart-container">
            <canvas id="durationChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="caloriesChart"></canvas>
        </div>
        <script>
            new Chart(document.getElementById('durationChart').getContext('2d'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Duration (minutes)', data: ${JSON.stringify(durationData)}, backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
            new Chart(document.getElementById('caloriesChart').getContext('2d'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Calories Burned', data: ${JSON.stringify(caloriesData)}, backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        </script>
    `;
}

function generateExerciseSummary(exerciseEntries) {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    const totalDays = exerciseEntries.length;
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = exerciseEntries.reduce((sum, entry) => sum + entry.calories, 0);

    return `
        <h2>Exercise Summary</h2>
        <p><strong>Total Days:</strong> ${totalDays}</p>
        <p><strong>Total Duration:</strong> ${totalDuration} minutes</p>
        <p><strong>Total Calories:</strong> ${totalCalories} calories</p>
    `;
}

// ============ EVENT HANDLERS ============
// Set up EVENT DELEGATION for dynamic elements
document.body.addEventListener('click', (e) => {
    if (e.target.matches('#signInButton')) {
        handleSignIn();
    }
    if (e.target.matches('#signOutButton')) {
        handleSignOut();
    }
    if (e.target.matches('#savePetDataButton')) {
        const petData = collectPetData();
        savePetDataHandler(petData);
    }
    if (e.target.matches('#saveUserProfileButton')) {
        const profileData = collectProfileData();
        saveUserProfile(profileData);
    }
});

// Helper function to safely add listeners
function safeAddListener(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.warn(`Element ${selector} not found!`);
    }
}

// Add listeners safely when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    safeAddListener("#signInButton", "click", handleSignIn);
    safeAddListener("#signOutButton", "click", handleSignOut);
    safeAddListener("#savePetDataButton", "click", () => {
        const petData = collectPetData();
        savePetDataHandler(petData);
    });
    safeAddListener("#saveUserProfileButton", "click", () => {
        const profileData = collectProfileData();
        saveUserProfile(profileData);
    });
});







// ============ UI SECTION MANAGEMENT ============
function showAuthenticationPage() {
    document.getElementById('authenticationPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authenticationPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Once the dashboard is shown, initialize its components (your existing initDashboard function)
    initDashboard();
}

// ============ INITIALIZE THE APP ============
// This function starts everything. Call this when the page loads.
function initDashboard() {
    console.log("App initializing...");
    
    // 1. Check if a user is already signed in (You will add Firebase logic here later)
    const userIsSignedIn = false; // CHANGE THIS LATER TO REAL CHECK
    
    // 2. Show the correct page based on sign-in status
    if (userIsSignedIn) {
        showDashboard();
    } else {
        showAuthenticationPage();
    }
    
    // 3. Apply saved theme, register service worker, etc.
    if (typeof applySavedTheme === 'function') applySavedTheme();
    if (typeof registerServiceWorker === 'function') registerServiceWorker();
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
// ============ INITIALIZATION ============
function initDashboard() {
    console.log('Dashboard Initialized');
    renderSavedProfiles();
    renderPetForm();
    renderCalendar();
    renderMoodLogs();
    renderCharts();
}



