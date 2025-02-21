"use strict";

/* ============================================================
   GLOBAL VARIABLES & STATE MANAGEMENT
============================================================ */
let editingProfileIndex = null; // Tracks editing index for the current pet's entries

// Utility functions for multi-pet support
function getCurrentPetId() {
  let petId = sessionStorage.getItem('currentPetId');
  if (!petId) {
    petId = "defaultPet";
    sessionStorage.setItem('currentPetId', petId);
  }
  return petId;
}

function getPetProfilesData() {
  let data = JSON.parse(localStorage.getItem('petProfilesData')) || {};
  let currentPetId = getCurrentPetId();
  if (!data[currentPetId]) {
    data[currentPetId] = [];
    localStorage.setItem('petProfilesData', JSON.stringify(data));
  }
  return data;
}

function savePetProfilesData(data) {
  localStorage.setItem('petProfilesData', JSON.stringify(data));
}

/* ============================================================
   HELPER FUNCTIONS & AUTHENTICATION
============================================================ */
function showPage(pageHTML) {
  document.getElementById('app').innerHTML = pageHTML;
}

function isLoggedIn() {
  return sessionStorage.getItem('user') !== null;
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
   UNSAVED FORM DATA PERSISTENCE
============================================================ */
function saveFormData() {
  const form = document.getElementById('exerciseForm');
  if (!form) return;
  const formData = {
    petName: form.petName.value,
    petCharacteristics: form.petCharacteristics.value,
    exerciseType: form.exerciseType.value,
    exerciseDuration: form.exerciseDuration.value,
    exerciseDate: form.exerciseDate.value,
    bodyconditionScoring: form.bodyconditionScoring.value,
    exerciseTime: form.exerciseTime.value,
    exerciseIntensity: form.exerciseIntensity.value,
    caloriesBurned: form.caloriesBurned.value,
    exerciseNotes: form.exerciseNotes.value,
    exerciseLocation: form.exerciseLocation.value
  };
  sessionStorage.setItem('unsavedFormData', JSON.stringify(formData));
}

function loadFormData() {
  const savedData = sessionStorage.getItem('unsavedFormData');
  if (!savedData) return;
  const data = JSON.parse(savedData);
  const form = document.getElementById('exerciseForm');
  if (!form) return;
  form.petName.value = data.petName || "";
  form.petCharacteristics.value = data.petCharacteristics || "";
  form.exerciseType.value = data.exerciseType || "";
  form.exerciseDuration.value = data.exerciseDuration || "";
  form.exerciseDate.value = data.exerciseDate || "";
  form.bodyconditionScoring.value = data.bodyconditionScoring || "";
  form.exerciseTime.value = data.exerciseTime || "";
  form.exerciseIntensity.value = data.exerciseIntensity || "";
  form.caloriesBurned.value = data.caloriesBurned || "";
  form.exerciseNotes.value = data.exerciseNotes || "";
  form.exerciseLocation.value = data.exerciseLocation || "";
}

function clearFormData() {
  sessionStorage.removeItem('unsavedFormData');
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

  const currentPetId = getCurrentPetId();
  const petHeader = `<h2>Current Pet: ${currentPetId}</h2>`;

  const exerciseLogPage = `
    <div id="exerciseLog">
      <div id="topButtons">
        <button id="addNewProfileButton">Add New Profile</button>
        <button id="toggleModeButton">Toggle Mode</button>
      </div>
      ${petHeader}
      <div id="entryContainer">
        <form id="exerciseForm">
          <label for="petName">Pet Name:</label>
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
          <input type="text" id="exerciseType" placeholder="e.g., Walking, Running">
          <br>
          <label for="exerciseDuration">Duration (minutes):</label>
          <input type="text" id="exerciseDuration" placeholder="e.g., 30 minutes" required>
          <br>
          <label for="exerciseDate">Date:</label>
          <input type="date" id="exerciseDate" required>
          <br>
          <label for="bodyconditionScoring">Body Condition Scoring:</label>
          <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean">
          <br>
          <label for="exerciseTime">Time:</label>
          <input type="time" id="exerciseTime">
          <br>
          <label for="exerciseIntensity">Intensity Level:</label>
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
          <!-- Dashboard Charts Section -->
          <div id="dashboardCharts">
            <h2>Dashboard Charts</h2>
            <canvas id="durationChartDashboard"></canvas>
            <canvas id="caloriesChartDashboard"></canvas>
          </div>
          <br>
          <button type="submit">${editingProfileIndex === null ? "Add Exercise" : "Update Exercise"}</button>
        </form>
      </div>
      <div id="savedProfilesContainer">
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
      </div>
      <button id="monthlyReportButton">Monthly Report</button>
      <button id="logoutButton">Logout</button>
    </div>
  `;
  showPage(exerciseLogPage);

  // Attach event listeners to persist unsaved data.
  const formElements = document.querySelectorAll('#exerciseForm input, #exerciseForm textarea, #exerciseForm select');
  formElements.forEach(el => {
    el.addEventListener('input', saveFormData);
  });
  loadFormData();

  // Attach submit event listener.
  const exerciseForm = document.getElementById('exerciseForm');
  if (exerciseForm) {
    exerciseForm.addEventListener('submit', (event) => {
      event.preventDefault();
      console.log("Submit event triggered");
      handleProfileSave(event);
      clearFormData(); // Clear unsaved data after successful submission.
      alert(editingProfileIndex === null ? 'Exercise added successfully!' : 'Exercise updated successfully!');
    });
  } else {
    console.error("Exercise form not found!");
  }

  document.getElementById('monthlyReportButton').addEventListener('click', generateMonthlyReport);
  document.getElementById('logoutButton').addEventListener('click', logout);

  generateCalendar();
  renderDashboardCharts();
  loadSavedProfiles();

  // Image preview handler.
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

  // "Add New Profile" button: create a new pet profile if name doesn't already exist.
  document.getElementById('addNewProfileButton').addEventListener('click', () => {
    const newPetName = prompt("Enter new pet name:");
    if (newPetName) {
      let data = JSON.parse(localStorage.getItem('petProfilesData')) || {};
      if (data[newPetName]) {
        alert("A profile with that name already exists. Please choose a different name.");
        return;
      }
      sessionStorage.setItem('currentPetId', newPetName);
      data[newPetName] = [];
      localStorage.setItem('petProfilesData', JSON.stringify(data));
      // Re-render the dashboard for the new profile.
      showExerciseLog();
    }
  });

  // "Toggle Mode" button: toggle a CSS class for visual changes.
  document.getElementById('toggleModeButton').addEventListener('click', () => {
    const entryContainer = document.getElementById('entryContainer');
    entryContainer.classList.toggle('toggled-mode');
  });
}

/* ============================================================
   CALENDAR, CHART & PROFILE MANAGEMENT
============================================================ */
function saveCalendarState() {
  let state = {};
  const checkboxes = document.querySelectorAll('#exerciseCalendar input[type="checkbox"]');
  checkboxes.forEach(cb => {
    let day = cb.id.replace("day", "");
    state[day] = cb.checked;
  });
  localStorage.setItem("currentCalendarState", JSON.stringify(state));
}

function loadCalendarState() {
  let state = JSON.parse(localStorage.getItem("currentCalendarState"));
  return state || {};
}

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
  
  const checkboxes = calendarDiv.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      saveCalendarState();
      renderDashboardCharts();
    });
  });
}

function renderDashboardCharts() {
  const canvasDuration = document.getElementById('durationChartDashboard');
  const ctxDuration = canvasDuration.getContext('2d');
  const canvasCalories = document.getElementById('caloriesChartDashboard');
  const ctxCalories = canvasCalories.getContext('2d');

  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  const profiles = data[currentPetId] || [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let dailyDuration = Array(daysInMonth).fill(0);
  let dailyCalories = Array(daysInMonth).fill(0);
  
  profiles.forEach(profile => {
    let date = new Date(profile.exerciseDate);
    if (date.getFullYear() === year && date.getMonth() === month) {
      let day = date.getDate();
      dailyDuration[day - 1] += parseInt(profile.exerciseDuration, 10) || 0;
      dailyCalories[day - 1] += parseInt(profile.caloriesBurned, 10) || 0;
    }
  });
  
  const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  if (window.durationChartDashboard instanceof Chart) {
    window.durationChartDashboard.destroy();
  }
  if (window.caloriesChartDashboard instanceof Chart) {
    window.caloriesChartDashboard.destroy();
  }
  
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
        x: { title: { display: true, text: 'Day of Month' } },
        y: {
          min: 0,
          ticks: { stepSize: 10, max: 90, callback: value => value + ' m' },
          title: { display: true, text: 'Duration (min)' }
        }
      }
    }
  });
  
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
        x: { title: { display: true, text: 'Day of Month' } },
        y: { title: { display: true, text: 'Calories' } }
      }
    }
  });
}

function handleProfileSave(event) {
  event.preventDefault();
  console.log("handleProfileSave called");
  
  const updatedDuration = document.getElementById('exerciseDuration').value;
  const updatedCalories = document.getElementById('caloriesBurned').value;
  const updatedDate = document.getElementById('exerciseDate').value;
  
  const petNameVal = document.getElementById('petName').value;
  const petImage = document.getElementById('petImagePreview').src;
  const petCharacteristics = document.getElementById('petCharacteristics').value;
  const exerciseType = document.getElementById('exerciseType').value;
  const bodyconditionScoring = document.getElementById('bodyconditionScoring').value;
  const exerciseTime = document.getElementById('exerciseTime').value;
  const exerciseIntensity = document.getElementById('exerciseIntensity').value;
  const exerciseNotes = document.getElementById('exerciseNotes').value;
  const exerciseLocation = document.getElementById('exerciseLocation').value;
  
  const newEntry = {
    petName: petNameVal,
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
  
  let data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  let profiles = data[currentPetId] || [];
  
  if (editingProfileIndex !== null) {
    profiles[editingProfileIndex] = newEntry;
    editingProfileIndex = null;
    document.getElementById('exerciseForm').querySelector('button[type="submit"]').textContent = "Add Exercise";
  } else {
    profiles.push(newEntry);
  }
  
  data[currentPetId] = profiles;
  savePetProfilesData(data);
  renderDashboardCharts();
  loadSavedProfiles();
  generateCalendar();
  console.log("New entry saved", newEntry);
}

function loadSavedProfiles() {
  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  const profiles = data[currentPetId] || [];
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
  let data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  let profiles = data[currentPetId] || [];
  profiles.splice(index, 1);
  data[currentPetId] = profiles;
  savePetProfilesData(data);
  loadSavedProfiles();
  renderDashboardCharts();
}

function printProfile(index) {
  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  const profiles = data[currentPetId] || [];
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
  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  const profiles = data[currentPetId] || [];
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
        x: { title: { display: true, text: 'Day of Month' } },
        y: {
          min: 0,
          ticks: { stepSize: 10, max: 90, callback: value => value + ' m' },
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
        x: { title: { display: true, text: 'Day of Month' } },
        y: { title: { display: true, text: 'Calories' } }
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

  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  const profiles = data[currentPetId] || [];
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
  
  const exercisedDays = dailyDuration.filter(d => d > 0).length;
  const totalDuration = dailyDuration.reduce((acc, val) => acc + val, 0);
  const totalCalories = dailyCalories.reduce((acc, val) => acc + val, 0);
  const summaryComment = `This month, ${currentPetId} exercised on ${exercisedDays} days with a total duration of ${totalDuration} minutes and burned a total of ${totalCalories} calories. Great job!`;

  let monthlyReport = {
    year,
    month,
    monthName,
    dailyDuration,
    dailyCalories,
    calendarState: loadCalendarState(),
    petProfiles: monthProfiles,
    summaryComment,
    generatedAt: new Date().toISOString()
  };

  let monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
  monthlyReports.push(monthlyReport);
  localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));

  const reportHTML = `
    <div id="monthlyReport">
      <h1>${monthName} ${year} Monthly Report for ${currentPetId}</h1>
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
      <div class="report-buttons" style="margin-bottom: 50px;">
         <button id="exportReport">Export Report</button>
         <button id="backToDashboard">Back to Dashboard</button>
      </div>
    </div>
  `;
  showPage(reportHTML);
  renderReportCalendar(daysInMonth, monthlyReport.calendarState);
  renderMonthlyCharts(dailyDuration, dailyCalories, daysInMonth);

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

  document.getElementById('exportReport').addEventListener('click', () => {
    exportMonthlyReport(monthlyReport);
  });
  document.getElementById('backToDashboard').addEventListener('click', () => {
    // Returning to dashboard preserves unsaved form data (loaded via loadFormData).
    showExerciseLog();
  });
}

function exportMonthlyReport(report) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${report.monthName}_${report.year}_Monthly_Report.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
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

  const data = getPetProfilesData();
  const currentPetId = getCurrentPetId();
  let profiles = data[currentPetId] || [];
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
    petProfiles: monthProfiles,
    generatedAt: new Date().toISOString()
  };

  let monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
  monthlyReports.push(monthlyReport);
  localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));

  exportMonthlyReport(monthlyReport);

  // Clear current pet's entries and calendar state for the new month.
  const allData = getPetProfilesData();
  allData[currentPetId] = [];
  savePetProfilesData(allData);
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
        registration.addEventListener('upd
