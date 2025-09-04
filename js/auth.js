// ====================
// auth.js - Pet Exercise Log Authentication
// ====================

let currentUser = null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
});

// Initialize authentication system
function initAuth() {
  // Try to load saved user session
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForAuthState(true);
  } else {
    updateUIForAuthState(false);
  }

  // Attach listeners
  setupAuthEventListeners();
}

// --- Event Listeners ---
function setupAuthEventListeners() {
  // Sign In
  document.addEventListener("click", (e) => {
    if (e.target.id === "signInButton") {
      showAuthForm(true); // show login form
    }
  });

  // Sign Out
  document.addEventListener("click", (e) => {
    if (e.target.id === "signOutButton") {
      handleSignOut();
    }
  });

  // Auth form submit
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "authForm") {
      e.preventDefault();
      const mode = e.target.dataset.mode; // "signin" or "signup"
      handleAuthSubmit(e, mode);
    }
  });
}

// --- Auth Actions ---
function handleSignIn(email, pin) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.pin === pin);

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  currentUser = {
    email: user.email,
    username: user.username,
    lastLogin: new Date().toISOString(),
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateUIForAuthState(true);
}

function handleSignUp(username, email, pin) {
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    alert("User already exists. Please sign in.");
    return;
  }

  const newUser = { username, email, pin };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Account created! Please sign in.");
  showAuthForm(true, "signin");
}

function handleSignOut() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateUIForAuthState(false);
}

// --- UI Updates ---
function updateUIForAuthState(isLoggedIn) {
  const authSection = document.getElementById("authSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const signInBtn = document.getElementById("signInButton");
  const signOutBtn = document.getElementById("signOutButton");
  const userWelcome = document.getElementById("userWelcome");

  if (isLoggedIn) {
    // Toggle visibility
    authSection.style.display = "none";
    dashboardSection.style.display = "block";
    signInBtn.style.display = "none";
    signOutBtn.style.display = "block";

    if (userWelcome) {
      const user = getCurrentUser();
      userWelcome.textContent = `Welcome, ${user.username}!`;
      userWelcome.style.display = "block";
    }

    // Init dashboard
    if (typeof initDashboard === "function") {
      initDashboard();
    }
  } else {
    // Toggle visibility
    authSection.style.display = "block";
    dashboardSection.style.display = "none";
    signInBtn.style.display = "block";
    signOutBtn.style.display = "none";
    userWelcome.style.display = "none";

    // Show sign-in form by default
    showAuthForm(true, "signin");
  }
}

// --- Auth Form Rendering ---
function showAuthForm(show, mode = "signin") {
  const container = document.getElementById("authFormContainer");
  if (!container) return;

  if (!show) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";

  if (mode === "signin") {
    container.innerHTML = `
      <form id="authForm" data-mode="signin">
        <h3>Sign In</h3>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="pin" placeholder="PIN" required />
        <button type="submit">Sign In</button>
        <p>Don't have an account? 
          <a href="#" id="goToSignUp">Sign Up</a>
        </p>
      </form>
    `;
  } else {
    container.innerHTML = `
      <form id="authForm" data-mode="signup">
        <h3>Sign Up</h3>
        <input type="text" name="username" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="pin" placeholder="PIN" required />
        <button type="submit">Sign Up</button>
        <p>Already have an account? 
          <a href="#" id="goToSignIn">Sign In</a>
        </p>
      </form>
    `;
  }

  // Handle switch links
  document.getElementById("goToSignUp")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthForm(true, "signup");
  });

  document.getElementById("goToSignIn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthForm(true, "signin");
  });
}

// --- Auth Form Handling ---
function handleAuthSubmit(e, mode) {
  const form = e.target;
  const email = form.email.value.trim();
  const pin = form.pin.value.trim();

  if (mode === "signup") {
    const username = form.username.value.trim();
    handleSignUp(username, email, pin);
  } else {
    handleSignIn(email, pin);
  }
}

// --- Helpers ---
function getCurrentUser() {
  if (!currentUser) {
    const saved = localStorage.getItem("currentUser");
    if (saved) currentUser = JSON.parse(saved);
  }
  return currentUser;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    return [];
  }
}
