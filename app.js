console.log("JavaScript loaded");

let exerciseData = [];

// Check if logged in
function isLoggedIn() {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    console.log('isLoggedIn:', loggedIn);
    return loggedIn;
}

// Check if profile is completed
function hasCompletedProfile() {
    const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
    console.log('hasCompletedProfile:', profileCompleted);
    return profileCompleted;
}

// Render Navigation Bar
function showNavigation() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
        <a href="#exercise-log" onclick="handleRoute('exercise-log')">Exercise Log</a>
        <a href="#profile-management" onclick="handleRoute('profile-management')">Profile Management</a>
        <button onclick="logOut()">Log Out</button>
    `;
    document.body.insertBefore(nav, document.getElementById('content'));
}

// Render Sign-In page
function showSignIn() {
    console.log('Rendering Sign-In page...');
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Sign In</h1>
        <form id="signInForm">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
            <label for="password">Password:</label>
            <input type="password" id="password" required>
            <button type="submit">Sign In</button>
        </form>
        <p>Don't have an account? <a href="#" onclick="showSignUp()">Sign Up</a></p>
    `;
    document.getElementById('signInForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            console.log('Sign-In successful.');
            localStorage.setItem('loggedIn', 'true');
            showApp();
        } else {
            console.log('Invalid credentials.');
            alert('Invalid credentials');
        }
    });
}

// Render Sign-Up page
function showSignUp() {
    console.log('Rendering Sign-Up page...');
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Sign Up</h1>
        <form id="signUpForm">
            <label for="signUpEmail">Email:</label>
            <input type="email" id="signUpEmail" required>
            <label for="signUpPassword">Password:</label>
            <input type="password" id="signUpPassword" required>
            <button type="submit">Sign Up</button>
        </form>
    `;
    document.getElementById('signUpForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Sign-Up successful.');
        alert('Sign Up successful! Please sign in.');
        showSignIn();
    });
}

// Render Exercise Log (Profile Creation)
function showExerciseLog() {
    console.log('Rendering Exercise Log page...');
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Create Pet Profile</h1>
        <form id="profileForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required>
            <label for="petCharacteristics">Characteristics:</label>
            <textarea id="petCharacteristics" rows="3" placeholder="e.g., Active, Friendly"></textarea>
            <label for="exerciseGoal">Exercise Goal:</label>
            <textarea id="exerciseGoal" rows="2" placeholder="e.g., 2 hours per day"></textarea>
            <label for="petImage">Pet Image:</label>
            <input type="file" id="petImage" accept="image/*">
            <div id="calendar" class="calendar-grid"></div>
            <h2>Exercise Trend</h2>
            <canvas id="exerciseGraph" width="400" height="200"></canvas>
            <button type="submit">Save Pet Profile</button>
        </form>
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
    `;

    generateCalendar();
    renderExerciseGraph();
    loadSavedProfiles();

    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
}

// Other Functions: (generateCalendar, renderExerciseGraph, handleProfileSave, loadSavedProfiles, deleteProfile)
// Same as before, with added `console.log` statements as needed for debugging.

// Route Handling
function handleRoute(route) {
    console.log('Handling route:', route);
    switch (route) {
        case 'exercise-log':
            showExerciseLog();
            break;
        default:
            showSignIn();
    }
}

// Main App Interface
function showApp() {
    console.log('Initializing app...');
    if (!document.querySelector('nav')) {
        showNavigation(); // Show navigation bar
    }
    if (!hasCompletedProfile()) {
        console.log('Redirecting to profile creation...');
        showExerciseLog(); // Force redirection to profile creation
        return; // Stop further execution
    }
    const route = location.hash.replace('#', '') || 'exercise-log';
    console.log('Navigating to route:', route);
    handleRoute(route); // Default route
}

// Log Out
function logOut() {
    console.log('Logging out...');
    localStorage.setItem('loggedIn', 'false');
    localStorage.setItem('profileCompleted', 'false');
    document.body.querySelector('nav')?.remove();
    showSignIn();
}

// Ensure DOM is ready before initializing
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing app...');
    if (isLoggedIn()) {
        showApp();
    } else {
        console.log('User is not logged in. Showing sign-in page...');
        showSignIn();
    }
});
