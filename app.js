"use strict";

/* ============================================================
   GLOBAL VARIABLES & STATE MANAGEMENT
============================================================ */
let editingProfileIndex = null; // Tracks whether we're editing an existing profile

/* ============================================================
   HELPER FUNCTIONS & AUTHENTICATION
============================================================ */

// Inject dynamic content into the #app container
function showPage(pageHTML) {
  document.getElementById('app').innerHTML = pageHTML;
}

// Check if the user is logged in (using sessionStorage for auth)
function isLoggedIn() {
  return sessionStorage.getItem('user') !== null;
}

// Secure password storage using SHA-256 via Web Crypto API
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
        sessionStorage.setItem('user', JSON.stringify({ username, password }));
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
      const user = JSON.parse(sessionStorage.getItem('user'));
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
        <!-- UPDATED: Removed 'required' so non-crucial fields can be empty -->
        <input type="text" id="petName">
        <br>
        <label for="petImage">Upload Pet Image:</label>
        <input type="file" id="petImage" accept="image/*">
        <img id="petImagePreview" style="max-width: 100px;" alt="Pet Image Preview" />
        <br>
        <label for="petCharacteristics">Characteristics:</label>
        <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament"></textarea>
        <br>
        <label for="exerciseType">Type of Exercise:</label>
        <!-- UPDATED: Removed 'required' -->
        <input type="text" id="exerciseType" placeholder="e.g., Walking, Running">
        <br>
        <label for="exerciseDuration">Duration (minutes):</label>
        <!-- Keep required as it's crucial -->
        <input type="text" id="exerciseDuration" placeholder="e.g., 30 minutes" required>
        <br>
        <label for="exerciseDate">Date:</label>
        <!-- Keep required as it's crucial -->
        <input type="date" id="exerciseDate" required>
        <br>
        <label for="bodyconditionScoring">Body Condition Scoring:</label>
        <!-- UPDATED: Removed 'required' -->
        <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean">
        <br>
        <label for="exerciseTime">Time:</label>
        <!-- UPDATED: Removed 'required' -->
        <input type="time" id="exerciseTime">
        <br>
        <label for="exerciseIntensity">Intensity Level:</label>
        <!-- UPDATED: Removed 'required' -->
        <select id="exerciseIntensity">
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
        <!-- Dashboard Charts Section: UPDATED -->
        <div id="dashboardCharts">
          <h2>Dashboard Charts</h2>
          <canvas id="durationChartDashboard"></canvas>
          <canvas id="caloriesChartDashboard"></canvas>
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
  renderDashboardCharts(); /* UPDATED: Render new dashboard charts */
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
   CALENDAR, CHART & PROFILE MANAGEMENT
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
  
  // Update calendar state and charts when any checkbox changes
  const checkboxes = calendarDiv.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      saveCalendarState();
      renderDashboardCharts(); /* UPDATED: Re-render dashboard charts on calendar change */
    });
  });
}

// Render Dashboard Charts for current month (Duration & Calories)
// UPDATED: New function to aggregate and render two charts on the dashboard.
function renderDashboardCharts() {
  const canvasDuration = document.getElementById('durationChartDashboard');
  const ctxDuration = canvasDuration.getContext('2d');
  const canvasCalories = document.getElementById('caloriesChartDashboard');
  const ctxCalories = canvasCalories.getContext('2d');

  const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Initialize daily aggregates
  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  
  // Aggregate profiles for the current month based on exerciseDate
  profiles.forEach(profile => {
    let date = new Date(profile.exerciseDate);
    if (date.getFullYear() === year && date.getMonth() === month) {
      let day = date.getDate();
      dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
      dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
    }
  });
  
  const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Destroy existing charts if they exist
  if (window.durationChartDashboard instanceof Chart) {
    window.durationChartDashboard.destroy();
  }
  if (window.caloriesChartDashboard instanceof Chart) {
    window.caloriesChartDashboard.destroy();
  }
  
  // Duration Chart
  window.durationChartDashboard = new Chart(ctxDuration, {
    type: 'line',
    data: {
      labels: labels,
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
  
  // Calories Chart
  window.caloriesChartDashboard = new Chart(ctxCalories, {
    type: 'line',
    data: {
      labels: labels,
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

// Save or update a pet profile (exercise entry)
// UPDATED: In edit mode, update all fields from the form while ensuring that date, duration, and calories burned are used for chart updates.
function handleProfileSave(event) {
  event.preventDefault();
  
  // Get crucial fields for charts
  const updatedDuration = document.getElementById('exerciseDuration').value;
  const updatedCalories = document.getElementById('caloriesBurned').value;
  const updatedDate = document.getElementById('exerciseDate').value;
  
  // Get all other fields from the form
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
    // UPDATED: In edit mode, update all fields
    let existingProfile = profiles[editingProfileIndex];
    existingProfile.petName = petName;
    existingProfile.petImage = petImage;
    existingProfile.petCharacteristics = petCharacteristics;
    existingProfile.exerciseType = exerciseType;
    existingProfile.exerciseDuration = updatedDuration;
    existingProfile.exerciseDate = updatedDate;
    existingProfile.bodyconditionScoring = bodyconditionScoring;
    existingProfile.exerciseTime = exerciseTime;
    existingProfile.exerciseIntensity = exerciseIntensity;
    existingProfile.caloriesBurned = updatedCalories;
    existingProfile.exerciseNotes = exerciseNotes;
    existingProfile.exerciseLocation = exerciseLocation;
    profiles[editingProfileIndex] = existingProfile;
    editingProfileIndex = null;
    document.getElementById('exerciseForm').querySelector('button[type="submit"]').textContent = "Add Exercise";
  } else {
    // New entry – save all fields
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
  sessionStorage.removeItem('user');
  alert('You have been logged out.');
  showSignIn();
}

/* ============================================================
   MONTHLY REPORT & AUTO-EXPORT TRIGGER
============================================================ */

// Render a read-only calendar for the report view
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

// Render two monthly charts: one for duration, one for calories burned.
function renderMonthlyCharts(dailyDuration, dailyCalories, daysInMonth) {
  // Duration Chart with fixed y-axis (9 grades, each 10 minutes, up to 90 minutes)
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

  // Calories Chart
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

// Generate the monthly report view by aggregating current month's data, saved profiles, and summary
function generateMonthlyReport() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter exercise entries for the current month
  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  let monthProfiles = profiles.filter(profile => {
    let date = new Date(profile.exerciseDate);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  // Aggregate daily totals for exercise duration and calories burned
  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  monthProfiles.forEach(profile => {
    let date = new Date(profile.exerciseDate);
    let day = date.getDate();
    dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
    dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
  });
  
  // Compute summary details
  const exercisedDays = dailyDuration.filter(d => d > 0).length;
  const totalDuration = dailyDuration.reduce((acc, val) => acc + val, 0);
  const totalCalories = dailyCalories.reduce((acc, val) => acc + val, 0);
  const summaryComment = `This month, the pet exercised on ${exercisedDays} days with a total duration of ${totalDuration} minutes and burned a total of ${totalCalories} calories. Great job!`;

  // Create a monthly report object including saved profile details and summary comment
  let monthlyReport = {
    year,
    month,
    monthName,
    dailyDuration,
    dailyCalories,
    calendarState: loadCalendarState(),
    petProfiles: monthProfiles, /* UPDATED: Include saved profile details */
    summaryComment,
    generatedAt: new Date().toISOString()
  };

  // Archive the monthly report
  let monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
  monthlyReports.push(monthlyReport);
  localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));

  // Render the monthly report view with added sections for summary and saved profile details
  const reportHTML = `
    <div id="monthlyReport">
      <h1>${monthName} ${year} Monthly Report</h1>
      <div id="reportCalendar"></div>
      <div id="reportCharts">
        <canvas id="durationChart"></canvas>
        <canvas id="caloriesChart"></canvas>
      </div>
      <div id="reportSummary">
         <h2>Summary</h2>
         <p>${summaryComment}</p>
      </div>
      <div id="savedProfileDetails">
         <h2>Saved Profile Details</h2>
      </div>
      <button id="exportReport">Export Report</button>
      <button id="backToDashboard">Back to Dashboard</button>
    </div>
  `;
  showPage(reportHTML);
  renderReportCalendar(daysInMonth, monthlyReport.calendarState);
  renderMonthlyCharts(dailyDuration, dailyCalories, daysInMonth);

  // Populate Saved Profile Details in the report
  const savedProfileDetailsDiv = document.getElementById('savedProfileDetails');
  if (monthProfiles.length > 0) {
    monthProfiles.forEach(profile => {
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
      `;
      savedProfileDetailsDiv.appendChild(profileDiv);
    });
  } else {
    savedProfileDetailsDiv.innerHTML += `<p>No entries for this month.</p>`;
  }

  // Attach export and back button listeners
  document.getElementById('exportReport').addEventListener('click', () => {
    exportMonthlyReport(monthlyReport);
  });
  document.getElementById('backToDashboard').addEventListener('click', () => {
    // UPDATED: Do not clear pet profile entries or calendar state on manual return
    showExerciseLog();
  });
}

// Export monthly report as a JSON file
function exportMonthlyReport(report) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${report.monthName}_${report.year}_Monthly_Report.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Automatic monthly report trigger (export & reset) at midnight on the last day of the month
function scheduleMonthlyReportTrigger() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // Last day of current month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Trigger at midnight (00:00:00) of the day after the last day
  const triggerTime = new Date(currentYea
