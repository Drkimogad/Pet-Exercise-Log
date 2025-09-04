
// Set up EVENT DELEGATION for dynamic elements
document.body.addEventListener('click', (e) => {
  // Handle click events for dynamically added buttons
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
// Add this wrapper around your event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Helper function to safely add listeners
  function safeAddListener(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element ${selector} not found!`);
    }
  }

  // Add listeners safely
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

// 2 

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
// 5
//* MOODLOGS*//
const MoodLogs = (function() {
  const CONFIG = {
    EMOJIS: ['😀', '😐', '😞', '😊', '😠']
  };

  const renderMoodLogs = () => {
    const activePet = dataService.getActivePet();
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
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateStr;
    }
  };

  const handleMoodSelection = (e) => {
    if (e.target.classList.contains('emoji-btn')) {
      const mood = parseInt(e.target.dataset.mood);
      const date = e.target.dataset.date;
      const activePetIndex = dataService.getActivePetIndex();
      const pets = dataService.getPets();
      if (activePetIndex !== null && pets[activePetIndex]) {
        let pet = { ...pets[activePetIndex] }; // Create a copy
        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
        pet.moodLogs.push({ date, mood });
        pets[activePetIndex] = pet;
        dataService.savePets(pets);
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        renderMoodLogs();
      }
    }
  };

  const attachMoodSelectionHandler = () => {
    document.addEventListener('click', handleMoodSelection);
  };

  return {
    renderMoodLogs: renderMoodLogs
  };
})();
export { MoodLogs };


//3 
//* Calendar *//
const Calendar = (function() {
  const renderCalendar = () => {
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
  };

  const updateCalendar = () => {
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
      const activePet = dataService.getActivePet();
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
  };

  const attachCalendarNavigationHandlers = () => {
    document.getElementById('prevMonth')?.addEventListener('click', updateCalendar);
    document.getElementById('nextMonth')?.addEventListener('click', updateCalendar);
  };

  return {
    renderCalendar: renderCalendar
  };
})();

export { Calendar };
// 4
//* Charts *//
const Charts = (function() {
  const renderCharts = () => {
    const activePet = dataService.getActivePet();
    const exerciseEntries = activePet?.exerciseEntries || [];
    document.getElementById('exerciseCharts').innerHTML = `<canvas id="exerciseChart"></canvas>`;
    initCharts(exerciseEntries);
  };

  const initCharts = (exerciseEntries) => {
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: prepareChartData(exerciseEntries),
      options: getChartOptions()
    });
  };

  const prepareChartData = (exerciseEntries) => {
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
  };

  const getChartOptions = () => {
    return {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  };

  const updateChartColors = () => {
    // Implement logic to update chart colors based on theme
    // Example:
    // if (document.body.classList.contains('dark-mode')) {
    //   // Update colors for dark mode
    // } else {
    //   // Update colors for light mode
    // }
  };

  return {
    renderCharts: renderCharts,
    updateChartColors: updateChartColors
  };
})();
export { Charts };

//6 
// SavedProfiles.js

const SavedProfiles = (function() {
  // Function to get the list of pets from localStorage
  const getPets = () => {
    try {
      const pets = JSON.parse(localStorage.getItem('petData'));
      return pets || []; // Return an empty array if no pets are saved
    } catch (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
  };

  // Function to save the list of pets to localStorage
  const savePets = (pets) => {
    try {
      localStorage.setItem('petData', JSON.stringify(pets));
    } catch (error) {
      console.error('Error saving pets:', error);
    }
  };

  // Function to get the active pet index from localStorage
  const getActivePetIndex = () => {
    try {
      return parseInt(localStorage.getItem('activePetIndex')) || null;
    } catch (error) {
      console.error('Error fetching active pet index:', error);
      return null;
    }
  };

  // Function to set the active pet index in localStorage
  const setActivePetIndex = (index) => {
    try {
      localStorage.setItem('activePetIndex', index);
    } catch (error) {
      console.error('Error setting active pet index:', error);
    }
  };

  // Function to render saved pet profiles
  const renderSavedProfiles = () => {
    const pets = getPets();
    const activePetIndex = getActivePetIndex();
    
    // Render the HTML structure for each pet profile
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

    // Attach event handlers for profile actions like edit, delete, etc.
    attachProfileActionHandlers();
  };

  // Function to handle profile actions (Edit, Delete, etc.)
  const handleProfileAction = (e) => {
    if (e.target.classList.contains('edit-btn')) {
      const index = parseInt(e.target.dataset.index);
      setActivePetIndex(index);
      PetFormSection.renderPetForm(getPets()[index]);
    } else if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pets = getPets();
      if (confirm(`Delete ${pets[index].name}?`)) {
        pets.splice(index, 1); // Remove the pet at the specified index
        savePets(pets); // Save updated list to localStorage
        renderSavedProfiles(); // Re-render the saved profiles
        if (getActivePetIndex() === index) {
          setActivePetIndex(null); // Clear active pet if it was the deleted one
          PetFormSection.renderPetForm(); // Render an empty form
        }
      }
    } else if (e.target.classList.contains('qr-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      generatePetQR(pet);
    } else if (e.target.classList.contains('print-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      ReportGenerator.generatePDF(pet);
    } else if (e.target.classList.contains('share-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      sharePetProfile(pet);
    }
  };

  // Function to attach event handlers for profile actions
  const attachProfileActionHandlers = () => {
    document.addEventListener('click', handleProfileAction);
  };

  // Function to share a pet profile using the Web Share API
  const sharePetProfile = (pet) => {
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
  };

  // Placeholder for QR code generation function (using a QR code library)
  const generatePetQR = (pet) => {
    alert(`QR code functionality for ${pet.name} will be implemented here.`);
    // You would use a library like qrcode.js to generate the QR code here
  };

  return {
    renderSavedProfiles: renderSavedProfiles
  };
})();

//7 monthly report
export { SavedProfiles };
const CONFIG = {
  EMOJIS: ['😀', '😐', '😞', '😊', '😠'] // Ensure this is consistent with other modules
};

const Report = (function() {
  const generatePDF = (pet) => {
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
  };

  const generatePetDetails = (pet) => {
    return `
      <div>
        <h2>Pet Details</h2>
        <p><strong>Name:</strong> ${pet.name}</p>
        <p><strong>Age:</strong> ${pet.age}</p>
        <p><strong>Weight:</strong> ${pet.weight}</p>
      </div>
    `;
  };

  const generateExerciseCalendar = (pet) => {
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
  };

  const generateMoodCalendar = (pet) => {
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
  };

  const generateExerciseCharts = (exerciseEntries) => {
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
  };

  const generateExerciseSummary = (exerciseEntries) => {
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
  };

  return {
    generatePDF: generatePDF
  };
})();
export { Report };
