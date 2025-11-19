// ===============================================
           //  REPORT 
// ===============================================
// ENHANCED REPORT DATA GENERATION
// PHASE 1: HELPERS MOVED TO UTILS.JS
//PHASE 2: ARCHIVE SYSTEM IMPLEMENTATION
//STEP 2A: CREATE FIREBASE ARCHIVE SERVICE
// ===============================================
// FIREBASE ARCHIVE SERVICE
// ===============================================
// ===============================================
// REPORT SYSTEM GLOBALS
// ===============================================
// 🆕 Track open report windows - MOVED FROM dashboard.js
let openReportWindows = new Map(); // petId -> window reference

const ReportArchiveService = {
    /**
     * Archives a monthly report to Firestore
     * @param {string} userId - Current user ID
     * @param {Object} reportData - Enhanced report data from generateEnhancedReportData()
     * @returns {Promise<boolean>} Success status
     */
    async archiveMonthlyReport(userId, reportData) {
        try {
            console.log(`📦 Archiving report for user: ${userId}, pet: ${reportData.petName}`);
            
            // 1. Prepare Firestore document structure
            const archiveDoc = {
                ...reportData,
                userId: userId,
                archivedAt: new Date().toISOString(),
                // Add any additional metadata needed
            };
            
            // 2. Archive to Firestore using approved structure
            const archiveSuccess = await this.saveToFirestore(userId, archiveDoc);
            
            // 3. Update local cache as fallback
            this.cacheReportLocally(userId, archiveDoc);
            
            // 4. Update monthly metadata
            await this.updateMonthlyMetadata(userId, reportData.year, reportData.month);
            
            console.log('✅ Report archived successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Archive failed:', error);
            // Fallback to local storage only
            this.cacheReportLocally(userId, reportData);
            return false;
        }
    },
    
    /**
     * Saves report to Firestore using approved structure
     */
    async saveToFirestore(userId, reportData) {
    // ✅ This calls your WORKING saveReportToFirestore function
    return await saveReportToFirestore(userId, reportData);
    },
    
    /**
     * Caches report locally as fallback
     */
    cacheReportLocally(userId, reportData) {
        try {
            const key = `archived_report_${userId}_${reportData.petId}_${reportData.year}_${reportData.month}`;
            const cacheData = {
                ...reportData,
                cachedAt: new Date().toISOString(),
                source: 'local_cache'
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
            console.log('💾 Report cached locally');
        } catch (error) {
            console.warn('Local cache failed:', error);
        }
    },
    
    /**
     * Updates monthly metadata in Firestore
     */
    async updateMonthlyMetadata(userId, year, month) {
        // Update the monthly summary document
        // yearlyreport2025/months/01_January/
        console.log(`📊 Updating metadata for ${year}-${month}`);
        
    
        const monthKey = `${month.toString().padStart(2, '0')}_${getMonthName(month)}`;
        await db.collection(`yearlyreport${year}`)
                .doc('months')
                .collection('months')
                .doc(monthKey)
                .set({
                    totalReports: firebase.firestore.FieldValue.increment(1),
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
    }
};
// STEP 2B: AUTO-ARCHIVE TRIGGER SYSTEM
// ===============================================
// AUTO-ARCHIVE TRIGGER SYSTEM
// ===============================================

/**
 * Checks if monthly archive should be triggered
 * Runs on app startup and periodically
 */
function initializeArchiveSystem() {
    console.log('🔄 Initializing archive system');
    
    // 1. Check if we need to archive previous month
    checkAndTriggerMonthlyArchive();
    
    // 2. Set up periodic checks (daily)
    setupArchivePeriodicCheck();
}

/**
 * Checks if it's time to archive the previous month
 */
function checkAndTriggerMonthlyArchive() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    
    // Check if we're in the first 3 days of month (archive previous month)
    if (today.getDate() <= 3) {
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        console.log(`📅 Checking archive for ${previousYear}-${previousMonth}`);
        
        // Check if already archived this month
        const lastArchiveKey = `last_archive_${previousYear}_${previousMonth}`;
        const lastArchiveDate = localStorage.getItem(lastArchiveKey);
        
        if (!lastArchiveDate) {
            console.log(`🚀 Triggering archive for ${previousYear}-${previousMonth}`);
            archiveAllPetsForMonth(previousYear, previousMonth);
        } else {
            console.log(`✅ Already archived ${previousYear}-${previousMonth} on ${lastArchiveDate}`);
        }
    }
}

/**
 * Archives all pets for a specific month
 */
async function archiveAllPetsForMonth(year, month) {
    console.log(`📦 Archiving all pets for ${year}-${month}`);
    const pets = await getPets(); // ← ADD THIS LINE

    const userId = getCurrentUserId(); // We'll need to implement this

    if (!userId) {
        console.warn('❌ Cannot archive: No user ID available');
        return;
    }
    
    let archivedCount = 0;
    
    for (const pet of pets) {
        try {
            // 1. Generate enhanced report data
            const reportData = generateEnhancedReportData(pet, year, month);
            await saveReportToFirestore(userId, reportData);

            
            // 2. Archive to Firestore
            const success = await ReportArchiveService.archiveMonthlyReport(userId, reportData);
            
            if (success) {
                archivedCount++;
                console.log(`✅ Archived ${pet.petDetails.name}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to archive ${pet.petDetails.name}:`, error);
        }
    }
    
    // Mark as archived in localStorage
    if (archivedCount > 0) {
        const archiveKey = `last_archive_${year}_${month}`;
        localStorage.setItem(archiveKey, new Date().toISOString());
        
        console.log(`🎉 Successfully archived ${archivedCount}/${pets.length} pets for ${year}-${month}`);
        showSuccess(`Monthly reports archived for ${archivedCount} pets`);
                // ✅ ADD THIS: Refresh the modal if it's open
        const modal = document.getElementById('archivedReportsModal');
        if (modal) {
            const petId = pets[0]?.id; // Get first pet's ID
            loadArchivedReportsContent(petId); // Reload the calendar
        }
    }
}

/**
 * Sets up daily checks for archive triggers
 */
function setupArchivePeriodicCheck() {
    // Check once per day at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight - now;
    
    setTimeout(() => {
        checkAndTriggerMonthlyArchive();
        // Continue checking daily
        setInterval(checkAndTriggerMonthlyArchive, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    
    console.log('⏰ Archive periodic check scheduled');
}

/**
 * Gets current user ID (placeholder - needs your auth implementation)
 */
// ON TOP OF DASHBOARD.JSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//function getCurrentUserId() {
    // This depends on your authentication system
    // Return user ID from your auth system
//    return sessionStorage.getItem('userId') || 'demo_user'; // Placeholder
//}
//STEP 2C: MANUAL ARCHIVE TRIGGERS if user wante to archive at a certain point
// ===============================================
// MANUAL ARCHIVE TRIGGERS
// ===============================================

/**
 * Manual trigger to archive current month immediately
 */
function archiveCurrentMonthManual() {   //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxto verify
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    if (confirm(`Archive ${currentYear}-${currentMonth} reports for all pets now?`)) {
         archiveAllPetsForMonth(currentYear, currentMonth);
    }
}

/**
 * Manual trigger to archive specific month
 */
async function archiveSpecificMonthManual(year, month) {
    // In manual archive triggers
  await saveReportToFirestore(userId, reportData);
    
    if (confirm(`Archive ${year}-${month} reports for all pets?`)) {
       await archiveAllPetsForMonth(year, month);
    }
}

/**
 * Manual trigger for single pet archive
 */
async function archiveSinglePetManual(petIndex, year, month) {
    const pets = await getPets();
    const pet = pets[petIndex];
    
    if (!pet) {
        showError('Pet not found');
        return;
    }
    
    if (confirm(`Archive ${year}-${month} report for ${pet.petDetails.name}?`)) {
       await archiveSinglePetForMonth(petIndex, year, month);
    }
}

/**
 * Archives single pet for specific month
 */
async function archiveSinglePetForMonth(petIndex, year, month) {
    const pets = getPets();
    const pet = pets[petIndex];
    const userId = getCurrentUserId();
    
    if (!userId) {
        showError('Cannot archive: User not authenticated');
        return;
    }
    
    try {
        showLoading('Archiving report...');
        
        // Generate enhanced report data
        const reportData = generateEnhancedReportData(pet, year, month);
        
        // Archive to Firestore
        const success = await ReportArchiveService.archiveMonthlyReport(userId, reportData);
        
        if (success) {
            showSuccess(`Report archived for ${pet.petDetails.name}`);
        } else {
            showError('Archive failed - using local cache only');
        }
        
    } catch (error) {
        console.error('Archive failed:', error);
        showError('Archive failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Shows archive management modal
 */
function showArchiveManagementModal() {
    // This would open a modal for managing archives
    // For now, simple manual triggers
    const action = prompt(
        'Archive Management:\n\n' +
        '1 - Archive current month\n' +
        '2 - Archive specific month\n' +
        '3 - Check archive status\n\n' +
        'Enter choice:'
    );
    
    switch (action) {
        case '1':
            archiveCurrentMonthManual();
            break;
        case '2':
            const year = prompt('Enter year (e.g., 2024):');
            const month = prompt('Enter month (1-12):');
            if (year && month) {
                archiveSpecificMonthManual(parseInt(year), parseInt(month));
            }
            break;
        case '3':
            checkArchiveStatus();
            break;
    }
}

/* 
get month name
*/
function getMonthName(monthNumber) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    return monthNames[monthNumber - 1] || "Unknown";
}

/**
 * Checks and displays archive status
 */
function checkArchiveStatus() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    let statusMessage = 'Archive Status:\n\n';
    
    // Check last 3 months
    for (let i = 0; i < 3; i++) {
        const checkMonth = currentMonth - i;
        let year = currentYear;
        
        if (checkMonth < 1) {
            year = currentYear - 1;
        }
        
        const month = checkMonth < 1 ? checkMonth + 12 : checkMonth;
        const archiveKey = `last_archive_${year}_${month}`;
        const archiveDate = localStorage.getItem(archiveKey);
        
        statusMessage += `${year}-${month}: ${archiveDate ? '✅ Archived' : '❌ Not archived'}\n`;
        if (archiveDate) {
            statusMessage += `   Date: ${new Date(archiveDate).toLocaleDateString()}\n`;
        }
    }
    
    alert(statusMessage);
}

/*THE COMPLETE USER JOURNEY WILL BE:
Generate Report Button 
    ↓
Current Report Modal (with Print/Export)
    ↓  
Archived Reports Button (new)
    ↓
Yearly Calendar Modal (2025, 2026 blocks)
    ↓
Click Archived Month 
    ↓
View Archived Report (with Export/Close)
*/

// PHASE 3: ARCHIVED REPORTS UI
//STEP 3A: ENHANCE CURRENT REPORT MODAL WITH ARCHIVE BUTTON
// ===============================================
// ENHANCED REPORT MODAL WITH ARCHIVE ACCESS
// ===============================================

/**
 * Enhanced generateReport function with archive button
 * Replaces your current generateReport function
 */
function generateEnhancedReport(pet) {
    const reportWindow = window.open('', '_blank');
    const reportId = `report_${Date.now()}`;
    
    reportWindow.document.write(`
        <html>
            <head>
                <title>Monthly Pet Report: ${pet.petDetails.name}</title>
                <style>
                    /* Your existing report styles */
                    body { font-family: sans-serif; padding: 20px; }
                    .report-actions { 
                        text-align: center; 
                        margin: 30px 0; 
                        padding: 20px;
                        border-top: 2px solid #301934;
                    }
                    .action-btn {
                        padding: 12px 24px;
                        margin: 0 10px;
                        background: #301934;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .action-btn:hover { background: #4a235a; }
                    .action-btn:disabled { 
                        background: #cccccc; 
                        cursor: not-allowed; 
                    }
                </style>
            </head>
            <body>
                ${generateReportContent(pet)} <!-- Your existing report content -->
                
                <div class="report-actions">
                    <button class="action-btn" onclick="window.print()">
                        🖨️ Print Report
                    </button>
                    <button class="action-btn" onclick="exportToCSV()">
                        📤 Export as CSV
                    </button>
                    <button class="action-btn" onclick="showArchivedReports()">
                        📚 Archived Reports
                    </button>
                    <button class="action-btn" onclick="window.close()">
                        ❌ Close
                    </button>
                </div>

                <script>
                    function showArchivedReports() {
                        // Send message to parent window to open archives modal
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage({
                                action: 'showArchivedReports',
                                petName: '${pet.petDetails.name}',
                                petId: '${pet.id || 'unknown'}'
                            }, '*');
                        } else {
                            alert('Please keep the main app window open to view archived reports');
                        }
                        window.close();
                    }

                    function exportToCSV() {
                        // We'll implement this using the enhanced report data
                        alert('CSV export will be available in the next update');
                    }
                </script>
            </body>
        </html>
    `);
    reportWindow.document.close();
}
//STEP 3B: CREATE ARCHIVED REPORTS MODAL
// ===============================================
// ARCHIVED REPORTS MODAL
// ===============================================

/**
 * Shows the archived reports modal with yearly calendar view
 */
function showArchivedReportsModal(petName = '', petId = '') {
    console.log('📚 Opening archived reports modal');
    
    // Remove any existing modal first
    const existingModal = document.getElementById('archivedReportsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create and insert the modal
    document.body.insertAdjacentHTML('beforeend', createArchivedReportsModal(petName, petId));
    
    // ✅ FIX: Add event listener for close button
    const modal = document.getElementById('archivedReportsModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeArchivedReportsModal);
        }
    }
    
    // Load archived reports data
    loadArchivedReportsContent(petId);
}

/**
 * Closes archived reports browser modal (the calendar view)
 */
function closeArchivedReportsModal() { // ✅ PLURALfor the 12-month calendar browser
    console.log('🔴 Closing archived reports modal');
    const modal = document.getElementById('archivedReportsModal'); // ✅ PLURAL ID
    if (modal) {
        modal.remove();
        console.log('✅ Archived reports modal closed');
    }
}
/**
 * Creates the archived reports modal HTML
 */
function createArchivedReportsModal(petName, petId) {
    const currentYear = new Date().getFullYear();
    
    return `
        <div class="action-modal-overlay" id="archivedReportsModal">
            <div class="action-modal wide-modal">
                <div class="modal-header">
                    <h3>📚 Archived Reports ${petName ? `- ${petName}` : ''}</h3>
                    <button class="close-modal-btn">&times;</button> <!-- ✅ This is the X button -->
                </div>
                <div class="modal-content" id="archivedReportsContent">
                    <div class="archived-loading">
                        <p>Loading archived reports...</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn" onclick="manualArchiveCurrentMonth()">
                        📦 Archive Current Month
                    </button>
                    <button class="action-btn" onclick="closeArchivedReportsModal()">
                        🔙 Back to Current Report
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Loads content for archived reports modal
 */
async function loadArchivedReportsContent(petId) {
    const content = document.getElementById('archivedReportsContent');
    if (!content) return;
    
    try {
        const userId = getCurrentUserId();
        const currentYear = new Date().getFullYear();
        
        // Get archived reports for current and previous year
        // Use the main function that was intended
        const archives = await loadUserReportsFromFirestore(userId, currentYear, petId);
       //const archives = await loadArchivedReports(userId, petId, currentYear);
        const previousArchives = await loadArchivedReports(userId, petId, currentYear - 1);
        
        content.innerHTML = createYearlyCalendarView(currentYear, archives, previousArchives);
        
        // Add event listeners to month buttons
        setupArchiveMonthListeners();
        
    } catch (error) {
        console.error('Failed to load archived reports:', error);
        content.innerHTML = `
            <div class="archived-error">
                <p>❌ Failed to load archived reports</p>
                <small>${error.message}</small>
                <p>Check your connection or try manual archive.</p>
            </div>
        `;
    }
}
//STEP 3C: CREATE YEARLY CALENDAR VIEW
// ===============================================
// YEARLY CALENDAR VIEW FOR ARCHIVES
// ===============================================

/**
 * Creates yearly calendar view with archived months
 */
function createYearlyCalendarView(currentYear, currentYearArchives, previousYearArchives) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return `
        <div class="archived-calendars">
            <!-- Current Year -->
            <div class="year-section">
                <h4>${currentYear}</h4>
                <div class="month-grid">
                    ${monthNames.map((month, index) => {
                        const monthNumber = index + 1;
                        const hasArchive = currentYearArchives.some(archive => 
                            archive.month === monthNumber
                        );
                        return `
                            <button class="month-btn ${hasArchive ? 'has-archive' : 'no-archive'}" 
                                    data-year="${currentYear}" 
                                    data-month="${monthNumber}"
                                    ${hasArchive ? '' : 'disabled'}>
                                ${month}
                                ${hasArchive ? '✅' : '📭'}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Previous Year -->
            <div class="year-section">
                <h4>${currentYear - 1}</h4>
                <div class="month-grid">
                    ${monthNames.map((month, index) => {
                        const monthNumber = index + 1;
                        const hasArchive = previousYearArchives.some(archive => 
                            archive.month === monthNumber
                        );
                        return `
                            <button class="month-btn ${hasArchive ? 'has-archive' : 'no-archive'}" 
                                    data-year="${currentYear - 1}" 
                                    data-month="${monthNumber}"
                                    ${hasArchive ? '' : 'disabled'}>
                                ${month}
                                ${hasArchive ? '✅' : '📭'}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${currentYearArchives.length === 0 && previousYearArchives.length === 0 ? `
                <div class="no-archives">
                    <p>📭 No archived reports found</p>
                    <small>Archived reports will appear here at the end of each month</small>
                    <p>You can manually archive the current month using the button below.</p>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Sets up event listeners for month buttons
 */
function setupArchiveMonthListeners() {
    document.querySelectorAll('.month-btn.has-archive').forEach(btn => {
        btn.addEventListener('click', () => {
            const year = parseInt(btn.dataset.year);
            const month = parseInt(btn.dataset.month);
            loadArchivedReport(year, month);
        });
    });
}
//STEP 3D: IMPLEMENT ARCHIVE LOADING FUNCTIONS
// ===============================================
// ARCHIVE LOADING AND RETRIEVAL
// ===============================================

/**
 * Loads archived reports for a specific year
 */
async function loadArchivedReports(userId, petId, year) {
    console.log(`📂 Loading archives for ${year}, pet: ${petId}`);
    
    try {
        // Try Firestore first
        const firestoreArchives = await loadArchivesFromFirestore(userId, petId, year);
        if (firestoreArchives.length > 0) {
            return firestoreArchives;
        }
        
        // Fallback to local storage
        const localArchives = loadArchivesFromLocalStorage(userId, petId, year);
        return localArchives;
        
    } catch (error) {
        console.warn(`Failed to load ${year} archives:`, error);
        return loadArchivesFromLocalStorage(userId, petId, year);
    }
}

/**
 * Loads archives from Firestore
 */
async function loadArchivesFromFirestore(userId, petId, year) { // it returns the ARRAY OF ACRCHIVED REPORTS for a year!
//   return await loadSpecificReportFromFirestore(userId, petId, year, month);
    // ✅ This should return ARRAY of reports for the year
    
    console.log(`🔍 Checking Firestore for ${year} archives...`);
    
    const snapshot = await db.collection(`yearlyreport${year}`)
                            .doc('reports')
                            .collection('reports')
                            .where('userId', '==', userId)
                            .where('petId', '==', petId)
                            .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    // Simulate empty for now
    return [];
}

/**
 * Loads archives from local storage
 */
function loadArchivesFromLocalStorage(userId, petId, year) {
    const archives = [];
    const prefix = `archived_report_${userId}_${petId}_${year}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                archives.push(data);
            } catch (error) {
                console.warn(`Invalid archive data in ${key}:`, error);
            }
        }
    }
    
    console.log(`📁 Found ${archives.length} local archives for ${year}`);
    return archives;
}

/**
 * Loads and displays a specific archived report
 */
async function loadArchivedReport(year, month) {
    console.log(`📄 Loading archived report: ${year}-${month}`);
    
    const userId = getCurrentUserId();
    const pets = await getPets();
    const petId = pets[0]?.id || 'unknown';
    
    try {
        showLoading('Loading archived report...');
        
        // ✅ FIXED: Try to load the specific report directly
        const report = await loadSpecificArchive(userId, petId, year, month);
        
        if (report) {
            // Display the archived report
            displayArchivedReport(report);
        } else {
            showError(`No archived report found for ${year}-${month}`);
        }
        
    } catch (error) {
        console.error('Failed to load archived report:', error);
        showError('Failed to load archived report: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Loads a specific archived report
 */
async function loadSpecificArchive(userId, petId, year, month) {
        // Add validation at the start
    if (!userId || !petId || !year || !month) {
        console.error('❌ Missing parameters in loadSpecificArchive:', { userId, petId, year, month });
        return null;
    }
    
    // Try Firestore first
    try {
        const report = await loadSpecificReportFromFirestore(userId, petId, year, month); 
         // ✅ Use singular function loadSpecificReportFromFirestore → returns ONE specific monthly report

        if (report) return report;
    } catch (error) {
        console.warn('Firestore load failed:', error);
    }
    
    // Fallback to local storage
    return loadArchiveFromLocalStorage(userId, petId, year, month);
}

/**
 * Loads specific archive from Firestore
 */
async function loadArchivesFromFirestore(userId, petId, year) {  //plural
    console.log(`📂 Loading archives for ${year}, pet: ${petId}`);
    
    try {
        // ✅ CORRECT: Query for ALL reports for this year/pet
        const snapshot = await db.collection(`yearlyreport${year}`)
                                .doc('reports')
                                .collection('reports')
                                .where('userId', '==', userId)
                                .where('petId', '==', petId)
                                .get();
        
        const archives = snapshot.docs.map(doc => doc.data());
        console.log(`✅ Found ${archives.length} Firestore archives for ${year}`);
        return archives;
        
    } catch (error) {
        console.error(`❌ Firestore load failed for ${year}:`, error);
        return [];
    }
}
    

/**
 * Loads specific archive from local storage
 */
function loadArchiveFromLocalStorage(userId, petId, year, month) {   //called singular ARCHIVE !!!
    const key = `archived_report_${userId}_${petId}_${year}_${month}`;
    const data = localStorage.getItem(key);
    
    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.warn(`Invalid local archive: ${key}`, error);
        }
    }
    
    return null;
}
//STEP 3E: DISPLAY ARCHIVED REPORT
// ===============================================
// ARCHIVED REPORT DISPLAY
// ===============================================

/**
 * Displays an archived report in a modal
 */
function displayArchivedReport(report) {
    // Close the archives browser modal
    closeArchivedReportsModal();
    
    // ✅ Store the report data for export
    window.currentArchivedReport = report;
    
    // Create and show the archived report modal
    document.body.insertAdjacentHTML('beforeend', createArchivedReportModal(report));
    
    // Setup event listeners for the report modal
    setupArchivedReportEvents();
}

/**
 * Creates modal for displaying archived report
 */
function createArchivedReportModal(report) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[report.month - 1];
    
    return `
        <div class="action-modal-overlay" id="archivedReportModal">
            <div class="action-modal extra-wide-modal">
                <div class="modal-header">
                    <h3>📄 ${report.petName} - ${monthName} ${report.year} (Archived)</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="archived-report-meta">
                        <small>Archived on: ${new Date(report.archivedAt).toLocaleDateString()}</small>
                        <small>Report period: ${report.reportPeriod}</small>
                    </div>
                    
                    <div id="archivedReportContent">
                        ${report.exportContent?.html || 'No report content available'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn" onclick="printArchivedReport()">
                        🖨️ Print
                    </button>
                    <button class="action-btn" onclick="exportArchivedReport()">
                        📤 Export CSV
                    </button>
                    <button class="action-btn" onclick="closeArchivedReportModal()">
                        ❌ Close
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Sets up event listeners for archived report modal
 */
function setupArchivedReportEvents() {
    const modal = document.getElementById('archivedReportModal');
    if (!modal) return;
    
    // Close button
    // ✅ FIX: Ensure close button works
    const closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeArchivedReportModal);
    }
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeArchivedReportModal();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape' && modal) {
            closeArchivedReportModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

/**
 * Closes archived report modal
 */
function closeArchivedReportModal() {  // for the singular modal 
    const modal = document.getElementById('archivedReportModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Closes archived reports browser modal
 */
function closeArchivedReportsModal() { //the one that displays 12 months calendar
    const modal = document.getElementById('archivedReportsModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Prints archived report
 */
function printArchivedReport() {
    const content = document.getElementById('archivedReportContent');
    if (content) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content.innerHTML);
        printWindow.document.close();
        printWindow.print();
    }
}

/*
complete implementation
  Exports archived report as CSV
 */
function exportArchivedReport() {
    const modal = document.getElementById('archivedReportModal');
    if (!modal) return;
    
    // Get the report data from the modal (you might need to store this globally)
    const report = window.currentArchivedReport; 
    
    if (report && report.exportContent?.csv) {
        // Create download link for CSV
        const blob = new Blob([report.exportContent.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pet_report_${report.petName}_${report.reportPeriod}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('✅ Archived report exported as CSV');
    } else {
        // Fallback: Try to generate CSV from the displayed content
        generateCSVFromArchivedReport();
    }
}

/**
 * Fallback CSV generation from archived report content
 */
function generateCSVFromArchivedReport() {
    const modal = document.getElementById('archivedReportModal');
    if (!modal) return;
    
    // Extract data from the displayed report
    const petName = modal.querySelector('h3')?.textContent?.split(' - ')[0] || 'Unknown_Pet';
    const reportPeriod = modal.querySelector('.archived-report-meta small:last-child')?.textContent?.replace('Report period: ', '') || 'Unknown_Date';
    
    // Create basic CSV content from visible data
    let csvContent = 'Pet Exercise Report\n';
    csvContent += `Pet: ${petName}\n`;
    csvContent += `Period: ${reportPeriod}\n\n`;
    
    // Add summary data if available
    const summaryStats = modal.querySelectorAll('.stat-box');
    if (summaryStats.length > 0) {
        csvContent += 'Summary\n';
        summaryStats.forEach(stat => {
            const value = stat.querySelector('h3')?.textContent || '';
            const label = stat.querySelector('p')?.textContent || '';
            csvContent += `${label},${value}\n`;
        });
        csvContent += '\n';
    }
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pet_report_${petName.replace(/\s+/g, '_')}_${reportPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Generated CSV from archived report display');
    showSuccess('Report exported as CSV');
}




//===============================================
//old code
// Report generation functionality  ENHANCED WITH THE ARCHIVE AND EXPORT BUTTONS 
//===================================================
async function generateReport(pet) {
    const reportWindow = window.open('', '_blank');
    
    // 🆕 STORE WINDOW REFERENCE
    openReportWindows.set(pet.id, reportWindow);
    
    // 🆕 USE NEW CONTENT GENERATOR (ORIGINAL VERSION)
    const reportContent = await generateReportContent(pet);
    
    reportWindow.document.write(`
        <html>
            <head>
                <title>Monthly Pet Report: ${pet.petDetails.name}</title>
                <style>
    body { 
        font-family: sans-serif; 
        padding: 20px; 
        background: var(--off-white);
        color: var(--black);
    }
    :root {
  --primary-yellow: #E2725B;    /* Terra cotta - replaces unreadable mustard */    
  --primary-mustard: #CB4154;   /* Was #B45309 - now your crimson */
  --dark-purple: #36454F;       /* Was #6B46C1 - now your charcoal */
  --light-purple: #C0C0C0;      /* Was #7C3AED - now your silver */
  --light-charcoal: #F5F5DC;    /* Was #4B5563 - now your cream */
  --dark-charcoal: #2C3840;     /* Was #374151 - darker charcoal */
  
  /* Keep the rest as is but updated */
  --white: #FFFFFF;
  --black: #000000;
  --off-white: #F5F5DC;         /* Your cream */
  --border-focus: #CB4154;      /* Your crimson */
  --input-bg: var(--white);
  --input-border: #C0C0C0;      /* Your silver */
  --container-bg: #F5F5DC;      /* Your cream */
  --container-border: #36454F;  /* Your charcoal */
  --shadow-sm: 0 2px 4px rgba(54, 69, 79, 0.1);
  --shadow-md: 0 4px 6px rgba(54, 69, 79, 0.15);
  --dark-mustard: #A83246;      /* Darker crimson */
  --header-text: var(--dark-purple); /* Your charcoal */

    }
    h1, h2 { 
        text-align: center; 
        color: var(--dark-purple); 
    }
    h1 {
        border-bottom: 3px solid var(--primary-yellow);
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
        background: var(--white);
        box-shadow: var(--shadow-sm);
    }
    th, td { 
        border: 1px solid var(--input-border); 
        padding: 12px; 
        text-align: center; 
    }
    th {
        background: var(--dark-purple);
        color: var(--white);
        font-weight: 600;
    }
    .calendar-grid { 
        display: grid; 
        grid-template-columns: repeat(7, 1fr); 
        gap: 5px; 
        margin: 15px 0;
    }
    .calendar-day { 
        padding: 12px; 
        border: 1px solid var(--input-border); 
        text-align: center;
        min-height: 45px;
        background: var(--white);
    }
    .mood-emoji { font-size: 1.5em; }
    
    .chart-container { 
        width: 100%; 
        height: 400px; 
        margin: 30px 0;
        page-break-inside: avoid;
        background: var(--white);
        padding: 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--container-border);
    }
    
    .summary-stats { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 15px; 
        margin: 20px 0;
    }
    .stat-box { 
        background: var(--white); 
        padding: 20px; 
        border-radius: 8px; 
        text-align: center;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--container-border);
    }
    .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: var(--dark-purple);
        margin-bottom: 5px;
    }
    .stat-label {
        color: var(--light-charcoal);
        font-size: 0.9rem;
    }
    
    .button-container { 
        text-align: center; 
        margin: 30px 0;
        padding: 25px;
        background: var(--white);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
        border-top: 3px solid var(--primary-yellow);
    }
    .action-btn { 
        padding: 12px 24px; 
        margin: 0 10px; 
        background: var(--dark-purple); 
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-sm);
    }
    .action-btn:hover { 
        background: var(--light-purple); 
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    .action-btn:active {
        transform: translateY(0);
    }
    .archive-btn {
        background: var(--primary-yellow);
    }
    .archive-btn:hover {
        background: var(--primary-mustard);
    }
    .export-btn {
        background: var(--border-focus);
    }
    .export-btn:hover {
        background: #047857;
    }
    
    /* Print-specific styles */
    @media print {
        .button-container { display: none; }
        body { background: white; }
        .stat-box { box-shadow: none; border: 1px solid #ddd; }
    }
</style>

            </head>
           <body>
           ${reportContent}
           </body>
        </html>
    `);
    reportWindow.document.close();

    // 🆕 ADD WINDOW CLOSE DETECTION
    reportWindow.addEventListener('beforeunload', () => {
        openReportWindows.delete(pet.id);
    });
}




function generatePetDetailsHTML(pet) {
        // ADD SAFETY CHECK FIRST:
    if (!pet || !pet.petDetails) {
        console.warn('⚠️ No pet details found for report');
        return '<p>Pet details not available</p>';
    }
    
    const details = pet.petDetails;
 
    return `
        <div>
            <h2>Pet Details & Health Assessment</h2>
            <table>
                <tr>
                    <th>Name</th><th>Age</th><th>Current Weight</th><th>Target Weight</th><th>Breed</th>
                </tr>
                <tr>
                    <td>${details.name || 'N/A'}</td>
                    <td>${details.age || 'N/A'} years</td>
                    <td>${details.weight || 'N/A'} lbs</td>
                    <td>${details.targetWeight || 'N/A'} lbs</td>
                    <td>${details.breed || 'N/A'}</td>
                </tr>
            </table>
            
            <table style="margin-top: 15px;">
                <tr>
                    <th>Body Condition</th><th>Energy Level</th><th>Feeding Recommendation</th><th>Gender</th>
                </tr>
                <tr>
                    <td>${getBCSDescription(details.bcs) || 'N/A'}</td>
                    <td>${details.energyLevel ? details.energyLevel.charAt(0).toUpperCase() + details.energyLevel.slice(1) : 'N/A'}</td>
                    <td>${getFeedingDescription(details.feedingRecommendation) || 'N/A'}</td>
                    <td>${details.gender ? details.gender.charAt(0).toUpperCase() + details.gender.slice(1) : 'N/A'}</td>
                </tr>
            </table>
        </div>
    `;
}


// =================================================================
//for updating report with fresh data when opens 
//🐢  Create Report Refresh Function
// 🆕 REFRESH OPEN REPORTS FOR A PET
async function refreshOpenReports(petId) {
    const reportWindow = openReportWindows.get(petId);
    if (!reportWindow || reportWindow.closed) {
        openReportWindows.delete(petId); // Clean up
        return;
    }
    
    try {
        const pets = await getPets();
        const pet = pets.find(p => p.id === petId);
        if (!pet) return;
        
        // Regenerate report content
        const newReportHTML = await generateReportContent(pet);
        
        // Safely update the open window
        if (!reportWindow.closed) {
            reportWindow.document.body.innerHTML = newReportHTML;
        }
    } catch (error) {
        console.error('Failed to refresh report:', error);
    }
}

// 🆕 EXTRACT REPORT CONTENT GENERATION
async function generateReportContent(pet) {
    // Move your report body content generation here
    return `
        <h1>Monthly Pet Report: ${pet.petDetails.name}</h1>
        ${generatePetDetailsHTML(pet)}
        ${generateHealthSummaryHTML(pet)}
        ${generateExerciseSummaryHTML(pet.exerciseEntries)}
        ${await generateSuggestedExercisesReportHTML(pet)} 
        ${generateExerciseCalendarHTML(pet)}
        ${pet.moodLogs && pet.moodLogs.length > 0 ? generateMoodCalendarHTML(pet) : ''}
        ${pet.exerciseEntries && pet.exerciseEntries.length > 0 ? generateExerciseChartsHTML(pet.exerciseEntries) : ''}
        
        <div class="button-container">
            <button class="action-btn" onclick="window.print()">
                🖨️ Print Report
            </button>
            <button class="action-btn archive-btn" onclick="showArchivedReports()">
                📚 Archived Reports
            </button>
            <button class="action-btn" onclick="window.close()">
                ❌ Close
            </button>
        </div>

        <script>
            function showArchivedReports() {
                // Send message to main app to open archives modal
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        action: 'showArchivedReports',
                        petName: '${pet.petDetails.name}',
                        petId: '${pet.id || 'unknown'}'
                    }, '*');
                    window.close();
                } else {
                    alert('Please keep the main app window open to view archived reports');
                }
            } 

            // Add keyboard shortcut support
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') window.close();
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    window.print();
                }
            });
        </script>
    `;
}
//===========================================

// Helper function for BCS description
function getBCSDescription(bcs) {
    const bcsMap = {
        '1': '1 - Very Underweight',
        '2': '2 - Underweight', 
        '3': '3 - Ideal Weight',
        '4': '4 - Overweight',
        '5': '5 - Obese'
    };
    return bcsMap[bcs] || 'Not assessed';
}

// Helper function for feeding description
function getFeedingDescription(feeding) {
    const feedingMap = {
        'feed_less': 'Feed Less - Weight Loss',
        'feed_more': 'Feed More - Weight Gain', 
        'maintain': 'Maintain Current Diet',
        'diet_change': 'Consider Diet Change'
    };
    return feedingMap[feeding] || 'Auto-calculated';
}

//generateHealthSummaryHTML()
function generateHealthSummaryHTML(pet) {
    const details = pet.petDetails;
    
    if (!details.medicalConditions || details.medicalConditions.length === 0) {
        return '<p>No health conditions recorded.</p>';
    }
    
    return `
        <div>
            <h2>Health Conditions & Notes</h2>
            <div style="margin: 15px 0;">
                <h3>Medical Conditions:</h3>
                <ul>
                    ${details.medicalConditions.map(condition => 
                        `<li>${formatMedicalCondition(condition)}</li>`
                    ).join('')}
                </ul>
            </div>
            ${details.healthNotes ? `
            <div style="margin: 15px 0;">
                <h3>Health Notes:</h3>
                <p>${details.healthNotes}</p>
            </div>
            ` : ''}
        </div>
    `;
}

// Helper function to format medical condition names
function formatMedicalCondition(condition) {
    const conditionMap = {
        'arthritis': 'Arthritis',
        'diabetes': 'Diabetes',
        'heart_condition': 'Heart Condition',
        'lameness': 'Lameness',
        'torn_muscle': 'Torn Muscle',
        'spinal_injury': 'Spinal Injury',
        'previous_fracture': 'Previous Bone Fracture',
        'seizure': 'Seizure Disorder'
    };
    return conditionMap[condition] || condition;
}

// GENERATE SUGGESTED EXERCISES html updated 
async function generateSuggestedExercisesReportHTML(pet) {
    const pets = await getPets();
    const petIndex = pets.findIndex(p => p.petDetails.name === pet.petDetails.name); // name is working 
    /* 
    if it causes issues we use petId instead and it is passed by function generateSuggestedExercises(pet, petIndex = null) {
     it works for both backward compatability
    */ 
    //const petIndex = pets.findIndex(p => p.id === pet.id); // ← MORE RELIABLE THAN NAME
    
    console.log('🔍 REPORT DEBUG: Pet from parameter:', pet.petDetails.name);
    console.log('🔍 REPORT DEBUG: All pets in array:', pets.map(p => p.petDetails.name));
    console.log('🔍 REPORT DEBUG: Found pet index:', petIndex);
    console.log('🔍 REPORT DEBUG: Pet at that index:', pets[petIndex]?.petDetails?.name);
    console.log('🔍 REPORT DEBUG: suggestionSettings:', pets[petIndex]?.suggestionSettings);
    
    // 🎯 GET DATA DIRECTLY FROM PET OBJECT
    let loggedSuggestionIds = [];
    if (pets[petIndex]?.suggestionSettings?.logged) {
        loggedSuggestionIds = pets[petIndex].suggestionSettings.logged;
    }
    
    if (loggedSuggestionIds.length === 0) {
        return '<p>No suggested exercises logged yet.</p>';
    }
    
    // Generate the actual suggested exercises to get full details
    const allSuggestions = await generateSuggestedExercises(pet);
    
    // Filter to only include logged suggestions
    const loggedSuggestions = allSuggestions.filter(suggestion => 
        loggedSuggestionIds.includes(suggestion.id)
    );
    
    if (loggedSuggestions.length === 0) {
        return '<p>No suggested exercises logged yet.</p>';
    }
    
    return `
        <div style="margin-top: 30px;">
            <h2>Suggested Exercises Used</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Exercise</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Duration</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Intensity</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Reason</th>
                </tr>
                ${loggedSuggestions.map(suggestion => ` 
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${suggestion.name}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${suggestion.duration} min</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${suggestion.intensity}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${suggestion.reason}</td>
                    </tr>
                `).join('')}
            </table>
            <p><small>Total suggested exercises used: ${loggedSuggestions.length}</small></p>
        </div>
    `;
}



function generateExerciseCalendarHTML(pet) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    let calendarHtml = `
        <h2>Exercise Calendar - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div class="calendar-grid">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
            `<div class="calendar-day" style="font-weight:bold;">${day}</div>`
        ).join('')}
    `;
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
        calendarHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const hasExercise = pet.exerciseEntries?.some(entry => entry.date === dateStr);
        calendarHtml += `<div class="calendar-day">${day} ${hasExercise ? '✅' : ''}</div>`;
    }
    
    calendarHtml += '</div>';
    return calendarHtml;
}


// AND ADD THIS HELPER FUNCTION IN THE REPORT:
function getMoodEmojiFromValue(value) {
    const emojiMap = {0: '😀', 1: '😊', 2: '😐', 3: '😞', 4: '😠', 5: '🤢', 6: '😤', 7: '😔', 8: '😴', 9: '😰'};
    return emojiMap[value] || '❓';
}
function generateMoodCalendarHTML(pet) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    let moodHtml = `
        <h2>Mood Calendar - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div class="calendar-grid">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
            `<div class="calendar-day" style="font-weight:bold;">${day}</div>`
        ).join('')}
        `; // ← ADDED CLOSING BACKTICK HERE
    
    // Empty days for the first week
    for (let i = 0; i < firstDay; i++) {
        moodHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const moodEntry = pet.moodLogs?.find(log => log.date === dateStr);
        const moodEmoji = moodEntry ? getMoodEmojiFromValue(moodEntry.mood) : '';
        moodHtml += `<div class="calendar-day mood-emoji">${moodEmoji}</div>`;
    }
    
    moodHtml += '</div>';
    return moodHtml;
}

//==========
// Generate exercise charts
//==========
function generateExerciseChartsHTML(exerciseEntries) {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    
    // Process data for all 3 charts (consistent with mini charts)
    const chartData = processReportChartData(exerciseEntries);
    
    return `
        <h2>Exercise Analysis</h2>
        
        <!-- Duration Chart -->
        <div class="chart-container">
            <canvas id="durationChart"></canvas>
        </div>
        
        <!-- Calories Chart -->
        <div class="chart-container">
            <canvas id="caloriesChart"></canvas>
        </div>
        
        <!-- NEW: Intensity Chart -->
        <div class="chart-container">
            <canvas id="intensityChart"></canvas>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            setTimeout(function() {
                // Duration Bar Chart
                new Chart(document.getElementById('durationChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(chartData.durationLabels)},
                        datasets: [{
                            label: 'Number of Sessions',
                            data: ${JSON.stringify(chartData.durationData)},
                            backgroundColor: '#3A86FF',
                            borderColor: '#26547C',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Exercise Duration Distribution'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Sessions'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Duration (minutes)'
                                }
                            }
                        }
                    }
                });
                
                // Calories Line Chart
                new Chart(document.getElementById('caloriesChart').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(chartData.calorieLabels)},
                        datasets: [{
                            label: 'Number of Sessions',
                            data: ${JSON.stringify(chartData.calorieData)},
                            backgroundColor: 'rgba(255, 209, 102, 0.2)',
                            borderColor: '#EFB366',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Calories Burned Distribution'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Sessions'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Calories Burned'
                                }
                            }
                        }
                    }
                });
                
                // NEW: Intensity Pie Chart
                new Chart(document.getElementById('intensityChart').getContext('2d'), {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(chartData.intensityLabels)},
                        datasets: [{
                            data: ${JSON.stringify(chartData.intensityData)},
                            backgroundColor: [
                                '#FFD166', // Low - yellow
                                '#3A86FF', // Medium - blue  
                                '#EFB366', // High - mustard
                                '#26547C'  // Very High - dark blue
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Exercise Intensity Distribution'
                            },
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }, 100);
        </script>
    `;
}

// Process exercise data for report charts (consistent with mini charts)
function processReportChartData(exerciseEntries) {
    // Duration data - 15-min increments
    const durationGroups = {
        '0-15': 0,
        '16-30': 0,
        '31-45': 0,
        '46-60': 0,
        '61+': 0
    };
    
    // Calories data - 25-calorie increments  
    const calorieGroups = {
        '0-25': 0,
        '26-50': 0,
        '51-75': 0,
        '76-100': 0,
        '101+': 0
    };
    
    // Intensity data
    const intensityGroups = {
        'Low': 0,
        'Medium': 0,
        'High': 0,
        'Very High': 0
    };
    
    // Process all entries
    exerciseEntries.forEach(entry => {
        // Duration grouping
        const duration = entry.duration;
        if (duration <= 15) durationGroups['0-15']++;
        else if (duration <= 30) durationGroups['16-30']++;
        else if (duration <= 45) durationGroups['31-45']++;
        else if (duration <= 60) durationGroups['46-60']++;
        else durationGroups['61+']++;
        
        // Calories grouping
        const calories = entry.caloriesBurned;
        if (calories <= 25) calorieGroups['0-25']++;
        else if (calories <= 50) calorieGroups['26-50']++;
        else if (calories <= 75) calorieGroups['51-75']++;
        else if (calories <= 100) calorieGroups['76-100']++;
        else calorieGroups['101+']++;
        
        // Intensity grouping
        const intensity = entry.intensity || 'Medium';
        const intensityKey = intensity.charAt(0).toUpperCase() + intensity.slice(1);
        intensityGroups[intensityKey] = (intensityGroups[intensityKey] || 0) + 1;
    });
    
    return {
        durationLabels: Object.keys(durationGroups),
        durationData: Object.values(durationGroups),
        calorieLabels: Object.keys(calorieGroups),
        calorieData: Object.values(calorieGroups),
        intensityLabels: Object.keys(intensityGroups),
        intensityData: Object.values(intensityGroups)
    };
}

function generateExerciseSummaryHTML(exerciseEntries) {
    if (!exerciseEntries || exerciseEntries.length === 0) return '<p>No exercise data available.</p>';
    
    const totalDays = new Set(exerciseEntries.map(entry => entry.date)).size;
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    const avgDuration = totalDuration / exerciseEntries.length;
    const avgCalories = totalCalories / exerciseEntries.length;

    return `
        <h2>Exercise Summary</h2>
        <div class="summary-stats">
            <div class="stat-box">
                <h3>${totalDays}</h3>
                <p>Days Exercised</p>
            </div>
            <div class="stat-box">
                <h3>${totalDuration} min</h3>
                <p>Total Duration</p>
            </div>
            <div class="stat-box">
                <h3>${totalCalories}</h3>
                <p>Total Calories</p>
            </div>
            <div class="stat-box">
                <h3>${avgDuration.toFixed(1)} min</h3>
                <p>Avg. per Session</p>
            </div>
            <div class="stat-box">
                <h3>${avgCalories.toFixed(0)}</h3>
                <p>Avg. Calories</p>
            </div>
            <div class="stat-box">
                <h3>${exerciseEntries.length}</h3>
                <p>Total Sessions</p>
            </div>
        </div>
    `;
}

//FIRESTORE
// ===============================================
// 🗂️ FIRESTORE SCHEMA SETUP
// ===============================================
// Ensures the yearly report collection exists
//🗂️ USER DOCUMENT SCHEMA
//Document Path: petProfiles/{your-real-user-uid}
//Fields:
//text
//userId: "{your-real-user-uid}" (string)
//email: "your-email@example.com" (string) 
//createdAt: [current timestamp] (timestamp)
//updatedAt: [current timestamp] (timestamp)
//pets: array [
  //{
  //  id: "pet1",
  //  petDetails: {
  //    name: "Pet Name",
  //    type: "dog",
  //    breed: "Breed",
  //    age: "2",
  //    weight: "25",
  //    gender: "male",
  //    bcs: "3", 
  //    energyLevel: "medium",
  //    targetWeight: "24",
  //    medicalConditions: [],
  //    feedingRecommendation: "maintain",
  //    healthNotes: "",
  //    image: "https://drkimogad.github.io/Pet-Exercise-Log/images/default-pet.png"
  //  },
//    exerciseEntries: [],
 //   moodLogs: [],
   // reminderSettings: {
//      enabled: true,
  //    threshold: 3,
 //     lastChecked: "2024-01-01"
//    },
//    goalSettings: {
//      enabled: false,
//      weeklyTarget: 5,
    //  currentWeekStart: "2024-01-01",
  //    exercisesThisWeek: 0,
//      streak: 0
//    },
 //   suggestionSettings: {
 //     dismissed: [],
 //     logged: []
//    }
//  }
//]

 
async function setupYearlySchema(year) {
    try {
        console.log(`🗂️ Setting up schema for year ${year}`);
        
        // Create metadata document if it doesn't exist
        await db.collection(`yearlyreport${year}`)
                .doc('metadata')
                .set({
                    year: year,
                    totalReports: 0,
                    lastUpdated: new Date().toISOString(),
                    schemaVersion: '1.0'
                }, { merge: true });
                
        console.log(`✅ Schema ready for year ${year}`);
        return true;
    } catch (error) {
        console.error('❌ Schema setup failed:', error);
        return false;
    }
}
// ===============================================
// 💾 SAVE REPORT TO FIRESTORE
// ===============================================

/**
 * Saves enhanced report data to Firestore
 * @param {string} userId - Current user ID
 * @param {Object} reportData - From generateEnhancedReportData()
 * @returns {Promise<boolean>} Success status
 */
async function saveReportToFirestore(userId, reportData) {
    try {
        console.log(`💾 Saving report to Firestore: ${reportData.reportPeriod}`);
        
        const year = reportData.year;
        const reportId = `${userId}_${reportData.petId}_${year}${reportData.month.toString().padStart(2, '0')}`;
        
        // 1. Ensure schema exists
        await setupYearlySchema(year);
        
        // 2. Save the report document
        await db.collection(`yearlyreport${year}`)
                .doc('reports')
                .collection('reports')
                .doc(reportId)
                .set({
                    ...reportData,
                    userId: userId,
                    archivedAt: new Date().toISOString()
                });
        
        // 3. Update metadata count
        await db.collection(`yearlyreport${year}`)
                .doc('metadata')
                .update({
                    totalReports: firebase.firestore.FieldValue.increment(1),
                    lastUpdated: new Date().toISOString()
                });
        
        console.log(`✅ Report saved: ${reportId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Save failed:', error);
        return false;
    }
}
// ===============================================
// 📥 LOAD REPORTS FROM FIRESTORE
// ===============================================

/**
 * Loads user's archived reports for a specific year
 */
async function loadUserReportsFromFirestore(userId, year, petId = null) {
  console.log('🔍 DEBUG LOAD REPORTS:', { 
        userId, 
        year, 
        petId,
        currentFirebaseUser: firebase.auth().currentUser?.uid 
    });
    try {        
        let query = db.collection(`yearlyreport${year}`)
                     .doc('reports')
                     .collection('reports')
                     .where('userId', '==', userId);
        
        // Filter by pet if specified
        if (petId) {
            query = query.where('petId', '==', petId);
        }
        
        const snapshot = await query.get();
        const reports = snapshot.docs.map(doc => doc.data());
        
        console.log(`✅ Loaded ${reports.length} reports for ${year}`);
        return reports;
        
    } catch (error) {
        console.error('❌ Load failed:', error);
        return [];
    }
}

/**
 * Loads a specific archived report
 */
async function loadSpecificReportFromFirestore(userId, petId, year, month) {
    // Add at the start of the function:
if (!month || !userId || !petId) {
    console.error('❌ Missing parameters for report load:', { month, userId, petId });
    return null;
}
    
    try {
        const reportId = `${userId}_${petId}_${year}${month.toString().padStart(2, '0')}`;
        
        const doc = await db.collection(`yearlyreport${year}`)
                           .doc('reports')
                           .collection('reports')
                           .doc(reportId)
                           .get();
        
        if (doc.exists) {
            console.log(`✅ Found archived report: ${reportId}`);
            return doc.data();
        } else {
            console.log(`📭 No archived report found: ${reportId}`);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Load specific report failed:', error);
        return null;
    }
}


/*yearlyreport2025/
├── metadata/           # Schema info
├── months/            # Monthly summaries (for auto-archive triggers)
└── reports/           # Individual archived reports
The months collection is for:
Tracking which months have been archived
Auto-archive system to know what needs processing
Monthly summary statistics

The reports collection contains:
Your actual archived pet reports
One document per pet per month
*/

// STEP 3F: INTEGRATION WITH EXISTING SYSTEM
// ===============================================
// SYSTEM INTEGRATION
// ===============================================
// ===============================================
// MESSAGE LISTENERS FOR REPORT SYSTEM
// ===============================================
// In reportsSystem.js - more efficient version:
window.addEventListener('message', function(event) {
    console.log('📨 Received message:', event.data);
    
    if (event.data.action === 'showArchivedReports') {
        showArchivedReportsModal(event.data.petName, event.data.petId);
    }
    else if (event.data.action === 'manualArchive') {
        archiveCurrentMonthManual();
    }
});

/**
 * Listen for messages from report windows
 */
window.addEventListener('message', function(event) {
    if (event.data.action === 'showArchivedReports') {
        showArchivedReportsModal(event.data.petName, event.data.petId);
    }
});

/**
 * Manual archive trigger for current month
 */
function manualArchiveCurrentMonth() {
    const today = new Date();
    archiveCurrentMonthManual();
}

/**
 * Initialize archive system when app starts
 */
// Add this to your existing initialization in showExerciseLog():
function initializeCompleteArchiveSystem() {
    initializeArchiveSystem(); // From Phase 2
    setupArchiveMessageListener();
}

/**
 * Sets up the message listener for archive actions
 */
function setupArchiveMessageListener() {
    // Already implemented above
    console.log('📨 Archive message listener ready');
}
