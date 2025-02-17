"use strict";

/* ============================================================
   GLOBAL VARIABLES & STATE MANAGEMENT
============================================================ */
let editingProfileIndex = null; // Tracks whether we're editing an existing profile

/* ============================================================
   USER AUTHENTICATION (Persistent using localStorage)
============================================================ */
window.onload = function() {
  showSignIn();
};

function isLoggedIn() {
  return localStorage.getItem('user') !== null;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/* ============================================================
   AUTHENTICATION PAGES: SIGN-UP & SIGN-IN
============================================================ */
function showSignUp() {
  const signUpPage = `
    <div id="signup">
      <h1>Sign Up</h1>
      <form id="signUpForm">
        <label for="signUpUsername">Username:</label>
        <input type="text" id="signUpUsername" required>
        <br><br>
        <label for="signUpPassword">Password:</label>
        <input type="password" id="signUpPassword" required>
        <br><br>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="#" id="goToSignIn">Sign In</a></p>
    </div>
  `;
  showPage(signUpPage);

  document.getElementById('signUpForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const username = document.getElementById('signUpUsername').value;
      const passwordRaw = document.getElementById('signUpPassword').value;
      const password = await hashPassword(passwordRaw);
      if (username && password) {
        localStorage.setItem('user', JSON.stringify({ username, password }));
        alert('Sign up successful!');
        showSignIn();
      } else {
        alert('Please fill in all fields.');
      }
    } catch (err) {
      console.error('Error during sign up:', err);
    }
  });

  document.getElementById('goToSignIn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignIn();
  });
}

function showSignIn() {
  const signInPage = `
    <div id="signin">
      <h1>Sign In</h1>
      <form id="signInForm">
        <label for="signInUsername">Username:</label>
        <input type="text" id="signInUsername" required>
        <br><br>
        <label for="signInPassword">Password:</label>
        <input type="password" id="signInPassword" required>
        <br><br>
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="goToSignUp">Sign Up</a></p>
    </div>
  `;
  showPage(signInPage);

  document.getElementById('signInForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const username = document.getElementById('signInUsername').value;
      const passwordRaw = document.getElementById('signInPassword').value;
      const password = await hashPassword(passwordRaw);
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.username === username && user.password === password) {
        alert('Sign in successful!');
        showExerciseLog();
      } else {
        alert('Invalid credentials, please try again.');
      }
    } catch (err) {
      console.error('Error during sign in:', err);
    }
  });

  document.getElementById('goToSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    showSignUp();
  });
}

/* ============================================================
   DASHBOARD / EXERCISE LOG PAGE
   [Dashboard now uses two charts (duration & calories) from the monthly report]
============================================================ */
function showExerciseLog() {
  if (!isLoggedIn()) {
    alert('Please sign in first.');
    showSignIn();
    return;
  }

  const exerciseLogPage = `
    <div id="exerciseLog">
      <h1>Pet Exercise Tracker</h1>
      <form id="exerciseForm">
        <label for="petName">Pet Name:</label>
        <input type="text" id="petName" required>
        <br>
        <label for="petImage">Upload Pet Image:</label>
        <input type="file" id="petImage" accept="image/*">
        <img id="petImagePreview" style="max-width: 100px;" alt="Pet Image Preview" />
        <br>
        <label for="petCharacteristics">Characteristics:</label>
        <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament"></textarea>
        <br>
        <label for="exerciseType">Type of Exercise:</label>
        <input type="text" id="exerciseType" placeholder="e.g., Walking, Running" required>
        <br>
        <label for="exerciseDuration">Duration (minutes):</label>
        <input type="text" id="exerciseDuration" placeholder="e.g., 30 minutes" required>
        <br>
        <label for="exerciseDate">Date:</label>
        <input type="date" id="exerciseDate" required>
        <br>
        <label for="bodyconditionScoring">Body Condition Scoring:</label>
        <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean" required>
        <br>
        <label for="exerciseTime">Time:</label>
        <input type="time" id="exerciseTime" required>
        <br>
        <label for="exerciseIntensity">Intensity Level:</label>
        <select id="exerciseIntensity" required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <br>
        <label for="caloriesBurned">Calories Burned (optional):</label>
        <input type="number" id="caloriesBurned" placeholder="e.g., 150 calories">
        <br>
        <label for="exerciseNotes">Notes/Comments:</label>
        <textarea id="exerciseNotes" placeholder="Any observations or details"></textarea>
        <br>
        <label for="exerciseLocation">Location (optional):</label>
        <input type="text" id="exerciseLocation" placeholder="e.g., Park">
        <br>
        <!-- Dynamic Calendar -->
        <div id="exerciseCalendar"></div>
        <br>
        <!-- Dashboard Charts Section -->
        <h2>Exercise Summary</h2>
        <div id="dashboardCharts">
          <canvas id="durationChart"></canvas>
          <canvas id="caloriesChart"></canvas>
        </div>
        <br>
        <button type="submit">${editingProfileIndex === null ? "Add Exercise" : "Update Exercise"}</button>
      </form>
      <div id="savedProfilesContainer">
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
      </div>
      <button id="monthlyReportButton">Monthly Report</button>
      <button id="logoutButton">Logout</button>
    </div>
  `;
  showPage(exerciseLogPage);

  // Attach event listener for exercise form submission
  document.getElementById('exerciseForm').addEventListener('submit', (event) => {
    event.preventDefault();
    handleProfileSave(event);
    alert(editingProfileIndex === null ? 'Exercise added successfully!' : 'Exercise updated successfully!');
  });

  // Attach listeners for monthly report and logout buttons
  document.getElementById('monthlyReportButton').addEventListener('click', generateMonthlyReport);
  document.getElementById('logoutButton').addEventListener('click', logout);

  // Initialize dashboard components
  generateCalendar();
  renderDashboardCharts();
  loadSavedProfiles();

  // Pet image preview handler
  document.getElementById('petImage').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('petImagePreview').src = e.target.result;
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  });
}

/* ============================================================
   NEW SECTION: DASHBOARD CHARTS (Using the same charts as Monthly Report)
============================================================ */
function renderDashboardCharts() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Filter pet profiles for the current month
  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  let monthProfiles = profiles.filter(profile => {
    let date = new Date(profile.exerciseDate);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  // Aggregate daily totals for duration and calories burned
  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  monthProfiles.forEach(profile => {
    let date = new Date(profile.exerciseDate);
    let day = date.getDate();
    dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
    dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
  });

  // Render Duration Chart (fixed y-axis similar to monthly report)
  const durationCtx = document.getElementById('durationChart').getContext('2d');
  if (window.dashboardDurationChart instanceof Chart) window.dashboardDurationChart.destroy();
  window.dashboardDurationChart = new Chart(durationCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Exercise Duration (min)',
        data: dailyDuration,
        borderColor: 'green',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Day of Month' }
        },
        y: {
          ticks: {
            stepSize: 10,
            max: 90,
            callback: value => value + ' min'
          },
          title: { display: true, text: 'Duration (min)' }
        }
      }
    }
  });

  // Render Calories Chart
  const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
  if (window.dashboardCaloriesChart instanceof Chart) window.dashboardCaloriesChart.destroy();
  window.dashboardCaloriesChart = new Chart(caloriesCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Calories Burned',
        data: dailyCalories,
        borderColor: 'red',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Day of Month' }
        },
        y: {
          title: { display: true, text: 'Calories' }
        }
      }
    }
  });
}

/* ============================================================
   CALENDAR, CHART & PROFILE MANAGEMENT (EXISTING FUNCTIONS)
============================================================ */
// Save the calendar's checkbox state (which days are ticked)
function saveCalendarState() {
  let state = {};
  const checkboxes = document.querySelectorAll('#exerciseCalendar input[type="checkbox"]');
  checkboxes.forEach(cb => {
    let day = cb.id.replace("day", "");
    state[day] = cb.checked;
  });
  localStorage.setItem("currentCalendarState", JSON.stringify(state));
}

// Load the calendar state from storage
function loadCalendarState() {
  let state = JSON.parse(localStorage.getItem("currentCalendarState"));
  return state || {};
}

// Generate calendar for the current month, loading saved tick state and updating charts on change
function generateCalendar() {
  const calendarDiv = document.getElementById('exerciseCalendar');
  calendarDiv.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const savedState = loadCalendarState();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    const isChecked = savedState[i] ? 'checked' : '';
    dayDiv.innerHTML = `<label>${i}</label><input type="checkbox" id="day${i}" ${isChecked}>`;
    if (i % 7 === 0) {
      calendarDiv.appendChild(document.createElement('br'));
    }
    calendarDiv.appendChild(dayDiv);
  }
  
  // Update calendar state and dashboard charts when any checkbox changes
  const checkboxes = calendarDiv.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      saveCalendarState();
      renderDashboardCharts();
    });
  });
}

// Save or update a pet profile (exercise entry) with partial update support
function handleProfileSave(event) {
  event.preventDefault();
  
  // Get updated fields for partial update in edit mode
  const updatedDuration = document.getElementById('exerciseDuration').value;
  const updatedCalories = document.getElementById('caloriesBurned').value;
  const updatedDate = document.getElementById('exerciseDate').value;
  
  // Get other fields from the form
  const petName = document.getElementById('petName').value;
  const petImage = document.getElementById('petImagePreview').src;
  const petCharacteristics = document.getElementById('petCharacteristics').value;
  const exerciseType = document.getElementById('exerciseType').value;
  const bodyconditionScoring = document.getElementById('bodyconditionScoring').value;
  const exerciseTime = document.getElementById('exerciseTime').value;
  const exerciseIntensity = document.getElementById('exerciseIntensity').value;
  const exerciseNotes = document.getElementById('exerciseNotes').value;
  const exerciseLocation = document.getElementById('exerciseLocation').value;
  
  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  
  if (editingProfileIndex !== null) {
    // In edit mode, update only duration, calories, and date (preserving other fields)
    let existingProfile = profiles[editingProfileIndex];
    existingProfile.exerciseDuration = updatedDuration || existingProfile.exerciseDuration;
    existingProfile.caloriesBurned = updatedCalories || existingProfile.caloriesBurned;
    existingProfile.exerciseDate = updatedDate || existingProfile.exerciseDate;
    profiles[editingProfileIndex] = existingProfile;
    editingProfileIndex = null;
    document.getElementById('exerciseForm').querySelector('button[type="submit"]').textContent = "Add Exercise";
  } else {
    // New entry – require all fields
    const newProfile = {
      petName,
      petImage,
      petCharacteristics,
      exerciseType,
      exerciseDuration: updatedDuration,
      exerciseDate: updatedDate,
      bodyconditionScoring,
      exerciseTime,
      exerciseIntensity,
      caloriesBurned: updatedCalories,
      exerciseNotes,
      exerciseLocation
    };
    profiles.push(newProfile);
  }
  
  localStorage.setItem('petProfiles', JSON.stringify(profiles));
  renderDashboardCharts();
  loadSavedProfiles();
  
  // Preserve the current calendar state before resetting the form
  const savedCalendarState = loadCalendarState();
  event.target.reset();
  localStorage.setItem("currentCalendarState", JSON.stringify(savedCalendarState));
  generateCalendar();
}

// Load saved pet profiles and attach delete, print, and edit actions
function loadSavedProfiles() {
  const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const savedProfilesDiv = document.getElementById('savedProfiles');
  savedProfilesDiv.innerHTML = '';

  profiles.forEach((profile, index) => {
    const profileDiv = document.createElement('div');
    profileDiv.innerHTML = `
      <h3>${profile.petName}</h3>
      <img src="${profile.petImage}" alt="Pet Image" style="max-width: 100px;" />
      <p>${profile.petCharacteristics}</p>
      <p>Type: ${profile.exerciseType}</p>
      <p>Duration: ${profile.exerciseDuration} min</p>
      <p>Date: ${profile.exerciseDate}</p>
      <p>Body Condition: ${profile.bodyconditionScoring}</p>
      <p>Time: ${profile.exerciseTime}</p>
      <p>Intensity: ${profile.exerciseIntensity}</p>
      <p>Calories Burned: ${profile.caloriesBurned}</p>
      <p>Notes: ${profile.exerciseNotes}</p>
      <p>Location: ${profile.exerciseLocation}</p>
      <button onclick="deleteProfile(${index})">Delete</button>
      <button onclick="printProfile(${index})">Print</button>
      <button onclick="editProfile(${index})">Edit</button>
    `;
    savedProfilesDiv.appendChild(profileDiv);
  });
}

function deleteProfile(index) {
  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  profiles.splice(index, 1);
  localStorage.setItem('petProfiles', JSON.stringify(profiles));
  loadSavedProfiles();
  renderDashboardCharts();
}

function printProfile(index) {
  const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = profiles[index];
  const printWindow = window.open('', '', 'width=600,height=400');
  printWindow.document.write(`<h1>${profile.petName}</h1>`);
  printWindow.document.write(`<img src="${profile.petImage}" alt="Pet Image" style="max-width: 100px;" />`);
  printWindow.document.write(`<p>${profile.petCharacteristics}</p>`);
  printWindow.document.write(`<p>Type: ${profile.exerciseType}</p>`);
  printWindow.document.write(`<p>Duration: ${profile.exerciseDuration} min</p>`);
  printWindow.document.write(`<p>Date: ${profile.exerciseDate}</p>`);
  printWindow.document.write(`<p>Body Condition: ${profile.bodyconditionScoring}</p>`);
  printWindow.document.write(`<p>Time: ${profile.exerciseTime}</p>`);
  printWindow.document.write(`<p>Intensity: ${profile.exerciseIntensity}</p>`);
  printWindow.document.write(`<p>Calories Burned: ${profile.caloriesBurned}</p>`);
  printWindow.document.write(`<p>Notes: ${profile.exerciseNotes}</p>`);
  printWindow.document.write(`<p>Location: ${profile.exerciseLocation}</p>`);
  printWindow.document.write('<br><button onclick="window.print()">Print</button>');
}

function editProfile(index) {
  const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = profiles[index];
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
  editingProfileIndex = index;
  document.getElementById('exerciseForm').querySelector('button[type="submit"]').textContent = "Update Exercise";
}

function logout() {
  localStorage.removeItem('user');
  alert('You have been logged out.');
  showSignIn();
}

/* ============================================================
   MONTHLY REPORT & AUTO-EXPORT TRIGGER
   [Note: Manual access to monthly report does NOT reset profile details]
============================================================ */
function exportMonthlyReport(report) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${report.monthName}_${report.year}_Monthly_Report.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function renderReportCalendar(daysInMonth, calendarState) {
  const calendarDiv = document.getElementById('reportCalendar');
  calendarDiv.innerHTML = '<h2>Calendar</h2>';
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day-report');
    const ticked = calendarState[i] ? '✔' : '';
    dayDiv.innerHTML = `<span>${i}</span> <span>${ticked}</span>`;
    calendarDiv.appendChild(dayDiv);
  }
}

function renderMonthlyCharts(dailyDuration, dailyCalories, daysInMonth) {
  const durationCtx = document.getElementById('durationChart').getContext('2d');
  if (window.durationChart instanceof Chart) window.durationChart.destroy();
  window.durationChart = new Chart(durationCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Exercise Duration (min)',
        data: dailyDuration,
        borderColor: 'green',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Day of Month' }
        },
        y: {
          ticks: {
            stepSize: 10,
            max: 90,
            callback: value => value + ' min'
          },
          title: { display: true, text: 'Duration (min)' }
        }
      }
    }
  });

  const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
  if (window.caloriesChart instanceof Chart) window.caloriesChart.destroy();
  window.caloriesChart = new Chart(caloriesCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Calories Burned',
        data: dailyCalories,
        borderColor: 'red',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Day of Month' }
        },
        y: {
          title: { display: true, text: 'Calories' }
        }
      }
    }
  });
}

function generateMonthlyReport() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  let monthProfiles = profiles.filter(profile => {
    let date = new Date(profile.exerciseDate);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  monthProfiles.forEach(profile => {
    let date = new Date(profile.exerciseDate);
    let day = date.getDate();
    dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
    dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
  });

  let calendarState = loadCalendarState();

  let monthlyReport = {
    year,
    month,
    monthName,
    dailyDuration,
    dailyCalories,
    calendarState,
    generatedAt: new Date().toISOString()
  };

  let monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
  monthlyReports.push(monthlyReport);
  localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));

  const reportHTML = `
    <div id="monthlyReport">
      <h1>${monthName} ${year} Monthly Report</h1>
      <div id="reportCalendar"></div>
      <div id="reportCharts">
        <canvas id="durationChart"></canvas>
        <canvas id="caloriesChart"></canvas>
      </div>
      <button id="exportReport">Export Report</button>
      <button id="backToDashboard">Back to Dashboard</button>
    </div>
  `;
  showPage(reportHTML);
  renderReportCalendar(daysInMonth, calendarState);
  renderMonthlyCharts(dailyDuration, dailyCalories, daysInMonth);

  document.getElementById('exportReport').addEventListener('click', () => {
    exportMonthlyReport(monthlyReport);
  });
  document.getElementById('backToDashboard').addEventListener('click', () => {
    // Return to dashboard without resetting profile details
    showExerciseLog();
  });
}

function scheduleMonthlyReportTrigger() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const triggerTime = new Date(currentYear, currentMonth, lastDayOfMonth + 1, 0, 0, 0);
  const timeUntilTrigger = triggerTime.getTime() - now.getTime();
  
  console.log(`Monthly report will auto-trigger in ${Math.round(timeUntilTrigger / 1000)} seconds.`);
  
  if (timeUntilTrigger > 0) {
    setTimeout(() => {
      exportAndResetMonthlyReport();
    }, timeUntilTrigger);
  }
}

function exportAndResetMonthlyReport() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  let monthProfiles = profiles.filter(profile => {
    const entryDate = new Date(profile.exerciseDate);
    return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
  });

  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  monthProfiles.forEach(profile => {
    const entryDate = new Date(profile.exerciseDate);
    const day = entryDate.getDate();
    dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
    dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
  });

  const calendarState = loadCalendarState();

  const monthlyReport = {
    year: currentYear,
    month: currentMonth,
    monthName,
    dailyDuration,
    dailyCalories,
    calendarState,
    generatedAt: new Date().toISOString()
  };

  let monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
  monthlyReports.push(monthlyReport);
  localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));

  exportMonthlyReport(monthlyReport);

  localStorage.removeItem("currentCalendarState");
  showExerciseLog();

  scheduleMonthlyReportTrigger();
}

/* ============================================================
   SERVICE WORKER & CONNECTIVITY
============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('https://drkimogad.github.io/Pet-Exercise-Log/service-worker.js')
      .then((registration) => {
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
      .catch((error) => {
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

/* ============================================================
   INITIALIZATION ON DOMCONTENTLOADED
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showExerciseLog();
  } else {
    showSignIn();
  }
  scheduleMonthlyReportTrigger();
});
