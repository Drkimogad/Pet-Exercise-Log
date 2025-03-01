"use strict";

/* =============================================
   MODULE: AppHelper [Color: Cyan]
   - Contains shared helper functions.
============================================= */
const AppHelper = (function() {
  function showPage(pageHTML) {
    document.getElementById('app').innerHTML = pageHTML;
  }

  return { showPage };
})();

/* =============================================
   MODULE: Authentication [Color: Blue]
   - Handles sign-up, sign-in, and password hashing.
============================================= */
const AuthModule = (function() {
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

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
    AppHelper.showPage(signUpPage);
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
    AppHelper.showPage(signInPage);
    document.getElementById('signInForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const username = document.getElementById('signInUsername').value;
        const passwordRaw = document.getElementById('signInPassword').value;
        const password = await hashPassword(passwordRaw);
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user && user.username === username && user.password === password) {
          alert('Sign in successful!');
          PetEntryModule.showExerciseLog();
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

  return { hashPassword, showSignUp, showSignIn };
})();

/* =============================================
   MODULE: PetEntryModule [Color: Green]
   - Manages pet profiles, exercise entry, saved profiles,
     and "Add New Profile" functionality.
============================================= */
const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;

  function getPets() {
    return JSON.parse(localStorage.getItem("pets")) || [];
  }

  function setPets(pets) {
    localStorage.setItem("pets", JSON.stringify(pets));
  }

  function getActivePet() {
    const pets = getPets();
    return activePetIndex !== null ? pets[activePetIndex] : null;
  }

  function updateActivePet(updatedPet) {
    let pets = getPets();
    if (activePetIndex !== null) {
      pets[activePetIndex] = updatedPet;
      setPets(pets);
    }
  }

  function showExerciseLog() {
    const dashboardHTML = `
      <div id="entryContainer">
        <form id="exerciseForm">
          <!-- Pet Details Section -->
          <fieldset>
            <legend>Pet Details</legend>
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" value="${getActivePet() ? getActivePet().petDetails.name : ''}" required>
            <br>
            <label for="petImage">Upload Pet Image:</label>
            <input type="file" id="petImage" accept="image/*">
            <br>
            <img id="petImagePreview" style="max-width: 100px;" src="${getActivePet() && getActivePet().petDetails.image ? getActivePet().petDetails.image : ''}" alt="Pet Image Preview" />
            <br>
            <label for="petCharacteristics">Characteristics:</label>
            <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament">${getActivePet() ? getActivePet().petDetails.characteristics : ''}</textarea>
          </fieldset>
          <!-- Exercise Entry Section -->
          <fieldset>
            <legend>Exercise Entry</legend>
            <label for="exerciseType">Type of Exercise:</label>
            <input type="text" id="exerciseType" placeholder="e.g., Walking, Running">
            <br>
            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" placeholder="e.g., 30" required>
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
            <label for="caloriesBurned">Calories Burned (required):</label>
            <input type="number" id="caloriesBurned" placeholder="e.g., 150" required>
            <br>
            <label for="exerciseNotes">Notes/Comments:</label>
            <textarea id="exerciseNotes" placeholder="Any observations or details"></textarea>
            <br>
            <label for="exerciseLocation">Location (optional):</label>
            <input type="text" id="exerciseLocation" placeholder="e.g., Park">
          </fieldset>
          <!-- Calendar & Charts Section -->
          <fieldset>
            <legend>Calendar & Dashboard</legend>
            <div id="exerciseCalendar"></div>
            <br>
            <div id="dashboardCharts">
              <h2>Dashboard Charts</h2>
              <canvas id="durationChartDashboard"></canvas>
              <canvas id="caloriesChartDashboard"></canvas>
            </div>
          </fieldset>
          <!-- Action Button -->
          <button type="submit">${activePetIndex === null ? "Add Exercise" : "Update & Add Exercise"}</button>
        </form>
        <!-- Saved Pet Profiles Section -->
        <div id="savedProfilesContainer">
          <h1>Saved Pet Profiles</h1>
          <div id="savedProfiles"></div>
        </div>
        <!-- Additional Buttons -->
        <div id="miscButtons">
          <button id="monthlyReportButton">Monthly Report</button>
          <button id="logoutButton">Logout</button>
        </div>
      </div>
      <!-- Fixed Buttons at the Top -->
      <button id="addNewProfileButton">Add New Profile</button>
      <button id="toggleModeButton">Toggle Mode</button>
    `;
    AppHelper.showPage(dashboardHTML);

    // Attach event listeners
    document.getElementById('exerciseForm').addEventListener('submit', (event) => {
      event.preventDefault();
      handleProfileSave(event);
    });
    document.getElementById('monthlyReportButton').addEventListener('click', ReportsModule.generateMonthlyReport);
    document.getElementById('logoutButton').addEventListener('click', AppHelper.logout);

    // Pet Image Preview Handler
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

    // "Add New Profile" Button Handler: clear form and hide saved profiles
    document.getElementById('addNewProfileButton').addEventListener('click', () => {
      let pets = getPets();
      if (pets.length >= MAX_PETS) {
        alert("Maximum number of pet profiles reached.");
        return;
      }
      activePetIndex = null;
      document.getElementById('exerciseForm').reset();
      document.getElementById('petImagePreview').src = "";
      document.getElementById('savedProfilesContainer').style.display = 'none';
      console.log("New profile mode activated. Form cleared and saved profiles hidden.");
    });

    // "Toggle Mode" Button Handler: toggle dark mode and save state to localStorage
    document.getElementById('toggleModeButton').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
      console.log("Toggle mode activated. Dark mode is now", document.body.classList.contains('dark-mode') ? "ON" : "OFF");
    });

    // Initialize Calendar, Charts, and Saved Profiles
    CalendarModule.generateCalendar();
    ChartsModule.renderDashboardCharts();
    loadSavedProfiles();
  }

  return {
    showExerciseLog,
    handleProfileSave,
    loadSavedProfiles,
    getActivePet,
    updateActivePet
  };
})();


/* =============================================
   MODULE: ServiceWorkerModule [Color: Red]
   - Registers the Service Worker.
============================================= */
const ServiceWorkerModule = (function() {
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    }
  }

  return { registerServiceWorker };
})();


/* =============================================
   INITIALIZATION [Color: Yellow]
============================================= */
document.addEventListener('DOMContentLoaded', () => {
  ServiceWorkerModule.registerServiceWorker();
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  if (sessionStorage.getItem('user')) {
    PetEntryModule.showExerciseLog();
  } else {
    AuthModule.showSignIn();
  }
});
