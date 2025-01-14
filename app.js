console.log("JavaScript loaded");

// Check if logged in
function isLoggedIn() {
    return localStorage.getItem('loggedIn') === 'true';
}

// Check if profile is completed
function hasCompletedProfile() {
    return localStorage.getItem('profileCompleted') === 'true';
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

// Render Sign-In Page
function showSignIn() {
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
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('loggedIn', 'true');
            showApp();
        } else {
            alert('Invalid credentials');
        }
    });
}

// Render Sign-Up Page
function showSignUp() {
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
        alert('Sign Up successful! Please sign in.');
        showSignIn();
    });
}

// Render Exercise Log (Profile Creation)
function showExerciseLog() {
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
            <button type="submit">Save Pet Profile</button>
        </form>
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
    `;

    loadSavedProfiles();

    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
}

// Save Pet Profile
function handleProfileSave(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value;
    const petCharacteristics = document.getElementById('petCharacteristics').value;
    const exerciseGoal = document.getElementById('exerciseGoal').value;
    const petImage = document.getElementById('petImage').files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const newProfile = { petName, petCharacteristics, exerciseGoal, petImage: e.target.result };
        const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
        profiles.push(newProfile);
        localStorage.setItem('petProfiles', JSON.stringify(profiles));
        localStorage.setItem('profileCompleted', 'true');
        alert('Profile saved successfully!');
        loadSavedProfiles();
        handleRoute('exercise-log');
    };

    if (petImage) {
        reader.readAsDataURL(petImage);
    }
}

// Load Saved Pet Profiles
function loadSavedProfiles() {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const savedProfilesDiv = document.getElementById('savedProfiles');
    savedProfilesDiv.innerHTML = '';

    profiles.forEach((profile, index) => {
        const profileDiv = document.createElement('div');
        profileDiv.innerHTML = `
            <h3>${profile.petName}</h3>
            <p>${profile.petCharacteristics}</p>
            <p>${profile.exerciseGoal}</p>
            <img src="${profile.petImage}" alt="Pet Image" width="100" height="100">
            <button onclick="deleteProfile(${index})">Delete</button>
        `;
        savedProfilesDiv.appendChild(profileDiv);
    });
}

// Delete Profile
function deleteProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    profiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(profiles));
    loadSavedProfiles();
}

// Route Handling
function handleRoute(route) {
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
    if (!document.querySelector('nav')) {
        showNavigation();
    }
    if (!hasCompletedProfile()) {
        showExerciseLog();
    } else {
        handleRoute(location.hash.replace('#', '') || 'exercise-log');
    }
}

// Log Out
function logOut() {
    localStorage.setItem('loggedIn', 'false');
    localStorage.setItem('profileCompleted', 'false');
    document.body.querySelector('nav')?.remove();
    showSignIn();
}

// Ensure DOM is loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        showApp();
    } else {
        showSignIn();
    }
});
