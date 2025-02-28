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
  
  // Retrieve pet profiles from localStorage
  function getPets() {
    return JSON.parse(localStorage.getItem("pets")) || [];
  }
  
  // Save pet profiles to localStorage
  function setPets(pets) {
    localStorage.setItem("pets", JSON.stringify(pets));
  }
  
  // Get the active pet based on activePetIndex
  function getActivePet() {
    const pets = getPets();
    return activePetIndex !== null ? pets[activePetIndex] : null;
  }
  
  // Update the active pet in localStorage
  function updateActivePet(updatedPet) {
    let pets = getPets();
    if (activePetIndex !== null) {
      pets[activePetIndex] = updatedPet;
      setPets(pets);
    }
  }
  
  // Render the main dashboard (exercise log, pet details, saved profiles)
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
    
    // Attach event listeners for form submission, monthly report, and logout
    document.getElementById('exerciseForm').addEventListener('submit', (event) => {
      event.preventDefault();
      handleProfileSave();
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
    
    // "Add New Profile" Button Handler: Clear form and hide saved profiles
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
    
    // "Toggle Mode" Button Handler: Toggle a 'dark-mode' class on the body
    document.getElementById('toggleModeButton').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      console.log("Toggle mode activated. Dark mode is now", document.body.classList.contains('dark-mode') ? "ON" : "OFF");
    });
    
    // Initialize Calendar, Charts, and Saved Profiles
    CalendarModule.generateCalendar();
    ChartsModule.renderDashboardCharts();
    loadSavedProfiles();
  }
  
  // Handle saving pet profiles and exercise entries
  function handleProfileSave() {
    console.log("handleProfileSave triggered");
    if (event) event.preventDefault();
    
    // Retrieve pet details
    const name = document.getElementById('petName').value.trim();
    const characteristics = document.getElementById('petCharacteristics').value.trim();
    const image = document.getElementById('petImagePreview').src;
    
    // Retrieve exercise details
    const exerciseType = document.getElementById('exerciseType').value;
    const exerciseDuration = document.getElementById('exerciseDuration').value;
    const exerciseDate = document.getElementById('exerciseDate').value;
    const bodyconditionScoring = document.getElementById('bodyconditionScoring').value;
    const exerciseTime = document.getElementById('exerciseTime').value;
    const exerciseIntensity = document.getElementById('exerciseIntensity').value;
    const caloriesBurned = document.getElementById('caloriesBurned').value;
    const exerciseNotes = document.getElementById('exerciseNotes').value;
    const exerciseLocation = document.getElementById('exerciseLocation').value;
    
    console.log("Received exercise details: Date =", exerciseDate, ", Duration =", exerciseDuration, ", Calories =", caloriesBurned);
    if (!exerciseDate || !exerciseDuration || !caloriesBurned) {
      alert("Please provide Date, Exercise Duration, and Calories Burned for the exercise update.");
      return;
    }
    
    // Save calendar state and retrieve it
    CalendarModule.saveCalendarState();
    const calendarState = CalendarModule.loadCalendarState();
    
    let pets = getPets();
    let currentPet;
    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) {
        alert("Maximum number of pet profiles reached.");
        return;
      }
      // Create a new pet profile
      currentPet = {
        petDetails: {
          name: name,
          image: image,
          characteristics: characteristics
        },
        exercises: [],
        calendarState: calendarState,
        monthlyReports: [],
        currentMonthlyReport: null
      };
      pets.push(currentPet);
      activePetIndex = pets.length - 1;
      console.log("New pet profile created. ActivePetIndex:", activePetIndex);
    } else {
      currentPet = getActivePet();
      if (name) currentPet.petDetails.name = name;
      if (image) currentPet.petDetails.image = image;
      if (characteristics) currentPet.petDetails.characteristics = characteristics;
      console.log("Existing pet profile updated:", currentPet.petDetails);
    }
    
    // Create new exercise entry
    const newExercise = {
      exerciseType,
      exerciseDuration,
      exerciseDate,
      bodyconditionScoring,
      exerciseTime,
      exerciseIntensity,
      caloriesBurned,
      exerciseNotes,
      exerciseLocation,
      calendarState
    };
    currentPet.exercises.push(newExercise);
    console.log("New exercise added:", newExercise);
    
    // Update monthly report and save to localStorage
    ReportsModule.updateCurrentMonthlyReport();
    pets[activePetIndex] = currentPet;
    setPets(pets);
    console.log("LocalStorage updated with pet profiles.");
    
    loadSavedProfiles();
    
    // Reset only the exercise fields while preserving pet details
    document.getElementById('exerciseForm').reset();
    document.getElementById('petName').value = currentPet.petDetails.name;
    document.getElementById('petCharacteristics').value = currentPet.petDetails.characteristics;
    if (currentPet.petDetails.image) {
      document.getElementById('petImagePreview').src = currentPet.petDetails.image;
    }
    
    document.getElementById('savedProfilesContainer').style.display = 'block';
    CalendarModule.generateCalendar();
    ChartsModule.renderDashboardCharts();
    loadSavedProfiles();
    console.log("Charts and saved profiles updated.");
  }
  
  // Render saved pet profiles
  function loadSavedProfiles() {
    const pets = getPets();
    const savedProfilesDiv = document.getElementById('savedProfiles');
    if (pets.length === 0) {
      savedProfilesDiv.innerHTML = '<p style="font-weight:bold;">No pet profiles saved yet.</p>';
      return;
    }
    savedProfilesDiv.innerHTML = `<h2>Saved Profiles (${pets.length})</h2>`;
    pets.forEach((pet, index) => {
      savedProfilesDiv.innerHTML += `
        <div class="pet-profile">
          <h3>${pet.petDetails.name || "Unnamed Pet"}</h3>
          <img src="${pet.petDetails.image || ''}" alt="Pet Image" style="max-width: 100px;" />
          <p>${pet.petDetails.characteristics || ""}</p>
          <p>Exercise Entries: ${pet.exercises.length}</p>
          <button id="delete_${index}">Delete</button>
          <button id="print_${index}">Print</button>
          <button id="edit_${index}">Edit</button>
        </div>
      `;
      document.getElementById(`delete_${index}`).addEventListener('click', () => deletePetProfile(index));
      document.getElementById(`print_${index}`).addEventListener('click', () => printPetProfile(index));
      document.getElementById(`edit_${index}`).addEventListener('click', () => editPetProfile(index));
    });
  }
  
  function deletePetProfile(index) {
    let pets = getPets();
    if (confirm("Are you sure you want to delete this pet profile?")) {
      pets.splice(index, 1);
      setPets(pets);
      if (activePetIndex === index) {
        activePetIndex = null;
      }
      loadSavedProfiles();
      ChartsModule.renderDashboardCharts();
    }
  }
  
  function printPetProfile(index) {
    const pets = getPets();
    const pet = pets[index];
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(`<h1>${pet.petDetails.name || "Unnamed Pet"}</h1>`);
    printWindow.document.write(`<img src="${pet.petDetails.image || ''}" alt="Pet Image" style="max-width: 100px;" />`);
    printWindow.document.write(`<p>${pet.petDetails.characteristics || ""}</p>`);
    printWindow.document.write(`<p>Number of Exercises: ${pet.exercises.length}</p>`);
    printWindow.document.write('<br><button onclick="window.print()">Print</button>');
  }
  
  function editPetProfile(index) {
    activePetIndex = index;
    showExerciseLog();
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
   MODULE: CalendarModule [Color: Orange]
   - Manages saving, loading, and generating the calendar.
============================================= */
const CalendarModule = (function() {
  function saveCalendarState() {
    const state = {};
    const checkboxes = document.querySelectorAll('#exerciseCalendar input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const day = cb.id.replace("day", "");
      state[day] = cb.checked;
    });
    let pet = PetEntryModule.getActivePet();
    if (pet) {
      pet.calendarState = state;
      PetEntryModule.updateActivePet(pet);
    }
  }
  
  function loadCalendarState() {
    let pet = PetEntryModule.getActivePet();
    return (pet && pet.calendarState) || {};
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
        ChartsModule.renderDashboardCharts();
      });
    });
  }
  
  return { saveCalendarState, loadCalendarState, generateCalendar };
})();


/* =============================================
   MODULE: ChartsModule [Color: Purple]
   - Renders the dashboard charts.
============================================= */
const ChartsModule = (function() {
  function renderDashboardCharts() {
    const canvasDuration = document.getElementById('durationChartDashboard');
    const ctxDuration = canvasDuration.getContext('2d');
    const canvasCalories = document.getElementById('caloriesChartDashboard');
    const ctxCalories = canvasCalories.getContext('2d');
  
    const pet = PetEntryModule.getActivePet();
    if (!pet) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let dailyDuration = Array(daysInMonth).fill(0);
    let dailyCalories = Array(daysInMonth).fill(0);
    
    pet.exercises.forEach(exercise => {
      let date = new Date(exercise.exerciseDate);
      if (date.getFullYear() === year && date.getMonth() === month) {
        let day = date.getDate();
        dailyDuration[day - 1] += parseInt(exercise.exerciseDuration, 10) || 0;
        dailyCalories[day - 1] += parseInt(exercise.caloriesBurned, 10) || 0;
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
            ticks: {
              stepSize: 10,
              max: 90,
              callback: value => value + ' m'
            },
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
  
  return { renderDashboardCharts };
})();


/* =============================================
   MODULE: ReportsModule [Color: Red]
   - Manages monthly reports: updating, generating, and exporting.
============================================= */
const ReportsModule = (function() {
  function updateCurrentMonthlyReport() {
    const pet = PetEntryModule.getActivePet();
    if (!pet) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let dailyDuration = Array(daysInMonth).fill(0);
    let dailyCalories = Array(daysInMonth).fill(0);
    
    const monthExercises = pet.exercises.filter(ex => {
      let date = new Date(ex.exerciseDate);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    
    monthExercises.forEach(exercise => {
      let date = new Date(exercise.exerciseDate);
      let day = date.getDate();
      dailyDuration[day - 1] += parseInt(exercise.exerciseDuration, 10) || 0;
      dailyCalories[day - 1] += parseInt(exercise.caloriesBurned, 10) || 0;
    });
    
    const exercisedDays = dailyDuration.filter(d => d > 0).length;
    const totalDuration = dailyDuration.reduce((acc, val) => acc + val, 0);
    const totalCalories = dailyCalories.reduce((acc, val) => acc + val, 0);
    
    const monthlyReport = {
      year,
      month,
      monthName,
      dailyDuration,
      dailyCalories,
      calendarState: pet.calendarState,
      exercises: monthExercises,
      summaryComment: `This month, ${pet.petDetails.name || "the pet"} exercised on ${exercisedDays} days for a total duration of ${totalDuration} minutes and burned ${totalCalories} calories.`,
      generatedAt: new Date().toISOString()
    };
    
    pet.currentMonthlyReport = monthlyReport;
    if (!pet.monthlyReports) {
      pet.monthlyReports = [];
    }
    const existingReportIndex = pet.monthlyReports.findIndex(r => r.year === year && r.month === month);
    if (existingReportIndex !== -1) {
      pet.monthlyReports[existingReportIndex] = monthlyReport;
    } else {
      pet.monthlyReports.push(monthlyReport);
    }
    PetEntryModule.updateActivePet(pet);
  }
  
  function generateMonthlyReport() {
    const pet = PetEntryModule.getActivePet();
    if (!pet) {
      alert("No active pet selected.");
      return;
    }
    updateCurrentMonthlyReport();
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const currentReport = pet.currentMonthlyReport;
    
    const reportHTML = `
      <div id="monthlyReport">
        <h1>${monthName} ${year} Monthly Report for ${pet.petDetails.name || "Unnamed Pet"}</h1>
        <div id="reportCalendar"></div>
        <div id="reportCharts">
          <canvas id="durationChart"></canvas>
          <canvas id="caloriesChart"></canvas>
        </div>
        <div id="reportSummary">
           <h2>Summary</h2>
           <p>${currentReport.summaryComment}</p>
        </div>
        <div class="report-buttons" style="margin-bottom: 50px;">
           <button id="exportReport">Export Report</button>
           <button id="backToDashboard">Back to Dashboard</button>
        </div>
      </div>
    `;
    AppHelper.showPage(reportHTML);
    renderReportCalendar(daysInMonth, currentReport.calendarState);
    renderMonthlyCharts(currentReport.dailyDuration, currentReport.dailyCalories, daysInMonth);
    
    document.getElementById('exportReport').addEventListener('click', () => {
      exportMonthlyReport(currentReport, pet.petDetails.name || "Unnamed_Pet");
    });
    document.getElementById('backToDashboard').addEventListener('click', () => {
      PetEntryModule.showExerciseLog();
    });
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
          x: { title: { display: true, text: 'Day of Month' } },
          y: {
            min: 0,
            ticks: {
              stepSize: 10,
              max: 90,
              callback: value => value + ' m'
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
          x: { title: { display: true, text: 'Day of Month' } },
          y: { title: { display: true, text: 'Calories' } }
        }
      }
    });
  }
  
  function exportMonthlyReport(report, petName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${petName}_${report.monthName}_${report.year}_Monthly_Report.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  
  return { updateCurrentMonthlyReport, generateMonthlyReport };
})();


/* =============================================
   MODULE: ServiceWorkerModule [Color: Yellow]
   - Registers the service worker and handles connectivity events.
============================================= */
const ServiceWorkerModule = (function() {
  function registerServiceWorker() {
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
  }
  
  window.addEventListener('online', () => {
    console.log('You are online');
    location.reload();
  });
  
  window.addEventListener('offline', () => {
    console.log('You are offline');
    alert('It seems like you\'re not connected to the internet. Please check your connection');
  });
  
  return { registerServiceWorker };
})();


/* =============================================
   MODULE: Initialization [Color: Gray]
   - Sets up initial event listeners and loads the appropriate view.
============================================= */
(function() {
  function logout() {
    sessionStorage.removeItem('user');
    alert('You have been logged out.');
    AuthModule.showSignIn();
  }
  AppHelper.logout = logout;
  
  document.addEventListener('DOMContentLoaded', () => {
    ServiceWorkerModule.registerServiceWorker();
    if (sessionStorage.getItem('user')) {
      PetEntryModule.showExerciseLog();
    } else {
      AuthModule.showSignIn();
    }
  });
})();
