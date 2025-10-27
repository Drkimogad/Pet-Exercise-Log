"use strict";

let currentUser = null;

// Handle Sign Up with Firebase
async function handleSignUp(e) {
    e.preventDefault();
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };

    const errors = [];
    if (!formData.username.trim()) errors.push('Name is required');
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) errors.push('Invalid email');
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');

    if (errors.length) return showErrors(errors);

    try {
        // Firebase Auth - Create user with email/password
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
            formData.email, 
            formData.password
        );
        
        // User created successfully
        const user = userCredential.user;
        
        // Update user profile with display name
        await user.updateProfile({
            displayName: formData.username
        });
        
        // Store additional user data in Firestore (we'll set this up next)
        currentUser = {
            uid: user.uid,
            username: formData.username,
            email: user.email
        };
        
        // Show success and show dashboard
        showSuccess('Account created successfully!');
        showExerciseLog();
        
    } catch (error) {
        console.error('Firebase sign up error:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            showError('This email is already registered. Please sign in instead.');
        } else if (error.code === 'auth/weak-password') {
            showError('Password is too weak. Please use a stronger password.');
        } else {
            showError('Sign up failed. Please try again.');
        }
    }
}

// Show/hide auth logo RECENTLY ADDED
function toggleAuthLogo(show) {
    const logo = document.querySelector('.auth-logo');
    if (logo) logo.style.display = show ? 'block' : 'none';
}

// Handle Sign In
async function handleSignIn(e) {
    e.preventDefault();
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    const errors = [];
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) errors.push('Invalid email');
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');

    if (errors.length) return showErrors(errors);

    try {
        // Check if user exists
        const userKey = 'user_' + formData.email;
        const savedUser = JSON.parse(localStorage.getItem(userKey));
        
        if (!savedUser) {
            return showError('No account found with this email');
        }
        
        // Verify password
        const hashedPassword = await hashPassword(formData.password, savedUser.salt);
        if (hashedPassword !== savedUser.password) {
            return showError('Incorrect password');
        }
        
        // Update last login and save
        savedUser.lastLogin = new Date().toISOString();
        sessionStorage.setItem('user', JSON.stringify(savedUser));
        currentUser = savedUser;
        
        // Show success and show dashboard
        showSuccess('Signed in successfully!');
        
        // Hide auth and properly initialize dashboard
        showExerciseLog();
        
    } catch (error) {
        console.error('Sign in error:', error);
        showError('Sign in failed. Please try again.');
    }
}

// Switch between sign in and sign up forms
function setupAuthSwitchers() {
    document.getElementById('switchAuth').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signinForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    });
    
    document.getElementById('switchToSignin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('signinForm').style.display = 'block';
    });
}

// Logout function with Firebase
function logout() {
    // Firebase Auth - Sign out
    firebase.auth().signOut().then(() => {
        // Clear user session
        currentUser = null;

        // Show auth logo and forms
        toggleAuthLogo(true);
        
        // Hide dashboard, show auth forms
        document.querySelector('.dashboard-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-banner').style.display = 'block';
        
        // Show sign-in form specifically
        document.getElementById('signinForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        
        // Clear any form values
        document.getElementById('authForm').reset();
        
        console.log('User logged out successfully');
    }).catch((error) => {
        console.error('Firebase logout error:', error);
    });
}

// Finally, update initAuth to handle Firebase auth state:
function initAuth() {
    // Show auth logo initially
    toggleAuthLogo(true);
    
    // Firebase Auth State Listener
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                username: user.displayName || user.email,
                email: user.email
            };
            showExerciseLog();
        } else {
            // User is signed out
            currentUser = null;
        }
    });
    
    // Set up form handlers
    document.getElementById('authForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignUp);
    
    // Set up auth switchers
    setupAuthSwitchers();
    
    // Set up logout button if it exists
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    registerServiceWorker(); // From utils.js
    initAuth();
});
