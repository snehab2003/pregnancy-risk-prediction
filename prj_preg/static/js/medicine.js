// Check authentication
const user = checkAuth();

// Show/hide weekly day selection
document.getElementById('medicineFrequency').addEventListener('change', (e) => {
    const weeklyDayGroup = document.getElementById('weeklyDayGroup');
    if (e.target.value === 'weekly') {
        weeklyDayGroup.style.display = 'block';
    } else {
        weeklyDayGroup.style.display = 'none';
    }
});

// Add Medicine Form
document.getElementById('addMedicineForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('medicineName').value;
    const time = document.getElementById('medicineTime').value;
    const frequency = document.getElementById('medicineFrequency').value;
    const weeklyDay = document.getElementById('weeklyDay').value;
    const notes = document.getElementById('medicineNotes').value;
    const alarmEnabled = document.getElementById('enableAlarm').checked;
    
    const newMedicine = {
        id: Date.now(),
        name: name,
        time: time,
        frequency: frequency,
        weeklyDay: frequency === 'weekly' ? parseInt(weeklyDay) : null,
        notes: notes,
        alarmEnabled: alarmEnabled,
        createdAt: new Date().toISOString()
    };
    
    const medicines = getMedicines();
    medicines.push(newMedicine);
    saveMedicines(medicines);

    //no of ti
    
    // Reset form
    document.getElementById('addMedicineForm').reset();
    document.getElementById('weeklyDayGroup').style.display = 'none';
    
    // Refresh display
    displayMedicines();
    displayTodaysMedicines();
    
    alert('Medicine added successfully!');
});

// Display Today's Medicines
function displayTodaysMedicines() {
    const medicines = getMedicines();
    const container = document.getElementById('todaysMedicinesContainer');
    const today = new Date();
    const currentDay = today.getDay();
    
    // Get today's date string
    const todayStr = today.toDateString();
    
    // Get taken medicines for today
    const takenToday = JSON.parse(localStorage.getItem('takenMedicines') || '{}');
    const takenTodayList = takenToday[todayStr] || [];
    
    // Filter medicines for today
    const todaysMedicines = medicines.filter(med => {
        if (med.frequency === 'daily') return true;
        if (med.frequency === 'weekly' && med.weeklyDay === currentDay) return true;
        return false;
    });
    
    if (todaysMedicines.length === 0) {
        container.innerHTML = '<div class="no-medicines-today">No medicines scheduled for today</div>';
        return;
    }
    
    // Sort by time
    todaysMedicines.sort((a, b) => a.time.localeCompare(b.time));
    
    container.innerHTML = todaysMedicines.map(med => {
        const isTaken = takenTodayList.includes(med.id);
        return `
            <div class="today-medicine-card">
                <div class="today-medicine-info">
                    <div class="today-medicine-name">${med.name}</div>
                    <div class="today-medicine-time">⏰ ${formatTime(med.time)}</div>
                    ${med.notes ? `<div class="today-medicine-notes">${med.notes}</div>` : ''}
                </div>
                <button class="medicine-taken-btn ${isTaken ? 'taken' : ''}" 
                        onclick="markAsTaken(${med.id})"
                        ${isTaken ? 'disabled' : ''}>
                    ${isTaken ? '✓ Taken' : 'Mark as Taken'}
                </button>
            </div>
        `;
    }).join('');
}

// Mark medicine as taken
function markAsTaken(medicineId) {
    const todayStr = new Date().toDateString();
    const takenMedicines = JSON.parse(localStorage.getItem('takenMedicines') || '{}');
    
    if (!takenMedicines[todayStr]) {
        takenMedicines[todayStr] = [];
    }
    
    if (!takenMedicines[todayStr].includes(medicineId)) {
        takenMedicines[todayStr].push(medicineId);
        localStorage.setItem('takenMedicines', JSON.stringify(takenMedicines));
        displayTodaysMedicines();
    }
}

// Display All Medicines
function displayMedicines() {
    const medicines = getMedicines();
    const container = document.getElementById('medicinesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (medicines.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    container.innerHTML = medicines.map(med => `
        <div class="medicine-card">
            <div class="medicine-header">
                <div class="medicine-title">
                    <div class="medicine-name">${med.name}</div>
                </div>
            </div>
            <div class="medicine-details">
                <div class="medicine-detail-item">
                    <span class="medicine-detail-icon">⏰</span>
                    <span>${formatTime(med.time)}</span>
                </div>
                <div class="medicine-detail-item">
                    <span class="medicine-frequency-badge ${med.frequency}">
                        ${med.frequency.charAt(0).toUpperCase() + med.frequency.slice(1)}
                    </span>
                </div>
                ${med.frequency === 'weekly' ? `
                    <div class="medicine-detail-item">
                        <span class="medicine-detail-icon">📅</span>
                        <span>${dayNames[med.weeklyDay]}</span>
                    </div>
                ` : ''}
            </div>
            ${med.notes ? `
                <div class="medicine-notes">
                    <strong>Note:</strong> ${med.notes}
                </div>
            ` : ''}
            <div class="medicine-alarm-status">
                ${med.alarmEnabled ? '🔔 Alarm Enabled' : '🔕 Alarm Disabled'}
            </div>
            <div class="medicine-actions">
                <button class="btn-edit" onclick="editMedicine(${med.id})">Edit</button>
                <button class="btn-delete-medicine" onclick="deleteMedicine(${med.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Format time to 12-hour format
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Edit Medicine
function editMedicine(medicineId) {
    const medicines = getMedicines();
    const medicine = medicines.find(m => m.id === medicineId);
    
    if (!medicine) return;
    
    // Fill form with medicine data
    document.getElementById('medicineName').value = medicine.name;
    document.getElementById('medicineTime').value = medicine.time;
    document.getElementById('medicineFrequency').value = medicine.frequency;
    document.getElementById('medicineNotes').value = medicine.notes || '';
    document.getElementById('enableAlarm').checked = medicine.alarmEnabled;
    
    if (medicine.frequency === 'weekly') {
        document.getElementById('weeklyDayGroup').style.display = 'block';
        document.getElementById('weeklyDay').value = medicine.weeklyDay;
    }
    
    // Delete the old medicine
    deleteMedicine(medicineId, false);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Medicine
function deleteMedicine(medicineId, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this medicine?')) {
        return;
    }
    
    const medicines = getMedicines();
    const updatedMedicines = medicines.filter(m => m.id !== medicineId);
    saveMedicines(updatedMedicines);
    displayMedicines();
    displayTodaysMedicines();
}

// Initialize display
displayMedicines();
displayTodaysMedicines();

// Refresh today's medicines every minute to update upcoming alerts
setInterval(() => {
    displayTodaysMedicines();
}, 60000);
