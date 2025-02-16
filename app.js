"use strict";

// Global variable to track editing mode (null means adding new)
let editingProfileIndex = null;

/* ============================================================
   Helper Functions & Authentication
============================================================ */

// Use the #app container for dynamic content
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
   Authentication Pages: Sign-Up & Sign-In
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
   Dashboard / Exercise Log Page
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
        <!-- Chart Section -->
        <h2>Exercise Summary</h2>
        <canvas id="exerciseChart"></canvas>
        <br>
        <button type="submit">${editingProfileIndex === null ? "Add Exercise" : "Update Exercise"}</button>
      </form>
      <div id="savedProfilesContainer">
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
      </div>
      <button id="logoutButton">Logout</button>
    </div>
  `;
  showPage(exerciseLogPage);

  // Event listener for exercise form submission
  document.getElementById('exerciseForm').addEventListener('submit', (event) => {
    event.preventDefault();
    handleProfileSave(event);
    alert(editingProfileIndex === null ? 'Exercise added successfully!' : 'Exercise updated successfully!');
  });

  // Logout button listener
  document.getElementById('logoutButton').addEventListener('click', logout);

  // Initialize dashboard components
  generateCalendar();
  renderExerciseGraph();
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
   Calendar, Chart, and Profile Management
============================================================ */

function generateCalendar() {
  const calendarDiv = document.getElementById('exerciseCalendar');
  calendarDiv.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
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

function renderExerciseGraph() {
  const canvas = document.getElementById('exerciseChart');
  const ctx = canvas.getContext('2d');
  const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const data = profiles.map(profile => parseInt(profile.exerciseDuration, 10) || 0);
  const labels = profiles.map((_, index) => `Entry ${index + 1}`);

  if (window.exerciseChart instanceof Chart) {
    window.exerciseChart.destroy();
  }

  window.exerciseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Exercise Duration (min)',
        data: data,
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Entries' }
        },
        y: {
          display: true,
          title: { display: true, text: 'Duration (min)' }
        }
      }
    }
  });
}

function handleProfileSave(event) {
  event.preventDefault();
  const petName = document.getElementById('petName').value;
  const petImage = document.getElementById('petImagePreview').src;
  const petCharacteristics = document.getElementById('petCharacteristics').value;
  const exerciseType = document.getElementById('exerciseType').value;
  const exerciseDuration = document.getElementById('exerciseDuration').value;
  const exerciseDate = document.getElementById('exerciseDate').value;
  const bodyconditionScoring = document.getElementById('bodyconditionScoring').value;
  const exerciseTime = document.getElementById('exerciseTime').value;
  const exerciseIntensity = document.getElementById('exerciseIntensity').value;
  const caloriesBurned = document.getElementById('caloriesBurned').value;
  const exerciseNotes = document.getElementById('exerciseNotes').value;
  const exerciseLocation = document.getElementById('exerciseLocation').value;

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

  let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

  if (editingProfileIndex !== null) {
    profiles[editingProfileIndex] = newProfile;
    editingProfileIndex = null;
    document.getElementById('exerciseForm').querySelector('button[type="submit"]').textContent = "Add Exercise";
  } else {
    profiles.push(newProfile);
  }

  localStorage.setItem('petProfiles', JSON.stringify(profiles));
  renderExerciseGraph();
  loadSavedProfiles();
  event.target.reset();
}

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
  renderExerciseGraph();
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
   Service Worker Registration & Connectivity
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
   Initialization on DOMContentLoaded
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showExerciseLog();
  } else {
    showSignIn();
  }
});
