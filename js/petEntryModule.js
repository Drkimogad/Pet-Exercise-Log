"use strict";

const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  let currentPetData = null;

  // Data Structure Enhancements
  const defaultPetProfile = {
    petDetails: {
      name: '',
      image: '',
      species: '',
      breed: '',
      age: '',
      characteristics: ''
    },
    exerciseEntries: [],
    healthMetrics: {}
  };

  // Unified Dashboard Initialization
  function showExerciseLog() {
    AppHelper.showPage(`
      <div class="dashboard-layout">
        <!-- Profile Section -->
        <section class="profile-section" id="profileSection"></section>
        
        <!-- Entry Form -->
        <section class="entry-form-section card" id="entryForm"></section>
        
        <!-- Calendar & Charts -->
        <section class="data-section">
          <div class="calendar-container card" id="calendarContainer"></div>
          <div class="charts-container card" id="chartsContainer"></div>
        </section>
        
        <!-- Saved Profiles -->
        <aside class="saved-profiles card" id="savedProfiles"></aside>
      </div>
    `);

    this.initializeComponents();
    this.loadSavedProfiles();
    this.setupEventListeners();
  }

  function initializeComponents() {
    // Render profile form
    AppHelper.renderComponent('entryForm', this.renderPetForm());
    
    // Initialize other modules
    CalendarModule.init('#calendarContainer');
    ChartsModule.init('#chartsContainer');
    
    // Load initial data
    this.loadEntries().then(data => {
      currentPetData = data;
      DashboardModule.refresh(data);
    });
  }

  // Enhanced Form Rendering
  function renderPetForm() {
    const pet = this.getActivePet() || defaultPetProfile;
    return `
      <form id="exerciseForm" class="pet-form">
        <div class="form-column">
          <h3>${pet.petDetails.name || 'New Pet Profile'}</h3>
          <div class="form-group">
            <label>Pet Image</label>
            <div class="image-upload">
              <input type="file" id="petImage" accept="image/*">
              <img id="petImagePreview" src="${pet.petDetails.image || 'placeholder.jpg'}" alt="Pet Image">
            </div>
          </div>
          
          <div class="form-group">
            <label>Pet Name</label>
            <input type="text" id="petName" value="${pet.petDetails.name}" required>
          </div>
        </div>

        <div class="form-column">
          <div class="form-group">
            <label>Exercise Details</label>
            <input type="text" id="exerciseType" placeholder="Activity type" required>
            <input type="number" id="exerciseDuration" placeholder="Duration (mins)" required>
            <input type="date" id="exerciseDate" required>
          </div>
          
          <div class="form-group">
            <button type="submit" class="primary-btn">
              ${activePetIndex === null ? 'Create Profile' : 'Update Profile'}
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Data Handling Improvements
  async function loadEntries() {
    const pet = this.getActivePet();
    return pet ? pet.exerciseEntries : [];
  }

  function handleProfileSave(event) {
    event.preventDefault();
    const formData = this.collectFormData();
    
    if (!this.validateForm(formData)) return;

    const updatedPet = this.createPetProfile(formData);
    this.savePetProfile(updatedPet);
    
    DashboardModule.refresh(updatedPet.exerciseEntries);
    AppHelper.refreshComponent('entryForm');
  }

  function collectFormData() {
    return {
      petDetails: {
        name: document.getElementById('petName').value,
        image: document.getElementById('petImagePreview').src,
        characteristics: document.getElementById('petCharacteristics').value
      },
      exerciseEntry: {
        type: document.getElementById('exerciseType').value,
        duration: document.getElementById('exerciseDuration').value,
        date: document.getElementById('exerciseDate').value,
        caloriesBurned: document.getElementById('caloriesBurned').value
      }
    };
  }

  function validateForm(formData) {
    // Add comprehensive validation
    if (!formData.petDetails.name) {
      AppHelper.showError('Pet name is required');
      return false;
    }
    if (!formData.exerciseEntry.type || !formData.exerciseEntry.duration) {
      AppHelper.showError('Exercise details are incomplete');
      return false;
    }
    return true;
  }

  function createPetProfile(formData) {
    const existing = this.getActivePet() || {...defaultPetProfile};
    return {
      ...existing,
      petDetails: {...existing.petDetails, ...formData.petDetails},
      exerciseEntries: [...existing.exerciseEntries, formData.exerciseEntry]
    };
  }

  function savePetProfile(updatedPet) {
    let pets = this.getPets();
    
    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) {
        AppHelper.showError('Maximum profiles reached');
        return;
      }
      pets.push(updatedPet);
      activePetIndex = pets.length - 1;
    } else {
      pets[activePetIndex] = updatedPet;
    }
    
    this.setPets(pets);
    sessionStorage.setItem('currentPet', JSON.stringify(updatedPet));
  }

  // Enhanced Profile Switching
  function loadSavedProfiles() {
    const pets = this.getPets();
    AppHelper.renderComponent('savedProfiles', `
      <h3>Saved Profiles</h3>
      <div class="profiles-grid">
        ${pets.map((pet, index) => `
          <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
            <img src="${pet.petDetails.image}">
            <h4>${pet.petDetails.name}</h4>
            <button class="select-profile" data-index="${index}">
              ${index === activePetIndex ? 'Selected' : 'Select'}
            </button>
          </div>
        `).join('')}
      </div>
    `);
  }

  function setupEventListeners() {
    // Unified event delegation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('select-profile')) {
        this.handleProfileSelect(e.target.dataset.index);
      }
      if (e.target.id === 'toggleModeButton') {
        this.handleToggleMode();
      }
    });

    document.getElementById('exerciseForm').addEventListener('submit', (e) => this.handleProfileSave(e));
    document.getElementById('petImage').addEventListener('change', (e) => this.handleImageUpload(e));
  }

  function handleProfileSelect(index) {
    activePetIndex = parseInt(index, 10);
    currentPetData = this.getActivePet().exerciseEntries;
    DashboardModule.refresh(currentPetData);
    AppHelper.refreshComponent('entryForm');
    AppHelper.refreshComponent('savedProfiles');
  }

  // Maintain existing image upload and toggle mode functions
  // ...

  return {
    showExerciseLog,
    loadEntries,
    getActivePet,
    updateActivePet: savePetProfile
  };
})(); mode activated. Form cleared and saved profiles hidden.");
  }

  // Handle image upload preview
  function handleImageUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('petImagePreview').src = e.target.result;
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  }

  // Handle dark mode toggle
  function handleToggleMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    console.log("Dark mode toggled.");
  }

  // Load saved pet profiles and display them
  function loadSavedProfiles() {
    const pets = getPets();
    const savedProfilesContainer = document.getElementById('savedProfiles');
    savedProfilesContainer.innerHTML = '';

    pets.forEach((pet, index) => {
      const petDiv = document.createElement('div');
      petDiv.classList.add('savedProfile');
      petDiv.innerHTML = `
        <img src="${pet.petDetails.image}" alt="${pet.petDetails.name}" style="width: 50px; height: 50px;">
        <h3>${pet.petDetails.name}</h3>
        <button class="selectPetButton" data-index="${index}">Select</button>
      `;
      savedProfilesContainer.appendChild(petDiv);

      // Attach event listeners for selecting a pet profile
      petDiv.querySelector('.selectPetButton').addEventListener('click', function() {
        activePetIndex = parseInt(this.dataset.index, 10);
        showExerciseLog();
      });
    });

    // Show saved profiles section
    if (pets.length > 0) {
      document.getElementById('savedProfilesContainer').style.display = 'block';
    }
  }

  // Handle logout
  function logout() {
    alert("Logging out...");
    // Add logout logic if necessary (e.g., clear session or localStorage)
  }

  return {
    showExerciseLog,
    updateActivePet
  };
})();
