import { auth } from './js/auth.js';  // auth handling
import { 
  getPetData,
  savePetData,
  updateCharts,
  saveProfile,
  toggleMode,
  applySavedTheme,
  registerServiceWorker
} from './js/helper.js';  // helper functions

import { Calendar } from './js/calendar.js';  // Import Calendar from calendar.js
import { Report } from './js/monthlyReport.js';  // Import Report from monthlyReport.js
import { MoodLogs } from './js/moodLogs.js';  // Import MoodLogs from moodLogs.js


// setting up main logic //

// Function to sign the user in
function handleSignIn() {
  signIn();  // Calls signIn function from auth.js
}

// Function to sign out
function handleSignOut() {
  signOut();  // Calls signOut function from auth.js
}

// Handling getting the current user
function loadCurrentUser() {
  const user = getCurrentUser();  // Calls getCurrentUser function from auth.js
  if (user) {
    console.log("User logged in:", user);
  } else {
    console.log("No user logged in.");
  }
}

// For displaying and saving pet data
function loadPetData() {
  const petData = getPetData();  // Calls getPetData function from dataService.js
  console.log("Pet Data:", petData);
}

function savePetDataHandler(data) {
  savePetData(data);  // Calls savePetData function from dataService.js
  updateCharts();  // Call to update charts after saving data
}

// Function to handle profile saving
function saveUserProfile(profileData) {
  saveProfile(profileData);  // Calls saveProfile function from savedProfiles.js
}

// Event Listeners//
// Add event listeners for the buttons
document.querySelector("#signInButton").addEventListener("click", handleSignIn);
document.querySelector("#signOutButton").addEventListener("click", handleSignOut);
document.querySelector("#savePetDataButton").addEventListener("click", () => {
  const petData = collectPetData();  // Function that collects pet data (from a form, etc.)
  savePetDataHandler(petData);
});
document.querySelector("#saveUserProfileButton").addEventListener("click", () => {
  const profileData = collectProfileData();  // Function that collects user profile data
  saveUserProfile(profileData);
});
