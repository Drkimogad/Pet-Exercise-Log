"use strict";

/* ==================== */
/* 1  Core Functionality  */
/* ==================== */
let deferredPrompt;
let installButtonAdded = false;

window.addEventListener('beforeinstallprompt', (e) => {
  if (installButtonAdded) return;

  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.createElement('button');
  installBtn.id = 'installButton';
  installBtn.textContent = 'Install App';
  installBtn.className = 'install-btn';
  installBtn.style.display = 'block';

  const footer = document.querySelector('footer');
  if (footer) {
    footer.prepend(installBtn);
  }
  installButtonAdded = true;
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  }
}

/* ==================== */
/* 2  Theme Management    */
/* ==================== */
function toggleMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');

  // Persist state
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);

  // Update button text - Ensure we target the button in the PetEntry dashboard
  const toggleBtn = document.getElementById('toggleModeButton');
  if (toggleBtn) {
    toggleBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }

  // Update charts - Assuming Charts is globally accessible
  if (typeof Charts !== 'undefined') {
    Charts.updateColors();
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    document.body.classList.add('dark-mode');
  }
}

/* ==================== */
/* 3  Initialization      */
/* ==================== */
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  registerServiceWorker();

  // Correct initialization sequence: Show signup form if not authenticated
  if (!sessionStorage.getItem('user')) {
    Auth.showAuth(true); // Show signup form
  } else {
    // Only load PetEntry if authenticated, with a small delay
    setTimeout(PetEntry.showExerciseLog, 50);
  }
});

/* ==================== */
/* 4 Auth Module         */
/* ==================== */
const Auth = (function() {
  let currentUser = null;

  async function hashPassword(pass, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt ? pass + salt : pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      form.querySelectorAll('.error-text').forEach(el => el.remove());

      const email = form.email.value;
      const password = form.password.value;
      const errors = [];

      if (isSignUp) {
        const username = form.username?.value;
        const confirmPassword = form.confirmPassword?.value;

        if (!username) errors.push('Name is required');
        if (password !== confirmPassword) errors.push('Passwords must match');
      }

      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('Invalid email format');
      }

      if (password.length < 8) errors.push('Password must be at least 8 characters');

      if (errors.length > 0) {
        errors.forEach(error => {
          const errorElement = document.createElement('p');
          errorElement.className = 'error-text';
          errorElement.textContent = error;
          errorElement.style.color = 'var(--error)';
          form.appendChild(errorElement);
        });
        return;
      }

      if (isSignUp) {
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const hashedPassword = await hashPassword(password, salt);

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push({ email, username: form.username?.value, password: hashedPassword, salt });
        localStorage.setItem('users', JSON.stringify(users));

        const successElement = document.createElement('p');
        successElement.className = 'success-text';
        successElement.textContent = 'Account created! Please sign in.';
        form.appendChild(successElement);

        setTimeout(() => showAuth(false), 1500);
        return;
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);

      if (!user) throw new Error('User not found');
      if (await hashPassword(password, user.salt) !== user.password) throw new Error('Invalid password');

      currentUser = { email: user.email, username: user.username, lastLogin: new Date().toISOString() };
      sessionStorage.setItem('user', JSON.stringify(currentUser));
      // Call PetEntry.showExerciseLog with a small delay
      setTimeout(PetEntry.showExerciseLog, 50);

    } catch (error) {
      const errorElement = document.createElement('p');
      errorElement.className = 'error-text';
      errorElement.textContent = error.message || 'Authentication failed';
      errorElement.style.color = 'var(--error)';
      form.appendChild(errorElement);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  }

  function showAuth(isSignUp = false) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = '';
    appContainer.style.opacity = 0;
    appContainer.innerHTML = authTemplate(isSignUp);
    setTimeout(() => appContainer.style.opacity = 1, 50);

    const form = document.getElementById('authForm');
    form.addEventListener('submit', (e) => handleAuthSubmit(e, isSignUp));

    document.getElementById('switchAuth').addEventListener('click', (e) => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  return {
    showAuth,
    logout: () => {
      sessionStorage.removeItem('user');
      showAuth(false);
    },
    toggleMode: toggleMode // Expose toggleMode to be accessible globally
  };
})();

/* ==================== */
/* 5 App Helper          */
/* ==================== */
const AppHelper = {
  showPage: (content) => {
    const app = document.getElementById('app');
    app.style.opacity = 0;
    app.innerHTML = content;
    setTimeout(() => app.style.opacity = 1, 50);
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
  }
};
