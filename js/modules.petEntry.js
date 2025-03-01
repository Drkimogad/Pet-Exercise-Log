"use strict";

const PetEntryModule = (function() {
  let activePetIndex = null;
  const MAX_PETS = 10;

  // Function to get the list of pets from localStorage
  function getPets() {
    return JSON.parse(localStorage.getItem("pets")) || [];
  }

  // Function to save the updated list of pets into localStorage
  function setPets(pets) {
    localStorage.setItem("pets", JSON.stringify(pets));
  }

  // Function to retrieve the active pet based on the current index
  function getActivePet() {
    const pets = getPets();
    return activePetIndex !== null ? pets[activePetIndex] : null;
  }

  // Function to update the active pet in the list and save it to localStorage
  function updateActivePet(updatedPet) {
    let pets = getPets();
    if (activePetIndex !== null) {
      pets[activePetIndex] = updatedPet;
      setPets(pets);
    }
  }

  // Function to show the exercise log page and form
  function showExerciseLog() {
    const dashboardHTML = `
      <div id="entryContainer">
        <form id="exerciseForm">
          <!-- Pet Details Section -->
          <fieldset>
            <legend>Pet Details</legend>
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" value="${getActivePet() ? getActivePet().petDetails.name : ''}" required>
            <br>
            <label for="petImage">Upload Pet Image:</label>
            <input type="file" id="petImage" accept="image/*">
            <br>
            <img id="petImagePreview" style="max-width: 100px;" src="${getActivePet() && getActivePet().petDetails.image ? getActivePet().petDetails.image : ''}" alt="Pet Image Preview" />
            <br>
            <label for="petCharacteristics">Characteristics:</label>
            <textarea id="petCharacteristics" rows="3" placeholder="e.g., Gender, Age, Activity level, Temperament">${getActivePet() ? getActivePet().petDetails.characteristics : ''}</textarea>
          </fieldset>
          
          <!-- Exercise Entry Section -->
          <fieldset>
            <legend>Exercise Entry</legend>
            <label for="exerciseType">Type of Exercise:</label>
            <input type="text" id="exerciseType" placeholder="e.g., Walking, Running">
            <br>
            <label for="exerciseDuration">Duration (minutes):</label>
            <input type="number" id="exerciseDuration" placeholder="e.g., 30" required>
            <br>
            <label for="exerciseDate">Date:</label>
            <input type="date" id="exerciseDate" required>
            <br>
            <label for="bodyconditionScoring">Body Condition Scoring:</label>
            <input type="text" id="bodyconditionScoring" placeholder="e.g., Obese, Overweight, Lean">
            <br>
            <label for="exerciseTime">Time:</label>
            <input type="time" id="exerciseTime">
            <br>
            <label for="exerciseIntensity">Intensity Level:</label>
            <select id="exerciseIntensity">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <br>
            <label for="caloriesBurned">Calories Burned (required):</label>
            <input type="number" id="caloriesBurned" placeholder="e.g., 150" required>
            <br>
            <label for="exerciseNotes">Notes/Comments:</label>
            <textarea id="exerciseNotes" placeholder="Any observations or details"></textarea>
            <br>
            <label for="exerciseLocation">Location (optional):</label>
            <input type="text" id="exerciseLocation" placeholder="e.g., Park">
          </fieldset>

          <!-- Calendar & Charts Section -->
          <fieldset>
            <legend>Calendar & Dashboard</legend>
            <div id="exerciseCalendar"></div>
            <br>
            <div id="dashboardCharts">
              <h2>Dashboard Charts</h2>
              <canvas id="durationChartDashboard"></canvas>
              <canvas id="caloriesChartDashboard"></canvas>
            </div>
          </fieldset>

          <!-- Action Button -->
          <button type="submit">${activePetIndex === null ? "Add Exercise" : "Update & Add Exercise"}</button>
        </form>

        <!-- Saved Pet Profiles Section -->
        <div id="savedProfilesContainer">
          <h1>Saved Pet Profiles</h1>
          <div id="savedProfiles"></div>
        </div>

        <!-- Additional Buttons -->
        <div id="miscButtons">
          <button id="monthlyReportButton">Monthly Report</button>
          <button id="logoutButton">Logout</button>
        </div>
      </div>

      <!-- Fixed Buttons at the Top -->
      <button id="addNewProfileButton">Add New Profile</button>
      <button id="toggleModeButton">Toggle Mode</button>
    `;

    // Show the page by using AppHelper.showPage()
    AppHelper.showPage(dashboardHTML);

    // Attach event listeners for form submission, logout, etc.
    document.getElementById('exerciseForm').addEventListener('submit', handleProfileSave);
    document.getElementById('monthlyReportButton').addEventListener('click', ReportsModule.generateMonthlyReport);
    document.getElementById('logoutButton').addEventListener('click', logout);

    // Handle pet image preview
    document.getElementById('petImage').addEventListener('change', handleImageUpload);

    // Handle adding a new pet profile
    document.getElementById('addNewProfileButton').addEventListener('click', handleNewProfile);

    // Handle mode toggling
    document.getElementById('toggleModeButton').addEventListener('click', handleToggleMode);

    // Initialize Calendar and Charts
    CalendarModule.generateCalendar();
    ChartsModule.renderDashboardCharts();
    loadSavedProfiles();
  }

  // Handle profile save
  function handleProfileSave(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value;
    const petImage = document.getElementById('petImagePreview').src;
    const petCharacteristics = document.getElementById('petCharacteristics').value;
    const exerciseType = document.getElementById('exerciseType').value;
    const exerciseDuration = document.getElementById('exerciseDuration').value;
    const exerciseDate = document.getElementById('exerciseDate').value;
    const bodyCondition = document.getElementById('bodyconditionScoring').value;
    const caloriesBurned = document.getElementById('caloriesBurned').value;
    const exerciseNotes = document.getElementById('exerciseNotes').value;
    const exerciseLocation = document.getElementById('exerciseLocation').value;

    // Store exercise data and update pet profile
    const exerciseData = {
      type: exerciseType,
      duration: exerciseDuration,
      date: exerciseDate,
      bodyCondition,
      caloriesBurned,
      notes: exerciseNotes,
      location: exerciseLocation,
    };

    // Create or update pet profile with exercise data
    const petProfile = {
      petDetails: {
        name: petName,
        image: petImage,
        characteristics: petCharacteristics,
      },
      exerciseEntries: [exerciseData],
    };

    if (activePetIndex !== null) {
      updateActivePet(petProfile);
    } else {
      // Add new pet profile to the list
      let pets = getPets();
      if (pets.length >= MAX_PETS) {
        alert("Maximum number of pets reached!");
        return;
      }
      pets.push(petProfile);
      setPets(pets);
    }
    alert("Pet profile saved successfully!");
    showExerciseLog(); // Refresh the page with updated info
  }

  // Handle new pet profile creation
  function handleNewProfile() {
    activePetIndex = null;
    document.getElementById('exerciseForm').reset();
    document.getElementById('petImagePreview').src = "";
    document.getElementById('savedProfilesContainer').style.display = 'none';
    console.log("New profile mode activated. Form cleared and saved profiles hidden.");
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
