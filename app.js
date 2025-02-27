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

/* ============================================================
   AUTHENTICATION FUNCTIONS (FIXED)
============================================================ */
function showSignUp() {
  const signUpPage = `
    <div id="signup">
      <h1>Sign Up</h1>
      <form id="signUpForm">
        <input type="text" id="signUpUsername" placeholder="Username" required>
        <input type="password" id="signUpPassword" placeholder="Password" required>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="#" id="goToSignIn">Sign In</a></p>
    </div>
  `;
  showPage(signUpPage);
  
  document.getElementById('signUpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = {
      username: document.getElementById('signUpUsername').value,
      password: await hashPassword(document.getElementById('signUpPassword').value)
    };
    sessionStorage.setItem('user', JSON.stringify(user));
    showExerciseLog();
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
        <input type="text" id="signInUsername" placeholder="Username" required>
        <input type="password" id="signInPassword" placeholder="Password" required>
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="goToSignUp">Sign Up</a></p>
    </div>
  `;
  showPage(signInPage);
  
  document.getElementById('signInForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const storedUser = JSON.parse(sessionStorage.getItem('user'));
    const inputUser = {
      username: document.getElementById('signInUsername').value,
      password: await hashPassword(document.getElementById('signInPassword').value)
    };
    
    if (storedUser && storedUser.password === inputUser.password) {
      showExerciseLog();
    } else {
      alert('Invalid credentials');
    }
  });
}

/* ============================================================
   PET FORM MANAGEMENT (FIXED)
============================================================ */
function showExerciseLog() {
  if (!isLoggedIn()) {
    showSignIn();
    return;
  }

  const pet = getActivePet();
  const dashboardHTML = `
    <div id="exerciseLog">
      <form id="exerciseForm">
        <!-- Pet Details -->
        <input type="text" id="petName" value="${pet?.petDetails?.name || ''}" required>
        <input type="file" id="petImage" accept="image/*">
        <img id="petImagePreview" src="${pet?.petDetails?.image || ''}">
        <textarea id="petCharacteristics">${pet?.petDetails?.characteristics || ''}</textarea>
        
        <!-- Exercise Form -->
        <input type="text" id="exerciseType" placeholder="Exercise type">
        <input type="number" id="exerciseDuration" min="1" required>
        <input type="date" id="exerciseDate" max="${new Date().toISOString().split('T')[0]}" required>
        <button type="submit">${pet ? 'Update' : 'Create'} Profile</button>
      </form>
      <div id="savedProfiles"></div>
    </div>
  `;
  showPage(dashboardHTML);

  // Initialize form with pet data
  if (pet) {
    document.getElementById('petName').value = pet.petDetails.name;
    document.getElementById('petCharacteristics').value = pet.petDetails.characteristics;
  }

  // Handle image upload
  document.getElementById('petImage').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('petImagePreview').src = reader.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  });

  // Form submission
  document.getElementById('exerciseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    savePetProfile();
  });

  loadSavedProfiles();
  generateCalendar();
}

/* ============================================================
   CORRECTED PROFILE SAVING
============================================================ */
function savePetProfile() {
  const pets = getPets();
  const pet = getActivePet() || {
    petDetails: { name: '', image: '', characteristics: '' },
    exercises: []
  };

  // Update pet details
  pet.petDetails = {
    name: document.getElementById('petName').value,
    image: document.getElementById('petImagePreview').src,
    characteristics: document.getElementById('petCharacteristics').value
  };

  // Add new exercise
  pet.exercises.push({
    type: document.getElementById('exerciseType').value,
    duration: document.getElementById('exerciseDuration').value,
    date: document.getElementById('exerciseDate').value
  });

  // Update storage
  if (activePetIndex === null) {
    if (pets.length >= MAX_PETS) {
      alert('Maximum pets reached!');
      return;
    }
    pets.push(pet);
    activePetIndex = pets.length - 1;
  }
  setPets(pets);
  
  loadSavedProfiles();
  generateCalendar();
}

/* ============================================================
   IMPROVED CALENDAR GENERATION
============================================================ */
function generateCalendar() {
  const pet = getActivePet();
  if (!pet) return;

  const calendarDiv = document.getElementById('exerciseCalendar');
  calendarDiv.innerHTML = '';
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const exerciseDates = pet.exercises
    .map(ex => new Date(ex.date).getDate())
    .filter(d => new Date(ex.date).getMonth() === now.getMonth());

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.innerHTML = `
      <span>${day}</span>
      <input type="checkbox" ${exerciseDates.includes(day) ? 'checked' : ''} disabled>
    `;
    calendarDiv.appendChild(dayElement);
  }
}

/* ============================================================
   SERVICE WORKER REGISTRATION (FIXED)
============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// Remaining helper functions (hashPassword, loadSavedProfiles, etc.) 
// should follow the same pattern with proper error handling
// and DOM element existence checks
