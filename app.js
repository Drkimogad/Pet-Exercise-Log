console.log("JavaScript loaded");

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
    document.getElementById('signInForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            localStorage.setItem('loggedIn', 'true');
            showExerciseLog();
        } else {
            alert('Invalid credentials');
        }
    });
}

// Render Sign-Up page
function showSignUp() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Sign Up</h1>
        <form id="signUpForm">
            <label for="newEmail">Email:</label>
            <input type="email" id="newEmail" required>
            <label for="newPassword">Password:</label>
            <input type="password" id="newPassword" required>
            <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" onclick="showSignIn()">Sign In</a></p>
    `;
    document.getElementById('signUpForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const newEmail = document.getElementById('newEmail').value;
        const newPassword = document.getElementById('newPassword').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(user => user.email === newEmail)) {
            alert('Email already exists');
        } else {
            users.push({ email: newEmail, password: newPassword });
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('loggedIn', 'true');
            showSignIn();
        }
    });
}

// Render Exercise Log page
function showExerciseLog() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h1>Create Pet Profile</h1>
        <form id="profileForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required>
            <label for="petImage">Pet Image:</label>
            <input type="file" id="petImage" accept="image/*">
            <button type="submit">Save Pet Profile</button>
        </form>
        
        <h1>Exercise Log</h1>
        <form id="exerciseForm">
            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" required>
            <button type="submit">Log Exercise</button>
        </form>
        <h2>Exercise Records</h2>
        <ul id="exerciseList"></ul>

        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
    `;

    // Load saved pet profiles and display
    loadSavedProfiles();

    // Handle profile creation form
    document.getElementById('profileForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const petName = document.getElementById('petName').value;
        const petImage = document.getElementById('petImage').files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const newProfile = { petName, petImage: e.target.result };
            let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
            profiles.push(newProfile);
            localStorage.setItem('petProfiles', JSON.stringify(profiles));
            loadSavedProfiles();
        };

        if (petImage) {
            reader.readAsDataURL(petImage);
        }
    });

    // Handle exercise log form
    document.getElementById('exerciseForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const exerciseDuration = document.getElementById('exerciseDuration').value;
        const exerciseEntry = { exerciseDuration, date: new Date().toLocaleDateString() };
        exerciseData.push(exerciseEntry);
        localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
        loadExerciseData();
    });

    // Display exercise records
    loadExerciseData();
}

// Load saved pet profiles
function loadSavedProfiles() {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const savedProfilesDiv = document.getElementById('savedProfiles');
    savedProfilesDiv.innerHTML = '';
    
    profiles.forEach((profile, index) => {
        const profileDiv = document.createElement('div');
        profileDiv.innerHTML = `
            <h3>${profile.petName}</h3>
            <img src="${profile.petImage}" alt="Pet Image" width="100" height="100">
            <button onclick="editProfile(${index})">Edit</button>
            <button onclick="printProfile(${index})">Print</button>
        `;
        savedProfilesDiv.appendChild(profileDiv);
    });
}

// Load exercise data
function loadExerciseData() {
    exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    
    exerciseData.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${entry.date}: ${entry.exerciseDuration} minutes
        `;
        exerciseList.appendChild(li);
    });
}

// Edit Profile
function editProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles[index];
    document.getElementById('petName').value = profile.petName;
    document.getElementById('petImage').value = '';
    localStorage.setItem('editingProfileIndex', index);
}

// Print Profile
function printProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles[index];
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(`<h1>${profile.petName}</h1>`);
    printWindow.document.write(`<img src="${profile.petImage}" alt="Pet Image" width="100" height="100">`);
    printWindow.document.write('<br><button onclick="window.print()">Print</button>');
}

// Initial check
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
