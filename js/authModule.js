"use strict";

const AuthModule = (function() {
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

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
    AppHelper.showPage(signUpPage);

    // Event listener for sign-up form submission
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

    // Event listener for Sign In link
    document.getElementById('goToSignIn').addEventListener('click', (e) => {
      e.preventDefault();
      showSignIn();
    });
  }

  function showSignIn() {
    const signInHTML = `
      <div id="signin">
        <h2>Sign In</h2>
        <form id="signInForm">
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="password" placeholder="Password" required />
          <button type="submit">Sign In</button>
        </form>
        <!-- Add the Sign Up link below the form -->
        <p>Don't have an account? <a href="#" id="goToSignUp">Sign Up</a></p>
      </div>
    `;
    AppHelper.showPage(signInHTML);

    // Event listener for Sign In form submission
    document.getElementById('signInForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const username = document.getElementById('email').value;
        const passwordRaw = document.getElementById('password').value;
        const password = await hashPassword(passwordRaw);
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user && user.username === username && user.password === password) {
          alert('Sign in successful!');
          PetEntryModule.showExerciseLog();
        } else {
          alert('Invalid credentials, please try again.');
        }
      } catch (err) {
        console.error('Error during sign in:', err);
      }
    });

    // Event listener for Sign Up link
    document.getElementById('goToSignUp').addEventListener('click', (e) => {
      e.preventDefault();
      showSignUp();
    });
  }

  return { hashPassword, showSignUp, showSignIn };
})();
