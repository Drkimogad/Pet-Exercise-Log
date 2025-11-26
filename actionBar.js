// ===============================================
// ACTION BAR COMPLETE IMPLEMENTATION           
// ===============================================
// ===============================================
// REUSABLE MODAL SYSTEM - PRODUCTION READY
// ===============================================
/*
This gives you a complete, production-ready modal system with:
✅ Modal state management - Registry tracks all open modals
✅ Duplicate prevention - Cannot open same modal twice
✅ Proper stacking - Z-index management for multiple modals
✅ Event delegation - No more aggressive cloneNode() issues
✅ Error handling - Graceful degradation for all operations
✅ Cleanup - Proper handler cleanup to prevent memory leaks
✅ Safe DOM operations - Protected element queries with error handling
✅ Console logging - Comprehensive debugging information
*/
// Modal state registry
const modalRegistry = {
    openModals: new Set(),
    zIndexBase: 1000,
    eventHandlers: new Map()
};

/**
 * Initialize the modal system
 */
function initializeModalSystem() {
    console.log('🔄 [MODAL SYSTEM] Initializing modal system');
    
    // Setup global event listeners
    setupGlobalModalHandlers();
    console.log('✅ [MODAL SYSTEM] Modal system ready');
}

/**
 * Setup global event handlers for modal system
 */
function setupGlobalModalHandlers() {
    // Escape key to close top modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const topModal = getTopModal();
            if (topModal) {
                console.log('🔒 [MODAL SYSTEM] Escape key pressed, closing top modal');
                closeModal(topModal.id);
            }
        }
    });

// Backdrop click handler (will be delegated)
// ENHANCED MAIN HANDLER (Replace lines 85-91)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id.replace('Overlay', '');
        console.log(`🔒 [MODAL SYSTEM] Backdrop clicked, closing modal: ${modalId}`);
        console.log('🔍 [DEBUG] Backdrop click details:', {
            modalId: modalId,
            timestamp: new Date().getTime(),
            element: e.target
        });
        closeModal(modalId);
    }
});
}

/**
 * Show a modal with proper lifecycle management
 */
function showModal(modalId, options = {}) {
    try {
        console.log(`🔄 [MODAL SYSTEM] Opening modal: ${modalId}`);
        
        // Check if modal is already open
        if (isModalOpen(modalId)) {
            console.log(`ℹ️ [MODAL SYSTEM] Modal ${modalId} is already open, bringing to front`);
            updateModalStack(); // Just bring to front
            return true;
        }

        // Close conflicting modals if specified
        if (options.closeOthers) {
            closeAllModals();
        }

        // Create or get modal container
        const modalElement = createModalContainer(modalId, options);
        if (!modalElement) {
            throw new Error(`Failed to create modal container for ${modalId}`);
        }

        // Add to registry
        modalRegistry.openModals.add(modalId);
        updateModalStack();
        
        console.log(`✅ [MODAL SYSTEM] Modal ${modalId} opened successfully`);
        return true;

    } catch (error) {
        console.error(`❌ [MODAL SYSTEM] Failed to open modal ${modalId}:`, error);
        return false;
    }
}

/**
 * Close a specific modal
 */
function closeModal(modalId) {
    try {
        // ADD DEBUG LINE HERE:
        console.log(`🔄 [MODAL SYSTEM] Closing modal: ${modalId}`, new Error().stack);
        
        const overlay = document.getElementById(`${modalId}Overlay`);
        if (overlay) {
            overlay.remove();
            console.log(`✅ [MODAL SYSTEM] Modal ${modalId} removed from DOM`);
        }

        // Remove from registry
        modalRegistry.openModals.delete(modalId);
        updateModalStack();
        
        // Cleanup event handlers
        cleanupModalHandlers(modalId);
        
        console.log(`✅ [MODAL SYSTEM] Modal ${modalId} closed successfully`);
        return true;

    } catch (error) {
        console.error(`❌ [MODAL SYSTEM] Failed to close modal ${modalId}:`, error);
        return false;
    }
}

/**
 * Close all open modals
 */
function closeAllModals() {
    console.log('🔄 [MODAL SYSTEM] Closing all modals');
    
    const modalsToClose = Array.from(modalRegistry.openModals);
    let closedCount = 0;

    modalsToClose.forEach(modalId => {
        if (closeModal(modalId)) {
            closedCount++;
        }
    });

    console.log(`✅ [MODAL SYSTEM] Closed ${closedCount} modals`);
    return closedCount;
}
// old handler removed and first handler enhanced

/**
 * Check if a modal is currently open
 */
function isModalOpen(modalId) {
    return modalRegistry.openModals.has(modalId);
}

/**
 * Get the top-most modal ID
 */
function getTopModal() {
    const modals = Array.from(modalRegistry.openModals);
    if (modals.length === 0) return null;
    
    // For now, return the last opened modal
    // In a real implementation, you'd track z-index
    return document.getElementById(`${modals[modals.length - 1]}Overlay`);
}

/**
 * Create modal container with proper structure
 */
function createModalContainer(modalId, options) {
    const overlayId = `${modalId}Overlay`;
    
    // Remove existing if any
    const existingOverlay = document.getElementById(overlayId);
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = modalRegistry.zIndexBase + modalRegistry.openModals.size;
    
    // Apply custom classes if provided
    if (options.overlayClass) {
        overlay.classList.add(options.overlayClass);
    }

    document.body.appendChild(overlay);
    console.log(`✅ [MODAL SYSTEM] Created modal container: ${overlayId}`);
    
    return overlay;
}

/**
 * Update modal stacking order
 */
function updateModalStack() {
    let zIndex = modalRegistry.zIndexBase;
    
    modalRegistry.openModals.forEach(modalId => {
        const overlay = document.getElementById(`${modalId}Overlay`);
        if (overlay) {
            overlay.style.zIndex = zIndex++;
        }
    });
}

/**
 * Cleanup event handlers for a modal
 */
function cleanupModalHandlers(modalId) {
    const handlers = modalRegistry.eventHandlers.get(modalId);
    if (handlers) {
        handlers.forEach(handler => {
            if (handler.element && handler.callback) {
                handler.element.removeEventListener(handler.type, handler.callback);
            }
        });
        modalRegistry.eventHandlers.delete(modalId);
        console.log(`🧹 [MODAL SYSTEM] Cleaned up handlers for ${modalId}`);
    }
}

/**
 * Register event handler for modal cleanup
 */
function registerModalHandler(modalId, element, eventType, callback) {
    if (!modalRegistry.eventHandlers.has(modalId)) {
        modalRegistry.eventHandlers.set(modalId, []);
    }
    
    modalRegistry.eventHandlers.get(modalId).push({
        element,
        eventType,
        callback
    });
}

/**
 * Safe element query with error handling
 */
function safeQuery(selector, context = document) {
    try {
        const element = context.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ [MODAL SYSTEM] Element not found: ${selector}`);
        }
        return element;
    } catch (error) {
        console.error(`❌ [MODAL SYSTEM] Query error for ${selector}:`, error);
        return null;
    }
}

/**
 * Safe element query all with error handling
 */
function safeQueryAll(selector, context = document) {
    try {
        const elements = context.querySelectorAll(selector);
        if (elements.length === 0) {
            console.warn(`⚠️ [MODAL SYSTEM] No elements found: ${selector}`);
        }
        return elements;
    } catch (error) {
        console.error(`❌ [MODAL SYSTEM] QueryAll error for ${selector}:`, error);
        return [];
    }
}

// Initialize modal system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalSystem);
} else {
    initializeModalSystem();
}

// ===============================================
// REMINDERS MODAL - PRODUCTION READY IMPLEMENTATION
// ===============================================

/**
 * Main entry point for reminders modal
 */
async function showRemindersModal() {
    console.log('🔄 [REMINDERS] Opening reminders modal');
    
    try {
        // Use modal system to open
        if (!showModal('reminders', { closeOthers: true })) {
            throw new Error('Modal system failed to open reminders modal');
        }

        const overlay = document.getElementById('remindersOverlay');
        if (!overlay) {
            throw new Error('Modal overlay not found');
        }

        // Create modal structure
        overlay.innerHTML = createRemindersModalHTML();
        console.log('✅ [REMINDERS] Modal structure created');

        // Load content with loading state
        await loadRemindersContent();
        
        // Setup event handlers
        setupRemindersEventHandlers();
        
        console.log('✅ [REMINDERS] Modal fully initialized');
        
    } catch (error) {
        console.error('❌ [REMINDERS] Failed to open reminders modal:', error);
        showError('Failed to load reminders');
        closeModal('reminders');
    }
}

/**
 * Create reminders modal HTML structure
 */
function createRemindersModalHTML() {
    return `
        <div class="action-modal">
            <div class="modal-header">
                <h3>🔔 Exercise Reminders</h3>
                <div class="modal-header-actions">
                    <button class="settings-btn" id="remindersSettingsBtn" title="Reminder Settings">⚙️ Settings</button>
                    <button class="close-modal-btn">&times;</button>
                </div>
            </div>
            <div class="modal-content" id="remindersContent">
                <div class="modal-loading">
                    <p>Loading reminders...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load and display reminders content
 */
async function loadRemindersContent() {
    console.log('🔄 [REMINDERS] Loading reminders content');
    
    const content = document.getElementById('remindersContent');
    if (!content) {
        throw new Error('Reminders content container not found');
    }

    try {
        // Show loading state
        content.innerHTML = `
            <div class="modal-loading">
                <p>Checking for exercise reminders...</p>
            </div>
        `;

        // Calculate reminders (using your existing function)
        const reminders = await calculateReminders();
        console.log(`📊 [REMINDERS] Found ${reminders.length} reminders`);

        if (reminders.length === 0) {
            content.innerHTML = `
                <div class="no-reminders">
                    <p>🎉 All caught up!</p>
                    <small>No exercise reminders at this time.</small>
                </div>
            `;
            return;
        }

        // Render reminders list
        content.innerHTML = `
            <div class="reminders-list">
                ${reminders.map(reminder => `
                    <div class="reminder-item" data-pet-index="${reminder.petIndex}">
                        <div class="reminder-header">
                            <span class="pet-name">${reminder.petName}</span>
                            <span class="days-missed">${reminder.daysMissed} days</span>
                        </div>
                        <div class="reminder-details">
                            <p>Last exercise: ${reminder.lastExerciseDate}</p>
                            <p>Threshold: ${reminder.threshold} days</p>
                        </div>
                        <div class="reminder-actions">
                            <button class="action-btn noted-btn" data-action="noted" data-pet-index="${reminder.petIndex}">✅ Noted</button>
                            <button class="action-btn log-now-btn" data-action="log-exercise" data-pet-index="${reminder.petIndex}">📝 Log Exercise</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        console.log('✅ [REMINDERS] Content loaded successfully');

    } catch (error) {
        console.error('❌ [REMINDERS] Failed to load content:', error);
        content.innerHTML = `
            <div class="modal-error">
                <p>❌ Failed to load reminders</p>
                <small>Please try again later</small>
                <button class="action-btn retry-btn" data-action="retry">🔄 Retry</button>
            </div>
        `;
    }
}

/**
 * Setup event handlers for reminders modal
 */
function setupRemindersEventHandlers() {
    console.log('🔄 [REMINDERS] Setting up event handlers');
    
    const overlay = document.getElementById('remindersOverlay');
    if (!overlay) return;

    // Event delegation for all reminder actions
    overlay.addEventListener('click', handleReminderAction);

    // Settings button
    const settingsBtn = safeQuery('#remindersSettingsBtn', overlay);
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showRemindersSettings);
        registerModalHandler('reminders', settingsBtn, 'click', showRemindersSettings);
    }

    // Close button
    const closeBtn = safeQuery('.close-modal-btn', overlay);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal('reminders'));
        registerModalHandler('reminders', closeBtn, 'click', () => closeModal('reminders'));
    }

    console.log('✅ [REMINDERS] Event handlers setup complete');
}

/**
 * Centralized event handler for reminder actions
 */
async function handleReminderAction(event) {
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;
    const petIndex = parseInt(target.dataset.petIndex);

    console.log(`👆 [REMINDERS] User action: ${action} for pet ${petIndex}`);

    try {
        switch (action) {
            case 'noted':
                await handleNotedReminder(petIndex);
                break;
            case 'log-exercise':
                handleLogExerciseFromReminder(petIndex);
                break;
            case 'retry':
                await loadRemindersContent();
                break;
            default:
                console.warn(`⚠️ [REMINDERS] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`❌ [REMINDERS] Action ${action} failed:`, error);
        showError(`Failed to complete action: ${action}`);
    }
}

/**
 * Handle "Noted" button click
 */
async function handleNotedReminder(petIndex) {
    console.log(`✅ [REMINDERS] Marking reminder as noted for pet ${petIndex}`);
    
    try {
        // Update last checked date (using your existing function)
        const success = updateReminderSettings(petIndex, {
            lastChecked: new Date().toISOString().split('T')[0]
        });

        if (!success) {
            throw new Error('Failed to update reminder settings');
        }

        // Remove the reminder item from view
        const reminderItem = document.querySelector(`.reminder-item[data-pet-index="${petIndex}"]`);
        if (reminderItem) {
            reminderItem.style.opacity = '0.5';
            setTimeout(async () => {
                reminderItem.remove();
                
                // If no reminders left, show empty state
                const remindersList = document.querySelector('.reminders-list');
                if (!remindersList || remindersList.children.length === 0) {
                    await loadRemindersContent();
                }
                
                // Update the badge
                await updateRemindersBadge();
            }, 300);
        }

        console.log(`✅ [REMINDERS] Reminder noted for pet ${petIndex}`);

    } catch (error) {
        console.error(`❌ [REMINDERS] Failed to note reminder:`, error);
        throw error;
    }
}

/**
 * Handle "Log Exercise" button click
 */
function handleLogExerciseFromReminder(petIndex) {
    console.log(`📝 [REMINDERS] Opening exercise log for pet ${petIndex}`);
    
    // Close the reminders modal first
    closeModal('reminders');
    
    // Open the daily log form for this pet (using your existing function)
    setTimeout(() => {
        showDailyLogForm(petIndex);
    }, 100);
}

// ===============================================
// REMINDERS SETTINGS MODAL
// ===============================================

/**
 * Show reminders settings modal
 */
async function showRemindersSettings() {
    console.log('🔄 [REMINDERS-SETTINGS] Opening settings modal');
    
    try {
        // Close parent modal first
        closeModal('reminders');

        // Open settings modal
        if (!showModal('remindersSettings', { closeOthers: true })) {
            throw new Error('Modal system failed to open settings modal');
        }

        const overlay = document.getElementById('remindersSettingsOverlay');
        if (!overlay) {
            throw new Error('Settings modal overlay not found');
        }

        // Create settings modal structure
        overlay.innerHTML = createRemindersSettingsModalHTML();
        console.log('✅ [REMINDERS-SETTINGS] Settings modal structure created');

        // Load settings content
        await loadRemindersSettingsContent();
        
        // Setup event handlers
        setupRemindersSettingsHandlers();
        
        console.log('✅ [REMINDERS-SETTINGS] Settings modal fully initialized');
        
    } catch (error) {
        console.error('❌ [REMINDERS-SETTINGS] Failed to open settings modal:', error);
        showError('Failed to load reminder settings');
        closeModal('remindersSettings');
    }
}

/**
 * Create reminders settings modal HTML
 */
function createRemindersSettingsModalHTML() {
    return `
        <div class="action-modal">
            <div class="modal-header">
                <h3>⚙️ Reminder Settings</h3>
                <button class="close-modal-btn">&times;</button>
            </div>
            <div class="modal-content" id="remindersSettingsContent">
                <div class="modal-loading">
                    <p>Loading settings...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load reminders settings content
 */
async function loadRemindersSettingsContent() {
    console.log('🔄 [REMINDERS-SETTINGS] Loading settings content');
    
    const content = document.getElementById('remindersSettingsContent');
    if (!content) {
        throw new Error('Settings content container not found');
    }

    try {
        // Get pets data (using your existing function)
        const pets = await getPets();

        if (!pets || pets.length === 0) {
            content.innerHTML = `
                <div class="no-pets-settings">
                    <p>No pets found</p>
                    <small>Create pet profiles first to set reminder preferences</small>
                </div>
            `;
            return;
        }

        // Render settings form
        content.innerHTML = `
            <div class="reminders-settings">
                <p class="settings-description">Set how many days without exercise before reminding you:</p>
                
                <div class="pet-reminder-settings">
                    ${pets.map((pet, index) => {
                        const settings = getReminderSettings(index);
                        return `
                            <div class="pet-setting-item" data-pet-index="${index}">
                                <div class="pet-setting-header">
                                    <span class="pet-name">${pet.petDetails.name}</span>
                                    <span class="pet-type">${pet.petDetails.type}</span>
                                </div>
                                <div class="setting-controls">
                                    <label>Remind after:</label>
                                    <select class="threshold-select" data-pet-index="${index}">
                                        <option value="1" ${settings.threshold == 1 ? 'selected' : ''}>1 day</option>
                                        <option value="2" ${settings.threshold == 2 ? 'selected' : ''}>2 days</option>
                                        <option value="3" ${settings.threshold == 3 ? 'selected' : ''}>3 days</option>
                                        <option value="5" ${settings.threshold == 5 ? 'selected' : ''}>5 days</option>
                                        <option value="7" ${settings.threshold == 7 ? 'selected' : ''}>7 days</option>
                                    </select>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="settings-actions">
                    <button class="action-btn save-settings-btn" data-action="save-settings">💾 Save Settings</button>
                    <button class="action-btn cancel-settings-btn" data-action="cancel-settings">❌ Cancel</button>
                </div>
            </div>
        `;

        console.log('✅ [REMINDERS-SETTINGS] Settings content loaded');

    } catch (error) {
        console.error('❌ [REMINDERS-SETTINGS] Failed to load settings:', error);
        content.innerHTML = `
            <div class="modal-error">
                <p>❌ Failed to load settings</p>
                <small>Please try again later</small>
                <button class="action-btn retry-btn" data-action="retry-settings">🔄 Retry</button>
            </div>
        `;
    }
}

/**
 * Setup reminders settings event handlers
 */
function setupRemindersSettingsHandlers() {
    console.log('🔄 [REMINDERS-SETTINGS] Setting up settings handlers');
    
    const overlay = document.getElementById('remindersSettingsOverlay');
    if (!overlay) return;

    // Event delegation for all settings actions
    overlay.addEventListener('click', handleRemindersSettingsAction);

    // Close button
    const closeBtn = safeQuery('.close-modal-btn', overlay);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal('remindersSettings'));
        registerModalHandler('remindersSettings', closeBtn, 'click', () => closeModal('remindersSettings'));
    }

    console.log('✅ [REMINDERS-SETTINGS] Settings handlers setup complete');
}

/**
 * Centralized event handler for settings actions
 */
async function handleRemindersSettingsAction(event) {
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;

    console.log(`👆 [REMINDERS-SETTINGS] User action: ${action}`);

    try {
        switch (action) {
            case 'save-settings':
                await saveRemindersSettings();
                break;
            case 'cancel-settings':
                closeModal('remindersSettings');
                // Reopen main reminders modal
                setTimeout(showRemindersModal, 100);
                break;
            case 'retry-settings':
                await loadRemindersSettingsContent();
                break;
            default:
                console.warn(`⚠️ [REMINDERS-SETTINGS] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`❌ [REMINDERS-SETTINGS] Action ${action} failed:`, error);
        showError(`Failed to complete action: ${action}`);
    }
}

/**
 * Save reminders settings
 */
async function saveRemindersSettings() {
    console.log('💾 [REMINDERS-SETTINGS] Saving reminder settings');
    
    try {
        const pets = await getPets();
        let settingsChanged = false;

        // Update each pet's threshold
        const thresholdSelects = safeQueryAll('.threshold-select');
        thresholdSelects.forEach(select => {
            const petIndex = parseInt(select.dataset.petIndex);
            const newThreshold = parseInt(select.value);
            
            if (pets[petIndex] && pets[petIndex].reminderSettings.threshold !== newThreshold) {
                pets[petIndex].reminderSettings.threshold = newThreshold;
                settingsChanged = true;
                console.log(`📊 [REMINDERS-SETTINGS] Updated ${pets[petIndex].petDetails.name} threshold to ${newThreshold} days`);
            }
        });

        if (settingsChanged) {
            // Save to storage (using your existing approach)
            if (window.petDataService) {
                // Save each pet individually if using Firestore
                for (const pet of pets) {
                    await window.petDataService.savePet(pet);
                }
            } else {
                localStorage.setItem('pets', JSON.stringify(pets));
            }
            
            showSuccess('Reminder settings saved!');
            console.log('✅ [REMINDERS-SETTINGS] Settings saved successfully');
            
            // Close settings modal and reopen main reminders
            closeModal('remindersSettings');
            setTimeout(showRemindersModal, 100);
            
            // Update badge
            await updateRemindersBadge();
            
        } else {
            showSuccess('No changes made');
            console.log('ℹ️ [REMINDERS-SETTINGS] No changes to save');
        }

    } catch (error) {
        console.error('❌ [REMINDERS-SETTINGS] Failed to save settings:', error);
        throw new Error('Save failed: ' + error.message);
    }
}
// old functions
async function initializeRemindersData() {
    // This will be called when we implement the settings form later
    const pets = await getPets();
    pets.forEach((pet, index) => {
        if (!pet.reminderSettings) {
            pet.reminderSettings = {
                enabled: true,
                threshold: 3, // Default 3 days
                lastChecked: new Date().toISOString().split('T')[0]
            };
        }
    });
    localStorage.setItem('pets', JSON.stringify(pets));
}

async function getReminderSettings(petIndex) {
    const pets = await getPets();
    const pet = pets[petIndex];
    return pet?.reminderSettings || { enabled: true, threshold: 3, lastChecked: new Date().toISOString().split('T')[0] };
}

async function updateReminderSettings(petIndex, settings) {
    const pets = await getPets();
    if (pets[petIndex]) {
        pets[petIndex].reminderSettings = { ...pets[petIndex].reminderSettings, ...settings };
        localStorage.setItem('pets', JSON.stringify(pets));
        return true;
    }
    return false;
}

async function calculateReminders() {
    console.log('🔄 Calculating exercise reminders');
  //  const pets = getPets(); // ← This might be returning undefined
 const pets = await getPets(); // ← ADD AWAIT
    const reminders = [];
    
        // ADD SAFETY CHECK:
    if (!pets || !Array.isArray(pets)) {
        console.warn('⚠️ No pets array found for reminders');
        return [];
    }
    pets.forEach((pet, index) => {
        const settings = getReminderSettings(index);
        if (!settings.enabled) return;
        
        const daysSinceLastExercise = getDaysSinceLastExercise(pet);
        
        if (daysSinceLastExercise >= settings.threshold) {
            reminders.push({
                petIndex: index,
                petName: pet.petDetails.name,
                daysMissed: daysSinceLastExercise,
                threshold: settings.threshold,
                lastExerciseDate: getLastExerciseDate(pet)
            });
        }
    });
    
    console.log(`✅ Found ${reminders.length} reminders`);
    return reminders;
}

function getDaysSinceLastExercise(pet) {
    if (!pet.exerciseEntries || pet.exerciseEntries.length === 0) {
        return 999;
    }
    
    // Get today's date in local timezone
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const sortedExercises = [...pet.exerciseEntries].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    const lastExerciseDate = sortedExercises[0].date;
    
    // Simple date difference calculation
    const lastDate = new Date(lastExerciseDate);
    const todayDate = new Date(todayStr);
    
    const timeDiff = todayDate - lastDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    console.log(`Last exercise: ${lastExerciseDate}, Today: ${todayStr}, Days since: ${daysDiff}`);
    
    return Math.max(0, daysDiff);
}

function getLastExerciseDate(pet) {
    if (!pet.exerciseEntries || pet.exerciseEntries.length === 0) {
        return 'Never';
    }
    
    const sortedExercises = [...pet.exerciseEntries].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    return formatDisplayDate(sortedExercises[0].date);
}

function formatDisplayDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

async function handleNotedReminder(petIndex) {
    console.log(`✅ Marking reminder as noted for pet ${petIndex}`);
    
    // Update last checked date
    await updateReminderSettings(petIndex, {
        lastChecked: new Date().toISOString().split('T')[0]
    });
    
    // Remove the reminder item from view
    const reminderItem = document.querySelector(`.reminder-item[data-pet-index="${petIndex}"]`);
    if (reminderItem) {
        reminderItem.style.opacity = '0.5';
        setTimeout(async () => {
            reminderItem.remove();
            // If no reminders left, show empty state
            const remindersList = document.querySelector('.reminders-list');
            if (!remindersList || remindersList.children.length === 0) {
               await loadRemindersContent(); // This will show empty state
            }
        }, 300);
    }
    
    // Update the badge count
    await updateRemindersBadge();
}
async function updateRemindersBadge() {                     //UPDATED
    const badge = document.getElementById('remindersBadge');
    if (!badge) return;
    
    const reminders = await calculateReminders();
    const reminderCount = reminders.length;
    
    badge.textContent = reminderCount;
    badge.style.display = reminderCount > 0 ? 'inline-block' : 'none';
    
    console.log(`✅ Reminders badge updated: ${reminderCount}`);
}

function handleLogExerciseFromReminder(petIndex) {
    console.log(`📝 Opening exercise log for pet ${petIndex}`);
    
    // Close the reminders modal
    const modal = document.getElementById('remindersModal');
    if (modal) {
        modal.remove();
    }
    
    // Open the daily log form for this pet
    showDailyLogForm(petIndex);
}












// ===============================================
// WEEKLY GOALS MODAL - PRODUCTION READY IMPLEMENTATION
// ===============================================

/**
 * Main entry point for weekly goals modal
 */
async function showGoalsModal() {
    console.log('🔄 [GOALS] Opening weekly goals modal');
    
    try {
        // Use modal system to open
        if (!showModal('goals', { closeOthers: true })) {
            throw new Error('Modal system failed to open goals modal');
        }

        const overlay = document.getElementById('goalsOverlay');
        if (!overlay) {
            throw new Error('Modal overlay not found');
        }

        // Create modal structure
        overlay.innerHTML = createGoalsModalHTML();
        console.log('✅ [GOALS] Modal structure created');

        // Load content with loading state
        await loadGoalsContent();
        
        // Setup event handlers
        setupGoalsEventHandlers();
        
        console.log('✅ [GOALS] Modal fully initialized');
        
    } catch (error) {
        console.error('❌ [GOALS] Failed to open goals modal:', error);
        showError('Failed to load goals');
        closeModal('goals');
    }
}

/**
 * Create goals modal HTML structure
 */
function createGoalsModalHTML() {
    return `
        <div class="action-modal">
            <div class="modal-header">
                <h3>🎯 Weekly Exercise Goals</h3>
                <div class="modal-header-actions">
                    <button class="settings-btn" id="goalsSettingsBtn" title="Goals Settings">⚙️ Manage Goals</button>
                    <button class="close-modal-btn">&times;</button>
                </div>
            </div>
            <div class="modal-content" id="goalsContent">
                <div class="modal-loading">
                    <p>Loading goals progress...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load and display goals content
 What the highlights add:
Individual reset buttons - Reset button for each pet's progress in the main view
Global reset button - Reset all pets' progress at once
Quick access - No need to go to settings for quick resets
 */
async function loadGoalsContent() {
    console.log('🔄 [GOALS] Loading goals content');
    
    const content = document.getElementById('goalsContent');
    if (!content) {
        throw new Error('Goals content container not found');
    }

    try {
        // Show loading state
        content.innerHTML = `
            <div class="modal-loading">
                <p>Calculating weekly progress...</p>
            </div>
        `;

        // Calculate goals progress (using your existing function)
        const goalsProgress = await calculateWeeklyGoals();
        console.log(`📊 [GOALS] Processed ${goalsProgress.length} active goals`);

        if (goalsProgress.length === 0) {
            content.innerHTML = `
                <div class="no-goals">
                    <p>📊 No active goals</p>
                    <small>Enable weekly goals in pet settings to track progress</small>
                    <div class="goals-actions">
                        <button class="action-btn enable-goals-btn" data-action="enable-goals">🎯 Enable Goals</button>
                    </div>
                </div>
            `;
            return;
        }

        // Render goals progress
        content.innerHTML = `
            <div class="goals-summary">
                <div class="weekly-progress">
                    <h4>This Week's Progress</h4>
                    
                    <!-- NEW: Global reset button -->
                    <div class="global-reset-section">
                        <button class="action-btn reset-all-btn" data-action="reset-all-weeks" 
                                title="Reset all progress for this week">
                            🔄 Reset All Progress This Week
                        </button>
                        <small>Start fresh for all pets</small>
                    </div>
                    
                    ${goalsProgress.map(goal => `
                        <div class="goal-item" data-pet-index="${goal.petIndex}">
                            <div class="goal-header">
                                <span class="pet-name">${goal.petName}</span>
                                <span class="goal-count">${goal.exercisesDone}/${goal.target}</span>
                                
                                <!-- NEW: Individual reset button -->
                             <button class="action-btn reset-single-btn" data-action="reset-week" 
                                    data-pet-index="${goal.petIndex}" title="Reset progress for ${goal.petName}">
                                    🔄
                                </button>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${goal.progressPercent}%"></div>
                            </div>
                            <div class="goal-status">
                                ${goal.goalMet ? 
                                    '<span class="goal-met">🎉 Goal Achieved!</span>' :
                                    goal.goalAlmostMet ?
                                    `<span class="goal-almost">Almost there! ${goal.exercisesRemaining} to go</span>` :
                                    `<span class="goal-progress">${goal.exercisesRemaining} exercises remaining</span>`
                                }
                            </div>
                            ${goal.streak > 0 ? `
                                <div class="streak-display">
                                    🔥 ${goal.streak} week streak
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        console.log('✅ [GOALS] Content loaded successfully');

    } catch (error) {
        console.error('❌ [GOALS] Failed to load content:', error);
        content.innerHTML = `
            <div class="modal-error">
                <p>❌ Failed to load goals</p>
                <small>Please try again later</small>
                <button class="action-btn retry-btn" data-action="retry">🔄 Retry</button>
            </div>
        `;
    }
}



/**
 * Setup event handlers for goals modal
 */
function setupGoalsEventHandlers() {
    console.log('🔄 [GOALS] Setting up event handlers');
    
    const overlay = document.getElementById('goalsOverlay');
    if (!overlay) return;

    // Event delegation for all goal actions
    overlay.addEventListener('click', handleGoalAction);

    // Settings button
    const settingsBtn = safeQuery('#goalsSettingsBtn', overlay);
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showGoalsSettings);
        registerModalHandler('goals', settingsBtn, 'click', showGoalsSettings);
    }

    // Close button
    const closeBtn = safeQuery('.close-modal-btn', overlay);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal('goals'));
        registerModalHandler('goals', closeBtn, 'click', () => closeModal('goals'));
    }

    console.log('✅ [GOALS] Event handlers setup complete');
}

/**
 * Centralized event handler for goal actions
 What the highlights add:
Reset week handler - Handles individual pet reset requests
Reset all handler - Handles bulk reset for all pets
Pet index parsing - Extracts pet index from button data attributes
 */
async function handleGoalAction(event) {
    console.log('🔍 [GOALS DEBUG] Event triggered on:', event.target);
    console.log('🔍 [GOALS DEBUG] Event type:', event.type);
    
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;
    const petIndex = target.dataset.petIndex ? parseInt(target.dataset.petIndex) : null;

    console.log(`👆 [GOALS] User action: ${action} for pet ${petIndex}`);

    try {
        switch (action) {
            case 'enable-goals':
                await showGoalsSettings();
                break;
            case 'retry':
                await loadGoalsContent();
                break;
            // NEW: Handle reset actions
            case 'reset-week':
                if (petIndex !== null) {
                    await showResetConfirmation(petIndex);
                }
                break;
            case 'reset-all-weeks':
                await showResetAllConfirmation();
                break;
            default:
                console.warn(`⚠️ [GOALS] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`❌ [GOALS] Action ${action} failed:`, error);
        showError(`Failed to complete action: ${action}`);
    }
}

// ===============================================
// GOALS SETTINGS MODAL
// ===============================================

/**
 * Show goals settings modal
 */
async function showGoalsSettings() {
    console.log('🔄 [GOALS-SETTINGS] Opening settings modal');
    
    try {
        // Close parent modal first
        closeModal('goals');

        // Open settings modal
        if (!showModal('goalsSettings', { closeOthers: true })) {
            throw new Error('Modal system failed to open goals settings modal');
        }

        const overlay = document.getElementById('goalsSettingsOverlay');
        if (!overlay) {
            throw new Error('Goals settings modal overlay not found');
        }

        // Create settings modal structure
        overlay.innerHTML = createGoalsSettingsModalHTML();
        console.log('✅ [GOALS-SETTINGS] Settings modal structure created');

        // Load settings content
        await loadGoalsSettingsContent();
        
        // Setup event handlers
        setupGoalsSettingsHandlers();
        
        console.log('✅ [GOALS-SETTINGS] Settings modal fully initialized');
        
    } catch (error) {
        console.error('❌ [GOALS-SETTINGS] Failed to open settings modal:', error);
        showError('Failed to load goal settings');
        closeModal('goalsSettings');
    }
}

/**
 * Create goals settings modal HTML
 */
function createGoalsSettingsModalHTML() {
    return `
        <div class="action-modal">
            <div class="modal-header">
                <h3>⚙️ Goals Settings</h3>
                <button class="close-modal-btn">&times;</button>
            </div>
            <div class="modal-content" id="goalsSettingsContent">
                <div class="modal-loading">
                    <p>Loading settings...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load goals settings content updated
 */
/*
What the highlights add:
Reset options section - Radio buttons to choose between resetting progress or 
keeping it when changing targets
Manual reset button - Allows resetting current week's progress to zero immediately
Progress context - Shows current progress in the reset options for informed decisions
*/
async function loadGoalsSettingsContent() {
    console.log('🔄 [GOALS-SETTINGS] Loading settings content');
    
    const content = document.getElementById('goalsSettingsContent');
    if (!content) {
        throw new Error('Goals settings content container not found');
    }

    try {
        // Get pets data (using your existing function)
        const pets = await getPets();

        if (!pets || pets.length === 0) {
            content.innerHTML = `
                <div class="no-pets-settings">
                    <p>No pets found</p>
                    <small>Create pet profiles first to set goal preferences</small>
                </div>
            `;
            return;
        }

        // Render settings form
        content.innerHTML = `
            <div class="goals-settings">
                <p class="settings-description">Set weekly exercise goals for each pet:</p>
                
                <div class="pet-goal-settings">
                    ${pets.map((pet, index) => {
                        const goals = getGoalSettings(index);
                        return `
                            <div class="pet-goal-item" data-pet-index="${index}">
                                <div class="pet-goal-header">
                                    <div class="pet-info">
                                        <span class="pet-name">${pet.petDetails.name}</span>
                                        <span class="pet-type">${pet.petDetails.type}</span>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" class="goal-toggle" data-pet-index="${index}" 
                                            ${goals.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                
                                <div class="goal-controls ${goals.enabled ? 'enabled' : 'disabled'}">
                                    <label>Weekly target:</label>
                                    <select class="target-select" data-pet-index="${index}" 
                                        ${goals.enabled ? '' : 'disabled'}>
                                        <option value="3" ${goals.weeklyTarget == 3 ? 'selected' : ''}>3 exercises</option>
                                        <option value="5" ${goals.weeklyTarget == 5 ? 'selected' : ''}>5 exercises</option>
                                        <option value="7" ${goals.weeklyTarget == 7 ? 'selected' : ''}>7 exercises</option>
                                        <option value="10" ${goals.weeklyTarget == 10 ? 'selected' : ''}>10 exercises</option>
                                    </select>
                                    <div class="current-progress">
                                        This week: <strong>${goals.exercisesThisWeek || 0}</strong> exercises
                                    </div>
                                    
                                    <!-- NEW: Reset progress option -->
                                    <div class="reset-options">
                                        <label class="reset-label">When changing target:</label>
                                        <div class="reset-choice">
                                            <input type="radio" id="reset_${index}" name="reset_${index}" 
                                                value="reset" class="reset-radio" checked>
                                            <label for="reset_${index}">Reset progress to 0</label>
                                        </div>
                                        <div class="reset-choice">
                                            <input type="radio" id="keep_${index}" name="reset_${index}" 
                                                value="keep" class="reset-radio">
                                            <label for="keep_${index}">Keep current progress (${goals.exercisesThisWeek || 0} exercises)</label>
                                        </div>
                                    </div>
                                    
                                    <!-- NEW: Manual reset button -->
                                    <div class="manual-reset">
                                        <button class="action-btn reset-week-btn" data-action="reset-week" data-pet-index="${index}">
                                            🔄 Reset This Week's Progress
                                        </button>
                                        <small>Start fresh from 0 exercises this week</small>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="settings-actions">
                    <button class="action-btn save-settings-btn" data-action="save-goals-settings">💾 Save Settings</button>
                    <button class="action-btn cancel-settings-btn" data-action="cancel-goals-settings">❌ Cancel</button>
                </div>
            </div>
        `;

        // Setup toggle switch interactions
        setupGoalToggleHandlers();
        console.log('✅ [GOALS-SETTINGS] Settings content loaded');

    } catch (error) {
        console.error('❌ [GOALS-SETTINGS] Failed to load settings:', error);
        content.innerHTML = `
            <div class="modal-error">
                <p>❌ Failed to load settings</p>
                <small>Please try again later</small>
                <button class="action-btn retry-btn" data-action="retry-goals-settings">🔄 Retry</button>
            </div>
        `;
    }
}

/**
 * Setup goal toggle switch handlers
 */
function setupGoalToggleHandlers() {
    const toggles = safeQueryAll('.goal-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const petIndex = parseInt(this.dataset.petIndex);
            const goalControls = document.querySelector(`.pet-goal-item[data-pet-index="${petIndex}"] .goal-controls`);
            const targetSelect = document.querySelector(`.target-select[data-pet-index="${petIndex}"]`);
            
            if (this.checked) {
                goalControls.classList.add('enabled');
                goalControls.classList.remove('disabled');
                targetSelect.disabled = false;
            } else {
                goalControls.classList.add('disabled');
                goalControls.classList.remove('enabled');
                targetSelect.disabled = true;
            }
        });
    });
}

/**
 * Setup goals settings event handlers
 */
function setupGoalsSettingsHandlers() {
    console.log('🔄 [GOALS-SETTINGS] Setting up settings handlers');
    
    const overlay = document.getElementById('goalsSettingsOverlay');
    if (!overlay) return;

    // Event delegation for all settings actions
    overlay.addEventListener('click', handleGoalsSettingsAction);

    // Close button
    const closeBtn = safeQuery('.close-modal-btn', overlay);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal('goalsSettings'));
        registerModalHandler('goalsSettings', closeBtn, 'click', () => closeModal('goalsSettings'));
    }

    console.log('✅ [GOALS-SETTINGS] Settings handlers setup complete');
}

/**
 * Centralized event handler for goals settings actions
 */
async function handleGoalsSettingsAction(event) {
console.log('🔍 [GOALS-SETTINGS DEBUG] Event triggered on:', event.target);
 console.log('🔍 [GOALS-SETTINGS DEBUG] Event type:', event.type);
  
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;

    console.log(`👆 [GOALS-SETTINGS] User action: ${action}`);

    try {
        switch (action) {
            case 'save-goals-settings':
                await saveGoalsSettings();
                break;
            case 'cancel-goals-settings':
                closeModal('goalsSettings');
                // Reopen main goals modal
                setTimeout(showGoalsModal, 100);
                break;
            case 'retry-goals-settings':
                await loadGoalsSettingsContent();
                break;
            default:
                console.warn(`⚠️ [GOALS-SETTINGS] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`❌ [GOALS-SETTINGS] Action ${action} failed:`, error);
        showError(`Failed to complete action: ${action}`);
    }
}

/**
 * Save goals settings
 */
/*What the highlights add:
Reset progress logic - Detects when target changes and resets progress based on user choice
Progress preservation - Keeps current progress if user selects "keep progress" option
Target change detection - Only resets when weekly target actually changes
*/
async function saveGoalsSettings() {
    console.log('💾 [GOALS-SETTINGS] Saving goals settings');
    
    try {
        const pets = await getPets();
        let settingsChanged = false;

        // Update each pet's goal settings
        const goalItems = safeQueryAll('.pet-goal-item');
        
        for (const item of goalItems) {
            const petIndex = parseInt(item.dataset.petIndex);
            const toggle = item.querySelector('.goal-toggle');
            const targetSelect = item.querySelector('.target-select');
            const resetRadio = item.querySelector('.reset-radio:checked');
            
            if (!pets[petIndex]) continue;
            
            const enabled = toggle.checked;
            const weeklyTarget = parseInt(targetSelect.value);
            const resetProgress = resetRadio ? resetRadio.value === 'reset' : true;
            
            // NEW: Check if target changed and handle progress reset
            const targetChanged = pets[petIndex].goalSettings.weeklyTarget !== weeklyTarget;
            
            if (pets[petIndex].goalSettings.enabled !== enabled || 
                targetChanged) {
                
                pets[petIndex].goalSettings.enabled = enabled;
                pets[petIndex].goalSettings.weeklyTarget = weeklyTarget;
                
                // NEW: Reset progress if target changed and user chose to reset
                if (targetChanged && resetProgress) {
                    pets[petIndex].goalSettings.exercisesThisWeek = 0;
                    console.log(`🔄 [GOALS-SETTINGS] Reset progress for ${pets[petIndex].petDetails.name} due to target change`);
                }
                
                settingsChanged = true;
                
                console.log(`📊 [GOALS-SETTINGS] Updated ${pets[petIndex].petDetails.name} goals: ${enabled ? 'enabled' : 'disabled'}, target: ${weeklyTarget}`);
            }
        }

        if (settingsChanged) {
            // SAVE TO STORAGE
            if (window.petDataService) {
                for (const pet of pets) {
                    await window.petDataService.savePet(pet);
                }
            } else {
                localStorage.setItem('pets', JSON.stringify(pets));
            }
            
            showSuccess('Goals settings saved!');
            console.log('✅ [GOALS-SETTINGS] Settings saved successfully');
            
            // FORCE REFRESH GOALS DATA
            await updateAllExerciseCounts();
            await updateGoalsProgress();
            
            // Close settings modal and reopen main goals modal WITH REFRESHED DATA
            closeModal('goalsSettings');
            setTimeout(showGoalsModal, 100);
            
        } else {
            showSuccess('No changes made');
        }

    } catch (error) {
        console.error('❌ [GOALS-SETTINGS] Failed to save settings:', error);
        throw error;
    }
}



// from old functions
async function initializeGoalsData() {
    const pets = await getPets();
    let needsUpdate = false;
    
    pets.forEach((pet, index) => {
        if (!pet.goalSettings) {
            pet.goalSettings = {
                enabled: false,
                weeklyTarget: 5, // Default 5 exercises per week
                currentWeekStart: getCurrentWeekStart(),
                exercisesThisWeek: 0,
                streak: 0
            };
            needsUpdate = true;
        }
        
        // Reset weekly count if new week
        if (pet.goalSettings.currentWeekStart !== getCurrentWeekStart()) {
            pet.goalSettings.currentWeekStart = getCurrentWeekStart();
            pet.goalSettings.exercisesThisWeek = 0;
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('pets', JSON.stringify(pets));
    }
}

function getCurrentWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday start
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
}

async function getGoalSettings(petIndex) {
    const pets = await getPets();
    const pet = pets[petIndex];
    return pet?.goalSettings || { 
        enabled: false, 
        weeklyTarget: 5, 
        currentWeekStart: getCurrentWeekStart(),
        exercisesThisWeek: 0,
        streak: 0
    };
}

async function updateGoalSettings(petIndex, settings) {
    const pets = await getPets();
    if (pets[petIndex]) {
        pets[petIndex].goalSettings = { ...pets[petIndex].goalSettings, ...settings };
        localStorage.setItem('pets', JSON.stringify(pets));
        return true;
    }
    return false;
}

async function calculateWeeklyGoals() {
    console.log('🔄 Calculating weekly goals progress');
    const pets = await getPets();
    const goalsProgress = [];
    
    // First, update exercise counts for all pets
    await updateAllExerciseCounts();
    
    // Use for...of instead of forEach to allow await
    for (let index = 0; index < pets.length; index++) {
        const pet = pets[index];
        const goals = await getGoalSettings(index); // ✅ NOW CAN AWAIT
        
        if (!goals.enabled) continue;
        
        const progress = await calculatePetGoalProgress(pet, index);
        goalsProgress.push(progress);
    }
    
    console.log(`✅ Processed ${goalsProgress.length} active goals`);
    return goalsProgress;
}

async function updateAllExerciseCounts() {
    const pets = await getPets();
    const currentWeekStart = getCurrentWeekStart();
    let needsUpdate = false;
    
    pets.forEach((pet, index) => {
        if (!pet.goalSettings) return;
        
        // Reset if new week
        if (pet.goalSettings.currentWeekStart !== currentWeekStart) {
            pet.goalSettings.currentWeekStart = currentWeekStart;
            pet.goalSettings.exercisesThisWeek = 0;
            pet.goalSettings.streak = 0; // Reset streak for now - we'll implement streak logic separately
            needsUpdate = true;
        }
        
        // Count exercises for current week
        const weeklyExercises = countExercisesThisWeek(pet, currentWeekStart);
        if (pet.goalSettings.exercisesThisWeek !== weeklyExercises) {
            pet.goalSettings.exercisesThisWeek = weeklyExercises;
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('pets', JSON.stringify(pets));
    }
}

function countExercisesThisWeek(pet, weekStart) {
    if (!pet.exerciseEntries || pet.exerciseEntries.length === 0) {
        return 0;
    }
    
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // End of week (Sunday)
    
    return pet.exerciseEntries.filter(entry => {
        const exerciseDate = new Date(entry.date);
        return exerciseDate >= weekStartDate && exerciseDate <= weekEndDate;
    }).length;
}

/*
calculatePetGoalProgress(pet, petIndex)
What the highlights add:
Manual reset awareness - Checks if manual reset occurred this week
Reset progress tracking - Uses exercises since reset instead of total exercises
Reset status flag - Provides data for UI to show reset state
*/
async function calculatePetGoalProgress(pet, petIndex) {
    const goals = await getGoalSettings(petIndex);
    
    // NEW: Check for manual reset this week
    const currentWeekStart = getCurrentWeekStart();
    let exercisesDone = goals.exercisesThisWeek || 0;
    
    // If manual reset happened this week, use reset progress
    if (goals.lastManualReset && goals.lastManualReset >= currentWeekStart) {
        exercisesDone = goals.exercisesSinceReset || 0;
    }
    
    const target = goals.weeklyTarget || 5;
    const progressPercent = Math.min(100, (exercisesDone / target) * 100);
    const exercisesRemaining = Math.max(0, target - exercisesDone);
    
    return {
        petIndex: petIndex,
        petName: pet.petDetails.name,
        exercisesDone: exercisesDone,
        target: target,
        progressPercent: progressPercent,
        exercisesRemaining: exercisesRemaining,
        streak: goals.streak || 0,
        goalMet: exercisesDone >= target,
        goalAlmostMet: exercisesDone >= target - 1 && exercisesDone < target,
        // NEW: Add reset status for UI
        wasReset: !!(goals.lastManualReset && goals.lastManualReset >= currentWeekStart)
    };
}

//STEP 3.6: Update the Goals Progress Display

async function updateGoalsProgress() {
    const progressElement = document.getElementById('goalsProgress');
    if (!progressElement) return;
    
    const goalsProgress = await calculateWeeklyGoals();
    
    if (goalsProgress.length === 0) {
        progressElement.textContent = '';
        progressElement.style.display = 'none';
        console.log('✅ Goals progress: No active goals');
        return;
    }
    
    // Calculate overall progress FIXED:
    const totalExercises = goalsProgress.reduce((sum, goal) => sum + (goal.exercisesDone || 0), 0);
    const totalTarget = goalsProgress.reduce((sum, goal) => sum + (goal.target || 0), 0);
    
    const overallProgress = totalTarget > 0 ? Math.round((totalExercises / totalTarget) * 100) : 0;
    
    // Show progress in action bar
    progressElement.textContent = `${totalExercises}/${totalTarget}`;
    progressElement.style.display = 'inline-block';
    progressElement.title = `${overallProgress}% of weekly goals completed`;
    
    console.log(`✅ Goals progress updated: ${totalExercises}/${totalTarget} (${overallProgress}%)`);
}

// STEP 3.7: Add Auto-Goal Tracking to Exercise Logging
// Call this function whenever a new exercise is logged
async function updateGoalsOnExerciseLogged(petIndex) { // ADD ASYNC
    console.log(`🎯 Updating goals for pet ${petIndex} after exercise logged`);
    
    const pets = await getPets();
    if (!pets[petIndex] || !pets[petIndex].goalSettings) return;
    
    // Increment exercise count for current week
    const currentWeekStart = getCurrentWeekStart();
    if (pets[petIndex].goalSettings.currentWeekStart === currentWeekStart) {
        pets[petIndex].goalSettings.exercisesThisWeek += 1;
        
        // Check for goal achievement
        if (pets[petIndex].goalSettings.exercisesThisWeek >= pets[petIndex].goalSettings.weeklyTarget) {
            showGoalAchievedNotification(pets[petIndex].petDetails.name);
        }
        
// REPLACED: Save using PetDataService
    if (window.petDataService) {
        await window.petDataService.savePet(pets[petIndex]);
    } else {
        localStorage.setItem('pets', JSON.stringify(pets));
    }     
        
        // Update UI
      await updateGoalsProgress();
    }
}

function showGoalAchievedNotification(petName) {
    console.log(`🎉 Goal achieved for ${petName}`);
    // You can enhance this with a nice notification later
    // For now, we'll just log it
}
/*
NEW FUNCTIONS IMPLEMENTED 
*/
// resetWeeklyProgress()
async function resetWeeklyProgress(petIndex) {
    console.log(`🔄 [GOALS] Resetting weekly progress for pet ${petIndex}`);
    
    try {
        const pets = await getPets();
        if (!pets[petIndex]) {
            throw new Error(`Pet not found at index ${petIndex}`);
        }
        
        // Reset progress but preserve settings
        pets[petIndex].goalSettings.exercisesThisWeek = 0;
        pets[petIndex].goalSettings.lastManualReset = new Date().toISOString().split('T')[0];
        pets[petIndex].goalSettings.exercisesSinceReset = 0;
        
        // Save changes
        if (window.petDataService) {
            await window.petDataService.savePet(pets[petIndex]);
        } else {
            localStorage.setItem('pets', JSON.stringify(pets));
        }
        
        console.log(`✅ [GOALS] Progress reset for pet ${petIndex}`);
        return true;
        
    } catch (error) {
        console.error(`❌ [GOALS] Failed to reset progress:`, error);
        throw error;
    }
}

async function showResetConfirmation(petIndex) {
    const pets = await getPets();
    const pet = pets[petIndex];
    const goals = getGoalSettings(petIndex);
    
    if (!pet) return;
    
    const confirmed = confirm(
        `Reset weekly progress for ${pet.petDetails.name}?\n\n` +
        `Current progress: ${goals.exercisesThisWeek || 0}/${goals.weeklyTarget} exercises\n` +
        `This will set progress to 0 and start fresh for this week.\n\n` +
        `Note: Your goal settings and streak will be preserved.`
    );
    
    if (confirmed) {
        try {
            await resetWeeklyProgress(petIndex);
            showSuccess(`Progress reset for ${pet.petDetails.name}!`);
            
            // Refresh the goals display
            await loadGoalsContent();
            await updateGoalsProgress();
            
        } catch (error) {
            showError('Failed to reset progress');
        }
    }
}

async function showResetAllConfirmation() {
    const pets = await getPets();
    const activeGoals = pets.filter(pet => pet.goalSettings && pet.goalSettings.enabled);
    
    if (activeGoals.length === 0) {
        showError('No active goals to reset');
        return;
    }
    
    const petNames = activeGoals.map(pet => pet.petDetails.name).join(', ');
    const totalProgress = activeGoals.reduce((sum, pet) => sum + (pet.goalSettings.exercisesThisWeek || 0), 0);
    
    const confirmed = confirm(
        `Reset weekly progress for ALL pets?\n\n` +
        `Affected pets: ${petNames}\n` +
        `Total progress being reset: ${totalProgress} exercises\n\n` +
        `This will set all progress to 0 and start fresh for this week.`
    );
    
    if (confirmed) {
        try {
            for (let i = 0; i < pets.length; i++) {
                if (pets[i].goalSettings && pets[i].goalSettings.enabled) {
                    await resetWeeklyProgress(i);
                }
            }
            
            showSuccess('All progress reset!');
            
            // Refresh the goals display
            await loadGoalsContent();
            await updateGoalsProgress();
            
        } catch (error) {
            showError('Failed to reset some progress');
        }
    }
}

//===============================================
// TIME LINE COMPLETE IMPLEMENTATION
//============================================
function showTimelineModal() {
    console.log('📅 [TIMELINE] Opening exercise history timeline');
    
    try {
        // Use modal system to ensure proper stacking
        if (!showModal('timeline', { closeOthers: false })) {
            throw new Error('Modal system failed to open timeline modal');
        }

        const overlay = document.getElementById('timelineOverlay');
        if (!overlay) {
            throw new Error('Timeline modal overlay not found');
        }

        // Create modal structure USING THE MODAL SYSTEM CONTAINER
        overlay.innerHTML = createTimelineModalHTML();
        console.log('✅ [TIMELINE] Modal structure created');

        // Load and display timeline
        loadTimelineContent();
        
        // Setup modal event listeners
        setupTimelineModalEvents();
        
        console.log('✅ [TIMELINE] Modal fully initialized');
        
    } catch (error) {
        console.error('❌ [TIMELINE] Failed to open timeline modal:', error);
        // Fallback to old implementation
        showTimelineModalFallback();
    }
}

/**
 * Create timeline modal HTML structure for modal system
 */
function createTimelineModalHTML() {
    return `
        <div class="action-modal wide-modal">
            <div class="modal-header">
                <h3>📅 Exercise History Timeline</h3>
                <button class="close-modal-btn">&times;</button>
            </div>
            <div class="modal-content" id="timelineContent">
                <div class="timeline-loading">
                    <p>Loading exercise history...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup timeline modal event handlers for modal system
 */
function handleTimelineAction(event) {
      console.log('🔍 [TIMELINE DEBUG] Event triggered on:', event.target);
    console.log('🔍 [TIMELINE DEBUG] Event type:', event.type);
    
    const target = event.target;
    console.log('🔍 [TIMELINE] Click detected on:', target);
    
    // Handle export button
    if (target.id === 'exportTimelineBtn' || target.closest('#exportTimelineBtn')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('👆 [TIMELINE] Export button clicked');
        exportTimelineData();
        return;
    }
    
    // Handle log exercise button
    if (target.id === 'logNewExerciseBtn' || target.closest('#logNewExerciseBtn')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('👆 [TIMELINE] Log exercise button clicked');
        showExerciseLogFromTimeline();
        return;
    }
    
    // Handle timeline entry clicks
    if (target.classList.contains('timeline-entry') || target.closest('.timeline-entry')) {
        event.preventDefault();
        event.stopPropagation();
        const timelineEntry = target.classList.contains('timeline-entry') ? target : target.closest('.timeline-entry');
        const petIndex = parseInt(timelineEntry.dataset.petIndex);
        const exerciseDate = timelineEntry.dataset.exerciseDate;
        console.log('👆 [TIMELINE] Timeline entry clicked:', { petIndex, exerciseDate });
        handleTimelineEntryClick(petIndex, exerciseDate);
        return;
    }
}

/**
 * Fallback implementation if modal system fails
 */
function showTimelineModalFallback() {
    console.warn('🔄 [TIMELINE] Using fallback implementation');
    
    // Your original implementation
    const existingModal = document.getElementById('timelineOverlay'); // ← FIXED ID
    if (existingModal) {
        existingModal.remove();
    }
    
document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="timelineOverlay">
        ${createTimelineModalHTML()}
    </div>
`);
    
loadTimelineContent();
}

// Update your existing close function to use modal system
function closeTimelineModal() {
    closeModal('timeline');
}

// ===============================================
// TIMELINE DATA PROCESSING
// ===============================================

async function generateTimelineData() {
    console.log('🔄 Generating exercise timeline data');
    const pets = await getPets();
    const allExercises = [];
    
    // Collect all exercises from all pets
    pets.forEach((pet, petIndex) => {
        if (pet.exerciseEntries && pet.exerciseEntries.length > 0) {
            pet.exerciseEntries.forEach(entry => {
                allExercises.push({
                    ...entry,
                    petIndex: petIndex,
                    petName: pet.petDetails.name,
                    petImage: pet.petDetails.image
                });
            });
        }
    });
    
    // Sort by date (newest first)
    const sortedExercises = allExercises.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    console.log(`✅ Timeline data: ${sortedExercises.length} exercises found`);
    return sortedExercises;
}

function groupExercisesByDate(exercises) {
    const grouped = {};
    
    exercises.forEach(exercise => {
        const dateKey = exercise.date;
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(exercise);
    });
    
    return grouped;
}

function getExerciseTypeIcon(exerciseType) {
    const icons = {
        'walking': '🚶',
        'running': '🏃',
        'swimming': '🏊',
        'playing': '🎾',
        'fetch': '🎯',
        'agility': '⛳'
    };
    return icons[exerciseType] || '💪';
}

function getIntensityColor(intensity) {
    const colors = {
        'low': '#28a745',
        'medium': '#ffc107',
        'high': '#dc3545',
        'very high': '#8b0000'
    };
    return colors[intensity] || '#6c757d';
}
// STEP 4.3: Update the Timeline Content Loader
async function loadTimelineContent() {
    const content = document.getElementById('timelineContent');
    if (!content) return;
    
    const timelineExercises = await generateTimelineData();
    const groupedExercises = groupExercisesByDate(timelineExercises);
    
    if (timelineExercises.length === 0) {
        content.innerHTML = `
            <div class="no-timeline">
                <p>📭 No exercise history</p>
                <small>Start logging exercises to see your pet's activity timeline</small>
                <div class="timeline-actions">
                    <button class="log-exercise-timeline-btn" id="logExerciseTimelineBtn">📝 Log First Exercise</button>
                </div>
            </div>
        `;
        
        // Add event listener for log exercise button
        document.getElementById('logExerciseTimelineBtn')?.addEventListener('click', showExerciseLogFromTimeline);
        return;
    }
    
    content.innerHTML = `
        <div class="timeline-container">
            <div class="timeline-stats">
                <div class="timeline-stat">
                    <span class="stat-number">${timelineExercises.length}</span>
                    <span class="stat-label">Total Exercises</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-number">${Object.keys(groupedExercises).length}</span>
                    <span class="stat-label">Active Days</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-number">${getUniquePetsCount(timelineExercises)}</span>
                    <span class="stat-label">Pets Active</span>
                </div>
            </div>
            
            <div class="timeline-entries">
                ${Object.entries(groupedExercises).map(([date, exercises]) => `
                    <div class="timeline-day-group">
                        <div class="timeline-date-header">
                            <span class="timeline-date">${formatTimelineDate(date)}</span>
                            <span class="exercise-count">${exercises.length} exercise${exercises.length > 1 ? 's' : ''}</span>
                        </div>
                        
                        <div class="timeline-day-exercises">
                            ${exercises.map(exercise => `
                                <div class="timeline-entry" data-pet-index="${exercise.petIndex}" data-exercise-date="${exercise.date}">
                                    <div class="timeline-icon">
                                        ${getExerciseTypeIcon(exercise.exerciseType)}
                                    </div>
                                    
                                    <div class="timeline-content">
                                        <div class="timeline-header">
                                            <span class="pet-info">
                                                <img src="${exercise.petImage}" alt="${exercise.petName}" class="pet-avatar">
                                                <span class="pet-name">${exercise.petName}</span>
                                            </span>
                                            <span class="exercise-type">${exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}</span>
                                        </div>
                                        
                                        <div class="timeline-details">
                                            <span class="duration">⏱️ ${exercise.duration} min</span>
                                            <span class="calories">🔥 ${exercise.caloriesBurned} cal</span>
                                            <span class="intensity" style="color: ${getIntensityColor(exercise.intensity)}">
                                                ⚡ ${exercise.intensity || 'medium'}
                                            </span>
                                        </div>
                                        
                                        ${exercise.notes ? `
                                            <div class="exercise-notes">
                                                <p>${exercise.notes}</p>
                                            </div>
                                        ` : ''}
                                        
                                        <div class="timeline-meta">
                                            <span class="exercise-time">${formatExerciseTime(exercise.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="timeline-actions">
            <button class="export-timeline-btn" id="exportTimelineBtn">📤 Export History</button>
            <button class="log-exercise-timeline-btn" id="logNewExerciseBtn">📝 Log New Exercise</button>
        </div>
    `;
    
    // Add event listeners for timeline actions
}

// STEP 4.4: Add Timeline Helper Functions
// Helper functions for timeline
function getUniquePetsCount(exercises) {
    const uniquePets = new Set(exercises.map(exercise => exercise.petIndex));
    return uniquePets.size;
}

function formatTimelineDate(dateString) {
    try {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (e) {
        return dateString;
    }
}

function formatExerciseTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
}

function exportTimelineData() {
    console.log('📤 Exporting timeline data');
    
    // FIX: Add await since generateTimelineData is async
    generateTimelineData().then(timelineExercises => {
        if (timelineExercises.length === 0) {
            alert('No exercise data to export');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Date,Pet Name,Exercise Type,Duration (min),Calories,Intensity,Notes\n';
        
        timelineExercises.forEach(exercise => {
            const row = [
                exercise.date,
                `"${exercise.petName}"`,
                exercise.exerciseType,
                exercise.duration,
                exercise.caloriesBurned,
                exercise.intensity,
                `"${exercise.notes || ''}"`
            ].join(',');
            csvContent += row + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pet-exercise-timeline-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Timeline data exported');
    }).catch(error => {
        console.error('❌ Export failed:', error);
    });
}
   
async function showExerciseLogFromTimeline() {
    console.log('📝 Opening exercise log from timeline');
    
    // Close the timeline modal using modal system
    closeModal('timeline');
    
    // Open daily log form with proper async handling
    const pets = await getPets();
    if (pets && pets.length > 0) {
        showDailyLogForm(0); // Open for first pet
    } else {
        console.error('❌ No pets found for exercise logging');
        showError('No pet profiles found. Please create a pet profile first.');
    }
}

function handleTimelineEntryClick(petIndex, exerciseDate) {
    console.log(`📅 Timeline entry clicked: Pet ${petIndex}, Date ${exerciseDate}`);
    console.log('🔍 [TIMELINE DEBUG] Event triggered on:', event.target);
    console.log('🔍 [TIMELINE DEBUG] Event type:', event.type);
    
    // For future enhancement: Could show detailed view or edit options
    // For now, just log the click
}
        
//STEP 4.6: Add Timeline Integration with Existing Data
// Call this when new exercises are added to refresh any open timeline
async function refreshTimelineIfOpen() {
    const timelineModal = document.getElementById('timelineModal');
    if (timelineModal) {
       await loadTimelineContent(); // Refresh the content
    }
}

/**
 * UPDATED timeline event setup (for fallback)
 */
function setupTimelineModalEvents() {
    console.log('🔄 [TIMELINE] Setting up event handlers');
    
    const overlay = document.getElementById('timelineOverlay');
    if (!overlay) return;

    // Use event delegation instead of individual listeners
    overlay.addEventListener('click', handleTimelineAction);

    // Close button using modal system
    const closeBtn = safeQuery('.close-modal-btn', overlay);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal('timeline'));
        registerModalHandler('timeline', closeBtn, 'click', () => closeModal('timeline'));
    }

    console.log('✅ [TIMELINE] Event handlers setup complete');
}


//=======================================
   //  SETUP Event Listeners FOR 3 MODALS
//=========================================
// In your action bar setup - REPLACE this:
async function setupActionBarEventListeners() {
    console.log('🔄 Setting up action bar event listeners');
    
    // Remove any existing listeners first
    const remindersBtn = document.getElementById('remindersBtn');
    const goalsBtn = document.getElementById('goalsBtn');
    const timelineBtn = document.getElementById('timelineBtn');
    
    // Clone buttons to remove old listeners
    if (remindersBtn) remindersBtn.replaceWith(remindersBtn.cloneNode(true));
    if (goalsBtn) goalsBtn.replaceWith(goalsBtn.cloneNode(true));
    if (timelineBtn) timelineBtn.replaceWith(timelineBtn.cloneNode(true));
    
    // Get fresh references
    const freshRemindersBtn = document.getElementById('remindersBtn');
    const freshGoalsBtn = document.getElementById('goalsBtn');
    const freshTimelineBtn = document.getElementById('timelineBtn');
    
    // Add fresh listeners
    if (freshRemindersBtn) {
        freshRemindersBtn.addEventListener('click', showRemindersModal);
    }
    
    if (freshGoalsBtn) {
        freshGoalsBtn.addEventListener('click', showGoalsModal);
    }
    
    if (freshTimelineBtn) {
        freshTimelineBtn.addEventListener('click', showTimelineModal);
    }
    
    console.log('✅ Action bar event listeners setup complete');
}

async function updateActionBarData() {
   await updateRemindersBadge();
   await updateGoalsProgress();
}

//=========================================================================================
  // INITIALIZE ACTION BAR FUNCTION CALLED IN SHOWEXERCISELOG FUNCTION FOR INITIALIZATION
//=================================================================================================
async function initializeActionBar() {
    console.log('🔄 Initializing action bar');
    
    // Action bar HTML is already in index.html - just setup events
    await setupActionBarEventListeners();
    await updateActionBarData();
    console.log('✅ Action bar initialized');
}
