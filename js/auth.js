import * as PetEntry from 'https://drkimogad.github.io/Pet-Exercise-Log/js/petEntry.js';
import dataService from 'https://drkimogad.github.io/Pet-Exercise-Log/js/dataService.js';
"use strict";

/* ==================== */
/* 0. Error Handling Setup */
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
/* 1. Core Functionality */
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
      navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
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
/* 2. Theme Management */
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

/* ==================== */
/* 3. Auth Module */
/* ==================== */
const Auth = (function() {
  let currentUser = null;

  async function hashPassword(pass, salt) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(salt ? pass + salt : pass);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      ErrorHandler.handle(error, 'Password Hashing');
      throw new Error('Password processing failed');
    }
  }

  function authTemplate(isSignUp) {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>${isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <form id="authForm" class="auth-form">
            ${isSignUp ? `
              <div class="form-group">
                <label for="username">Name</label>
                <input type="text" id="username" name="username" required>
              </div>` : ''}
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required minlength="8">
            </div>
            ${isSignUp ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
              </div>` : ''}
            <button type="submit" class="auth-btn">${isSignUp ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <div class="auth-switch">
            ${isSignUp ? 'Have an account?' : 'New user?'}
            <a href="#" id="switchAuth">${isSignUp ? 'Sign In' : 'Sign Up'}</a>
          </div>
        </div>
      </div>`;
  }

  async function handleAuthSubmit(e, isSignUp) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      form.querySelectorAll('.error-text').forEach(el => el.remove());

      // Validation logic
      const email = form.email.value;
      const password = form.password.value;
      const errors = [];

      if (isSignUp) {
        const username = form.username?.value;
        const confirmPassword = form.confirmPassword?.value;
        if (!username) errors.push('Name is required');
        if (password !== confirmPassword) errors.push('Passwords must match');
      }

      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) errors.push('Invalid email format');
      if (password.length < 8) errors.push('Password must be at least 8 characters');

      if (errors.length > 0) {
        errors.forEach(error => {
          AppHelper.showError(error);
        });
        return;
      }

      if (isSignUp) {
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const hashedPassword = await hashPassword(password, salt);

        const users = dataService.getUsers() || []; // Use dataService
        if (users.some(u => u.email === email)) {
          throw new Error('User already exists');
        }

        const newUser = { email, username: form.username?.value, password: hashedPassword, salt };
        dataService.saveUser(newUser); // Use dataService

        AppHelper.showSuccess('Account created! Please sign in.');
        showAuth(false);
        return;
      }

      // Sign-in logic
      const users = dataService.getUsers() || []; // Use dataService
      const user = users.find(u => u.email === email);
      if (!user) throw new Error('User not found');
      if (await hashPassword(password, user.salt) !== user.password) throw new Error('Invalid password');

      currentUser = {
        email: user.email,
        username: user.username,
        lastLogin: new Date().toISOString()
      };
      sessionStorage.setItem('user', JSON.stringify(currentUser));

      // Initialize dashboard with error handling
      try {
        initDashboard();
      } catch (dashboardError) {
        ErrorHandler.handle(dashboardError, 'Dashboard Initialization');
        sessionStorage.removeItem('user');
        showAuth(false);
        AppHelper.showError('Failed to initialize dashboard. Please try again.');
      }

    } catch (error) {
      AppHelper.showError(error.message || 'Authentication failed');
      ErrorHandler.handle(error, isSignUp ? 'Signup' : 'Login');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  }

  function showAuth(isSignUp = false) {
    try {
      const appContainer = document.getElementById('app');
      appContainer.innerHTML = authTemplate(isSignUp);

      const form = document.getElementById('authForm');
      form?.addEventListener('submit', (e) => handleAuthSubmit(e, isSignUp));

      document.getElementById('switchAuth')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuth(!isSignUp);
      });
    } catch (error) {
      ErrorHandler.handle(error, 'Auth UI Render');
      ErrorHandler.showFatalError('Authentication system failed. Please reload.');
    }
  }

  function logout() {
    try {
      sessionStorage.removeItem('user');
      showAuth(false);
    } catch (error) {
      ErrorHandler.handle(error, 'Logout');
      location.reload();
    }
  }

  return {
    showAuth,
    logout,
    toggleMode
  };
})();

/* ==================== */
/* 4. App Helper */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    const app = document.getElementById('app');
    app.style.opacity = 0;
    setTimeout(() => {
      app.innerHTML = content;
      app.style.opacity = 1;
    }, 50);
  },

  showModal: (content) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${content}
        <button class="close-modal">Close</button>
      </div>`;
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  },

  showError: (message) => {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  },

  showSuccess: (message) => {
    const success = document.createElement('div');
    success.className = 'success-message';
    success.textContent = message;
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 3000);
  }
};

// Initialization
applySavedTheme();
registerServiceWorker();

// Check if user is logged in
if (sessionStorage.getItem('user')) {
  try {
    initDashboard();
  } catch (error) {
    ErrorHandler.handle(error, 'Dashboard Init on Load');
    Auth.showAuth(false);
    AppHelper.showError('Failed to load dashboard.');
  }
} else {
  Auth.showAuth(false);
}
