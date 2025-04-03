const PetFormSection = (function() {
  const CONFIG = {
    DEFAULT_IMAGE: 'default-pet.png',
    EMOJIS: ['😀', '😐', '😞', '😊', '😠'],
    EXERCISE_LEVELS: ['high', 'medium', 'low'],
    FAVORITE_EXERCISES: ['running', 'swimming', 'fetch', 'walking', 'playing'],
    ACTIVITY_TYPES: ['running_park', 'around_block', 'swimming', 'house_play', 'companion_play'],
    LOCATIONS: ['park', 'backyard', 'indoors', 'beach', 'trail']
  };

  const templates = {
    petForm: (pet = {}) => `
      <form id="petForm" class="pet-form">
        <input type="hidden" id="petId" value="${pet.id || crypto.randomUUID()}">
        <div class="form-group">
          <label for="petName">Pet Name</label>
          <input type="text" id="petName" value="${pet.name || ''}" required>
        </div>
        <div class="form-group">
          <label for="petImage">Pet Image</label>
          <div class="image-upload">
            <input type="file" id="petImage" accept="image/*">
            <img id="petImagePreview" src="${pet.image || CONFIG.DEFAULT_IMAGE}" alt="Pet Preview" style="max-width: 150px;">
          </div>
        </div>
        <div class="form-group">
          <label for="petCharacteristics">Characteristics</label>
          <textarea id="petCharacteristics" rows="3">${pet.characteristics || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="petAge">Age</label>
            <input type="number" id="petAge" value="${pet.age || ''}" min="0" required>
          </div>
          <div class="form-group">
            <label for="petWeight">Weight</label>
            <input type="number" id="petWeight" value="${pet.weight || ''}" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <label for="petHealthStatus">Health Status</label>
          <select id="petHealthStatus">
            ${['healthy', 'diabetic', 'arthritic', 'hepatic', 'renal', 'digestive', 'dental'].map(status => `<option value="${status}" ${pet.healthStatus === status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petAllergies">Allergies</label>
          <select id="petAllergies">
            ${['', 'allergic rhinitis', 'nuts', 'skin allergy', 'contact dermatitis'].map(allergy => `<option value="${allergy}" ${pet.allergies === allergy ? 'selected' : ''}>${allergy || 'None'}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petExerciseLevel">Exercise Level</label>
          <select id="petExerciseLevel" required>
            ${CONFIG.EXERCISE_LEVELS.map(level => `<option value="${level}" ${pet.exerciseLevel === level ? 'selected' : ''}>${level.charAt(0).toUpperCase() + level.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petFavoriteExercise">Favorite Exercise</label>
          <select id="petFavoriteExercise">
            ${CONFIG.FAVORITE_EXERCISES.map(ex => `<option value="${ex}" ${pet.favoriteExercise === ex ? 'selected' : ''}>${ex.charAt(0).toUpperCase() + ex.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petLastActivity">Last Activity</label>
          <select id="petLastActivity">
            ${CONFIG.ACTIVITY_TYPES.map(act => `<option value="${act}" ${pet.lastActivity === act ? 'selected' : ''}>${act.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petExerciseLocation">Exercise Location</label>
          <select id="petExerciseLocation">
            ${CONFIG.LOCATIONS.map(loc => `<option value="${loc}" ${pet.exerciseLocation === loc ? 'selected' : ''}>${loc.charAt(0).toUpperCase() + loc.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="petDate">Date</label>
          <input type="date" id="petDate" value="${pet.date || new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label for="petExerciseDuration">Exercise Duration (minutes)</label>
          <input type="number" id="petExerciseDuration" value="${pet.exerciseDuration || '30'}" min="0" required>
        </div>
        <div class="form-group">
          <label for="petCalories">Calories Burnt</label>
          <input type="number" id="petCalories" value="${pet.calories || '150'}" min="0" required>
        </div>
        <div class="form-group mood-selector">
          <label>Today's Mood:</label>
          <div class="mood-options">
            ${CONFIG.EMOJIS.map((emoji, index) => `<button type="button" class="emoji-btn ${pet.mood === index ? 'selected' : ''}" data-mood="${index}" data-date="${new Date().toISOString().split('T')[0]}">${emoji}</button>`).join('')}
          </div>
        </div>
      </form>`
  };

  const renderPetForm = (pet = {}) => {
    document.getElementById('petFormContainer').innerHTML = templates.petForm(pet);
    attachImageUploadHandler();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('petImagePreview').src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const attachImageUploadHandler = () => {
    document.getElementById('petImage')?.addEventListener('change', handleImageUpload);
  };

  return {
    renderPetForm: renderPetForm
  };
})();
