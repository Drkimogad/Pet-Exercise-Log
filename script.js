let currentUser = null;  // To keep track of logged-in user
let exerciseData = [];

// Helper functions to manage login state
function isLoggedIn() {
    return localStorage.getItem('loggedIn') === 'true';
}

function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
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
        const user = JSON.parse(localStorage.getItem('users'))?.find(user => user.email === email && user.password === password);
        if (user) {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
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
            localStorage.setItem('currentUser', JSON.stringify({ email: newEmail }));
            showSignIn();
        }
    });
}

// Render Exercise Log page
function showExerciseLog() {
    if (!isLoggedIn()) {
        showSignIn();
        return;
    }

    const content = document.getElementById('content');
    currentUser = getLoggedInUser();

    content.innerHTML = `
        <h1>Exercise Log</h1>
        <form id="exerciseForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required>
            <label for="exerciseType">Exercise Type:</label>
            <input type="text" id="exerciseType" required>
            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" required>
            <label for="beforeEnergy">Energy Level (Before Exercise):</label>
            <select id="beforeEnergy">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
            <label for="afterEnergy">Energy Level (After Exercise):</label>
            <select id="afterEnergy">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
            <label for="healthStatus">Health Status:</label>
            <input type="text" id="healthStatus" placeholder="e.g., Joint issues, Age-related concerns">
            <label for="exerciseNotes">Notes:</label>
            <input type="text" id="exerciseNotes">
            <button type="submit">Log Exercise</button>
        </form>
        <h2>Exercise Records</h2>
        <ul id="exerciseList"></ul>
        <h2>Exercise Goal Progress</h2>
        <div id="progressBar"></div>
        <div id="progressText">Progress: 0%</div>
        <h2>Exercise Calendar</h2>
        <div id="calendar"></div>
    `;

    // Add event listener for form submission
    document.getElementById('exerciseForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const petName = document.getElementById('petName').value;
        const exerciseType = document.getElementById('exerciseType').value;
        const exerciseDuration = parseInt(document.getElementById('exerciseDuration').value);
        const beforeEnergy = document.getElementById('beforeEnergy').value;
        const afterEnergy = document.getElementById('afterEnergy').value;
        const healthStatus = document.getElementById('healthStatus').value;
        const exerciseNotes = document.getElementById('exerciseNotes').value;
        
        const exerciseEntry = {
            petName,
            exerciseType,
            duration: exerciseDuration,
            beforeEnergy,
            afterEnergy,
            healthStatus,
            notes: exerciseNotes,
            date: new Date().toLocaleDateString()
        };
        exerciseData.push(exerciseEntry);
        localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
        displayExerciseHistory();
    });

    // Display exercise history
    function displayExerciseHistory() {
        const exerciseList = document.getElementById('exerciseList');
        exerciseList.innerHTML = '';
        exerciseData.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.petName}</strong> (${entry.date}): 
                ${entry.exerciseType} - ${entry.duration} min. 
                <em>Energy before: ${entry.beforeEnergy}, after: ${entry.afterEnergy}</em> 
                <br><span>Health Status: ${entry.healthStatus}</span>
                <br><span>Notes: ${entry.notes}</span>
                <button class="delete">Delete</button>
            `;
            li.querySelector('.delete').addEventListener('click', () => {
                const index = exerciseData.indexOf(entry);
                if (index > -1) {
                    exerciseData.splice(index, 1);
                    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
                    displayExerciseHistory();
                }
            });
            exerciseList.appendChild(li);
        });
    }

    // Exercise Goal Progress
    const progressData = JSON.parse(localStorage.getItem('exerciseData')) || [];
    let totalDuration = progressData.reduce((acc, ex) => acc + ex.duration, 0);
    const goal = 150; // Example: goal is 150 minutes per month
    const progress = (totalDuration / goal) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Progress: ${Math.min(progress, 100).toFixed(2)}%`;

    // Display Exercise Calendar (Mockup)
    displayCalendar();
}

// Display Calendar (mockup)
function displayCalendar() {
    const calendar = document.getElementById('calendar');
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const totalDays = lastDay.getDate();
    let dayOfWeek = firstDay.getDay();
    let calendarHtml = '<div class="calendar-header">';
    daysOfWeek.forEach(day => {
        calendarHtml += `<div>${day}</div>`;
    });
    calendarHtml += '</div><div class="calendar-body">';

    // Fill empty days before the first day of the month
    for (let i = 0; i < dayOfWeek; i++) {
        calendarHtml += '<div class="calendar-day empty"></div>';
    }

    // Fill in the actual days of the month
    for (let i = 1; i <= totalDays; i++) {
        const day = new Date(now.getFullYear(), now.getMonth(), i);
        const isExerciseDay = exerciseData.some(entry => new Date(entry.date).toLocaleDateString() === day.toLocaleDateString());
        calendarHtml += `
            <div class="calendar-day ${isExerciseDay ? 'exercise-day' : ''}">
                ${i}
            </div>
        `;
    }

    calendarHtml += '</div>';
    calendar.innerHTML = calendarHtml;
}

// Initial call to check login status
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
