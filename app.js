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
    
    document.getElementById('signUpForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        if (email && password) {
            localStorage.setItem('user', JSON.stringify({ email, password }));
            alert('Sign up successful!');
            showExerciseLog();
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
    
    document.getElementById('signInForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
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
        <h1>Pet Exercise Log</h1>
        <form id="exerciseForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required><br><br>

            <label for="petCharacteristics">Pet Characteristics (Breed, Age, Weight, Gender):</label>
            <input type="text" id="petCharacteristics" placeholder="e.g. Golden Retriever, 5 years, 30kg, Male" required><br><br>

            <label for="exerciseType">Exercise Type:</label>
            <input type="text" id="exerciseType" required><br><br>

            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" required><br><br>

            <button type="submit">Log Exercise</button>
        </form>

        <h2>Exercise Records</h2>
        <ul id="exerciseList"></ul>

        <h3>Exercise Calendar</h3>
        <div id="calendar"></div>

        <canvas id="exerciseGraph" width="400" height="200"></canvas>
    `;
    
    showPage(exerciseLogPage);
    document.getElementById('exerciseForm').addEventListener('submit', handleExerciseForm);
    displayExercises();
    generateCalendar();
    generateGraph();
}

// Handle form submission to log exercise
function handleExerciseForm(event) {
    event.preventDefault();
    
    const petName = document.getElementById('petName').value;
    const petCharacteristics = document.getElementById('petCharacteristics').value;
    const exerciseType = document.getElementById('exerciseType').value;
    const exerciseDuration = document.getElementById('exerciseDuration').value;
    
    if (!petName || !petCharacteristics || !exerciseType || exerciseDuration <= 0) {
        alert('Please fill in all fields with valid data.');
        return;
    }

    const timestamp = new Date().toISOString();
    const exerciseData = { petName, petCharacteristics, exerciseType, exerciseDuration, timestamp };
    
    let exercises = localStorage.getItem('exercises');
    exercises = exercises ? JSON.parse(exercises) : [];
    exercises.push(exerciseData);
    localStorage.setItem('exercises', JSON.stringify(exercises));

    document.getElementById('exerciseForm').reset();
    displayExercises();
}

// Display Saved Exercises
function displayExercises() {
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    
    let exercises = localStorage.getItem('exercises');
    exercises = exercises ? JSON.parse(exercises) : [];
    
    exercises.forEach((exercise, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${exercise.petName} - ${exercise.exerciseType} for ${exercise.exerciseDuration} minutes. (${exercise.petCharacteristics})`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        // Edit button functionality here (optional)
        
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
        });

        li.appendChild(editButton);
        li.appendChild(printButton);
        li.appendChild(deleteButton);
        exerciseList.appendChild(li);
    });
}

// Generate Calendar for Exercise Tracking
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const daysInMonth = 30;
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = i;
        dayDiv.className = 'calendar-day';
        dayDiv.addEventListener('click', function() {
            dayDiv.classList.toggle('selected');
        });
        calendar.appendChild(dayDiv);
    }
}

// Generate Graph for Exercise Data
function generateGraph() {
    const ctx = document.getElementById('exerciseGraph').getContext('2d');
    const exercises = localStorage.getItem('exercises');
    const exerciseData = exercises ? JSON.parse(exercises) : [];
    
    const exerciseCategories = ['Idle', 'Semi Active', 'Active', 'Over Exercised'];
    const exerciseCounts = [0, 0, 0, 0];  // Idle, Semi Active, Active, Over Exercised
    
    exerciseData.forEach(exercise => {
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
        type: 'bar',
        data: {
            labels: exerciseCategories,
            datasets: [{
                label: 'Exercise Activity',
                data: exerciseCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize the application based on login status
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
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
