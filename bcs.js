//==================================================
// BCS Reassessment Modal - Complete Implementation
//===============================================
// ===============================================
// BCS MODAL SYSTEM - FULLY DEBUGGED VERSION
// ===============================================
// BCS Modal Template as a JS string
const bcsModalTemplate = `
<div class="bcs-modal-overlay">
    <div class="bcs-modal">
        <div class="bcs-modal-header">
            <h2>Body Condition Score Assessment</h2>
            <div class="bcs-modal-actions">
                <button class="bcs-update-btn">✅ Update Score</button>
                <button class="bcs-close-btn">❌ Close</button>
            </div>
        </div>

        <div class="bcs-modal-content">
            <div class="bcs-instructions">
                <p>Select your pet's current body condition score:</p>
            </div>

            <div class="bcs-options">
                <div class="bcs-option" data-bcs="1">
                    <span class="bcs-number">1</span>
                    <span class="bcs-title">Very Underweight</span>
                </div>

                <div class="bcs-option" data-bcs="2">
                    <span class="bcs-number">2</span>
                    <span class="bcs-title">Underweight</span>
                </div>

                <div class="bcs-option" data-bcs="3">
                    <span class="bcs-number">3</span>
                    <span class="bcs-title">Ideal Weight</span>
                </div>

                <div class="bcs-option" data-bcs="4">
                    <span class="bcs-number">4</span>
                    <span class="bcs-title">Overweight</span>
                </div>

                <div class="bcs-option" data-bcs="5">
                    <span class="bcs-number">5</span>
                    <span class="bcs-title">Obese</span>
                </div>
            </div>
        </div>

        <div class="bcs-selection-display">
            <div class="selected-bcs-info">
                <span class="selected-label">Selected Score:</span>
                <span class="selected-value selected-bcs-display">None</span>
            </div>
        </div>
    </div>
</div>
`;

// GLOBAL MODAL STATE
let currentBCSModal = null;
let currentPetIndex = null;

// STANDALONE CLOSE FUNCTION (GLOBALLY ACCESSIBLE)
function closeBCSModal() {
    console.log('🔴 MODAL: closeBCSModal() called');
    
    const modal = document.querySelector('.bcs-modal-overlay');
    console.log('🔴 MODAL: Found modal element?', !!modal);
    
    if (!modal) {
        console.error('🔴 MODAL: No modal found to close');
        return;
    }
    
    // Clean up event listeners
    if (modal._escapeHandler) {
        console.log('🔴 MODAL: Removing escape key handler');
        document.removeEventListener('keydown', modal._escapeHandler);
    }
    
    // Restore body scrolling
    document.body.style.overflow = '';
    console.log('🔴 MODAL: Body overflow restored');
    
    // Remove modal from DOM
    if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
        console.log('🔴 MODAL: Modal removed from DOM');
    }
    
    // Clear global references
    currentBCSModal = null;
    currentPetIndex = null;
    console.log('🔴 MODAL: Global references cleared');
}

// DEBUGGED: Show BCS Reassessment Modal
async function showBCSReassessmentModal(index) {
    console.log('🟢 MODAL: showBCSReassessmentModal() called with index:', index);
    
    // Get pet data - FIXED: Use 'index' parameter instead of 'petIndex'
    const pets = await getPets();
    const pet = pets[index];
    if (!pet) {
        console.error('🔴 MODAL: Pet not found at index:', index);
        showError('Pet not found');
        return;
    }
    
    console.log('🟢 MODAL: Found pet:', pet.petDetails.name);
 
    // Add this safety check
if (typeof showError === 'undefined') {
    console.error('showError function not found - check utils.js loading order');
    // Fallback to console
    window.showError = function(msg) { console.error('ERROR:', msg); };
    window.showSuccess = function(msg) { console.log('SUCCESS:', msg); };
}
    // Load modal template - FIXED: Use JS string directly
    console.log('🟢 MODAL: Inserting template into DOM');
    document.body.insertAdjacentHTML('beforeend', bcsModalTemplate);
    
    // Find the newly created modal
    const modal = document.querySelector('.bcs-modal-overlay:last-child');
    if (!modal) {
        console.error('🔴 MODAL: Modal element not created after template insertion');
        return;
    }
    
    console.log('🟢 MODAL: Modal element created successfully');
    
    // Set global references - FIXED: Use 'index' parameter
    currentBCSModal = modal;
    currentPetIndex = index;
    
    const currentBCS = pet.petDetails.bcs;
    console.log('🟢 MODAL: Current BCS:', currentBCS);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    console.log('🟢 MODAL: Body scrolling disabled');
    
    // Set up event listeners - FIXED: Use 'index' parameter
    setupBCSModalEvents(modal, index, currentBCS);
    
    // Pre-select current BCS if exists
    if (currentBCS) {
        const currentOption = modal.querySelector(`.bcs-option[data-bcs="${currentBCS}"]`);
        if (currentOption) {
            console.log('🟢 MODAL: Pre-selecting current BCS option:', currentBCS);
            selectBCSOption(currentOption);
            updateSelectedDisplay(currentBCS);
        }
    }
    
    console.log('🟢 MODAL: Modal setup complete - ready for user interaction');
}

function setupBCSModalEvents(modal, petIndex, currentBCS) {
    console.log('🟢 MODAL: setupBCSModalEvents() called - USING DIRECT HANDLERS');
    
    let selectedBCS = currentBCS;
    
    // DIRECT EVENT HANDLERS - SIMPLE AND RELIABLE
    const updateBtn = modal.querySelector('.bcs-update-btn');
    const closeBtn = modal.querySelector('.bcs-close-btn');
    
    if (updateBtn) {
        updateBtn.onclick = function(e) {
            console.log('🟢 MODAL: Update button clicked directly');
            e.stopPropagation();
            if (!selectedBCS) {
                AppHelper.showError('Please select a body condition score');
                return;
            }
            updatePetBCS(petIndex, selectedBCS);
            closeBCSModal();
        };
        console.log('🟢 MODAL: Update button handler attached');
    }
    
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            console.log('🟢 MODAL: Close button clicked directly');
            e.stopPropagation();
            closeBCSModal();
        };
        console.log('🟢 MODAL: Close button handler attached');
    }
    
    // BCS OPTION CLICKS - DIRECT HANDLERS
    modal.querySelectorAll('.bcs-option').forEach(option => {
        option.onclick = function(e) {
            console.log('🟢 MODAL: BCS option clicked directly:', this.dataset.bcs);
            e.stopPropagation();
            selectedBCS = this.dataset.bcs;
            selectBCSOption(this);
            updateSelectedDisplay(selectedBCS);
        };
    });
    console.log('🟢 MODAL: BCS option handlers attached');
    
    // ESCAPE KEY HANDLER
    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            console.log('🟢 MODAL: Escape key pressed');
            closeBCSModal();
        }
    };
    document.addEventListener('keydown', handleEscape);
    modal._escapeHandler = handleEscape;
    console.log('🟢 MODAL: Escape key handler attached');
    
    console.log('🟢 MODAL: All direct event handlers setup complete');
}

// DEBUGGED: Select BCS Option
function selectBCSOption(option) {
    console.log('🟢 MODAL: selectBCSOption() called');
    console.log('🟢 MODAL: Option element:', option);
    console.log('🟢 MODAL: Option BCS value:', option.dataset.bcs);
    
    const modal = option.closest('.bcs-modal-overlay');
    if (!modal) {
        console.error('🔴 MODAL: Could not find modal parent for option');
        return;
    }
    
    const allOptions = modal.querySelectorAll('.bcs-option');
    console.log('🟢 MODAL: Found', allOptions.length, 'BCS options');
    
    // Remove selection from all options
    allOptions.forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    option.classList.add('selected');
    console.log('🟢 MODAL: Option selected visually');
}

// DEBUGGED: Update Selected Display - FIXED: Use correct class selector
function updateSelectedDisplay(bcsValue) {
    console.log('🟢 MODAL: updateSelectedDisplay() called with:', bcsValue);
    
    const modal = document.querySelector('.bcs-modal-overlay');
    if (!modal) {
        console.error('🔴 MODAL: No modal found for display update');
        return;
    }
    
    const display = modal.querySelector('.selected-bcs-display');
    if (!display) {
        console.error('🔴 MODAL: .selected-bcs-display element not found');
        return;
    }
    
    const displayText = getBCSDisplay(bcsValue);
    console.log('🟢 MODAL: Setting display text to:', displayText);
    
    display.textContent = displayText;
    display.className = `selected-value selected-bcs-display bcs-${bcsValue}`;
    
    console.log('🟢 MODAL: Display updated successfully');
}

// DEBUGGED: Update Pet BCS
async function updatePetBCS(petIndex, selectedBCS) { // ADD ASYNC
    console.log('🟢 MODAL: updatePetBCS() called');
    console.log('🟢 MODAL: Pet index:', petIndex);
    console.log('🟢 MODAL: New BCS:', selectedBCS);
    
    const pets = await getPets();
    const pet = pets[petIndex];
    
    if (!pet) {
        console.error('🔴 MODAL: Pet not found during update');
        showError('Pet not found during update');
        return;
    }
    
    console.log('🟢 MODAL: Updating pet:', pet.petDetails.name);
    console.log('🟢 MODAL: Old BCS:', pet.petDetails.bcs);
    
    pet.petDetails.bcs = selectedBCS;
    console.log('🟢 MODAL: New BCS set in pet object');
    
    // Auto-update feeding recommendation
    let newFeedingRec = '';
    if (selectedBCS >= 4) {
        newFeedingRec = 'feed_less';
    } else if (selectedBCS <= 2) {
        newFeedingRec = 'feed_more';
    } else {
        newFeedingRec = 'maintain';
    }
    
    console.log('🟢 MODAL: Auto-setting feeding recommendation:', newFeedingRec);
    pet.petDetails.feedingRecommendation = newFeedingRec;
    
    // REPLACED: Save using PetDataService
    if (window.petDataService) {
        await window.petDataService.savePet(pet);
    } else {
        localStorage.setItem('pets', JSON.stringify(pets));
        console.log('🟢 MODAL: Pets saved to localStorage');
    }    
    console.log('🟢 MODAL: Pets saved to localStorage');
    
    // Refresh UI
    await loadSavedProfiles();
    console.log('🟢 MODAL: Profiles reloaded');
    
    // Show success message
    const successMessage = `Body Condition Score updated to: ${getBCSDisplay(selectedBCS)}`;
    console.log('🟢 MODAL: Showing success:', successMessage);
    showSuccess(successMessage);
}

// Helper function (ensure this exists)
function getBCSDisplay(bcs) {
    const bcsMap = {
        '1': '1 - Very Underweight',
        '2': '2 - Underweight',
        '3': '3 - Ideal Weight', 
        '4': '4 - Overweight',
        '5': '5 - Obese'
    };
    return bcsMap[bcs] || 'Not assessed';
}
