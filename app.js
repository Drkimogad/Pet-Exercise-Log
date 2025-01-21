// Helper function to show different pages
function showPage(page) {
    document.getElementById('content').innerHTML = page;
}

// Check if the user is logged in
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

// Sign-Up Page
function showSignUp() {
    const signUpPage = `
        <h1>Sign Up</h1>
        <form id="signUpForm">
            <label for="signUpEmail">Email:</label>
            <input type="email" id="signUpEmail" required><br><br>
            <label for="signUpPassword">Password:</label>
            <input type="password" id="signUpPassword" required><br><br>
            <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" onclick="showSignIn()">Sign In</a></p>
    `;

    showPage(signUpPage);

    document.getElementById('signUpForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;

        if (email && password) {
            localStorage.setItem('user', JSON.stringify({ email, password }));
            alert('Sign up successful!');
            showExerciseLog(); // Redirect to profile creation page
        } else {
            alert('Please fill in all fields.');
        }
    });
}

// Sign-In Page
function showSignIn() {
    const signInPage = `
        <h1>Sign In</h1>
        <form id="signInForm">
            <label for="signInEmail">Email:</label>
            <input type="email" id="signInEmail" required><br><br>
            <label for="signInPassword">Password:</label>
            <input type="password" id="signInPassword" required><br><br>
            <button type="submit">Sign In</button>
        </form>
        <p>Don't have an account? <a href="#" onclick="showSignUp()">Sign Up</a></p>
    `;

    showPage(signInPage);

    document.getElementById('signInForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && user.email === email && user.password === password) {
            alert('Sign in successful!');
            showExerciseLog(); // Redirect to profile creation page
        } else {
            alert('Invalid credentials, please try again.');
        }
    });
}

// Exercise Log Page (after sign-in)
function showExerciseLog() {
    if (!isLoggedIn()) {
        alert('Please sign in first.');
        showSignIn();
        return;
    }

    const exerciseLogPage = `
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
            <h2>Exercise Calendar</h2>
            <div id="calendar" class="calendar-grid"></div>
            <h2>Exercise Trend</h2>
            <canvas id="exerciseGraph" width="400" height="200"></canvas>
            <button type="submit">Save Pet Profile</button>
        </form>
        
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
    `;

    showPage(exerciseLogPage);

    generateCalendar();
    renderExerciseGraph();
    loadSavedProfiles();

    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
}

// Generate Exercise Calendar
function generateCalendar() {
    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '';
    const daysInMonth = 30; // Adjust for the number of days in the month
    const calendarRow = document.createElement('div');
    calendarRow.classList.add('calendar-row');
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.textContent = i;
        day.classList.add('calendar-day');
        const inputMinutes = document.createElement('input');
        inputMinutes.type = 'number';
        inputMinutes.placeholder = 'mins';
        inputMinutes.classList.add('calendar-input');
        day.appendChild(inputMinutes);
        day.addEventListener('click', () => day.classList.toggle('marked'));
        calendarRow.appendChild(day);
    }
    calendarDiv.appendChild(calendarRow);
}

// Render Exercise Graph Placeholder
function renderExerciseGraph() {
    const canvas = document.getElementById('exerciseGraph');
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.quadraticCurveTo(200, 50, 400, 100);
    ctx.strokeStyle = "blue";
    ctx.stroke();
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
        let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
        profiles.push(newProfile);
        localStorage.setItem('petProfiles', JSON.stringify(profiles));
        loadSavedProfiles();
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
            <button onclick="printProfile(${index})">Print</button>
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

// Print Profile
function printProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles[index];
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(`<h1>${profile.petName}</h1>`);
    printWindow.document.write(`<p>${profile.petCharacteristics}</p>`);
    printWindow.document.write(`<p>${profile.exerciseGoal}</p>`);
    printWindow.document.write(`<img src="${profile.petImage}" alt="Pet Image" width="100" height="100">`);
    printWindow.document.write('<br><button onclick="window.print()">Print</button>');
}

// Initial check
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
