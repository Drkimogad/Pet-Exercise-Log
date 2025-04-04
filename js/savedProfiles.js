import dataService from './dataService.js';

const SavedProfilesSection = (function() {
  const renderSavedProfiles = () => {
    const pets = dataService.getPets();
    const html = `
      <div class="saved-profiles-list">
        ${pets.map((pet, index) => `
          <div class="saved-profile ${state.activePetIndex === index ? 'active' : ''}">
            <img src="${pet.image || 'default-pet.png'}" alt="${pet.name}">
            <h4>${pet.name}</h4>
            <div class="profile-actions">
              <button class="edit-btn" data-index="${index}">Edit</button>
              <button class="delete-btn" data-index="${index}">Delete</button>
              <button class="print-btn" data-index="${index}">Print</button>
              <button class="qr-btn" data-index="${index}">🔲 QR Code</button>
              <button class="share-btn" data-index="${index}">Share</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    document.getElementById('savedProfiles').innerHTML = html;
    attachProfileActionHandlers();
  };

  const handleProfileAction = (e) => {
    if (e.target.classList.contains('edit-btn')) {
      const index = parseInt(e.target.dataset.index);
      state.activePetIndex = index;
      sessionStorage.setItem('activePetIndex', index);
      PetFormSection.renderPetForm(dataService.getPets()[index]);
    } else if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pets = dataService.getPets();
      if (confirm(`Delete ${pets[index].name}?`)) {
        pets.splice(index, 1);
        dataService.savePets(pets);
        renderSavedProfiles();
      }
    } else if (e.target.classList.contains('qr-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = dataService.getPets()[index];
      generatePetQR(pet);
    } else if (e.target.classList.contains('print-btn')) {
        const index = parseInt(e.target.dataset.index);
        const pet = dataService.getPets()[index];
        ReportGenerator.generatePDF(pet);
    } else if (e.target.classList.contains('share-btn')){
        const index = parseInt(e.target.dataset.index);
        const pet = dataService.getPets()[index];
        sharePetProfile(pet);
    }
  };

  const attachProfileActionHandlers = () => {
    document.addEventListener('click', handleProfileAction);
  };

  const sharePetProfile = (pet) => {
    if(navigator.share){
        navigator.share({
            title: `Pet Profile: ${pet.name}`,
            text: `Check out ${pet.name}'s profile!`,
            url: window.location.href, // or a specific URL
        }).then(()=> console.log('Shared successfully'))
        .catch(error => console.error('Error sharing:', error))
    } else {
        alert('Sharing not supported on this device');
    }
  }

  return {
    renderSavedProfiles: renderSavedProfiles
  };
})();
