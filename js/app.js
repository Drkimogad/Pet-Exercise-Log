"use strict";

document.addEventListener('DOMContentLoaded', () => {
  ServiceWorkerModule.registerServiceWorker();
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  if (sessionStorage.getItem('user')) {
    PetEntryModule.showExerciseLog();
  } else {
    AuthModule.showSignIn();
  }
});
