"use strict";

let currentUser = null;

async function hashPassword(pass, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt ? pass + salt : pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleAuthSubmit(e, isSignUp) {
    e.preventDefault();
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        ...(isSignUp && {
            username: document.getElementById('username').value,
            confirmPassword: document.getElementById('confirmPassword')?.value
        })
    };

    const errors = [];
    if (isSignUp && !formData.username?.trim()) errors.push('Name required');
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) errors.push('Invalid email');
    if (formData.password.length < 8) errors.push('Password must be 8+ chars');
    if (isSignUp && formData.password !== formData.confirmPassword) errors.push('Passwords mismatch');

    if (errors.length) return showErrors(errors);

    try {
        const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
        const userData = {
            ...(isSignUp && { username: formData.username }),
            email: formData.email,
            password: await hashPassword(formData.password, salt),
            salt,
            lastLogin: new Date().toISOString()
        };
        
        currentUser = userData;
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Authentication error:', error);
        showError('Authentication failed. Please try again.');
    }
}

function showAuth(isSignUp = false) {
    document.getElementById('lottie-banner').style.display = 'block';
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    
    document.getElementById('authForm').addEventListener('submit', e => handleAuthSubmit(e, isSignUp));
    document.getElementById('switchAuth').addEventListener('click', e => {
        e.preventDefault();
        const newState = !isSignUp;
        document.getElementById('authForm').style.display = newState ? 'block' : 'none';
        document.getElementById('signupForm').style.display = newState ? 'none' : 'block';
    });
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
}
