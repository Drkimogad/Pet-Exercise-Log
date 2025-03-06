"use strict";

const AuthModule = (function() {
  // Private state
  let currentUser = null;
  
  // Enhanced password hashing with salt
  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const saltedPass = salt ? password + salt : password;
    const data = encoder.encode(saltedPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Unified auth form template
  function authTemplate(isSignUp) {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>${isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <form id="authForm">
            ${isSignUp ? `
              <div class="form-group">
                <label for="username">Pet Owner Name</label>
                <input type="text" id="username" required>
              </div>
            ` : ''}
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <!-- UPDATED: Removed pattern and hints -->
              <input type="password" id="password" required minlength="8">
            </div>

            ${isSignUp ? `
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" required>
              </div>
            ` : ''}

            <button type="submit" class="auth-btn">
              ${isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div class="auth-switch">
            ${isSignUp ? 'Already have an account?' : 'New user?'}
            <a href="#" id="switchAuth">${isSignUp ? 'Sign In' : 'Create Account'}</a>
          </div>
        </div>
      </div>
    `;
  }

  // Form validation
  function validateForm(formData, isSignUp) {
    const errors = [];
    
    if (isSignUp) {
      if (!formData.username?.trim()) {
        errors.push('Name is required');
      }
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }

    // UPDATED: Removed uppercase, lowercase, and number restrictions
    if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  }

  // Handle auth success
  function handleAuthSuccess(userData, isSignUp) {
    currentUser = userData;
    sessionStorage.setItem('user', JSON.stringify(userData));
    if (isSignUp) {
      showAuth(false); // Redirect to sign in form after successful sign up
    } else {
      // If you add a DashboardModule later, you can call its init function here.
      // For now, we use PetEntryModule directly.
      PetEntryModule.showExerciseLog();
    }
  }

  // Unified auth handler
  async function handleAuthSubmit(e, isSignUp) {
    e.preventDefault();
    
    const formData = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      ...(isSignUp && {
        username: document.getElementById('username').value,
        confirmPassword: document.getElementById('confirmPassword')?.value
      })
    };

    const errors = validateForm(formData, isSignUp);
    if (errors.length > 0) {
      AppHelper.showErrors(errors);
      return;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
      const hashedPassword = await hashPassword(formData.password, salt);
      
      const userData = {
        ...(isSignUp && { username: formData.username }),
        email: formData.email,
        password: hashedPassword,
        salt,
        lastLogin: new Date().toISOString()
      };

      handleAuthSuccess(userData, isSignUp);
    } catch (error) {
      AppHelper.showError('Authentication failed. Please try again.');
      console.error('Auth error:', error);
    }
  }

  // Show auth view
  function showAuth(isSignUp = false) {
    AppHelper.showPage(authTemplate(isSignUp));

    document.getElementById('authForm').addEventListener('submit', (e) => {
      handleAuthSubmit(e, isSignUp);
    });

    document.getElementById('switchAuth').addEventListener('click', (e) => {
      e.preventDefault();
      showAuth(!isSignUp);
    });
  }

  // Check auth status
  function checkAuth() {
    return sessionStorage.getItem('user') !== null;
  }

  // Logout
  function logout() {
    sessionStorage.removeItem('user');
    currentUser = null;
    AppHelper.showPage('<div class="logout-message">Successfully logged out</div>');
    setTimeout(() => showAuth(false), 2000);
  }

  return {
    showAuth,
    checkAuth,
    logout,
    getCurrentUser: () => currentUser
  };
})();
