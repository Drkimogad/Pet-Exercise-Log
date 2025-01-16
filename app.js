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
    
    document.getElementById('signInForm').addEventListener('submit', function(event) {
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
        <h1>Pet Exercise Log</h1>
        <form id="exerciseForm">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" required><br><br>
            <label for="exerciseType">Exercise Type:</label>
            <input type="text" id="exerciseType" required><br><br>
            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" required><br><br>
            <button type="submit">Log Exercise</button>
        </form>
        <ul id="exerciseList"></ul>
    `;

    showPage(exerciseLogPage);
}

// Initialize the application based on login status
if (isLoggedIn()) {
    showExerciseLog(); // Redirect to profile creation if logged in
} else {
    showSignIn();
}
