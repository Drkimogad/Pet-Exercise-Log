/* =======================================
   Global Variables & Constants
   ======================================= */
let editingProfileIndex = null;
let db = null; // IndexedDB instance
const SALT = "YourUniqueSaltValue"; // Change this to a more unique value in production

/* =======================================
   Section: Security & Utility Functions
   ======================================= */

// Simple input sanitization to prevent XSS
function sanitize(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Hash the password using SHA-256 with a salt
async function hashPassword(password, salt = SALT) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/* =======================================
   Section: IndexedDB Operations
   ======================================= */

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('petExerciseDB', 1);
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('petProfiles')) {
        db.createObjectStore('petProfiles', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
      reject(event);
    };
  });
}

function addPetProfile(profile) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    const request = store.add(profile);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function updatePetProfile(id, profile) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    profile.id = id; // ensure we maintain the same id
    const request = store.put(profile);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function deletePetProfile(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readwrite');
    const store = transaction.objectStore('petProfiles');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
  });
}

function getAllProfiles() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readonly');
    const store = transaction.objectStore('petProfiles');
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
}
// ... other IndexedDB operations ...

function getAllProfiles() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['petProfiles'], 'readonly');
    const store = transaction.objectStore('petProfiles');
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
}

// Insert the getPetProfileByName function here
async function getPetProfileByName(petName) {
  try {
    const profiles = await getAllProfiles();
    return profiles.find(profile => profile.petName === petName);
  } catch (error) {
    console.error('Error retrieving pet profile by name:', error);
    return null;
  }
}

/* =======================================
   Section: Authentication (Sign Up / Sign In)
   ======================================= */

// Basic function to swap pages by updating the main container's innerHTML
function showPage(pageHTML) {
    console.log("Rendering page:", pageHTML); // Log the content being rendered
    document.getElementById('app').innerHTML = pageHTML;
}

function showSignUp() {
  const signUpPage = `
    <div id="content">
      <blockquote>
        <p>Regular exercise is vital for your pet's health...</p>
      </blockquote>
      <h3>Please sign in or sign up to start tracking your pet's activities.</h3>
    </div>
    <div id="formContainer">
      <h1>Sign Up</h1>
      <form id="signUpForm">
        <label for="signUpUsername">Username:</label>
        <input type="text" id="signUpUsername" required><br><br>
        <label for="signUpPassword">Password:</label>
        <input type="password" id="signUpPassword" required><br><br>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="#" id="goToSignIn">Sign In</a></p>
    </div>
  `;
  showPage(signUpPage);

  document.getElementById('signUpForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = sanitize(document.getElementById('signUpUsername').value);
    const passwordRaw = document.getElementById('signUpPassword').value;
    const password = await hashPassword(passwordRaw);

    if (username && password) {
      sessionStorage.setItem('user', JSON.stringify({ username, password }));
      alert('Sign up successful!');
      showSignIn();
    } else {
      alert('Please fill in all fields.');
    }
  });

  document.getElementById('goToSignIn').addEventListener('click', (e) => {
    e.preventDefault();
    showSignIn();
  });
}

function showSignIn() {
  const signInPage = `
    <div id="content">
      <blockquote>
        <p>Regular exercise is vital for your pet's health...</p>
      </blockquote>
      <h3>Please sign in or sign up to start tracking your pet's activities.</h3>
    </div>
    <div id="formContainer">
      <h1>Sign In</h1>
      <form id="signInForm">
        <label for="signInUsername">Username:</label>
        <input type="text" id="signInUsername" required><br><br>
        <label for="signInPassword">Password:</label>
        <input type="password" id="signInPassword" required><br><br>
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="goToSignUp">Sign Up</a></p>
    </div>
  `;
  showPage(signInPage);

  document.getElementById('signInForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = sanitize(document.getElementById('signInUsername').value);
    const passwordRaw = document.getElementById('signInPassword').value;
    const password = await hashPassword(passwordRaw);
    const user = JSON.parse(sessionStorage.getItem('user'));

    if (user && user.username === username && user.password === password) {
      alert('Sign in successful!');
      showExerciseLog();
    } else {
      alert('Invalid credentials, please try again.');
    }
  });

  document.getElementById('goToSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    showSignUp();
  });
}

/* =======================================
   Section: Calendar and Chart Rendering
   ======================================= */

// Function to update exercise log and chart
async function handleProfileSave(event) {
  event.preventDefault();
  const petName = sanitize(document.getElementById('petName').value);
  const exerciseDate = sanitize(document.getElementById('exerciseDate').value);
  const exerciseDuration = sanitize(document.getElementById('exerciseDuration').value);
  const caloriesBurned = sanitize(document.getElementById('caloriesBurned').value);

  const petProfile = await getPetProfileByName(petName);
  if (!petProfile) {
    alert("Pet profile not found!");
    return;
  }

  // Update exercise and calendar for the pet
  petProfile.exercises.push({
    date: exerciseDate,
    duration: exerciseDuration,
    caloriesBurned: caloriesBurned
  });

  if (!petProfile.calendar.includes(exerciseDate)) {
    petProfile.calendar.push(exerciseDate); // Mark the date as exercised
  }

  // Calculate average exercise duration and calories burned
  const totalDuration = petProfile.exercises.reduce((acc, exercise) => acc + parseInt(exercise.duration, 10), 0);
  const totalCalories = petProfile.exercises.reduce((acc, exercise) => acc + parseInt(exercise.caloriesBurned, 10), 0);

  petProfile.averageExerciseDuration = totalDuration / petProfile.exercises.length;
  petProfile.averageCaloriesBurned = totalCalories / petProfile.exercises.length;

  // Save updated profile to IndexedDB
  await updatePetProfile(petProfile.id, petProfile);

  // Update chart and monthly report
  renderExerciseGraph();
  generateMonthlyReport();
}

// Function to render the exercise chart
async function renderExerciseGraph() {
  const profiles = await getAllProfiles();
  const labels = profiles.map(profile => profile.petName);
  const exerciseData = profiles.map(profile => profile.exercises.reduce((acc, exercise) => acc + parseInt(exercise.duration, 10), 0));
  const caloriesData = profiles.map(profile => profile.exercises.reduce((acc, exercise) => acc + parseInt(exercise.caloriesBurned, 10), 0));

  const ctx = document.getElementById('exerciseChart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Exercise Duration (min)',
          data: exerciseData,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.1)',
          fill: true
        },
        {
          label: 'Calories Burned',
          data: caloriesData,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { enabled: true },
        legend: { display: true }
      },
      scales: {
        x: { title: { display: true, text: 'Pet Name' } },
        y: { title: { display: true, text: 'Duration (min) / Calories' } }
      }
    }
  });
}

function generateMonthlyReport() {
  // Monthly report logic based on pet exercise data
  // Generate monthly report and display it
}
