"use strict";

let currentUser = null;

// Add this connection check function at the top of auth.js (if not already there)
const checkConnection = async () => {
    if (!navigator.onLine) return false;
    try {
        const response = await fetch('./index.html', {
            method: 'HEAD',
            cache: 'no-store'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

// Handle Sign Up with Firebase
async function handleSignUp(e) {
        e.preventDefault();
    // 🆕 OFFLINE CHECK - Use the shared function
    const isOnline = await checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking signup - offline');
        showError('Cannot sign up while offline. Please check your internet connection.');
        return;
    }
    
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
      // showExerciseLog();
              // Wait for dashboard.js to load
   setTimeout(() => {
    if (typeof showExerciseLog === 'function') {
        showExerciseLog();
      } else {
        // If still not available after delay, use manual fallback
        console.log('Manual dashboard activation');
        
        document.getElementById('split-auth-container').style.display = 'none';
        document.querySelector('.dashboard-container').style.display = 'flex';
      }
   }, 500);
        
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


// Handle Sign In with Firebase
async function handleSignIn(e) {
    e.preventDefault();
    console.log('Login form submitted'); // ADD THIS

        // 🆕 OFFLINE CHECK - Use the shared function
     // 🆕 OFFLINE CHECK - Use the shared function
    const isOnline = await checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking signin - offline');
        showError('Cannot sign in while offline. Please check your internet connection.');
        return;
    }

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

          // Show success and show dashboard
showSuccess('Signed in successfully!');

// Wait for dashboard.js to load
setTimeout(() => {
    if (typeof showExerciseLog === 'function') {
        showExerciseLog();
    } else {
        // If still not available after delay, use manual fallback
        console.log('Manual dashboard activation');
        
        document.getElementById('split-auth-container').style.display = 'none';
        document.querySelector('.dashboard-container').style.display = 'flex';
        
    }
}, 500);
        
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
        document.getElementById('signupForm').style.display = 'flex';
    });
    
    document.getElementById('switchToSignin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('signinForm').style.display = 'flex';
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
    document.getElementById('forgotPasswordForm').style.display = 'flex';
}

// Show Sign In Form
function showSignInForm() {
    document.getElementById('signinForm').style.display = 'flex';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();

        // 🆕 OFFLINE CHECK - Use the shared function
    const isOnline = await checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking password reset - offline');
        showError('Cannot reset password while offline. Please check your internet connection.');
        return;
    }


    
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
// Simple function to show auth page and hide dashboard
function showAuth() {
    console.log('🔐 Showing auth page');
    
    // Safely hide dashboard if it exists
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
    }
    
    // Show auth container
    document.getElementById('split-auth-container').style.display = 'flex';
    
    // Show sign-in form by default
    document.getElementById('signinForm').style.display = 'flex';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

// Reset UI state after logout
function resetUI() {
    console.log('🔄 Resetting UI state');
    
    // Clear any form values
    document.getElementById('authForm').reset();
    document.getElementById('signupFormElement').reset();
    document.getElementById('forgotPasswordFormElement').reset();
    
    // Clear local storage
    localStorage.removeItem('firebaseAuthToken');
    localStorage.removeItem('lastActivePage');
    sessionStorage.removeItem('user');
}

// Simplified logout - users can logout anytime, online or offline
function logout() {
    console.log('🚪 User logging out');
    
    // Firebase sign out
    firebase.auth().signOut().then(() => {
        // Clear user session
        currentUser = null;
        
        // Reset UI
        resetUI();
        
        // Show auth page
        showAuth();
        
        console.log('✅ Logout successful');
        
    }).catch((error) => {
        console.error('❌ Firebase logout error:', error);
        showError('Logout failed. Please try again.');
    });
}

// Finally, update initAuth to handle Firebase auth state:
function initAuth() {
    // Use the SAME reliable connection check as offline.js
    const checkConnection = async () => {
        if (!navigator.onLine) return false;
        try {
        const response = await fetch('./index.html', {
                method: 'HEAD',
                cache: 'no-store'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Initial connection check
    (async () => {
        const isOnline = await checkConnection();
        if (!isOnline) {
            console.log('❌ No connection on startup - redirecting to offline page');
            window.location.href = 'offline.html';
            return;
        }
        // Continue with auth initialization if online
        initializeAuthComponents();
    })();

    function initializeAuthComponents() {
        // Set up form handlers
        document.getElementById('authForm').addEventListener('submit', handleSignIn);
        document.getElementById('signupFormElement').addEventListener('submit', handleSignUp);
        
        // Set up password reset handlers
        setupPasswordReset();
        setupAuthSwitchers();
        
        // Set up logout button if it exists
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // Check for password reset flow
        handlePasswordResetFromEmail();

        // Firebase Auth State Listener
        firebase.auth().onAuthStateChanged(async (user) => {
                console.log('🔄 Auth state changed:', user?.uid);
                debugUserTracking(); // ADD THIS LINE
            
            if (user) {
                currentUser = {
                    uid: user.uid,
                    username: user.displayName || user.email,
                    email: user.email
                };
                
                if (window.petDataService) await window.petDataService.initialize(user.uid);
                
                setTimeout(() => {
                    if (typeof showExerciseLog === 'function') {
                        showExerciseLog();
                    } else {
                        document.getElementById('split-auth-container').style.display = 'none';
                        document.querySelector('.dashboard-container').style.display = 'flex';
                    }
                }, 500);
            } else {
                currentUser = null;
            }
        });
    }

    // Online/offline events - redirect to appropriate pages
    window.addEventListener('online', async () => {
        const isOnline = await checkConnection();
        if (isOnline && window.location.pathname.includes('offline.html')) {
            setTimeout(() => {
                if (currentUser) {
                    window.location.href = './index.html?page=dashboard';
                } else {
                    window.location.href = './index.html';
                }
            }, 2000);
        }
    });

    window.addEventListener('offline', () => {
        if (!window.location.pathname.includes('offline.html')) {
            window.location.href = './offline.html';
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    registerServiceWorker(); // From utils.js
    initAuth();
});
