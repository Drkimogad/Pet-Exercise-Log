// Helper function to show different pages
function showPage(page) {
    document.getElementById('content').innerHTML = page;
}

// Check if the user is logged in
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

// Secure password storage using Base64 encoding (replace with hashing in production)
function hashPassword(password) {
    return btoa(password);  // Replace with a proper hashing function for production
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
        const password = hashPassword(document.getElementById('signUpPassword').value);

        if (email && password) {
            localStorage.setItem('user', JSON.stringify({ email, password }));
            alert('Sign up successful!');
            showSignIn(); // Redirect to sign-in page after successful sign-up
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
        const password = hashPassword(document.getElementById('signInPassword').value);
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && user.email === email && user.password === password) {
            alert('Sign in successful!');
            showExerciseLog();
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
        <form id="exerciseForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required>
            
            <label for="petCharacteristics">Characteristics:</label>
            <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament"></textarea>

            <label for="exerciseType">Type of Exercise:</label>
            <input type="text" id="exerciseType" placeholder="e.g., Walking, Running" required>

            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" placeholder="e.g., 30" required>

            <label for="exerciseDate">Date:</label>
            <input type="date" id="exerciseDate" required>

            <label for="bodyconditionScoring">Scoring:</label>
            <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean" required>

            <label for="exerciseTime">Time:</label>
            <input type="time" id="exerciseTime" required>

            <label for="exerciseIntensity">Intensity Level:</label>
            <select id="exerciseIntensity" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>

            <label for="caloriesBurned">Calories Burned (optional):</label>
            <input type="number" id="caloriesBurned" placeholder="e.g., 150 calories">

            <label for="exerciseNotes">Notes/Comments:</label>
            <textarea id="exerciseNotes" placeholder="Any observations or details"></textarea>

            <label for="exerciseLocation">Location (optional):</label>
            <input type="text" id="exerciseLocation" placeholder="e.g., Park">

            <!-- Exercise Calendar -->
            <div id="exerciseCalendar"></div>

            <!-- Canvas for Chart.js -->
            <h2>Exercise Summary</h2>
            <canvas id="exerciseChart"></canvas>

            <button type="submit">Add Exercise</button>
        </form>
        
        <h1>Saved Pet Profiles</h1>
        <div id="savedProfiles"></div>
        <button onclick="logout()">Logout</button>
    `;

    showPage(exerciseLogPage);

    document.getElementById('exerciseForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handleProfileSave(event);
        alert('Exercise added successfully!');
        loadSavedProfiles();
    });

    generateCalendar(); // Call the function to generate the calendar
    renderExerciseGraph(); // Call the function to render the graph
    loadSavedProfiles();
}

// Generate Exercise Calendar
function generateCalendar() {
    const calendarDiv = document.getElementById('exerciseCalendar');
    calendarDiv.innerHTML = '';
    const daysInMonth = new Date().getMonth() % 2 === 0 ? 30 : 31; // Adjust for the number of days in the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.innerHTML = `<label>${i}</label><input type="checkbox" id="day${i}">`;
        if (i % 10 === 0) {
            calendarDiv.appendChild(document.createElement('br'));
        }
        calendarDiv.appendChild(dayDiv);
    }
}

// Render Exercise Graph Placeholder
function renderExerciseGraph() {
    const canvas = document.getElementById('exerciseChart');
    const ctx = canvas.getContext('2d');
    const data = JSON.parse(localStorage.getItem('exerciseData')) || [];
    const labels = data.map((_, index) => `Day ${index + 1}`);
    const values = data.map(entry => entry.duration);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Exercise Duration',
                data: values,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Duration (min)'
                    }
                }
            }
        }
    });
}

// Save Pet Profile
function handleProfileSave(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value;
    const petCharacteristics = document.getElementById('petCharacteristics').value;
    const exerciseType = document.getElementById('exerciseType').value;
    const exerciseDuration = document.getElementById('exerciseDuration').value;
    const exerciseDate = document.getElementById('exerciseDate').value;
    const bodyconditionScoring = document.getElementById('bodyconditionScoring').value;
    const exerciseTime = document.getElementById('exerciseTime').value;
    const exerciseIntensity = document.getElementById('exerciseIntensity').value;
    const caloriesBurned = document.getElementById('caloriesBurned').value;
    const exerciseNotes = document.getElementById('exerciseNotes').value;
    const exerciseLocation = document.getElementById('exerciseLocation').value;

    const newProfile = {
        petName, 
        petCharacteristics, 
        exerciseType, 
        exerciseDuration, 
        exerciseDate, 
        bodyconditionScoring, 
        exerciseTime, 
        exerciseIntensity, 
        caloriesBurned, 
        exerciseNotes, 
        exerciseLocation
    };
    let profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    profiles.push(newProfile);
    localStorage.setItem('petProfiles', JSON.stringify(profiles));
    localStorage.setItem('exerciseData', JSON.stringify(profiles.map(profile => ({duration: profile.exerciseDuration})))); // Save exercise data for graph

    loadSavedProfiles();
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
            <p>Type: ${profile.exerciseType}</p>
            <p>Duration: ${profile.exerciseDuration} min</p>
            <p>Date: ${profile.exerciseDate}</p>
            <p>Scoring: ${profile.bodyconditionScoring}</p>
            <p>Time: ${profile.exerciseTime}</p>
            <p>Intensity: ${profile.exerciseIntensity}</p>
            <p>Calories Burned: ${profile.caloriesBurned}</p>
            <p>Notes: ${profile.exerciseNotes}</p>
            <p>Location: ${profile.exerciseLocation}</p>
            <button onclick="deleteProfile(${index})">Delete</button>
            <button onclick="printProfile(${index})">Print</button>
            <button onclick="editProfile(${index})">Edit</button>
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
    printWindow.document.write('<br><button onclick="window.print()">Print</button>');
}

// Edit Profile
function editProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = profiles[index];

    document.getElementById('petName').value = profile.petName;
    document.getElementById('petCharacteristics').value = profile.petCharacteristics;
    document.getElementById('exerciseType').value = profile.exerciseType;
    document.getElementById('exerciseDuration').value = profile.exerciseDuration;
    document.getElementById('exerciseDate').value = profile.exerciseDate;
    document.getElementById('bodyconditionScoring').value = profile.bodyconditionScoring;
    document.getElementById('exerciseTime').value = profile.exerciseTime;
    document.getElementById('exerciseIntensity').value = profile.exerciseIntensity;
    document.getElementById('caloriesBurned').value = profile.caloriesBurned;
    document.getElementById('exerciseNotes').value = profile.exerciseNotes;
    document.getElementById('exerciseLocation').value = profile.exerciseLocation;

    profiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(profiles));

    loadSavedProfiles();
}

// Logout function
function logout() {
    localStorage.clear();
    alert('You have been logged out.');
    showSignIn();
}

// Initial check
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
