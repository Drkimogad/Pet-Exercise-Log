// utils.js - Vanilla JS version (no imports/exports)
"use strict";

// ============ ERROR HANDLING ============
const ErrorHandler = {
  showFatalError: function(message) {
    document.body.innerHTML = `
      <div class="fatal-error">
        <h2>😿 Critical Application Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload App</button>
        <button onclick="ErrorHandler.clearStorage()">Reset Data</button>
      </div>
    `;
  },

  clearStorage: function() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    } catch (error) {
      this.showFatalError('Storage clearance failed: ' + error.message);
    }
  },

  handle: function(error, context) {
    console.error('[ERROR] ' + context + ':', error);
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

// ============ CORE UTILITIES ============
function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function(reg) { 
          console.log('SW registered:', reg); 
        })
        .catch(function(err) {
          ErrorHandler.handle(err, 'Service Worker Registration');
        });
    }
  } catch (error) {
    ErrorHandler.handle(error, 'Service Worker Setup');
  }
}

// ============ THEME MANAGEMENT ============
function toggleMode() {
  try {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));

    const toggleBtn = document.getElementById('toggleModeButton');
    if (toggleBtn) {
      toggleBtn.textContent = body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
    }
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

// ============ DATA HELPERS ============
function getPetData() {
  try {
    const data = JSON.parse(localStorage.getItem('petData'));
    return data || [];
  } catch (error) {
    ErrorHandler.handle(error, 'Get Pet Data');
    return [];
  }
}

function savePetData(data) {
  try {
    localStorage.setItem('petData', JSON.stringify(data));
    return true;
  } catch (error) {
    ErrorHandler.handle(error, 'Save Pet Data');
    return false;
  }
}

function saveProfile(profileData) {
  try {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    return true;
  } catch (error) {
    ErrorHandler.handle(error, 'Save Profile');
    return false;
  }
}

// ============ FORM HELPERS ============
function collectPetData() {
  try {
    const form = document.getElementById('petForm');
    if (!form) return null;
    
    const moodButton = document.querySelector('.mood-options button.selected');
    
    return {
      id: form.querySelector('#petId') ? form.querySelector('#petId').value : crypto.randomUUID(),
      name: form.querySelector('#petName') ? form.querySelector('#petName').value : '',
      image: document.getElementById('petImagePreview') ? 
             document.getElementById('petImagePreview').src : 'default-pet.png',
      characteristics: form.querySelector('#petCharacteristics') ? 
                      form.querySelector('#petCharacteristics').value : '',
      age: form.querySelector('#petAge') ? 
           parseInt(form.querySelector('#petAge').value) || 0 : 0,
      weight: form.querySelector('#petWeight') ? 
              parseInt(form.querySelector('#petWeight').value) || 0 : 0,
      healthStatus: form.querySelector('#petHealthStatus') ? 
                   form.querySelector('#petHealthStatus').value : 'healthy',
      allergies: form.querySelector('#petAllergies') ? 
                form.querySelector('#petAllergies').value : '',
      exerciseLevel: form.querySelector('#petExerciseLevel') ? 
                    form.querySelector('#petExerciseLevel').value : 'medium',
      favoriteExercise: form.querySelector('#petFavoriteExercise') ? 
                       form.querySelector('#petFavoriteExercise').value : 'walking',
      lastActivity: form.querySelector('#petLastActivity') ? 
                   form.querySelector('#petLastActivity').value : 'around_block',
      exerciseLocation: form.querySelector('#petExerciseLocation') ? 
                       form.querySelector('#petExerciseLocation').value : 'park',
      date: form.querySelector('#petDate') ? 
            form.querySelector('#petDate').value : new Date().toISOString().split('T')[0],
      exerciseDuration: form.querySelector('#petExerciseDuration') ? 
                       parseInt(form.querySelector('#petExerciseDuration').value) || 30 : 30,
      calories: form.querySelector('#petCalories') ? 
               parseInt(form.querySelector('#petCalories').value) || 150 : 150,
      mood: moodButton ? parseInt(moodButton.dataset.mood) : null
    };
  } catch (error) {
    ErrorHandler.handle(error, 'Collect Pet Data');
    return null;
  }
}

function collectProfileData() {
  try {
    // Implementation depends on your profile form structure
    return {};
  } catch (error) {
    ErrorHandler.handle(error, 'Collect Profile Data');
    return null;
  }
}

// ============ UTILITY FUNCTIONS ============
function debounce(func, wait) {
  let timeout;
  return function executedFunction() {
    const args = arguments;
    const later = function() {
      clearTimeout(timeout);
      func.apply(null, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDisplayDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateStr;
  }
}

function safeSelect(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn('Element not found:', selector);
    }
    return element;
  } catch (error) {
    ErrorHandler.handle(error, 'Element Selection');
    return null;
  }
}

function safeGetStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    ErrorHandler.handle(error, 'Storage Get');
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    ErrorHandler.handle(error, 'Storage Set');
    return false;
  }
}

// ============ GLOBAL SETUP ============
// Set up global error handling
window.addEventListener('error', function(event) {
  ErrorHandler.handle(event.error, 'Unhandled Error');
});

window.addEventListener('unhandledrejection', function(event) {
  ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
});

// Apply saved theme on load
document.addEventListener('DOMContentLoaded', function() {
  applySavedTheme();
});
