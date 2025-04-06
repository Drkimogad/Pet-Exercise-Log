/* ==================== */
/*  Auth Module */
/* ==================== */
const Auth = (function() {
  let currentUser = null;

  // Move signIn function to the outer scope
  async function signIn(email, password) {
    console.log("User signed in");
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
    localStorage.setItem("currentUser", JSON.stringify({
      isLoggedIn: true,
      name: "Pet Lover"
    }));

    // Initialize dashboard with error handling
    try {
      PetEntry.initDashboard(); // Call the imported function
    } catch (dashboardError) {
      ErrorHandler.handle(dashboardError, 'Dashboard Initialization');
      sessionStorage.removeItem('user');
      showAuth(false);
      AppHelper.showError('Failed to initialize dashboard. Please try again.');
    }
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

      // Call the signIn function
      await signIn(email, password);

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

      const switchAuth = document.getElementById('switchAuth');
      switchAuth?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuth(!isSignUp);
      });

      const authForm = document.getElementById('authForm');
      authForm?.addEventListener('submit', (e) => handleAuthSubmit(e, isSignUp));
    } catch (error) {
      ErrorHandler.handle(error, 'Show Authentication');
    }
  }

  // Function to sign out
  function signOut() {
    console.log("User signed out");
    // Your signOut logic here
    function logout() {
      try {
        sessionStorage.removeItem('user');
        showAuth(false);
      } catch (error) {
        ErrorHandler.handle(error, 'Logout');
      }
    }

  }

  // Handling getting the current user
  function getCurrentUser() {
    console.log("Fetching current user");

    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (user && user.isLoggedIn) {
      return user;
    } else {
      return null;
    }
  }

  /* ==================== */
  /* 4. Exporting the Module */
  /* ==================== */
  return { signIn, signOut, getCurrentUser };

})();

/* ==================== */
/* Export the Auth Module */
export { Auth };
