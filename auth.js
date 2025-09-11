"use strict";

let currentUser = null;

async function hashPassword(pass, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt ? pass + salt : pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Handle Sign Up
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
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const userData = {
            username: formData.username,
            email: formData.email,
            password: await hashPassword(formData.password, salt),
            salt,
            lastLogin: new Date().toISOString()
        };
        
        // Save to localStorage (for demo purposes)
        localStorage.setItem('user_' + formData.email, JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Show success and redirect
        showSuccess('Account created successfully!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Sign up error:', error);
        showError('Sign up failed. Please try again.');
    }
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
        
        // Show success and redirect
        showSuccess('Signed in successfully!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
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

// Initialize authentication
function initAuth() {
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Set up form handlers
    document.getElementById('authForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignUp);
    
    // Set up auth switchers
    setupAuthSwitchers();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
