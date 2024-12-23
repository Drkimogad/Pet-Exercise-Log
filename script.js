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
            showExerciseLog();
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
            <input type="text" id="exerciseDuration" required>
            <label for="characteristics">Characteristics:</label>
            <input type="text" id="characteristics" placeholder="Breed, Age, Weight, etc.">
            <button type="submit">Log Exercise</button>
        </form>

        <h2>Exercise Records</h2>
        <ul id="exerciseList"></ul>

        <h2>Exercise Trend</h2>
        <canvas id="exerciseGraph" width="400" height="200"></canvas>
    `;
    document.getElementById('exerciseForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const petName = document.getElementById('petName').value;
        const exerciseType = document.getElementById('exerciseType').value;
        const exerciseDuration = parseInt(document.getElementById('exerciseDuration').value);
        const characteristics = document.getElementById('characteristics').value;
        if (!petName || !exerciseType || isNaN(exerciseDuration)) {
            alert('Please fill in all fields with valid data.');
            return;
        }
        const timestamp = new Date().toISOString();
        const exerciseDataEntry = { petName, exerciseType, exerciseDuration, characteristics, timestamp };
        
        // Save data to local storage
        let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
        exercises.push(exerciseDataEntry);
        localStorage.setItem('exercises', JSON.stringify(exercises));

        // Reset form
        document.getElementById('exerciseForm').reset();
        displayExercises();
        drawGraph();
    });

    displayExercises();
    drawGraph();
}

// Display exercise records
function displayExercises() {
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
    exercises.forEach((exercise, index) => {
        const li = document.createElement('li');
        li.textContent = `${exercise.petName} - ${exercise.exerciseType} for ${exercise.exerciseDuration} minutes (${exercise.characteristics})`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function() {
            alert('Edit functionality is not implemented yet.');
        });

        const printButton = document.createElement('button');
        printButton.textContent = 'Print';
        printButton.addEventListener('click', function() {
            window.print();
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            exercises.splice(index, 1);
            localStorage.setItem('exercises', JSON.stringify(exercises));
            displayExercises();
            drawGraph();
        });

        li.appendChild(editButton);
        li.appendChild(printButton);
        li.appendChild(deleteButton);
        exerciseList.appendChild(li);
    });
}

// Draw the exercise trend graph (using Chart.js)
function drawGraph() {
    const ctx = document.getElementById('exerciseGraph').getContext('2d');
    const exerciseCategories = ['Idle', 'Semi Active', 'Active', 'Over Exercised'];
    const exerciseCounts = [0, 0, 0, 0];  // Idle, Semi Active, Active, Over Exercised

    let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
    exercises.forEach(exercise => {
        if (exercise.exerciseDuration < 15) {
            exerciseCounts[0]++;
        } else if (exercise.exerciseDuration <= 30) {
            exerciseCounts[1]++;
        } else if (exercise.exerciseDuration <= 45) {
            exerciseCounts[2]++;
        } else {
            exerciseCounts[3]++;
        }
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: exerciseCategories,
            datasets: [{
                label: 'Exercise Trend',
                data: exerciseCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Start by checking login status
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
