//* monthlyReport *//
const SavedProfiles = (function() {
  const renderSavedProfiles = () => {
    const pets = dataService.getPets();
    const activePetIndex = dataService.getActivePetIndex();
    const html = `
      <div class="saved-profiles-list">
        ${pets.map((pet, index) => `
          <div class="saved-profile ${activePetIndex === index ? 'active' : ''}">
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
      dataService.setActivePetIndex(index);
      PetFormSection.renderPetForm(dataService.getPets()[index]);
    } else if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pets = dataService.getPets();
      if (confirm(`Delete ${pets[index].name}?`)) {
        pets.splice(index, 1);
        dataService.savePets(pets);
        renderSavedProfiles();
        // Optionally clear active pet if the deleted one was active
        if (dataService.getActivePetIndex() === index) {
          dataService.setActivePetIndex(null);
          PetFormSection.renderPetForm(); // Render an empty form
        }
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
  };

  // Placeholder for QR code generation function (implementation needed)
  const generatePetQR = (pet) => {
    alert(`QR code functionality for ${pet.name} will be implemented here.`);
    // You would typically use a library like qrcode.js to generate and display the QR code
  };

  return {
    renderSavedProfiles: renderSavedProfiles
  };
})();
export { SavedProfiles };


