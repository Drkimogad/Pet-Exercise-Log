"use strict";

const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;

  function getPets() {
    return JSON.parse(localStorage.getItem("pets")) || [];
  }

  function setPets(pets) {
    localStorage.setItem("pets", JSON.stringify(pets));
  }

  function getActivePet() {
    const pets = getPets();
    return activePetIndex !== null ? pets[activePetIndex] : null;
  }

  function updateActivePet(updatedPet) {
    let pets = getPets();
    if (activePetIndex !== null) {
      pets[activePetIndex] = updatedPet;
      setPets(pets);
    }
  }

  function showExerciseLog() {
    const dashboardHTML = `...`;  // Same HTML as you provided
    AppHelper.showPage(dashboardHTML);

    // Attach event listeners for form submission, logout, etc.
  }

  return {
    showExerciseLog,
    updateActivePet
  };
})();
