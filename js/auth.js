// auth.js - Vanilla JS Authentication
/* ==================== */
/*  Authentication Functions */
/* ==================== */

let currentUser = null;

// Initialize authentication
function initAuth() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForAuthState(true);
    }
    
    // Set up auth event listeners
    setupAuthEventListeners();
}

// Set up authentication event listeners
function setupAuthEventListeners() {
    // Sign in button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'signInButton') {
            handleSignIn();
        }
    });
    
    // Sign out button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'signOutButton') {
            handleSignOut();
        }
    });
    
    // Auth form submission
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'authForm') {
            e.preventDefault();
            const isSignUp = e.target.querySelector('input[name="username"]') !== null;
            handleAuthSubmit(e, isSignUp);
        }
    });
}

// Handle sign in
function handleSignIn() {
    try {
        console.log("User signed in");
        
        // For demo purposes - replace with actual authentication
        currentUser = {
            email: "user@example.com",
            username: "Pet Lover",
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        updateUIForAuthState(true);
        
    } catch (error) {
        console.error("Sign in error:", error);
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'Sign In');
        }
    }
}

// Handle sign out
function handleSignOut() {
    try {
        console.log("User signed out");
        localStorage.removeItem("currentUser");
        currentUser = null;
        updateUIForAuthState(false);
    } catch (error) {
        console.error("Sign out error:", error);
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'Sign Out');
        }
    }
}

// Get current user
function getCurrentUser() {
    if (!currentUser) {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    }
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Update UI based on authentication state
function updateUIForAuthState(isLoggedIn) {
    const signInBtn = document.getElementById('signInButton');
    const signOutBtn = document.getElementById('signOutButton');
    const userWelcome = document.getElementById('userWelcome');
    
    if (signInBtn) signInBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (signOutBtn) signOutBtn.style.display = isLoggedIn ? 'block' : 'none';
    
    if (userWelcome && isLoggedIn) {
        const user = getCurrentUser();
        userWelcome.textContent = `Welcome, ${user.username || 'User'}!`;
        userWelcome.style.display = 'block';
    } else if (userWelcome) {
        userWelcome.style.display = 'none';
    }
}

// Handle auth form submission
function handleAuthSubmit(e, isSignUp) {
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        // Clear previous errors
        const errorElements = form.querySelectorAll('.error-text');
        errorElements.forEach(el => el.remove());
        
        // Get form values
        const email = form.email.value;
        const simplePin = form.pin ? form.pin.value : '';
        
        // Simple validation
        if (!email) {
            showFormError(form, 'Email is required');
            return;
        }
        
        if (isSignUp) {
            const username = form.username.value;
            if (!username) {
                showFormError(form, 'Name is required');
                return;
            }
            
            // For demo - create a simple user account
            const users = getUsers();
            if (users.some(u => u.email === email)) {
                showFormError(form, 'User already exists');
                return;
            }
            
            const newUser = { 
                email, 
                username, 
                pin: simplePin // In real app, this would be hashed
            };
            
            saveUser(newUser);
            showAuthSuccess('Account created! Please sign in.');
            showAuthForm(false);
            
        } else {
            // Sign in logic
            const users = getUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                showFormError(form, 'User not found');
                return;
            }
            
            if (user.pin !== simplePin) {
                showFormError(form, 'Invalid PIN');
                return;
            }
            
            // Successful login
            currentUser = {
                email: user.email,
                username: user.username,
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            updateUIForAuthState(true);
        }
        
    } catch (error) {
        console.error("Auth submit error:", error);
        showFormError(form, error.message || 'Authentication failed');
        
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
}

// Helper function to show form error
function showFormError(form, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-text';
    errorDiv.style.color = 'red';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
}

// Show auth success message
function showAuthSuccess(message) {
    // You can implement a toast or message display here
    alert(message); // Simple alert for demo
}

// Show/hide auth form
function showAuthForm(show) {
    const authForm = document.getElementById('authFormContainer');
    if (authForm) {
        authForm.style.display = show ? 'block' : 'none';
    }
}

// Get users from storage
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('users')) || [];
    } catch (error) {
        console.error("Error getting users:", error);
        return [];
    }
}

// Save user to storage
function saveUser(user) {
    try {
        const users = getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error("Error saving user:", error);
        return false;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});
