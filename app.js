"use strict";

// ============================================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// ============================================================
let activePetId = null;
const MAX_PETS = 10;

// ============================================================
// STORAGE HELPER FUNCTIONS
// ============================================================
function getPetProfiles() {
  return JSON.parse(localStorage.getItem("petProfiles")) || [];
}

function setPetProfiles(profiles) {
  localStorage.setItem("petProfiles", JSON.stringify(profiles));
}

function getExercises() {
  return JSON.parse(localStorage.getItem("exercises")) || [];
}

function setExercises(exercises) {
  localStorage.setItem("exercises", JSON.stringify(exercises));
}

function getActivePet() {
  const profiles = getPetProfiles();
  return profiles.find(profile => profile.id === activePetId) || null;
}

function updateActivePet(updatedPet) {
  let profiles = getPetProfiles();
  const index = profiles.findIndex(profile => profile.id === updatedPet.id);
  if (index !== -1) {
    profiles[index] = updatedPet;
    setPetProfiles(profiles);
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
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

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================
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

// ============================================================
// DASHBOARD / EXERCISE LOG PAGE & EVENT LISTENERS
// ============================================================
function showExerciseLog() {
  if (!isLoggedIn()) {
    alert('Please sign in first.');
    showSignIn();
    return;
  }
  
  // When showing the exercise log, include the pet management UI.
  let activePet = getActivePet();
  const dashboardHTML = `
    <div id="exerciseLog">
      <h1>Pet Exercise Tracker</h1>
      <div id="editFormContainer">
        <form id="editForm">
          <fieldset>
            <legend>Pet Details</legend>
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" value="${activePet ? activePet.petDetails.name : ''}" required>
            <br>
            <label for="petAge">Age:</label>
            <input type="number" id="petAge" value="${activePet ? activePet.petDetails.age : ''}" required>
            <br>
            <label for="petType">Type:</label>
            <input type="text" id="petType" value="${activePet ? activePet.petDetails.type : ''}" required>
            <br>
            <label for="petBreed">Breed:</label>
            <input type="text" id="petBreed" value="${activePet ? activePet.petDetails.breed : ''}" required>
            <br>
            <label for="petImage">Upload Pet Image:</label>
            <input type="file" id="petImage" accept="image/*">
            <br>
            <img id="petImagePreview" style="max-width: 100px;" src="${activePet ? activePet.petDetails.image : ''}" alt="Pet Image Preview" />
            <br>
          </fieldset>
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
            <label for="caloriesBurned">Calories Burned:</label>
            <input type="number" id="caloriesBurned" placeholder="e.g., 150" required>
            <br>
            <label for="exerciseNotes">Notes/Comments:</label>\n            <textarea id="exerciseNotes" placeholder=\"Any observations or details\"></textarea>\n            <br>\n          </fieldset>\n          <button type=\"button\" id=\"saveProfile\">Save Profile</button>\n          <button type=\"button\" id=\"addExercise\">Add Exercise</button>\n        </form>\n      </div>\n      <div id=\"savedPetsContainer\">\n        <h2>Saved Pet Profiles</h2>\n        <div id=\"savedPets\"></div>\n      </div>\n      <button id=\"addNewProfile\">Add New Profile</button>\n      <button id=\"logoutButton\">Logout</button>\n    </div>\n  `;

  showPage(dashboardHTML);

  // Attach event listeners
  document.getElementById('saveProfile').addEventListener('click', handleProfileSave);
  document.getElementById('addExercise').addEventListener('click', handleAddExercise);
  document.getElementById('addNewProfile').addEventListener('click', () => {
    // Switch to "new profile" mode: hide saved profiles and reset the form.
    document.getElementById('savedPetsContainer').style.display = 'none';
    document.getElementById('editForm').reset();
    activePetId = null;
  });
  document.getElementById('logoutButton').addEventListener('click', logout);
  
  // Initialize pet image preview handler
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
  
  renderSavedProfiles();
}

// ============================================================
// PET & EXERCISE MANAGEMENT FUNCTIONS
// ============================================================
function handleProfileSave() {
  // Get pet details
  const petName = document.getElementById('petName').value.trim();
  const petAge = document.getElementById('petAge').value.trim();
  const petType = document.getElementById('petType').value.trim();
  const petBreed = document.getElementById('petBreed').value.trim();
  const petImagePreview = document.getElementById('petImagePreview').src;

  if (!petName || !petAge || !petType || !petBreed) {
    alert('Please fill in all pet details.');
    return;
  }

  let petProfiles = getPetProfiles();
  let currentPet;

  if (activePetId) {
    // Update existing pet profile
    currentPet = petProfiles.find(p => p.id === activePetId);
    if (currentPet) {
      currentPet.petDetails = {
        name: petName,
        age: petAge,
        type: petType,
        breed: petBreed,
        image: petImagePreview
      };
    }
  } else {
    // Create new pet profile
    if (petProfiles.length >= MAX_PETS) {
      alert('Maximum number of pet profiles reached.');
      return;
    }
    currentPet = {
      id: Date.now(),
      petDetails: {
        name: petName,
        age: petAge,
        type: petType,
        breed: petBreed,
        image: petImagePreview
      },
      exercises: []
    };
    petProfiles.push(currentPet);
    activePetId = currentPet.id;
  }

  setPetProfiles(petProfiles);
  alert('Profile saved successfully!');
  renderSavedProfiles();
}

function handleAddExercise() {
  // Get exercise details
  const exerciseDate = document.getElementById('exerciseDate').value;
  const exerciseDuration = document.getElementById('exerciseDuration').value;
  const caloriesBurned = document.getElementById('caloriesBurned').value;
  const exerciseType = document.getElementById('exerciseType').value.trim();
  const exerciseNotes = document.getElementById('exerciseNotes').value.trim();

  if (!exerciseDate || !exerciseDuration || !caloriesBurned) {
    alert('Please fill in Date, Duration, and Calories Burned.');
    return;
  }

  let petProfiles = getPetProfiles();
  let currentPet = petProfiles.find(p => p.id === activePetId);
  if (!currentPet) {
    alert('No active pet profile found. Please save a pet profile first.');
    return;
  }

  // Add exercise entry to current pet
  currentPet.exercises.push({
    exerciseType,
    exerciseDate,
    exerciseDuration,
    caloriesBurned,
    exerciseNotes
  });

  setPetProfiles(petProfiles);
  alert('Exercise added successfully!');
  renderSavedProfiles();
}

function renderSavedProfiles() {
  const petProfiles = getPetProfiles();
  const savedPetsDiv = document.getElementById('savedPets');
  if (!savedPetsDiv) return;
  savedPetsDiv.innerHTML = '';
  petProfiles.forEach(pet => {
    savedPetsDiv.innerHTML += `
      <div class="pet-profile">
        <h3>${pet.petDetails.name}</h3>
        <img src="${pet.petDetails.image}" alt="Pet Image" style="max-width: 100px;" />
        <p>Age: ${pet.petDetails.age}</p>
        <p>Type: ${pet.petDetails.type}</p>
        <p>Breed: ${pet.petDetails.breed}</p>
        <p>Exercises: ${pet.exercises.length}</p>
        <button onclick="editPetProfile(${pet.id})">Edit</button>
        <button onclick="deletePetProfile(${pet.id})">Delete</button>
      </div>
    `;
  });
}

function editPetProfile(petId) {
  activePetId = petId;
  showExerciseLog();
}

function deletePetProfile(petId) {
  let petProfiles = getPetProfiles();
  petProfiles = petProfiles.filter(p => p.id !== petId);
  setPetProfiles(petProfiles);
  if (activePetId === petId) activePetId = null;
  renderSavedProfiles();
}

// ============================================================
// SERVICE WORKER & CONNECTIVITY
// ============================================================
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

// ============================================================
// LOGOUT & INITIALIZATION
// ============================================================
function logout() {
  sessionStorage.removeItem('user');
  alert('You have been logged out.');
  showSignIn();
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showExerciseLog();
  } else {
    showSignIn();
  }
});
