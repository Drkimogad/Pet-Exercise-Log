console.log("JavaScript loaded"); // Debug statement

let exerciseData = [];

// Check if logged in
function isLoggedIn() {
    console.log("Checking if user is logged in"); // Debug statement
    return localStorage.getItem('loggedIn') === 'true';
}

// Render Sign-In page
function showSignIn() {
    console.log("Rendering Sign-In Page"); // Debug statement
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
    console.log("Rendering Sign-Up Page"); // Debug statement
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
            showExerciseLog();
        }
    });
}

// Render Exercise Log page
function showExerciseLog() {
    console.log("Rendering Exercise Log Page"); // Debug statement
    const content = document.getElementById('content');
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
        <div id="progressBarContainer">
            <div id="progressBar"></div>
        </div>
        <div id="progressText">Progress: 0%</div>
    `;

    // Load existing exercise data
    loadExerciseData();

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

        // Create new exercise entry
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
        loadExerciseData();
    });

    // Display exercise records
    function loadExerciseData() {
        console.log("Loading exercise data"); // Debug statement
        exerciseData = JSON.parse(localStorage.getItem('exerciseData')) || [];
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
            li.querySelector('.delete').addEventListener('click', function() {
                const index = exerciseData.indexOf(entry);
                if (index > -1) {
                    exerciseData.splice(index, 1);
                    localStorage.setItem('exerciseData', JSON.stringify(exerciseData));
                    loadExerciseData();
                }
            });
            exerciseList.appendChild(li);
        });

        // Calculate progress (example: 150 minutes per month)
        const goal = 150;
        const totalDuration = exerciseData.reduce((sum, entry) => sum + entry.duration, 0);
        const progress = (totalDuration / goal) * 100;
        document.getElementById('progressBar').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('progressText').textContent = `Progress: ${Math.min(progress, 100).toFixed(2)}%`;
    }
}

// Initial check
console.log("Initial login check"); // Debug statement
if (isLoggedIn()) {
    showExerciseLog();
} else {
    showSignIn();
}
