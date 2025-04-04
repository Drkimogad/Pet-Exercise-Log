import dataService from '/Pet-Exercise-Log/js/dataService.js';

const MoodLogsSection = (function() {
  const CONFIG = {
    EMOJIS: ['😀', '😐', '😞', '😊', '😠']
  };

  const renderMoodLogs = () => {
    const activePet = dataService.getActivePet();
    if (activePet) {
      document.getElementById('moodLogs').innerHTML = `
        <div class="mood-container">
          ${activePet.moodLogs?.map(log => `
            <div class="mood-entry">
              <span>${formatDate(log.date)}</span>
              <span class="mood-emoji">${CONFIG.EMOJIS[log.mood]}</span>
            </div>
          `).join('') || '<p>No mood entries yet</p>'}
        </div>`;
    }
    attachMoodSelectionHandler();
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateStr;
    }
  };

  const handleMoodSelection = (e) => {
    if (e.target.classList.contains('emoji-btn')) {
      const mood = parseInt(e.target.dataset.mood);
      const date = e.target.dataset.date;
      const activePetIndex = dataService.getActivePetIndex();
      const pets = dataService.getPets();
      if (activePetIndex !== null && pets[activePetIndex]) {
        let pet = { ...pets[activePetIndex] }; // Create a copy
        pet.moodLogs = pet.moodLogs || [];
        pet.moodLogs = pet.moodLogs.filter(m => m.date !== date);
        pet.moodLogs.push({ date, mood });
        pets[activePetIndex] = pet;
        dataService.savePets(pets);
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        renderMoodLogs();
      }
    }
  };

  const attachMoodSelectionHandler = () => {
    document.addEventListener('click', handleMoodSelection);
  };

  return {
    renderMoodLogs: renderMoodLogs
  };
})();
