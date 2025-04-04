// /Pet-Exercise-Log/js/dataService.js
const dataService = {
  pets: JSON.parse(localStorage.getItem('pets')) || [],

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

  updatePet: function(index, updatedPet) {
    if (index >= 0 && index < this.pets.length) {
      this.pets[index] = updatedPet;
      this.savePets();
    }
  },

  deletePet: function(index) {
    if (index >= 0 && index < this.pets.length) {
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
  }
};

export default dataService;
