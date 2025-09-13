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
let durationChart, caloriesChart, activityChart, intensityChart;

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
    // Hide auth and show dashboard
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('lottie-banner').style.display = 'none';
    document.querySelector('.dashboard-container').style.display = 'block';

    // Show saved profiles, hide the form container initially
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('profileContainer').style.display = 'none';
    
    loadSavedProfiles();
    setupEventListeners();
}


// Setup event listeners
function setupEventListeners() {
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.getElementById('addNewProfileButton').addEventListener('click', showCreateProfile);
    document.getElementById('toggleModeButton').addEventListener('click', toggleDarkMode);
}

// Show create profile to show the profile form when "New Profile" is clicked
function showCreateProfile() {
    // Hide saved profiles, show form container
    document.getElementById('savedProfiles').style.display = 'none';
    document.getElementById('profileContainer').style.display = 'block';
    
    // Load the profile form template
    const template = document.getElementById('profileFormTemplate');
    document.getElementById('profileContainer').innerHTML = template.innerHTML;
    
    // Set up form submission handler
    document.getElementById('completeProfileForm').addEventListener('submit', handleProfileSubmit);
    
    // Set up cancel button
    document.getElementById('cancelButton').addEventListener('click', function() {
        document.getElementById('savedProfiles').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'none';
        document.getElementById('profileContainer').innerHTML = '';
    });
    
    // Set today's date as default for exercise
    document.getElementById('exerciseDate').value = new Date().toISOString().split('T')[0];
    
    // Initialize empty charts, calendar, and mood tracker
    initializeEmptyDashboard();
}

function handleProfileSubmit(e) {
    e.preventDefault();
    // This will handle collecting ALL data and updating everything
    console.log('Profile form submitted - will process all data');
    // We'll implement this function next
}

function initializeEmptyDashboard() {
    // Initialize empty charts
    initializeEmptyCharts();
    
    // Initialize empty calendar
    initializeEmptyCalendar();
    
    // Initialize empty mood tracker
    initializeEmptyMoodTracker();
}

// Handle form submit
function handleFormSubmit(e) {
    e.preventDefault();
    // Your form handling logic here
        console.log('FORM SUBMIT CALLED!'); // ← Add this line

    // Collect all form data
    pets = PetEntry.getPets(); // ← FIXED
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
        // Validate required fields Validation code
    const errors = [];
    if (!formData.petType) errors.push('Pet type is required');
    if (!formData.petName.trim()) errors.push('Pet name is required');
    if (formData.duration < 1) errors.push('Invalid duration');
    if (formData.calories < 1) errors.push('Invalid calories');
    if (errors.length) return AppHelper.showErrors(errors);

 //   pets = getPets();
    const petData = activePetIndex !== null ? pets[activePetIndex] : initializeNewPet();
      // it retrieves everything via the helper

    // Update pet details with all form fields data processing
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

// AFTER SUCCESSFUL SAVE:
localStorage.setItem('pets', JSON.stringify(pets));
sessionStorage.setItem('activePetIndex', activePetIndex);

// Return to view profiles state - USING UI STATE
setUIState(UIState.VIEW_PROFILES); // ← ONLY THIS LINE

// Refresh and show success
loadSavedProfiles();
AppHelper.showError('Profile saved successfully!');
updateDashboard(petData);
}

// ===============================================
//  Load saved profiles
//==========================================
function loadSavedProfiles() {
    pets = getPets();
    if (pets.length === 0) {
        document.getElementById('savedProfiles').innerHTML = `
            <div class="no-profiles-message">
                <p>No saved profiles yet. Click "New Profile" to create one!</p>
            </div>`;
        return;
    }
    // Your profiles rendering logic here
    
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



// Get pets from localStorage
function getPets() {
    return JSON.parse(localStorage.getItem('pets') || '[]');
}

// Logout function
//function logout() {
  //  sessionStorage.removeItem('user');
//    window.location.href = 'index.html';
//}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('petImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Mood Logs functionality
function renderMoodLogs() {
    if (activePetIndex === null) return;
    
    const pets = getPets();
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
    
    const moodContainer = document.getElementById('moodLogsContainer');
    if (moodContainer) {
        moodContainer.innerHTML = html;
        
        // Add event listeners
        moodContainer.addEventListener('click', handleMoodSelection);
        
        // Highlight today's mood if already logged
        const todayMood = moodLogs.find(log => log.date === today);
        if (todayMood) {
            const todayBtn = moodContainer.querySelector(`.emoji-btn[data-mood="${todayMood.mood}"]`);
            if (todayBtn) todayBtn.classList.add('selected');
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
    if (e.target.classList.contains('emoji-btn') || e.target.closest('.emoji-btn')) {
        const btn = e.target.classList.contains('emoji-btn') ? 
                   e.target : e.target.closest('.emoji-btn');
        
        const moodValue = parseInt(btn.dataset.mood);
        const date = btn.dataset.date;
        
        if (activePetIndex === null) return;
        
        const pets = getPets();
        let pet = { ...pets[activePetIndex] };
        
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
        
        // Update pets array and save
        pets[activePetIndex] = pet;
        localStorage.setItem('pets', JSON.stringify(pets));
        
        // Update UI
        document.querySelectorAll('.emoji-btn').forEach(btn => 
            btn.classList.remove('selected')
        );
        btn.classList.add('selected');
        
        // Re-render mood logs
        renderMoodLogs();
    }
}

// Calendar functionality
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let exerciseData = [];

function initCalendar(selector) {
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
    addCalendarEventListeners();
}

function addCalendarEventListeners() {
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
        if (activePetIndex !== null) {
            const pets = getPets();
            const pet = pets[activePetIndex];
            pet.exerciseEntries.push({
                date: e.target.dataset.date,
                exerciseType: 'walking',
                duration: 30,
                caloriesBurned: 150,
                intensity: 'medium'
            });
            localStorage.setItem('pets', JSON.stringify(pets));
            refreshCalendar(pet.exerciseEntries);
        }
        document.querySelector('.calendar-modal').remove();
    });
    
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        document.querySelector('.calendar-modal').remove();
    });
}

function refreshCalendar(data) {
    exerciseData = data || [];
    generateCalendar();
}



// Charts functionality
let durationChart, caloriesChart, activityChart, intensityChart;

function initCharts(selector) {
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

function refreshCharts(data) {
    if (!data || !data.length) return;
    destroyCharts();
    
    const processed = processChartData(data);
    createDurationChart(processed);
    createActivityChart(processed);
    createCaloriesChart(processed);
    createIntensityChart(processed);
}

function processChartData(data) {
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
                tension: 0.3
            }]
        }
    });
}

function createActivityChart(data) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
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
        }
    });
}

function destroyCharts() {
    if (durationChart) durationChart.destroy();
    if (activityChart) activityChart.destroy();
    if (caloriesChart) caloriesChart.destroy();
    if (intensityChart) intensityChart.destroy();
}

function updateChartColors() {
    const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#374151';
    Chart.defaults.color = textColor;
    if (durationChart) durationChart.update();
    if (activityChart) activityChart.update();
    if (caloriesChart) caloriesChart.update();
    if (intensityChart) intensityChart.update();
}


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
    `;
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
        moodHtml += '<div class="calendar-day'></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
        const moodEmoji = moodEntry ? MOOD_EMOJIS[moodEntry.mood] || '❓' : '';
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

// added for later
function updateDashboard(exerciseData) {
    // 1. Update Calendar
    updateCalendar(exerciseData);
    
    // 2. Update Mood Logs (for the selected date)
    updateMoodLogs(exerciseData.date);
    
    // 3. Update All Charts
    updateCharts(exerciseData);
}

// Helper function for Calendar
function updateCalendar(exerciseData) {
    const calendar = document.getElementById('exerciseCalendar');
    if (!calendar) return;
    
    // Find the calendar day for this exercise date
    const dayElement = calendar.querySelector(`[data-date="${exerciseData.date}"]`);
    if (dayElement) {
        // Add exercise indicator to this day
        if (!dayElement.querySelector('.exercise-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'exercise-indicator';
            indicator.textContent = '✅'; // Or use CSS styles
            dayElement.appendChild(indicator);
        }
    }
}

// Helper function for Mood Logs
function updateMoodLogs(exerciseDate) {
    const moodContainer = document.getElementById('moodLogsContainer');
    if (!moodContainer) return;
    
    // Highlight or enable mood selection for this date
    const moodEntry = moodContainer.querySelector(`[data-date="${exerciseDate}"]`);
    if (moodEntry) {
        moodEntry.classList.add('active-date');
    }
}

// Helper function for Charts
function updateCharts(exerciseData) {
    // Get current chart data or initialize
    let chartData = JSON.parse(localStorage.getItem('chartData')) || {
        dates: [],
        durations: [],
        calories: [],
        activities: []
    };
    
    // Add new exercise data
    chartData.dates.push(exerciseData.date);
    chartData.durations.push(exerciseData.duration);
    chartData.calories.push(exerciseData.caloriesBurned);
    chartData.activities.push(exerciseData.exerciseType);
    
    // Save updated data
    localStorage.setItem('chartData', JSON.stringify(chartData));
    
    // Refresh all charts
    refreshCharts(chartData);
}

//============================================

