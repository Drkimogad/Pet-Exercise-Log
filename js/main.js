import { Auth } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/auth.js'; // Correct import for named exports
import { 
  getPetData,
  savePetData,
  updateCharts,
  saveProfiles,
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
// Add this wrapper around your event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Helper function to safely add listeners
  function safeAddListener(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element ${selector} not found!`);
    }
  }

  // Add listeners safely
  safeAddListener("#signInButton", "click", handleSignIn);
  safeAddListener("#signOutButton", "click", handleSignOut);
  safeAddListener("#savePetDataButton", "click", () => {
    const petData = collectPetData();
    savePetDataHandler(petData);
  });
  safeAddListener("#saveUserProfileButton", "click", () => {
    const profileData = collectProfileData();
    saveUserProfile(profileData);
  });
});
