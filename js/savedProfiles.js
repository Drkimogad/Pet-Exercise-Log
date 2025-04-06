// SavedProfiles.js

const SavedProfiles = (function() {
  // Function to get the list of pets from localStorage
  const getPets = () => {
    try {
      const pets = JSON.parse(localStorage.getItem('petData'));
      return pets || []; // Return an empty array if no pets are saved
    } catch (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
  };

  // Function to save the list of pets to localStorage
  const savePets = (pets) => {
    try {
      localStorage.setItem('petData', JSON.stringify(pets));
    } catch (error) {
      console.error('Error saving pets:', error);
    }
  };

  // Function to get the active pet index from localStorage
  const getActivePetIndex = () => {
    try {
      return parseInt(localStorage.getItem('activePetIndex')) || null;
    } catch (error) {
      console.error('Error fetching active pet index:', error);
      return null;
    }
  };

  // Function to set the active pet index in localStorage
  const setActivePetIndex = (index) => {
    try {
      localStorage.setItem('activePetIndex', index);
    } catch (error) {
      console.error('Error setting active pet index:', error);
    }
  };

  // Function to render saved pet profiles
  const renderSavedProfiles = () => {
    const pets = getPets();
    const activePetIndex = getActivePetIndex();
    
    // Render the HTML structure for each pet profile
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

    // Attach event handlers for profile actions like edit, delete, etc.
    attachProfileActionHandlers();
  };

  // Function to handle profile actions (Edit, Delete, etc.)
  const handleProfileAction = (e) => {
    if (e.target.classList.contains('edit-btn')) {
      const index = parseInt(e.target.dataset.index);
      setActivePetIndex(index);
      PetFormSection.renderPetForm(getPets()[index]);
    } else if (e.target.classList.contains('delete-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pets = getPets();
      if (confirm(`Delete ${pets[index].name}?`)) {
        pets.splice(index, 1); // Remove the pet at the specified index
        savePets(pets); // Save updated list to localStorage
        renderSavedProfiles(); // Re-render the saved profiles
        if (getActivePetIndex() === index) {
          setActivePetIndex(null); // Clear active pet if it was the deleted one
          PetFormSection.renderPetForm(); // Render an empty form
        }
      }
    } else if (e.target.classList.contains('qr-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      generatePetQR(pet);
    } else if (e.target.classList.contains('print-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      ReportGenerator.generatePDF(pet);
    } else if (e.target.classList.contains('share-btn')) {
      const index = parseInt(e.target.dataset.index);
      const pet = getPets()[index];
      sharePetProfile(pet);
    }
  };

  // Function to attach event handlers for profile actions
  const attachProfileActionHandlers = () => {
    document.addEventListener('click', handleProfileAction);
  };

  // Function to share a pet profile using the Web Share API
  const sharePetProfile = (pet) => {
    if (navigator.share) {
      navigator.share({
        title: `Pet Profile: ${pet.name}`,
        text: `Check out ${pet.name}'s profile!`,
        url: window.location.href,
      }).then(() => console.log('Shared successfully'))
        .catch(error => console.error('Error sharing:', error));
    } else {
      alert('Sharing not supported on this device');
    }
  };

  // Placeholder for QR code generation function (using a QR code library)
  const generatePetQR = (pet) => {
    alert(`QR code functionality for ${pet.name} will be implemented here.`);
    // You would use a library like qrcode.js to generate the QR code here
  };

  return {
    renderSavedProfiles: renderSavedProfiles
  };
})();

export { SavedProfiles };
