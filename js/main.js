import { Auth } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/auth.js'; // Correct import for named exports
import { 
  getPetData,
  savePetData,
  toggleMode,
  applySavedTheme,
  registerServiceWorker
} from 'https://drkimogad.github.io/Pet-Exercise-Log/js/helper.js';  // helper functions

import { Calendar } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/calendar.js';  // Import Calendar from calendar.js
import { Report } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/monthlyReport.js';  // Import Report from monthlyReport.js
import { MoodLogs } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/moodLogs.js';  // Import MoodLogs from moodLogs.js

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
