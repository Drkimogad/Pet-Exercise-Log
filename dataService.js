// /Pet-Exercise-Log/js/dataService.js
const dataService = {
  pets: [],

  savePets: function() {
    localStorage.setItem('pets', JSON.stringify(this.pets));
  },

  getPets: function() {
    return [...this.pets]; // Return a copy to prevent direct manipulation
  },

  addPet: function(pet) {
    this.pets.push(pet);
    this.savePets();
  },

  updatePet: function(id, updatedPet) {
    const index = this.pets.findIndex(pet => pet.id === id);
    if (index !== -1) {
      this.pets[index] = updatedPet;
      this.savePets();
    }
  },

  deletePet: function(id) {
    const index = this.pets.findIndex(pet => pet.id === id);
    if (index !== -1) {
      this.pets.splice(index, 1);
      this.savePets();
    }
  },

  getActivePetIndex: function() {
    return sessionStorage.getItem('activePetIndex') ? parseInt(sessionStorage.getItem('activePetIndex')) : null;
  },

  setActivePetIndex: function(index) {
    sessionStorage.setItem('activePetIndex', index);
  },

  getActivePet: function() {
    const index = this.getActivePetIndex();
    return index !== null ? this.pets[index] : null;
  },

  // --- User Data ---
  getUsers: function() {
    return JSON.parse(localStorage.getItem('users')) || [];
  },

  saveUser: function(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }
};

export default dataService;
