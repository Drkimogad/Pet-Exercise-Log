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

// Error handling
function showError(msg) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = msg;
    document.getElementById('app').appendChild(error);
    setTimeout(() => error.remove(), 5000);
}

function showErrors(msgs) {
    msgs.forEach(msg => showError(msg));
}
