"use strict";

const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;
  const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7dEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAAAAADgNhG4AAE0mNlCAAAAAElFTkSuQmCC';

  // HTML Templates
  const templates = {
    dashboard: () => `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <button id="addNewProfileButton" class="icon-btn">＋ New Profile</button>
          <button id="toggleModeButton" class="icon-btn">🌓 Toggle Mode</button>
        </header>

        <main class="dashboard-main">
          <section class="form-section">
            ${templates.petForm()}
          </section>

          <section class="data-section">
            <div class="calendar-container" id="exerciseCalendar"></div>
            <div class="charts-container">
              <canvas id="durationChart"></canvas>
              <canvas id="activityChart"></canvas>
              <canvas id="caloriesChart"></canvas>
            </div>
          </section>
        </main>

        <aside class="saved-profiles" id="savedProfiles"></aside>
      </div>
    `,

    petForm: () => `
      <form id="exerciseForm" class="pet-form card">
        <fieldset class="pet-details">
          <legend>Pet Profile</legend>
          <div class="form-group">
            <label for="petName">Name</label>
            <input type="text" id="petName" required>
          </div>
          <div class="form-group">
            <label>Image</label>
            <div class="image-upload">
              <input type="file" id="petImage" accept="image/*">
              <img id="petImagePreview" src="${DEFAULT_IMAGE}" alt="Pet Preview">
            </div>
          </div>
          <div class="form-group">
            <label for="petCharacteristics">Description</label>
            <textarea id="petCharacteristics" rows="3"></textarea>
          </div>
        </fieldset>

        <fieldset class="exercise-entry">
          <legend>New Exercise</legend>
          <div class="form-grid">
            <div class="form-group">
              <label for="exerciseType">Type</label>
              <select id="exerciseType" required>
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="swimming">Swimming</option>
                <option value="playing">Playing</option>
              </select>
            </div>
            <div class="form-group">
              <label for="exerciseDuration">Duration (min)</label>
              <input type="number" id="exerciseDuration" min="1" required>
            </div>
            <div class="form-group">
              <label for="exerciseDate">Date</label>
              <input type="date" id="exerciseDate" required>
            </div>
            <div class="form-group">
              <label for="caloriesBurned">Calories</label>
              <input type="number" id="caloriesBurned" min="1" required>
            </div>
          </div>
          <button type="submit" class="primary-btn">
            ${activePetIndex === null ? 'Create Profile' : 'Add Exercise'}
          </button>
        </fieldset>
      </form>
    `
  };

  // Core Functions
  function showExerciseLog() {
    AppHelper.showPage(templates.dashboard());
    this.initializeModules();
    this.setupEventListeners();
    this.loadSavedProfiles();
    this.loadActivePetData();
  }

  function initializeModules() {
    CalendarModule.init('#exerciseCalendar');
    ChartsModule.init('.charts-container');
  }

  function setupEventListeners() {
    document.getElementById('exerciseForm').addEventListener('submit', e => this.handleFormSubmit(e));
    document.getElementById('petImage').addEventListener('change', e => this.handleImageUpload(e));
    document.getElementById('toggleModeButton').addEventListener('click', this.toggleDarkMode);
    document.getElementById('addNewProfileButton').addEventListener('click', this.resetForm);
  }

  // Data Handling
  function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = this.validateFormData({
        petName: document.getElementById('petName').value,
        petImage: document.getElementById('petImagePreview').src,
        characteristics: document.getElementById('petCharacteristics').value,
        exerciseType: document.getElementById('exerciseType').value,
        duration: document.getElementById('exerciseDuration').value,
        date: document.getElementById('exerciseDate').value,
        calories: document.getElementById('caloriesBurned').value
      });

      const updatedPet = this.processPetData(formData);
      this.savePetData(updatedPet);
      this.updateDashboard(updatedPet);

    } catch (error) {
      AppHelper.showError(error.message);
    }
  }

  function validateFormData(data) {
    const errors = [];
    if (!data.petName.trim()) errors.push('Pet name is required');
    if (data.duration < 1) errors.push('Duration must be at least 1 minute');
    if (data.calories < 1) errors.push('Calories burned must be at least 1');
    if (!data.date) errors.push('Date is required');

    if (errors.length > 0) throw new Error(errors.join('\n'));
    return data;
  }

  function processPetData(formData) {
    const currentPet = this.getActivePet() || {
      petDetails: { name: '', image: DEFAULT_IMAGE, characteristics: '' },
      exerciseEntries: []
    };

    return {
      petDetails: {
        ...currentPet.petDetails,
        name: formData.petName,
        image: formData.petImage,
        characteristics: formData.characteristics
      },
      exerciseEntries: [
        ...currentPet.exerciseEntries,
        {
          type: formData.exerciseType,
          duration: Number(formData.duration),
          date: formData.date,
          caloriesBurned: Number(formData.calories)
        }
      ]
    };
  }

  function savePetData(petData) {
    const pets = this.getPets();
    
    if (activePetIndex === null) {
      if (pets.length >= MAX_PETS) throw new Error('Maximum pet profiles reached');
      pets.push(petData);
      activePetIndex = pets.length - 1;
    } else {
      pets[activePetIndex] = petData;
    }

    localStorage.setItem('pets', JSON.stringify(pets));
    sessionStorage.setItem('activePetIndex', activePetIndex);
  }

  // Dashboard Integration
  function updateDashboard(petData) {
    CalendarModule.refresh(petData.exerciseEntries);
    ChartsModule.refresh(petData.exerciseEntries);
    this.loadSavedProfiles();
    AppHelper.refreshComponent('#petForm', templates.petForm());
  }

  function loadActivePetData() {
    const savedIndex = sessionStorage.getItem('activePetIndex');
    if (savedIndex !== null) {
      activePetIndex = parseInt(savedIndex, 10);
      const petData = this.getPets()[activePetIndex];
      if (petData) this.updateDashboard(petData);
    }
  }

  // Profile Management
  function loadSavedProfiles() {
    const pets = this.getPets();
    const profilesHTML = pets.map((pet, index) => `
      <div class="profile-card ${index === activePetIndex ? 'active' : ''}">
        <img src="${pet.petDetails.image || DEFAULT_IMAGE}" alt="${pet.petDetails.name}">
        <h4>${pet.petDetails.name}</h4>
        <button class="select-btn" data-index="${index}">
          ${index === activePetIndex ? 'Selected' : 'Select'}
        </button>
      </div>
    `).join('');

    AppHelper.renderComponent('#savedProfiles', profilesHTML);
    this.addProfileEventListeners();
  }

  function addProfileEventListeners() {
    document.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePetIndex = parseInt(btn.dataset.index, 10);
        this.loadActivePetData();
      });
    });
  }

  // Utility Functions
  function resetForm() {
    activePetIndex = null;
    sessionStorage.removeItem('activePetIndex');
    AppHelper.refreshComponent('#petForm', templates.petForm());
    this.loadSavedProfiles();
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    ChartsModule.updateColors();
    CalendarModule.refresh();
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('petImagePreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Public API
  return {
    showExerciseLog,
    getPets: () => JSON.parse(localStorage.getItem("pets")) || [],
    getActivePet: () => activePetIndex !== null ? this.getPets()[activePetIndex] : null
  };
})();
