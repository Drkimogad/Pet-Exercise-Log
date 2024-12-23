// Handle Form Submission
document.getElementById('exerciseForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value;
    const petCharacteristics = document.getElementById('petCharacteristics').value;
    const exerciseType = document.getElementById('exerciseType').value;
    const exerciseDuration = document.getElementById('exerciseDuration').value;

    if (!petName || !petCharacteristics || !exerciseType || exerciseDuration <= 0) {
        alert('Please fill in all fields with valid data.');
        return;
    }

    const timestamp = new Date().toISOString();
    const exerciseData = { petName, petCharacteristics, exerciseType, exerciseDuration, timestamp };

    let exercises = localStorage.getItem('exercises');
    exercises = exercises ? JSON.parse(exercises) : [];
    exercises.push(exerciseData);
    localStorage.setItem('exercises', JSON.stringify(exercises));

    document.getElementById('exerciseForm').reset();
    displayExercises();
});

// Display Saved Exercises
function displayExercises() {
    const exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    let exercises = localStorage.getItem('exercises');
    exercises = exercises ? JSON.parse(exercises) : [];

    exercises.forEach((exercise, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${exercise.petName} - ${exercise.exerciseType} for ${exercise.exerciseDuration} minutes. (${exercise.petCharacteristics})`;

        // Edit, Print, Delete buttons
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function() {
            // Edit functionality to be added
        });

        const printButton = document.createElement('button');
        printButton.textContent = 'Print';
        printButton.addEventListener('click', function() {
            window.print();
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            exercises.splice(index, 1);
            localStorage.setItem('exercises', JSON.stringify(exercises));
            displayExercises();
        });

        li.appendChild(editButton);
        li.appendChild(printButton);
        li.appendChild(deleteButton);
        exerciseList.appendChild(li);
    });
}

// Generate Calendar for Exercise Tracking
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const daysInMonth = 30; // Simplified for demo purposes
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = i;
        dayDiv.className = 'calendar-day';
        dayDiv.addEventListener('click', function() {
            dayDiv.classList.toggle('selected');
        });
        calendar.appendChild(dayDiv);
    }
}

// Generate Graph for Exercise Data
function generateGraph() {
    const ctx = document.getElementById('exerciseGraph').getContext('2d');
    const exercises = localStorage.getItem('exercises');
    const exerciseData = exercises ? JSON.parse(exercises) : [];
    const exerciseCategories = ['Idle', 'Semi Active', 'Active', 'Over Exercised'];
    const exerciseDurations = exerciseCategories.map(() => 0);

    exerciseData.forEach(exercise => {
        if (exercise.exerciseDuration <= 10) {
            exerciseDurations[0] += exercise.exerciseDuration;
        } else if (exercise.exerciseDuration <= 30) {
            exerciseDurations[1] += exercise.exerciseDuration;
        } else if (exercise.exerciseDuration <= 60) {
            exerciseDurations[2] += exercise.exerciseDuration;
        } else {
            exerciseDurations[3] += exercise.exerciseDuration;
        }
    });

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: exerciseCategories,
            datasets: [{
                label: 'Exercise Duration (minutes)',
                data: exerciseDurations,
                backgroundColor: '#FFA500', // Orange
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    displayExercises();
    generateCalendar();
    generateGraph();
});
