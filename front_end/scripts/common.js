// Check authentication
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('babyBloomUser'));
    if (!user || !user.isLoggedIn) {
        window.location.href = 'index.html';
    }
    return user;
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

    if (!profileBtn) return;

    // Load user data
    const user = checkAuth();
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileTrimester').value = user.trimester || '1';
    document.getElementById('profileDueDate').value = user.dueDate || '';

    // Load profile picture
    if (user.profilePic) {
        document.getElementById('profilePicDisplay').src = user.profilePic;
    }

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
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profilePicDisplay').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Save profile
    saveProfileBtn.addEventListener('click', () => {
        const updatedUser = {
            ...user,
            name: document.getElementById('profileName').value,
            trimester: document.getElementById('profileTrimester').value,
            dueDate: document.getElementById('profileDueDate').value,
            profilePic: document.getElementById('profilePicDisplay').src
        };
        localStorage.setItem('babyBloomUser', JSON.stringify(updatedUser));
        alert('Profile updated successfully!');
        closeModal();
    });

    // Delete account
    deleteAccountBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('babyBloomUser');
        window.location.href = 'index.html';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initHealthData();
    initGoals();
    initMedicines();
    initProfileModal();
});
