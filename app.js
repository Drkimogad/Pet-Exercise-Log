/* =======================================
   Global Variables & Constants
   ======================================= */
let editingProfileIndex = null;
let db = null; // IndexedDB instance
const SALT = "YourUniqueSaltValue"; // Change this to a more unique value in production

/* =======================================
   Section: Security & Utility Functions
   ======================================= */

// Simple input sanitization to prevent XSS (consider using a library like DOMPurify for robust cases)
function sanitize(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Hash the password using SHA-256 with a salt
async function hashPassword(password, salt = SALT) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/* =======================================
   Section: IndexedDB Operations
   ======================================= */

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('petExerciseDB', 1);
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('petProfiles')) {
        db.createObjectStore('petProfiles', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
      reject(event);
    };
  });
}

function addPetProfile(profile) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    const request = store.add(profile);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function updatePetProfile(id, profile) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    profile.id = id; // ensure we maintain the same id
    const request = store.put(profile);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function deletePetProfile(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function getAllProfiles() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readonly');
    const store = transaction.objectStore('petProfiles');
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
}

/* =======================================
   Section: Authentication (Sign Up / Sign In)
   ======================================= */

// Basic function to swap pages by updating the main container's innerHTML
function showPage(pageHTML) {
  document.getElementById('app').innerHTML = pageHTML;
}

function isLoggedIn() {
  return sessionStorage.getItem('user') !== null;
}

function showSignUp() {
  const signUpPage = `
    <header style="background-color: #ADD8E6;">Pet Exercise Log</header>
    <div id="content">
      <blockquote>
        <p>Regular exercise is vital for your pet's health, supporting a healthy weight, flexibility, and mental well-being.</p>
      </blockquote>
      <h3>Please sign in or sign up to start tracking your pet's activities.</h3>
    </div>
    <div id="formContainer">
      <h1>Sign Up</h1>
      <form id="signUpForm">
        <label for="signUpUsername">Username:</label>
        <input type="text" id="signUpUsername" required><br><br>
        <label for="signUpPassword">Password:</label>
        <input type="password" id="signUpPassword" required><br><br>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="#" id="goToSignIn">Sign In</a></p>
    </div>
  `;
  showPage(signUpPage);

  document.getElementById('signUpForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = sanitize(document.getElementById('signUpUsername').value);
    const passwordRaw = document.getElementById('signUpPassword').value;
    const password = await hashPassword(passwordRaw);

    if (username && password) {
      sessionStorage.setItem('user', JSON.stringify({ username, password }));
      alert('Sign up successful!');
      showSignIn();
    } else {
      alert('Please fill in all fields.');
    }
  });

  document.getElementById('goToSignIn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignIn();
  });
}

function showSignIn() {
  const signInPage = `
    <header style="background-color: #ADD8E6;">Pet Exercise Log</header>
    <div id="content">
      <blockquote>
        <p>Regular exercise is vital for your pet's health, supporting a healthy weight, flexibility, and mental well-being.</p>
      </blockquote>
      <h3>Please sign in or sign up to start tracking your pet's activities.</h3>
    </div>
    <div id="formContainer">
      <h1>Sign In</h1>
      <form id="signInForm">
        <label for="signInUsername">Username:</label>
        <input type="text" id="signInUsername" required><br><br>
        <label for="signInPassword">Password:</label>
        <input type="password" id="signInPassword" required><br><br>
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="goToSignUp">Sign Up</a></p>
    </div>
  `;
  showPage(signInPage);

  document.getElementById('signInForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = sanitize(document.getElementById('signInUsername').value);
    const passwordRaw = document.getElementById('signInPassword').value;
    const password = await hashPassword(passwordRaw);
    const user = JSON.parse(sessionStorage.getItem('user'));

    if (user && user.username === username && user.password === password) {
      alert('Sign in successful!');
      showExerciseLog();
    } else {
      alert('Invalid credentials, please try again.');
    }
  });

  document.getElementById('goToSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    showSignUp();
  });
}

/* =======================================
   Section: Calendar Generation
   ======================================= */

function generateCalendar() {
  const calendarDiv = document.getElementById('exerciseCalendar');
  if (!calendarDiv) return;
  calendarDiv.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    dayDiv.innerHTML = `<label>${i}</label><input type="checkbox" id="day${i}">`;
    if (i % 7 === 0) {
      calendarDiv.appendChild(document.createElement('br'));
    }
    calendarDiv.appendChild(dayDiv);
  }
}

/* =======================================
   Section: Chart.js Rendering
   ======================================= */

// Renders the exercise graph using Chart.js with aggregated data from IndexedDB
async function renderExerciseGraph() {
  const profiles = await getAllProfiles();
  const data = profiles.map(profile => parseInt(profile.exerciseDuration, 10) || 0);
  const labels = profiles.map((profile, index) => `Entry ${index + 1}`);
  const canvas = document.getElementById('exerciseChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (window.exerciseChart instanceof Chart) {
    window.exerciseChart.destroy();
  }

  window.exerciseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Exercise Duration (min)',
        data,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { enabled: true },
        legend: { display: true }
      },
      scales: {
        x: { title: { display: true, text: 'Entries' } },
        y: { title: { display: true, text: 'Duration (min)' } }
      }
    }
  });
}

/* =======================================
   Section: Monthly Exercise Report
   ======================================= */

// Aggregates profiles by month and displays a report
async function generateMonthlyReport() {
  const profiles = await getAllProfiles();
  const report = {};

  profiles.forEach(profile => {
    const date = new Date(profile.exerciseDate);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!report[month]) {
      report[month] = { totalDuration: 0, sessions: [] };
    }
    report[month].totalDuration += parseInt(profile.exerciseDuration, 10) || 0;
    report[month].sessions.push(profile);
  });

  displayReport(report);
}

function displayReport(report) {
  const reportContainer = document.getElementById('monthlyReport');
  if (!reportContainer) return;
  reportContainer.innerHTML = '';

  Object.keys(report).forEach(month => {
    const { totalDuration, sessions } = report[month];
    const monthSection = document.createElement('div');
    monthSection.classList.add('report-month');
    monthSection.innerHTML = `
      <h2>${month}</h2>
      <p>Total Duration: ${totalDuration} minutes</p>
      <p>Number of Sessions: ${sessions.length}</p>
      <ul>
        ${sessions.map(session => `<li>${sanitize(session.petName)}: ${sanitize(session.exerciseType)} on ${sanitize(session.exerciseDate)} (${sanitize(session.exerciseDuration) || 0} min)</li>`).join('')}
      </ul>
      <hr>
    `;
    reportContainer.appendChild(monthSection);
  });
}

/* =======================================
   Section: Main App Functions (Exercise Log & More)
   ======================================= */

function showExerciseLog() {
  if (!isLoggedIn()) {
    alert('Please sign in first.');
    showSignIn();
    return;
  }

  const exerciseLogPage = `
    <header style="background-color: #ADD8E6;">Pet Exercise Tracker</header>
    <div id="content">
      <form id="exerciseForm">
        <label for="petName">Pet Name:</label>
        <input type="text" id="petName" required>
        
        <label for="petImage">Upload Pet Image:</label>
        <input type="file" id="petImage" accept="image/*">
        <img id="petImagePreview" style="max-width: 100px;" />
        
        <label for="petCharacteristics">Characteristics:</label>
        <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament"></textarea>
        
        <label for="exerciseType">Type of Exercise:</label>
        <input type="text" id="exerciseType" placeholder="e.g., Walking, Running" required>
        
        <label for="exerciseDuration">Duration (minutes):</label>
        <input type="text" id="exerciseDuration" placeholder="e.g., 30 minutes" required>
        
        <label for="exerciseDate">Date:</label>
        <input type="date" id="exerciseDate" required>
        
        <label for="bodyconditionScoring">Body Condition Scoring:</label>
        <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean" required>
        
        <label for="exerciseTime">Time:</label>
        <input type="time" id="exerciseTime" required>
        
        <label for="exerciseIntensity">Intensity Level:</label>
        <select id="exerciseIntensity" required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        
        <label for="caloriesBurned">Calories Burned (optional):</label>
        <input type="number" id="caloriesBurned" placeholder="e.g., 150 calories">
        
        <label for="exerciseNotes">Notes/Comments:</label>
        <textarea id="exerciseNotes" placeholder="Any observations or details"></textarea>
        
        <label for="exerciseLocation">Location (optional):</label>
        <input type="text" id="exerciseLocation" placeholder="e.g., Park">
        
        <div id="exerciseCalendar"></div>
        
        <h2>Exercise Summary</h2>
        <canvas id="exerciseChart"></canvas>
        
        <button type="submit">${editingProfileIndex === null ? "Add Exercise" : "Update Exercise"}</button>
      </form>
      <div id="savedProfilesContainer">
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
      </div>
      <div id="monthlyReportContainer">
        <h1>Monthly Exercise Report</h1>
        <div id="monthlyReport"></div>
        <button id="generateReport">Generate Report</button>
      </div>
      <button id="logoutButton">Logout</button>
    </div>
    <footer style="background-color: #D3D3D3;">&copy; 2025 Pet Exercise Log</footer>
  `;
  showPage(exerciseLogPage);

  // Attach event for exercise form submission (add/update)
  const exerciseForm = document.getElementById('exerciseForm');
  exerciseForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Retrieve and sanitize form values
    const petName = sanitize(document.getElementById('petName').value);
    const petImage = document.getElementById('petImagePreview').src || '';
    const petCharacteristics = sanitize(document.getElementById('petCharacteristics').value);
    const exerciseType = sanitize(document.getElementById('exerciseType').value);
    const exerciseDuration = sanitize(document.getElementById('exerciseDuration').value);
    const exerciseDate = sanitize(document.getElementById('exerciseDate').value);
    const bodyconditionScoring = sanitize(document.getElementById('bodyconditionScoring').value);
    const exerciseTime = sanitize(document.getElementById('exerciseTime').value);
    const exerciseIntensity = sanitize(document.getElementById('exerciseIntensity').value);
    const caloriesBurned = sanitize(document.getElementById('caloriesBurned').value);
    const exerciseNotes = sanitize(document.getElementById('exerciseNotes').value);
    const exerciseLocation = sanitize(document.getElementById('exerciseLocation').value);

    const newProfile = {
      petName,
      petImage,
      petCharacteristics,
      exerciseType,
      exerciseDuration,
      exerciseDate,
      bodyconditionScoring,
      exerciseTime,
      exerciseIntensity,
      caloriesBurned,
      exerciseNotes,
      exerciseLocation
    };

    // Check if adding a new profile or updating an existing one
    if (editingProfileIndex === null) {
      await addPetProfile(newProfile);
      alert('Exercise added successfully!');
    } else {
      const profiles = await getAllProfiles();
      const profileToEdit = profiles[editingProfileIndex];
      if (profileToEdit) {
        await updatePetProfile(profileToEdit.id, newProfile);
        alert('Exercise updated successfully!');
        editingProfileIndex = null;
      }
    }

    // Refresh the list and chart
    loadSavedProfiles();
    renderExerciseGraph();
    exerciseForm.reset();
  });

  // Logout functionality
  document.getElementById('logoutButton').addEventListener('click', function () {
    sessionStorage.removeItem('user');
    alert('You have been logged out.');
    showSignIn();
  });

  // Pet image preview functionality
  const petImageInput = document.getElementById('petImage');
  const petImagePreview = document.getElementById('petImagePreview');
  petImageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      petImagePreview.src = e.target.result;
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  });

  // Generate the calendar and attach event for report generation
  generateCalendar();
  document.getElementById('generateReport').addEventListener('click', generateMonthlyReport);

  // Load saved profiles and render chart
  loadSavedProfiles();
  renderExerciseGraph();
}

async function loadSavedProfiles() {
  const profiles = await getAllProfiles();
  const savedProfilesDiv = document.getElementById('savedProfiles');
  if (!savedProfilesDiv) return;
  savedProfilesDiv.innerHTML = '';

  profiles.forEach((profile, index) => {
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile-entry');
    profileDiv.innerHTML = `
      <h3>${sanitize(profile.petName)}</h3>
      <img src="${profile.petImage}" alt="Pet Image" style="max-width: 100px;" />
      <p>${sanitize(profile.petCharacteristics)}</p>
      <p>Type: ${sanitize(profile.exerciseType)}</p>
      <p>Duration: ${sanitize(profile.exerciseDuration)} min</p>
      <p>Date: ${sanitize(profile.exerciseDate)}</p>
      <p>Body Condition Scoring: ${sanitize(profile.bodyconditionScoring)}</p>
      <p>Time: ${sanitize(profile.exerciseTime)}</p>
      <p>Intensity: ${sanitize(profile.exerciseIntensity)}</p>
      <p>Calories Burned: ${sanitize(profile.caloriesBurned)}</p>
      <p>Notes: ${sanitize(profile.exerciseNotes)}</p>
      <p>Location: ${sanitize(profile.exerciseLocation)}</p>
      <button class="deleteProfile" data-index="${index}">Delete</button>
      <button class="printProfile" data-index="${index}">Print</button>
      <button class="editProfile" data-index="${index}">Edit</button>
    `;
    savedProfilesDiv.appendChild(profileDiv);
  });

  // Attach events for delete, print, and edit actions
  document.querySelectorAll('.deleteProfile').forEach(button => {
    button.addEventListener('click', async function () {
      const index = parseInt(this.getAttribute('data-index'));
      const profiles = await getAllProfiles();
      const profileToDelete = profiles[index];
      if (profileToDelete) {
        await deletePetProfile(profileToDelete.id);
        loadSavedProfiles();
        renderExerciseGraph();
      }
    });
  });

  document.querySelectorAll('.printProfile').forEach(button => {
    button.addEventListener('click', async function () {
      const index = parseInt(this.getAttribute('data-index'));
      const profiles = await getAllProfiles();
      const profile = profiles[index];
      const printWindow = window.open('', '', 'width=600,height=400');
      printWindow.document.write(`<h1>${sanitize(profile.petName)}</h1>`);
      printWindow.document.write(`<img src="${profile.petImage}" alt="Pet Image" style="max-width: 100px;" />`);
      printWindow.document.write(`<p>${sanitize(profile.petCharacteristics)}</p>`);
      printWindow.document.write(`<p>Type: ${sanitize(profile.exerciseType)}</p>`);
      printWindow.document.write(`<p>Duration: ${sanitize(profile.exerciseDuration)} min</p>`);
      printWindow.document.write(`<p>Date: ${sanitize(profile.exerciseDate)}</p>`);
      printWindow.document.write(`<p>Body Condition Scoring: ${sanitize(profile.bodyconditionScoring)}</p>`);
      printWindow.document.write(`<p>Time: ${sanitize(profile.exerciseTime)}</p>`);
      printWindow.document.write(`<p>Intensity: ${sanitize(profile.exerciseIntensity)}</p>`);
      printWindow.document.write(`<p>Calories Burned: ${sanitize(profile.caloriesBurned)}</p>`);
      printWindow.document.write(`<p>Notes: ${sanitize(profile.exerciseNotes)}</p>`);
      printWindow.document.write(`<p>Location: ${sanitize(profile.exerciseLocation)}</p>`);
      printWindow.document.write('<br><button onclick="window.print()">Print</button>');
    });
  });

  document.querySelectorAll('.editProfile').forEach(button => {
    button.addEventListener('click', async function () {
      const index = parseInt(this.getAttribute('data-index'));
      const profiles = await getAllProfiles();
      const profile = profiles[index];
      if (profile) {
        document.getElementById('petName').value = profile.petName;
        document.getElementById('petCharacteristics').value = profile.petCharacteristics;
        document.getElementById('exerciseType').value = profile.exerciseType;
        document.getElementById('exerciseDuration').value = profile.exerciseDuration;
        document.getElementById('exerciseDate').value = profile.exerciseDate;
        document.getElementById('bodyconditionScoring').value = profile.bodyconditionScoring;
        document.getElementById('exerciseTime').value = profile.exerciseTime;
        document.getElementById('exerciseIntensity').value = profile.exerciseIntensity;
        document.getElementById('caloriesBurned').value = profile.caloriesBurned;
        document.getElementById('exerciseNotes').value = profile.exerciseNotes;
        document.getElementById('exerciseLocation').value = profile.exerciseLocation;
        // Optionally update the image preview here if needed
        editingProfileIndex = index;
        document.querySelector('#exerciseForm button[type="submit"]').textContent = "Update Exercise";
      }
    });
  });
}

/* =======================================
   Section: Service Worker & Connectivity
   ======================================= */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        registration.update();
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('A new version of the app is available. Would you like to update?')) {
                installingWorker.postMessage({ action: 'skipWaiting' });
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  });
}

window.addEventListener('online', () => {
  console.log('You are online');
  location.reload();
});

window.addEventListener('offline', () => {
  console.log('You are offline');
  alert('It seems like you\'re not connected to the internet. Please check your connection');
});

/* =======================================
   Section: App Initialization
   ======================================= */

async function initApp() {
  await initDB();
  if (isLoggedIn()) {
    showExerciseLog();
  } else {
    showSignIn();
  }
}

initApp();
