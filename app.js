"use strict";

/* ============================================================
   GLOBAL VARIABLES & STATE MANAGEMENT
============================================================ */
let activePetIndex = null;
const MAX_PETS = 10;

/* ============================================================
   STORAGE HELPER FUNCTIONS
============================================================ */
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

/* ============================================================
   HELPER FUNCTIONS
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
   AUTHENTICATION FUNCTIONS (UNCHANGED)
============================================================ */
// ... [Keep the existing authentication functions identical] ...

/* ============================================================
   UPDATED CALENDAR MANAGEMENT FUNCTIONS
============================================================ */
function generateCalendar() {
  const calendarDiv = document.getElementById('exerciseCalendar');
  calendarDiv.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pet = getActivePet();

  // Get exercise dates for current month
  const exerciseDates = pet?.exercises
    .filter(ex => {
      const exDate = new Date(ex.exerciseDate);
      return exDate.getMonth() === month && exDate.getFullYear() === year;
    })
    .map(ex => new Date(ex.exerciseDate).getDate()) || [];

  // Generate calendar days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    const isChecked = exerciseDates.includes(i) ? 'checked' : '';
    dayDiv.innerHTML = `
      <label>${i}</label>
      <input type="checkbox" id="day${i}" ${isChecked} disabled>
    `;
    calendarDiv.appendChild(dayDiv);
  }
}

/* ============================================================
   IMPROVED DASHBOARD CHART FUNCTIONS
============================================================ */
function renderDashboardCharts() {
  const pet = getActivePet();
  if (!pet) return;

  // Destroy existing charts if they exist
  if (window.durationChartDashboard) window.durationChartDashboard.destroy();
  if (window.caloriesChartDashboard) window.caloriesChartDashboard.destroy();

  // Process exercise data for charts
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dailyData = Array(daysInMonth).fill(0).map(() => ({
    duration: 0,
    calories: 0
  }));

  pet.exercises.forEach(ex => {
    const exDate = new Date(ex.exerciseDate);
    if (exDate.getMonth() === month && exDate.getFullYear() === year) {
      const day = exDate.getDate() - 1;
      dailyData[day].duration += parseInt(ex.exerciseDuration) || 0;
      dailyData[day].calories += parseInt(ex.caloriesBurned) || 0;
    }
  });

  // Create new charts
  const chartConfig = {
    type: 'line',
    options: {
      responsive: true,
      scales: { x: { title: { display: true, text: 'Day of Month' } } }
    }
  };

  window.durationChartDashboard = new Chart(
    document.getElementById('durationChartDashboard').getContext('2d'),
    {
      ...chartConfig,
      data: {
        labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
        datasets: [{
          label: 'Exercise Duration (minutes)',
          data: dailyData.map(d => d.duration),
          borderColor: '#4CAF50',
          tension: 0.1
        }]
      },
      options: {
        ...chartConfig.options,
        scales: {
          y: { title: { display: true, text: 'Minutes' } }
        }
      }
    }
  );

  window.caloriesChartDashboard = new Chart(
    document.getElementById('caloriesChartDashboard').getContext('2d'),
    {
      ...chartConfig,
      data: {
        labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
        datasets: [{
          label: 'Calories Burned',
          data: dailyData.map(d => d.calories),
          borderColor: '#F44336',
          tension: 0.1
        }]
      },
      options: {
        ...chartConfig.options,
        scales: {
          y: { title: { display: true, text: 'Calories' } }
        }
      }
    }
  );
}

/* ============================================================
   IMPROVED PET & EXERCISE MANAGEMENT
============================================================ */
function handleProfileSave(event) {
  event.preventDefault();
  
  // Validate form inputs
  const exerciseDate = document.getElementById('exerciseDate').value;
  const exerciseDuration = parseInt(document.getElementById('exerciseDuration').value);
  
  if (new Date(exerciseDate) > new Date()) {
    alert("Exercise date cannot be in the future!");
    return;
  }
  
  if (isNaN(exerciseDuration) || exerciseDuration <= 0) {
    alert("Please enter a valid duration!");
    return;
  }

  // Update pet data
  let pets = getPets();
  let pet = getActivePet() || {
    petDetails: {
      name: document.getElementById('petName').value,
      image: document.getElementById('petImagePreview').src,
      characteristics: document.getElementById('petCharacteristics').value
    },
    exercises: []
  };

  // Add new exercise
  pet.exercises.push({
    exerciseType: document.getElementById('exerciseType').value,
    exerciseDuration,
    exerciseDate,
    bodyconditionScoring: document.getElementById('bodyconditionScoring').value,
    exerciseTime: document.getElementById('exerciseTime').value,
    exerciseIntensity: document.getElementById('exerciseIntensity').value,
    caloriesBurned: document.getElementById('caloriesBurned').value,
    exerciseNotes: document.getElementById('exerciseNotes').value,
    exerciseLocation: document.getElementById('exerciseLocation').value
  });

  // Update storage
  if (activePetIndex === null) {
    if (pets.length >= MAX_PETS) {
      alert("Maximum number of pets reached!");
      return;
    }
    pets.push(pet);
    activePetIndex = pets.length - 1;
  }
  setPets(pets);

  // Update UI
  generateCalendar();
  renderDashboardCharts();
  loadSavedProfiles();
  alert("Exercise logged successfully!");
}

/* ============================================================
   UPDATED REPORT FUNCTIONS
============================================================ */
function generateMonthlyReport() {
  const pet = getActivePet();
  if (!pet) return;

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();

  const reportHTML = `
    <div id="monthlyReport">
      <h1>${monthName} ${year} Report for ${pet.petDetails.name}</h1>
      <div id="reportCalendar"></div>
      <div class="chart-container">
        <canvas id="durationChart"></canvas>
        <canvas id="caloriesChart"></canvas>
      </div>
      <button id="backToDashboard">Back to Dashboard</button>
    </div>
  `;
  showPage(reportHTML);

  // Render calendar with exercise days
  const calendarDiv = document.getElementById('reportCalendar');
  calendarDiv.innerHTML = '';
  const exerciseDates = pet.exercises
    .map(ex => new Date(ex.exerciseDate).getDate());
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day-report');
    dayDiv.textContent = `${i}${exerciseDates.includes(i) ? ' ✔' : ''}`;
    calendarDiv.appendChild(dayDiv);
  }

  // Render charts
  const dailyData = Array(daysInMonth).fill(0).map(() => ({
    duration: 0,
    calories: 0
  }));

  pet.exercises.forEach(ex => {
    const day = new Date(ex.exerciseDate).getDate() - 1;
    dailyData[day].duration += parseInt(ex.exerciseDuration) || 0;
    dailyData[day].calories += parseInt(ex.caloriesBurned) || 0;
  });

  new Chart(document.getElementById('durationChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Exercise Duration',
        data: dailyData.map(d => d.duration),
        backgroundColor: '#4CAF50'
      }]
    }
  });

  new Chart(document.getElementById('caloriesChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Calories Burned',
        data: dailyData.map(d => d.calories),
        backgroundColor: '#F44336'
      }]
    }
  });

  document.getElementById('backToDashboard').addEventListener('click', showExerciseLog);
}

/* ============================================================
   OTHER IMPROVED FUNCTIONS
============================================================ */
function loadSavedProfiles() {
  const pets = getPets();
  const container = document.getElementById('savedProfiles');
  container.innerHTML = '';

  pets.forEach((pet, index) => {
    const profile = document.createElement('div');
    profile.className = 'pet-profile';
    profile.innerHTML = `
      <h3>${pet.petDetails.name}</h3>
      <img src="${pet.petDetails.image}" alt="Pet image">
      <p>Exercises logged: ${pet.exercises.length}</p>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;

    profile.querySelector('.delete-btn').addEventListener('click', () => {
      pets.splice(index, 1);
      setPets(pets);
      loadSavedProfiles();
    });

    profile.querySelector('.edit-btn').addEventListener('click', () => {
      activePetIndex = index;
      showExerciseLog();
    });

    container.appendChild(profile);
  });
}

// ... [Keep remaining functions like authentication, service worker, etc.] ...

/* ============================================================
   INITIALIZATION
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showExerciseLog();
  } else {
    showSignIn();
  }
});
