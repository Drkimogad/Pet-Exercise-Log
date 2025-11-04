"use strict";

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/Pet-Exercise-Log/service-worker.js', {
            scope: '/Pet-Exercise-Log/'
        }).then(reg => {
            console.log('Service Worker registered with scope:', reg.scope);
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    }
}

// Error handling - UPDATED
function showError(msg) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = msg;
    
    // Use auth container for messages
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.appendChild(error);
        setTimeout(() => error.remove(), 5000);
    } else {
        console.error('Error:', msg); // Fallback to console
    }
}

function showErrors(msgs) {
    msgs.forEach(msg => showError(msg));
}


// Success message function - UPDATED
function showSuccess(msg) {
    const success = document.createElement('div');
    success.className = 'success-message';
    success.textContent = msg;
    
    // Use auth container for messages
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.appendChild(success);
        setTimeout(() => success.remove(), 5000);
    } else {
        console.log('Success:', msg); // Fallback to console
    }
}

// Check if user is authenticated - IMPROVED
function checkAuth() {
    try {
        const userJson = sessionStorage.getItem('user');
        if (!userJson) return false;
        
        const user = JSON.parse(userJson);
        if (!user || !user.email) return false;
        
        // User is logged in, show dashboard, hide auth
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('lottie-banner').style.display = 'none';
        
        const dashboard = document.querySelector('.dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        // If there's any error, clear the invalid session
        sessionStorage.removeItem('user');
        return false;
    }
}


//=================================================
// ENHANCED REPORT DATA GENERATION HELPERS
//======================================================

/**
 * Generates minimal report data structure for archiving
 * @param {Object} pet - The pet data object
 * @param {number} year - Report year (2024, 2025, etc.)
 * @param {number} month - Report month (1-12)
 * @returns {Object} Structured report data for archiving
 */
function generateEnhancedReportData(pet, year, month) {
    console.log(`📊 Generating enhanced report data for ${year}-${month}`);
    
    // 1. Generate minimal calendar data
    const calendars = generateMinimalCalendars(pet, year, month);
    
    // 2. Generate pre-aggregated chart data  
    const charts = generatePreAggregatedCharts(pet, year, month);
    
    // 3. Generate summary statistics
    const summary = generateReportSummary(pet, year, month);
    
    // 4. Generate export content (HTML + CSV)
    const exportContent = generateExportContent(pet, year, month, summary, calendars, charts);
    
    // 5. Return complete report structure
    return {
        // Metadata
        id: `${pet.petDetails.name}_${year}_${month.toString().padStart(2, '0')}`,
        petId: pet.id || 'unknown', // We'll need to ensure pets have IDs
        petName: pet.petDetails.name,
        year: year,
        month: month,
        reportPeriod: `${year}-${month.toString().padStart(2, '0')}`,
        generatedAt: new Date().toISOString(),
        
        // Core data (minimal format)
        summary: summary,
        calendars: calendars,
        charts: charts,
        exportContent: exportContent
    };
}
// ===============================================
// MINIMAL CALENDARS GENERATION
// ===============================================

/**
 * Generates minimal calendar data (counts only)
 * @param {Object} pet - The pet data object  
 * @param {number} year - Report year
 * @param {number} month - Report month
 * @returns {Object} Minimal calendar data
 */
function generateMinimalCalendars(pet, year, month) {
    console.log(`📅 Generating minimal calendars for ${year}-${month}`);
    
    const exerciseEntries = pet.exerciseEntries || [];
    const moodLogs = pet.moodLogs || [];
    
    // Filter data for the target month
    const monthStr = month.toString().padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;
    
    // 1. Exercise Calendar: { "2024-11-01": 2, "2024-11-02": 1, ... }
    const exerciseCalendar = {};
    exerciseEntries.forEach(entry => {
        if (entry.date && entry.date.startsWith(targetMonthPrefix)) {
            exerciseCalendar[entry.date] = (exerciseCalendar[entry.date] || 0) + 1;
        }
    });
    
    // 2. Mood Calendar: { "2024-11-01": 2, "2024-11-02": 4, ... }  
    const moodCalendar = {};
    moodLogs.forEach(log => {
        if (log.date && log.date.startsWith(targetMonthPrefix)) {
            moodCalendar[log.date] = log.mood; // Store mood value (0-9)
        }
    });
    
    return {
        exercise: exerciseCalendar,
        mood: moodCalendar
    };
}
// ===============================================
// PRE-AGGREGATED CHARTS GENERATION
// ===============================================

/**
 * Generates pre-aggregated chart data (weekly summaries)
 * @param {Object} pet - The pet data object
 * @param {number} year - Report year  
 * @param {number} month - Report month
 * @returns {Object} Pre-aggregated chart data
 */
function generatePreAggregatedCharts(pet, year, month) {
    console.log(`📈 Generating pre-aggregated charts for ${year}-${month}`);
    
    const exerciseEntries = pet.exerciseEntries || [];
    const monthStr = month.toString().padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;
    
    // Filter exercises for target month
    const monthExercises = exerciseEntries.filter(entry => 
        entry.date && entry.date.startsWith(targetMonthPrefix)
    );
    
    // 1. Group by week and calculate totals
    const weeklyData = groupExercisesByWeek(monthExercises, year, month);
    
    // 2. Calculate intensity distribution
    const intensityData = calculateIntensityDistribution(monthExercises);
    
    return {
        // Duration Chart: Weekly totals
        durationData: {
            labels: weeklyData.labels,
            datasets: [{
                label: "Weekly Duration (min)",
                data: weeklyData.durationTotals
            }]
        },
        
        // Calories Chart: Weekly totals  
        caloriesData: {
            labels: weeklyData.labels,
            datasets: [{
                label: "Weekly Calories",
                data: weeklyData.calorieTotals
            }]
        },
        
        // Intensity Chart: Distribution counts
        intensityData: {
            labels: intensityData.labels,
            datasets: [{
                data: intensityData.counts
            }]
        }
    };
}

/**
 * Groups exercises by week and calculates totals
 */
function groupExercisesByWeek(exercises, year, month) {
    const weeks = {};
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    
    exercises.forEach(entry => {
        const weekNumber = getWeekOfMonth(entry.date);
        if (!weeks[weekNumber]) {
            weeks[weekNumber] = { duration: 0, calories: 0, count: 0 };
        }
        weeks[weekNumber].duration += entry.duration || 0;
        weeks[weekNumber].calories += entry.caloriesBurned || 0;
        weeks[weekNumber].count += 1;
    });
    
    // Convert to arrays for chart data
    const durationTotals = [];
    const calorieTotals = [];
    
    weekLabels.forEach((label, index) => {
        const weekData = weeks[index + 1] || { duration: 0, calories: 0 };
        durationTotals.push(weekData.duration);
        calorieTotals.push(weekData.calories);
    });
    
    return {
        labels: weekLabels,
        durationTotals: durationTotals,
        calorieTotals: calorieTotals
    };
}

/**
 * Calculates intensity distribution counts
 */
function calculateIntensityDistribution(exercises) {
    const intensityCounts = { low: 0, medium: 0, high: 0, 'very high': 0 };
    
    exercises.forEach(entry => {
        const intensity = entry.intensity || 'medium';
        intensityCounts[intensity] = (intensityCounts[intensity] || 0) + 1;
    });
    
    return {
        labels: ["Low", "Medium", "High", "Very High"],
        counts: [
            intensityCounts.low,
            intensityCounts.medium, 
            intensityCounts.high,
            intensityCounts['very high']
        ]
    };
}

/**
 * Helper: Gets week of month (1-5)
 */
function getWeekOfMonth(dateString) {
    const date = new Date(dateString);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const offset = ((7 - firstDay) % 7);
    return Math.ceil((date.getDate() + offset) / 7);
}
// ===============================================
// REPORT SUMMARY GENERATION
// ===============================================

/**
 * Generates summary statistics for the report
 * @param {Object} pet - The pet data object
 * @param {number} year - Report year
 * @param {number} month - Report month  
 * @returns {Object} Summary statistics
 */
function generateReportSummary(pet, year, month) {
    console.log(`📋 Generating report summary for ${year}-${month}`);
    
    const exerciseEntries = pet.exerciseEntries || [];
    const moodLogs = pet.moodLogs || [];
    const monthStr = month.toString().padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;
    
    // Filter data for target month
    const monthExercises = exerciseEntries.filter(entry => 
        entry.date && entry.date.startsWith(targetMonthPrefix)
    );
    const monthMoods = moodLogs.filter(log => 
        log.date && log.date.startsWith(targetMonthPrefix)
    );
    
    // 1. Exercise Summary
    const totalExercises = monthExercises.length;
    const totalDuration = monthExercises.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalCalories = monthExercises.reduce((sum, entry) => sum + (entry.caloriesBurned || 0), 0);
    const averageDuration = totalExercises > 0 ? Math.round(totalDuration / totalExercises) : 0;
    
    // 2. Favorite Exercise
    const favoriteExercise = getMostFrequentExercise(monthExercises);
    
    // 3. Exercise Days (unique days with exercises)
    const exerciseDays = new Set(monthExercises.map(entry => entry.date)).size;
    
    // 4. Mood Summary
    const totalMoodEntries = monthMoods.length;
    const averageMood = totalMoodEntries > 0 
        ? Math.round(monthMoods.reduce((sum, log) => sum + (log.mood || 0), 0) / totalMoodEntries * 10) / 10 
        : 0;
    const moodTrend = calculateMoodTrend(monthMoods);
    
    // 5. Goals Progress (from existing goalSettings)
    const goalsProgress = calculateGoalsProgress(pet, year, month);
    
    return {
        // Exercise Metrics
        totalExercises: totalExercises,
        totalDuration: totalDuration,
        totalCalories: totalCalories,
        averageDuration: averageDuration,
        favoriteExercise: favoriteExercise,
        exerciseDays: exerciseDays,
        
        // Mood Metrics
        totalMoodEntries: totalMoodEntries,
        averageMood: averageMood,
        moodTrend: moodTrend,
        
        // Goals
        goalsProgress: goalsProgress,
        
        // Health Metrics (from petDetails)
        healthMetrics: {
            bcs: pet.petDetails.bcs || 'Not assessed',
            energyLevel: pet.petDetails.energyLevel || 'Not assessed',
            weight: pet.petDetails.weight || 'Unknown'
        }
    };
}

/**
 * Finds the most frequent exercise type
 */
function getMostFrequentExercise(exercises) {
    if (exercises.length === 0) return 'None';
    
    const exerciseCount = {};
    exercises.forEach(entry => {
        const type = entry.exerciseType || 'unknown';
        exerciseCount[type] = (exerciseCount[type] || 0) + 1;
    });
    
    const favorite = Object.keys(exerciseCount).reduce((a, b) => 
        exerciseCount[a] > exerciseCount[b] ? a : b
    );
    
    return favorite.charAt(0).toUpperCase() + favorite.slice(1);
}

/**
 * Calculates mood trend (improving, stable, declining)
 */
function calculateMoodTrend(moodLogs) {
    if (moodLogs.length < 2) return 'Not enough data';
    
    // Sort by date and get first/last half averages
    const sortedLogs = [...moodLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const midPoint = Math.floor(sortedLogs.length / 2);
    
    const firstHalfAvg = sortedLogs.slice(0, midPoint).reduce((sum, log) => sum + log.mood, 0) / midPoint;
    const secondHalfAvg = sortedLogs.slice(midPoint).reduce((sum, log) => sum + log.mood, 0) / (sortedLogs.length - midPoint);
    
    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 0.5) return 'Improving';
    if (difference < -0.5) return 'Declining';
    return 'Stable';
}

/**
 * Calculates goals progress for the month
 */
function calculateGoalsProgress(pet, year, month) {
    const goals = pet.goalSettings || {};
    const monthStr = month.toString().padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;
    
    const monthExercises = (pet.exerciseEntries || []).filter(entry => 
        entry.date && entry.date.startsWith(targetMonthPrefix)
    );
    
    const weeklyTarget = goals.weeklyTarget || 5;
    const exercisesCompleted = monthExercises.length;
    
    // Simple calculation: compare monthly total to weekly target × 4
    const monthlyTarget = weeklyTarget * 4;
    const goalAchieved = exercisesCompleted >= monthlyTarget;
    
    return {
        weeklyTarget: weeklyTarget,
        exercisesCompleted: exercisesCompleted,
        goalAchieved: goalAchieved,
        progressPercent: Math.min(100, (exercisesCompleted / monthlyTarget) * 100)
    };
}
// ===============================================
// EXPORT CONTENT GENERATION (HTML + CSV)
// ===============================================

/**
 * Generates export content (HTML for printing + CSV for data)
 * @param {Object} pet - The pet data object
 * @param {number} year - Report year
 * @param {number} month - Report month
 * @param {Object} summary - Pre-calculated summary
 * @param {Object} calendars - Minimal calendar data  
 * @param {Object} charts - Pre-aggregated chart data
 * @returns {Object} Export content in multiple formats
 */
function generateExportContent(pet, year, month, summary, calendars, charts) {
    console.log(`📤 Generating export content for ${year}-${month}`);
    
    const htmlContent = generateHTMLReport(pet, year, month, summary, calendars, charts);
    const csvContent = generateCSVReport(pet, year, month, summary, calendars, charts);
    
    return {
        html: htmlContent,
        csv: csvContent
    };
}

/**
 * Generates full HTML report for printing
 */
function generateHTMLReport(pet, year, month, summary, calendars, charts) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[month - 1];
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Monthly Pet Report: ${pet.petDetails.name} - ${monthName} ${year}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
        }
        .report-header { 
            text-align: center; 
            border-bottom: 2px solid #301934;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .pet-details, .summary-section { 
            margin: 20px 0; 
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin: 15px 0;
        }
        .stat-box { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 6px; 
            text-align: center;
        }
        .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #301934;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin: 15px 0;
        }
        .calendar-day {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: center;
            min-height: 40px;
        }
        .has-exercise { background-color: #e8f5e8; }
        .has-mood { background-color: #fff3cd; }
        .chart-placeholder {
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            text-align: center;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>Monthly Pet Exercise Report</h1>
        <h2>${pet.petDetails.name} - ${monthName} ${year}</h2>
    </div>
    
    ${generatePetDetailsHTML(pet.petDetails)}
    ${generateSummaryHTML(summary)}
    ${generateCalendarsHTML(calendars, year, month)}
    ${generateChartsHTML(charts)}
    ${generateGoalsHTML(summary.goalsProgress)}
    
    <div class="report-footer">
        <p><small>Report generated on ${new Date().toLocaleDateString()}</small></p>
    </div>
</body>
</html>
    `;
}

/**
 * Generates CSV data for export
 */
function generateCSVReport(pet, year, month, summary, calendars, charts) {
    const monthStr = month.toString().padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;
    const monthExercises = (pet.exerciseEntries || []).filter(entry => 
        entry.date && entry.date.startsWith(targetMonthPrefix)
    );
    
    let csv = 'Pet Exercise Report - Data Export\n';
    csv += `Pet: ${pet.petDetails.name}\n`;
    csv += `Period: ${year}-${monthStr}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    // Summary Section
    csv += 'SUMMARY STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Exercises,${summary.totalExercises}\n`;
    csv += `Total Duration (min),${summary.totalDuration}\n`;
    csv += `Total Calories,${summary.totalCalories}\n`;
    csv += `Average Duration,${summary.averageDuration}\n`;
    csv += `Favorite Exercise,${summary.favoriteExercise}\n`;
    csv += `Exercise Days,${summary.exerciseDays}\n`;
    csv += `Average Mood,${summary.averageMood}\n`;
    csv += `Mood Trend,${summary.moodTrend}\n\n`;
    
    // Exercise Data
    csv += 'EXERCISE DETAILS\n';
    csv += 'Date,Exercise Type,Duration (min),Calories,Intensity,Notes\n';
    monthExercises.forEach(entry => {
        csv += `"${entry.date}","${entry.exerciseType}",${entry.duration},${entry.caloriesBurned},"${entry.intensity}","${entry.notes || ''}"\n`;
    });
    
    csv += '\n';
    
    // Chart Data (for recreating charts)
    csv += 'CHART DATA - Weekly Summary\n';
    csv += 'Week,Duration (min),Calories\n';
    charts.durationData.labels.forEach((label, index) => {
        csv += `"${label}",${charts.durationData.datasets[0].data[index]},${charts.caloriesData.datasets[0].data[index]}\n`;
    });
    
    csv += '\n';
    csv += 'CHART DATA - Intensity Distribution\n';
    csv += 'Intensity,Count\n';
    charts.intensityData.labels.forEach((label, index) => {
        csv += `"${label}",${charts.intensityData.datasets[0].data[index]}\n`;
    });
    
    return csv;
}

/**
 * Helper: Generates pet details HTML section
 */
function generatePetDetailsHTML(petDetails) {
    return `
    <div class="pet-details">
        <h3>Pet Details</h3>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Name</div>
                <div class="stat-text">${petDetails.name || 'Unknown'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Age</div>
                <div class="stat-text">${petDetails.age || 'Unknown'} years</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Weight</div>
                <div class="stat-text">${petDetails.weight || 'Unknown'} lbs</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Breed</div>
                <div class="stat-text">${petDetails.breed || 'Mixed'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Body Condition</div>
                <div class="stat-text">${getBCSDisplay(petDetails.bcs) || 'Not assessed'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Energy Level</div>
                <div class="stat-text">${petDetails.energyLevel ? petDetails.energyLevel.charAt(0).toUpperCase() + petDetails.energyLevel.slice(1) : 'Not assessed'}</div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Helper: Generates summary HTML section
 */
function generateSummaryHTML(summary) {
    return `
    <div class="summary-section">
        <h3>Monthly Summary</h3>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number">${summary.totalExercises}</div>
                <div class="stat-label">Total Exercises</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${summary.totalDuration}</div>
                <div class="stat-label">Total Minutes</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${summary.totalCalories}</div>
                <div class="stat-label">Total Calories</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${summary.averageDuration}</div>
                <div class="stat-label">Avg Duration</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${summary.exerciseDays}</div>
                <div class="stat-label">Active Days</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${summary.averageMood}</div>
                <div class="stat-label">Avg Mood</div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Helper: Generates calendars HTML section
 */
function generateCalendarsHTML(calendars, year, month) {
    // This would generate the visual calendar grids
    // For now, return placeholder
    return `
    <div class="calendars-section">
        <h3>Monthly Activity</h3>
        <div class="chart-placeholder">
            <p>Exercise Calendar: ${Object.keys(calendars.exercise).length} active days</p>
            <p>Mood Calendar: ${Object.keys(calendars.mood).length} mood entries</p>
            <small>Calendar visualization would appear here in the full implementation</small>
        </div>
    </div>
    `;
}

/**
 * Helper: Generates charts HTML section  
 */
function generateChartsHTML(charts) {
    return `
    <div class="charts-section">
        <h3>Exercise Analysis</h3>
        <div class="chart-placeholder">
            <p>Duration Trend: ${charts.durationData.datasets[0].data.join(', ')} minutes</p>
            <p>Calories Burned: ${charts.caloriesData.datasets[0].data.join(', ')} calories</p>
            <p>Intensity: ${charts.intensityData.labels.map((label, i) => `${label} (${charts.intensityData.datasets[0].data[i]})`).join(', ')}</p>
            <small>Chart visualizations would appear here in the full implementation</small>
        </div>
    </div>
    `;
}

/**
 * Helper: Generates goals HTML section
 */
function generateGoalsHTML(goalsProgress) {
    const status = goalsProgress.goalAchieved ? '✅ Achieved' : '📊 In Progress';
    return `
    <div class="goals-section">
        <h3>Goals Progress</h3>
        <div class="stat-box">
            <div class="stat-number">${goalsProgress.exercisesCompleted}/${goalsProgress.weeklyTarget * 4}</div>
            <div class="stat-label">Monthly Goal Progress</div>
            <div class="stat-text">${status} (${goalsProgress.progressPercent}%)</div>
        </div>
    </div>
    `;
}


// ===============================================
// PET DATA SERVICE - FIXED Firestore implementation
// ===============================================
class PetDataService {
    constructor() {
        this.userId = null;
        this.db = firebase.firestore();
    }
    
    async initialize(userId) {
        this.userId = userId;
        return true;
    }
    
    async savePet(petData) {
        try {
            if (!petData.id) petData.id = 'pet_' + Date.now();
            
            // Get existing pets array first
            const doc = await this.db.collection('petProfiles')
                .doc(this.userId)
                .get();
                
            let petsArray = [];
              if (doc.exists && doc.data().pets) {
             // ENSURE it's always an array
              petsArray = Array.isArray(doc.data().pets) ? doc.data().pets : [];
              }


            // Update or add the pet in the array
            const existingIndex = petsArray.findIndex(p => p.id === petData.id);
            if (existingIndex >= 0) {
                petsArray[existingIndex] = petData; // Update existing
            } else {
                petsArray.push(petData); // Add new
            }

            // Save back as array
            await this.db.collection('petProfiles')
                .doc(this.userId)
                .set({
                    pets: petsArray,  // CORRECT: Saving as array
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            
            this.updateLocalStorage(petData);
            return true;
            
        } catch (error) {
            console.error('Firestore save failed:', error);
            this.updateLocalStorage(petData);
            return false;
        }
    }
    
    async loadUserPets() {
        try {
            const doc = await this.db.collection('petProfiles')
                .doc(this.userId)
                .get();
            
            if (doc.exists) {
                const data = doc.data();
                // Return the array directly - no conversion needed
                const pets = data.pets || [];
                localStorage.setItem('pets', JSON.stringify(pets));
                return pets;
            }
            return [];
            
        } catch (error) {
            console.error('Firestore load failed:', error);
            const pets = JSON.parse(localStorage.getItem('pets') || '[]');
            return pets;
        }
    }
    
    updateLocalStorage(petData) {
        const pets = JSON.parse(localStorage.getItem('pets') || '[]');
        const existingIndex = pets.findIndex(p => p.id === petData.id);
        
        if (existingIndex >= 0) {
            pets[existingIndex] = petData;
        } else {
            pets.push(petData);
        }
        
        localStorage.setItem('pets', JSON.stringify(pets));
    }
}

window.petDataService = new PetDataService();

