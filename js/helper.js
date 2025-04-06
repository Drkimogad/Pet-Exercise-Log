"use strict";

/* ==================== */
/*  Error Handling Setup */
/* ==================== */
const ErrorHandler = {
  showFatalError: (message) => {
    document.body.innerHTML = `
      <div class="fatal-error">
        <h2>😿 Critical Application Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload App</button>
        <button onclick="ErrorHandler.clearStorage()">Reset Data</button>
      </div>
    `;
  },

  clearStorage: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    } catch (error) {
      this.showFatalError(`Storage clearance failed: ${error.message}`);
    }
  },

  handle: (error, context = '') => {
    console.error(`%c[ERROR] ${context}:`, 'color: red;', error);
    if (!document.body.querySelector('.global-error')) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'global-error';
      errorDiv.innerHTML = `
        <div class="error-content">
          <p>⚠️ ${context}: ${error.message}</p>
          <button onclick="this.parentElement.remove()">Dismiss</button>
        </div>
      `;
      document.body.appendChild(errorDiv);
    }
  }
};

// Global error listeners
window.addEventListener('error', (event) => {
  ErrorHandler.handle(event.error, 'Unhandled Error');
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
});

/* ==================== */
/*  Core Functionality */
/* ==================== */
let deferredPrompt;
let installButtonAdded = false;

window.addEventListener('beforeinstallprompt', (e) => {
  try {
    if (installButtonAdded) return;
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.createElement('button');
    installBtn.id = 'installButton';
    installBtn.textContent = 'Install App';
    installBtn.className = 'install-btn';
    installBtn.style.display = 'block';

    const footer = document.querySelector('footer');
    if (footer) footer.prepend(installBtn);
    installButtonAdded = true;
  } catch (error) {
    ErrorHandler.handle(error, 'Install Prompt');
  }
});

function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('https://drkimogad.github.io/Pet-Exercise-Log/service-worker.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => {
          ErrorHandler.handle(err, 'Service Worker Registration');
          AppHelper.showError('Offline capabilities disabled. Check internet connection.');
        });
    }
  } catch (error) {
    ErrorHandler.handle(error, 'Service Worker Setup');
  }
}

/* ==================== */
/*  Theme Management */
/* ==================== */
function toggleMode() {
  try {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));

    const toggleBtn = document.getElementById('toggleModeButton');
    if (toggleBtn) toggleBtn.textContent = body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';

    if (typeof Charts !== 'undefined') Charts.updateColors();
  } catch (error) {
    ErrorHandler.handle(error, 'Theme Toggle');
  }
}

function applySavedTheme() {
  try {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    }
  } catch (error) {
    ErrorHandler.handle(error, 'Theme Initialization');
    localStorage.removeItem('darkMode');
  }
}

//* helper functions*//
// Function to get pet data
  export function getPetData() {
  console.log("Fetching pet data...");
  try {
    const data = JSON.parse(localStorage.getItem("petData"));
    return data || []; // Return an empty array if nothing is found
  } catch (error) {
    ErrorHandler.handle(error, 'Get Pet Data');
    return [];
  }
}

// Function to save pet data
 export function savePetData(data) {
  console.log("Saving pet data:", data);
  try {
    localStorage.setItem("petData", JSON.stringify(data));
  } catch (error) {
    ErrorHandler.handle(error, 'Save Pet Data');
  }
}

// Function to update charts
  // You’ll replace this later with actual chart update logic
import { renderCharts } from 'https://drkimogad.github.io/Pet-Exercise-Log/js/charts.js';
 export function updateCharts() {
  const data = getPetData(); // Get current data
  renderCharts(data);        // Update chart with latest data
  }

// Function to save user profile
export function saveProfiles(profileData) {
  console.log("Saving user profile:", profileData);
  try {
    localStorage.setItem("userProfile", JSON.stringify(profileData));
  } catch (error) {
    ErrorHandler.handle(error, 'Save Profile');
  }
}

//* exportation*//
export {
  getPetData,
  savePetData,
  updateCharts,
  saveProfiles, // Corrected export name
  toggleMode,
  applySavedTheme,
  registerServiceWorker
};

