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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('user')) {
        showExerciseLog();
    }
});

// Dashboard template
function dashboardTemplate() {
    return `
    <div class="dashboard-container">
        <header class="dashboard-header">
            <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
            <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
            <button id="logoutButton" class="icon-btn">🚪 Logout</button>
        </header>
        
        <main class="dashboard-main">
            <section class="form-section" id="petFormContainer"></section>
            
            <section class="data-section">
                <div class="component-container">
                    <h3>Exercise Calendar</h3>
                    <div id="exerciseCalendar"></div>
                </div>
                
                <div class="component-container">
                    <h3>Mood Tracker</h3>
                    <div id="moodLogsContainer"></div>
                </div>
                
                <div class="charts-container">
                    <div class="chart-container">
                        <h3>Duration</h3>
                        <canvas id="durationChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Calories Burned</h3>
                        <canvas id="caloriesChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Intensity Distribution</h3>
                        <canvas id="intensityChart"></canvas>
                    </div>
                </div>
            </section>
        </main>
        
        <aside class="saved-profiles" id="savedProfiles"></aside>
    </div>`;
}

// Pet form template
function petFormTemplate(pet = {}) {
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
            
            <!-- Rest of your form fields here -->
            
            <div class="create-profile-btn-container">
                <button type="submit" class="primary-btn">
                    ${activePetIndex === null ? 'Create Complete Profile' : 'Update Profile'}
                </button>
            </div>
        </fieldset>
    </form>`;
}

// Show exercise log
function showExerciseLog() {
    document.getElementById('app').innerHTML = dashboardTemplate();
    document.getElementById('lottie-banner').style.display = 'none';
    document.querySelector('.dashboard-main').style.display = 'none';
    document.getElementById('savedProfiles').style.display = 'block';
    loadSavedProfiles();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.getElementById('addNewProfileButton').addEventListener('click', showCreateProfile);
    document.getElementById('toggleModeButton').addEventListener('click', toggleDarkMode);
}

// Show create profile
function showCreateProfile() {
    activePetIndex = null;
    document.querySelector('.dashboard-main').style.display = 'flex';
    document.getElementById('savedProfiles').style.display = 'block';
    document.getElementById('petFormContainer').innerHTML = petFormTemplate();
    
    document.getElementById('exerciseForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('petImage').addEventListener('change', handleImageUpload);
}

// Handle form submit
function handleFormSubmit(e) {
    e.preventDefault();
    // Your form handling logic here
}

// Load saved profiles
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
}

// Get pets from localStorage
function getPets() {
    return JSON.parse(localStorage.getItem('pets') || '[]');
}

// Logout function
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
}

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

