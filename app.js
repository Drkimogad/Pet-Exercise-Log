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
  const petImage = document.getElementById('petImage').value;
   }
