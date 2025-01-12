console.log("JavaScript loaded");

// Initial Data
let exerciseData = [];

// Check if logged in
function isLoggedIn() {
    return localStorage.getItem('loggedIn') === 'true';
}

// Render Sign-In page
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
    document.getElementById('signInForm').addEventListener('submit', handleSignIn);
}

// Handle Sign-In
function handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem('loggedIn', 'true');
        alert('Sign In successful!');
        showExerciseLog();
    } else {
        alert('Invalid credentials. Please try again.');
    }
}

// Render Sign-Up page
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
    document.getElementById('signUpForm').addEventListener('submit', handleSignUp);
}

// Handle Sign-Up
function handleSignUp(event) {
    event.preventDefault();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.email === email)) {
        alert('Email already registered. Please sign in.');
    } else {
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Sign-Up successful! Please sign in.');
        showSignIn();
    }
}

// Render Exercise Log and Profile Management
function showExerciseLog() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Manage Pet Profiles</h1>
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
        <button id="logoutButton" class="logout">Logout</button>
    `;
    loadSavedProfiles();
    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
}

// Save Pet Profile
function handleProfileSave(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value.trim();
    const petCharacteristics = document.getElementById('petCharacteristics').value.trim();
    const exerciseGoal = document.getElementById('exerciseGoal').value.trim();
    const petImage = document.getElementById('petImage').files[0];

    if (!petName || !exerciseGoal) {
        alert('Please complete all required fields.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const newProfile = { petName, petCharacteristics, exerciseGoal, petImage: e.target.result };
        const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
        profiles.push(newProfile);
        localStorage.setItem('petProfiles', JSON.stringify(profiles));
        loadSavedProfiles();
    };

    if (petImage) {
        reader.readAsDataURL(petImage);
    } else {
        const newProfile = { petName, petCharacteristics, exerciseGoal, petImage: '' };
        const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
        profiles.push(newProfile);
        localStorage.setItem('petProfiles', JSON.stringify(profiles));
        loadSavedProfiles();
    }
}

// Load Saved Profiles
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
            ${profile.petImage ? `<img src="${profile.petImage}" alt="Pet Image" width="100" height="100">` : ''}
            <button onclick="editProfile(${index})">Edit</button>
            <button onclick="deleteProfile(${index})">Delete</button>
        `;
        savedProfilesDiv.appendChild(profileDiv);
    });
}

// Logout Functionality
function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.setItem('loggedIn', 'false');
        showSignIn();
    }
}

// Edit Profile (Placeholder for Future)
function editProfile(index) {
    alert(`Edit profile functionality will be added soon for profile #${index + 1}.`);
}

// Delete Profile
function deleteProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    profiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(profiles));
    loadSavedProfiles();
}

// Initial Check
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
