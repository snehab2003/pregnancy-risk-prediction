// Check authentication (client-side guard is no longer required because
// Django views redirect unauthenticated users.  We keep the function so
// other scripts can still call it without crashing.
// authentication handled by Django views; this stub remains for any legacy usage
function checkAuth() {
    return {};
}

// Initialize health data if not exists
function initHealthData() {
    if (!localStorage.getItem('healthData')) {
        const defaultData = {
        bloodPressureSys: [],
        bloodPressureDia: [],
        bloodSugar: [],
        bodyTemp: [],
        heartRate: []
    };

        localStorage.setItem('healthData', JSON.stringify(defaultData));
    }
}

// Get health data
function getHealthData() {
    return JSON.parse(localStorage.getItem('healthData') || '{"systolicBP":[],"diastolicBP":[],"bloodSugar":[],"bodyTemperature":[],"heartRate":[]}');
}

// Save health data
function saveHealthData(data) {
    localStorage.setItem('healthData', JSON.stringify(data));
}

// Combine health data for charts
function createCombinedChart(canvasId) {
    const healthData = getHealthData();

    healthData.bloodPressureSys = healthData.bloodPressureSys || [];
    healthData.bloodPressureDia = healthData.bloodPressureDia || [];
    healthData.bloodSugar = healthData.bloodSugar || [];
    healthData.bodyTemp = healthData.bodyTemp || [];
    healthData.heartRate = healthData.heartRate || [];

    const dates = [];
    const bloodPressureSysData = [];
    const bloodPressureDiaData = [];
    const bloodSugarData = [];
    const bodyTempData = [];
    const heartRateData = [];

    const allDates = [...new Set([
        ...healthData.bloodPressureSys.map(d => d.date),
        ...healthData.bloodPressureDia.map(d => d.date),
        ...healthData.bloodSugar.map(d => d.date),
        ...healthData.bodyTemp.map(d => d.date),
        ...healthData.heartRate.map(d => d.date)
    ])].sort().slice(-14);

    allDates.forEach(date => {
        dates.push(formatDate(date));

        const bpSys = healthData.bloodPressureSys.find(d => d.date === date);
        bloodPressureSysData.push(bpSys ? bpSys.value : null);

        const bpDia = healthData.bloodPressureDia.find(d => d.date === date);
        bloodPressureDiaData.push(bpDia ? bpDia.value : null);

        const bs = healthData.bloodSugar.find(d => d.date === date);
        bloodSugarData.push(bs ? bs.value : null);

        const bt = healthData.bodyTemp.find(d => d.date === date);
        bodyTempData.push(bt ? bt.value : null);

        const hr = healthData.heartRate.find(d => d.date === date);
        heartRateData.push(hr ? hr.value : null);
    });

    const ctx = document.getElementById(canvasId).getContext('2d');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'Sys BP', data: bloodPressureSysData },
                { label: 'Dia BP', data: bloodPressureDiaData },
                { label: 'Sugar', data: bloodSugarData },
                { label: 'Temp', data: bodyTempData },
                { label: 'Heart', data: heartRateData }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}


// Initialize goals if not exists
function initGoals() {
    if (!localStorage.getItem('goals')) {
        const defaultGoals = [];
        localStorage.setItem('goals', JSON.stringify(defaultGoals));
    }
    if (!localStorage.getItem('sleepData')) {
        localStorage.setItem('sleepData', JSON.stringify([]));
    }
    if (!localStorage.getItem('waterData')) {
        localStorage.setItem('waterData', JSON.stringify([]));
    }
}

// Get goals
function getGoals() {
    return JSON.parse(localStorage.getItem('goals') || '[]');
}

// Save goals
function saveGoals(goals) {
    localStorage.setItem('goals', JSON.stringify(goals));
}

// Get sleep data
function getSleepData() {
    return JSON.parse(localStorage.getItem('sleepData') || '[]');
}

// Get water data
function getWaterData() {
    return JSON.parse(localStorage.getItem('waterData') || '[]');
}

// Initialize medicines if not exists
function initMedicines() {
    if (!localStorage.getItem('medicines')) {
        const defaultMedicines = [];
        localStorage.setItem('medicines', JSON.stringify(defaultMedicines));
    }
}

// Get medicines
function getMedicines() {
    return JSON.parse(localStorage.getItem('medicines') || '[]');
}

// Save medicines
function saveMedicines(medicines) {
    localStorage.setItem('medicines', JSON.stringify(medicines));
}

// Get current mood
function getCurrentMood() {
    const today = new Date().toDateString();
    const moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
    return moodData[today];
}

// Save mood
function saveMood(mood, emoji) {
    const today = new Date().toDateString();
    const moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
    moodData[today] = { mood, emoji, timestamp: new Date().toISOString() };
    localStorage.setItem('moodData', JSON.stringify(moodData));
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calculate average
function calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, item) => acc + parseFloat(item.value || 0), 0);
    return (sum / arr.length).toFixed(1);
}
function getLatestByDate(arr) {
    if (!arr || arr.length === 0) return null;

    const sorted = [...arr].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    return sorted[0];
}


// Profile modal functionality
function initProfileModal() {
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfile = document.getElementById('closeProfile');
    const blurOverlay = document.getElementById('blurOverlay');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profilePicInput = document.getElementById('profilePicInput');
    const removePicBtn = document.getElementById('removePicBtn');
    const removePicInput = document.getElementById('removePic');

    if (!profileBtn) return;

    // Input fields are pre-populated by template context; no client-side loading needed
    // Logout and delete URLs are stored in data attributes on buttons if present

    // Open modal
    profileBtn.addEventListener('click', () => {
        profileModal.classList.add('active');
        blurOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeProfile.addEventListener('click', closeModal);
    blurOverlay.addEventListener('click', closeModal);

    function closeModal() {
        profileModal.classList.remove('active');
        blurOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Profile picture upload
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // when user selects new file we should clear any removal flag
            if (removePicInput) removePicInput.value = '0';
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profilePicDisplay').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove/cancel picture
    if (removePicBtn) {
        removePicBtn.addEventListener('click', () => {
            document.getElementById('profilePicDisplay').src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='50' cy='50' r='50' fill='%23667eea'/><text x='50' y='60' font-size='40' fill='white' text-anchor='middle'>👤</text></svg>";
            if (removePicInput) removePicInput.value = '1';
            // clear file input if any
            if (profilePicInput) profilePicInput.value = '';
        });
    }

    // Save button should submit the surrounding form
    saveProfileBtn.addEventListener('click', () => {
        const form = document.querySelector('#profileModal form');
        if (form) {
            form.submit();
        }
    });

    // Delete account (not implemented server-side yet)
    deleteAccountBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // future implementation: call endpoint to remove account
            alert('Account deletion is not available at this time.');
        }
    });

    // Logout button will redirect to server logout URL if provided
    logoutBtn.addEventListener('click', () => {
        const url = logoutBtn.dataset.logoutUrl || '/logout/';
        window.location.href = url;
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initHealthData();
    initGoals();
    initMedicines();
    initProfileModal();
});
