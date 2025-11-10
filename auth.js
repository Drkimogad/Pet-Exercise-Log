"use strict";

let currentUser = null;

// 🆕 OFFLINE MANAGEMENT - ADD THIS BLOCK
let isOffline = false;
let offlineChecked = false;

class OfflineManager {
    static async checkConnection() {
        try {
            console.log('🔍 [OFFLINE DEBUG] Starting connection test...');
            console.log('🔍 [OFFLINE DEBUG] navigator.onLine:', navigator.onLine);
            console.log('🔍 [OFFLINE DEBUG] Testing URL:', '/Pet-Exercise-Log/index.html');
            
            const response = await fetch('/Pet-Exercise-Log/index.html', {
                method: 'HEAD',
                cache: 'no-store'
            });
            
            console.log('✅ [OFFLINE DEBUG] Connection test SUCCESS - Status:', response.status);
            return response.ok;
        } catch (error) {
            console.log('❌ [OFFLINE DEBUG] Connection test FAILED:', error.message);
            console.log('❌ [OFFLINE DEBUG] Error details:', error);
            return false;
        }
    }

    static async handleOffline() {
        console.log('📶 [OFFLINE DEBUG] handleOffline() called');
        console.log('📶 [OFFLINE DEBUG] Current isOffline:', isOffline);
        console.log('📶 [OFFLINE DEBUG] Current location:', window.location.href);
        
        if (isOffline) {
            console.log('🔄 [OFFLINE DEBUG] Already offline - skipping');
            return;
        }
        
        console.log('📶 [OFFLINE DEBUG] Setting isOffline = true');
        isOffline = true;
        
        // Only redirect if we're not already on offline page
        if (!window.location.pathname.includes('offline.html')) {
            console.log('🔄 [OFFLINE DEBUG] Redirecting to offline.html');
            window.location.href = 'offline.html';
        } else {
            console.log('✅ [OFFLINE DEBUG] Already on offline page - no redirect needed');
        }
    }

    static handleOnline() {
        console.log('🌐 [OFFLINE DEBUG] handleOnline() called');
        console.log('🌐 [OFFLINE DEBUG] Setting isOffline = false');
        isOffline = false;
    }
}


// Handle Sign Up with Firebase
async function handleSignUp(e) {
        e.preventDefault();
       // 🆕 OFFLINE CHECK - ADD THIS AT START
    const isOnline = await OfflineManager.checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking signup - offline');
        showError('Cannot sign up while offline. Please check your internet connection.');
        return;
    }
    // END OF OFFLINE CHECK
    
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

         // 🆕 OFFLINE CHECK - ADD THIS AT START  
    const isOnline = await OfflineManager.checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking signin - offline');
        showError('Cannot sign in while offline. Please check your internet connection.');
        return;
    }
    // END OF OFFLINE CHECK

    
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

        // 🆕 OFFLINE CHECK - ADD THIS AT START
    const isOnline = await OfflineManager.checkConnection();
    if (!isOnline) {
        console.log('❌ Blocking password reset - offline');
        showError('Cannot reset password while offline. Please check your internet connection.');
        return;
    }
    // END OF OFFLINE CHECK

    
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

    // 🆕 OFFLINE CHECK - ADD THIS AT START OF initAuth
(async () => {
    console.log('🚀 [OFFLINE DEBUG] Starting initAuth offline check');
    console.log('🚀 [OFFLINE DEBUG] offlineChecked:', offlineChecked);
    console.log('🚀 [OFFLINE DEBUG] navigator.onLine:', navigator.onLine);
    
    if (!offlineChecked) {
        console.log('🔍 [OFFLINE DEBUG] Running initial connection check...');
        const isOnline = await OfflineManager.checkConnection();
        offlineChecked = true;
        console.log('🔍 [OFFLINE DEBUG] Connection check result:', isOnline);
        
        if (!isOnline) {
            console.log('❌ [OFFLINE DEBUG] No connection - calling handleOffline()');
            await OfflineManager.handleOffline();
            return; // Stop auth initialization
        } else {
            console.log('✅ [OFFLINE DEBUG] Connection OK - continuing auth initialization');
        }
    } else {
        console.log('✅ [OFFLINE DEBUG] Already checked - skipping connection test');
    }
})();

    
        // 🆕 OFFLINE CHECK - ADD THIS AT START OF LOGOUT
    if (isOffline) {
        console.log('❌ Blocking logout - offline');
        showError('Cannot logout while offline. Some data may not sync properly.');
        return;
    }
    // END OF OFFLINE CHECK

    // Firebase Auth - Sign out
    firebase.auth().signOut().then(() => {
        // Clear user session
        currentUser = null;
        
        // Hide dashboard, show auth forms
        document.querySelector('.dashboard-container').style.display = 'none';
        document.querySelector('.split-auth-container').style.display = 'flex'; // ✅ CHANGED
        
        // Show sign-in form specifically
        document.getElementById('signinForm').style.display = 'flex';
        document.getElementById('signupForm').style.display = 'none';
        
        // Clear any form values
        document.getElementById('authForm').reset();
        
        console.log('User logged out successfully');
    }).catch((error) => {
        console.error('Firebase logout error:', error);
    });
}

// Finally, update initAuth to handle Firebase auth state:
function initAuth() {  // await petDataService 
      // 🆕 OFFLINE CHECK - ADD THIS AT START OF initAuth
    (async () => {
        if (!offlineChecked) {
            console.log('🔍 Initial connection check...');
            const isOnline = await OfflineManager.checkConnection();
            offlineChecked = true;
            
            if (!isOnline) {
                console.log('❌ No connection on startup - showing offline page');
                await OfflineManager.handleOffline();
                return; // Stop auth initialization
            }
        }
    })();
    // END OF OFFLINE CHECK
    
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
firebase.auth().onAuthStateChanged(async (user) => {  // ADD ASYNC HERE
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            username: user.displayName || user.email,
            email: user.email
        };
    // ADD THIS LINE FOR PETDATA SERVICE INITIALIZATION FROM UTILS.JS
    if (window.petDataService) await window.petDataService.initialize(user.uid);
        
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
    } else {
        // User is signed out
        currentUser = null;
    }
});
    // 🆕 ONLINE/OFFLINE EVENT LISTENERS - ADD THIS AT END BEFORE CLOSING BRACE
    window.addEventListener('online', async () => {
        console.log('🌐 Online event detected');
        OfflineManager.handleOnline();
        
        // If we're on offline page and come back online, redirect appropriately
        if (window.location.pathname.includes('offline.html')) {
            console.log('🔄 Redirecting from offline page');
            setTimeout(() => {
                if (currentUser) {
                    window.location.href = 'index.html?page=dashboard';
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);
        }
    });

    window.addEventListener('offline', () => {
        console.log('📵 Offline event detected');
        OfflineManager.handleOffline();
    });
    // END OF EVENT LISTENERS

} // ← initAuth closing brace


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    registerServiceWorker(); // From utils.js
    initAuth();
});
