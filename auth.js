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

// Show/hide auth header (logo + legal links)
function toggleAuthHeader(show) {
    const authHeader = document.querySelector('.auth-header');
    if (authHeader) authHeader.style.display = show ? 'block' : 'none';
}

// Handle Sign In with Firebase
async function handleSignIn(e) {
    e.preventDefault();
    console.log('Login form submitted'); // ADD THIS
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    console.log('Form data:', formData); // ADD THIS

    const errors = [];
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) errors.push('Invalid email');
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');

    if (errors.length) return showErrors(errors);

    try {
        console.log('Attempting Firebase sign in...'); // ADD THIS
        // Firebase Auth - Sign in with email/password
        const userCredential = await firebase.auth().signInWithEmailAndPassword(
            formData.email, 
            formData.password
        );
        
        console.log('Firebase sign in successful:', userCredential.user); // ADD THIS
        // User signed in successfully
        const user = userCredential.user;
        
        currentUser = {
            uid: user.uid,
            username: user.displayName || user.email,
            email: user.email
        };
        
        // Show success and show dashboard
        showSuccess('Signed in successfully!');
        showExerciseLog();
        
    } catch (error) {
        console.error('Firebase sign in error:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/user-not-found') {
            showError('No account found with this email.');
        } else if (error.code === 'auth/wrong-password') {
            showError('Incorrect password.');
        } else if (error.code === 'auth/invalid-email') {
            showError('Invalid email address.');
        } else {
            showError('Sign in failed. Please try again.');
        }
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

// Password Reset Functions
function setupPasswordReset() {
    // Forgot Password link
    document.getElementById('forgotPassword').addEventListener('click', function(e) {
        e.preventDefault();
        showForgotPasswordForm();
    });
    
    // Back to Sign In from Forgot Password
    document.getElementById('backToSignin').addEventListener('click', function(e) {
        e.preventDefault();
        showSignInForm();
    });
    
    // Forgot Password form submission
    document.getElementById('forgotPasswordFormElement').addEventListener('submit', handleForgotPassword);
}

// Show Forgot Password Form
function showForgotPasswordForm() {
    document.getElementById('signinForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
}

// Show Sign In Form
function showSignInForm() {
    document.getElementById('signinForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        return showError('Please enter your email address.');
    }
    
    try {
        // Send password reset email
        await firebase.auth().sendPasswordResetEmail(email);
        showSuccess('Password reset email sent! Check your inbox.');
        
        // Clear form and go back to sign in
        document.getElementById('forgotPasswordFormElement').reset();
        setTimeout(() => {
            showSignInForm();
        }, 2000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
            showError('No account found with this email.');
        } else if (error.code === 'auth/invalid-email') {
            showError('Invalid email address.');
        } else {
            showError('Failed to send reset email. Please try again.');
        }
    }
}

// Handle Password Reset from Email Link
function handlePasswordResetFromEmail() {
    // Check if we're on a password reset page (URL contains mode=resetPassword)
    if (window.location.href.includes('mode=resetPassword')) {
        // This would be handled by Firebase automatically
        // The user clicks the email link and gets redirected to your auth page
        // Firebase handles the token verification and password reset
        console.log('Password reset flow detected');
    }
}


// Logout function with Firebase
function logout() {
    // Firebase Auth - Sign out
    firebase.auth().signOut().then(() => {
        // Clear user session
        currentUser = null;

        // Show auth logo and forms
        toggleAuthHeader(true);
        
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
    toggleAuthHeader(true);
    
     // Set up form handlers first
    document.getElementById('authForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignUp);
    
   // Set up password reset handlers
    setupPasswordReset();

    // Set up auth switchers
    setupAuthSwitchers();
    
    // Set up logout button if it exists
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Check for password reset flow
    handlePasswordResetFromEmail();

// Firebase Auth State Listener
// Firebase Auth State Listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            username: user.displayName || user.email,
            email: user.email
        };
        
        // Wait for dashboard.js to load
        setTimeout(() => {
            if (typeof showExerciseLog === 'function') {
                showExerciseLog();
            } else {
                // If still not available after delay, use manual fallback
                console.log('Manual dashboard activation');
                toggleAuthHeader(false);
                document.getElementById('auth-container').style.display = 'none';
                document.getElementById('main-banner').style.display = 'none';
                document.querySelector('.dashboard-container').style.display = 'block';
            }
        }, 500);
    } else {
        // User is signed out
        currentUser = null;
    }
});
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    registerServiceWorker(); // From utils.js
    initAuth();
});
