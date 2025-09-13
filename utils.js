"use strict";

 const MOOD_EMOJIS = ['😀', '😊', '😐', '😞', '😠', '🤢', '😤', '😔', '😴', '😰'];
let deferredPrompt;

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js', {
            scope: '/Pet-Exercise-Log/'
        }).then(reg => {
            console.log('Service Worker registered with scope:', reg.scope);
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    }
}

// PWA Install
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();  
    deferredPrompt = event; 
    setTimeout(async () => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                console.log(choiceResult.outcome === 'accepted' ? 'User accepted install' : 'User dismissed install');
                deferredPrompt = null;
            } catch (error) {
                console.error('Auto Install prompt failed:', error);
            }
        }
    }, 2000);
    
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                try {
                    await deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    console.log(choiceResult.outcome === 'accepted' ? 'User accepted install' : 'User dismissed install');
                } catch (error) {
                    console.error('Manual Install failed:', error);
                } finally {
                    deferredPrompt = null;
                    installButton.style.display = 'none';
                }
            }
        });
    }
});



// Error handling - UPDATED
function showError(msg) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = msg;
    
    // Use auth container for messages
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.appendChild(error);
        setTimeout(() => error.remove(), 5000);
    } else {
        console.error('Error:', msg); // Fallback to console
    }
}
function showErrors(msgs) {
    msgs.forEach(msg => showError(msg));
}


// Success message function - UPDATED
function showSuccess(msg) {
    const success = document.createElement('div');
    success.className = 'success-message';
    success.textContent = msg;
    
    // Use auth container for messages
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.appendChild(success);
        setTimeout(() => success.remove(), 5000);
    } else {
        console.log('Success:', msg); // Fallback to console
    }
}

// Check if user is authenticated - IMPROVED
function checkAuth() {
    try {
        const userJson = sessionStorage.getItem('user');
        if (!userJson) return false;
        
        const user = JSON.parse(userJson);
        if (!user || !user.email) return false;
        
        // User is logged in, show dashboard, hide auth
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('lottie-banner').style.display = 'none';
        
        const dashboard = document.querySelector('.dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        // If there's any error, clear the invalid session
        sessionStorage.removeItem('user');
        return false;
    }
}
