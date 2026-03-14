// Check authentication
const user = checkAuth();

// Set today's date as default
document.getElementById('sleepDate').valueAsDate = new Date();
document.getElementById('waterDate').valueAsDate = new Date();

// Category change handler
document.getElementById('goalCategory').addEventListener('change', (e) => {
    const customGoalGroup = document.getElementById('customGoalGroup');
    if (e.target.value === 'other') {
        customGoalGroup.style.display = 'block';
        document.getElementById('customGoalName').required = true;
    } else {
        customGoalGroup.style.display = 'none';
        document.getElementById('customGoalName').required = false;
    }
});

// Add Goal Form
document.getElementById('addGoalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const category = document.getElementById('goalCategory').value;
    const customName = document.getElementById('customGoalName').value;
    const description = document.getElementById('goalDescription').value;
    const target = document.getElementById('goalTarget').value;
    
    const goalName = category === 'other' ? customName : category.charAt(0).toUpperCase() + category.slice(1);
    
    const newGoal = {
        id: Date.now(),
        category: category,
        name: goalName,
        description: description,
        target: target,
        progress: 0,
        createdAt: new Date().toISOString(),
        completedDays: 0
    };
    
    const goals = getGoals();
    goals.push(newGoal);
    saveGoals(goals);
    
    // Reset form
    document.getElementById('addGoalForm').reset();
    document.getElementById('customGoalGroup').style.display = 'none';
    
    // Refresh display
    displayGoals();
    updateSummary();
});

// Display Goals
function displayGoals() {
    const goals = getGoals();
    const container = document.getElementById('goalsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (goals.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = goals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <div class="goal-title">
                    <span class="goal-category ${goal.category}">${goal.category}</span>
                    <h4 class="goal-name">${goal.name}</h4>
                </div>
            </div>
            <p class="goal-description">${goal.description}</p>
            <div class="goal-target">
                <span>🎯</span>
                <span>Target: ${goal.target}</span>
            </div>
            <div class="goal-progress-section">
                <div class="progress-header">
                    <span>Progress</span>
                    <span>${goal.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn-update" onclick="updateGoalProgress(${goal.id})">Update Progress</button>
                <button class="btn-delete" onclick="deleteGoal(${goal.id})">Delete Goal</button>
            </div>
        </div>
    `).join('');
}

// Update Goal Progress
function updateGoalProgress(goalId) {
    const goals = getGoals();
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) return;
    
    const newProgress = prompt(`Current progress: ${goal.progress}%\n\nEnter new progress (0-100):`, goal.progress);
    
    if (newProgress !== null) {
        const progress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
        goal.progress = progress;
        saveGoals(goals);
        displayGoals();
        updateSummary();
    }
}

// Delete Goal
function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    const goals = getGoals();
    const updatedGoals = goals.filter(g => g.id !== goalId);
    saveGoals(updatedGoals);
    displayGoals();
    updateSummary();
}

// Update Summary
function updateSummary() {
    const goals = getGoals();
    
    document.getElementById('totalGoals').textContent = goals.length;
    
    const completed = goals.filter(g => g.progress === 100).length;
    document.getElementById('completedGoals').textContent = completed;
    
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;
    document.getElementById('avgProgress').textContent = avgProgress + '%';
}

// Sleep Tracker
document.getElementById('addSleepBtn').addEventListener('click', () => {
    const hours = document.getElementById('sleepHours').value;
    const date = document.getElementById('sleepDate').value;
    
    if (!hours || !date) {
        alert('Please enter sleep hours and date');
        return;
    }
    
    const sleepData = getSleepData();
    
    // Check if entry for this date already exists
    const existingIndex = sleepData.findIndex(s => s.date === date);
    
    if (existingIndex >= 0) {
        if (confirm('Entry for this date already exists. Update it?')) {
            sleepData[existingIndex].hours = parseFloat(hours);
        } else {
            return;
        }
    } else {
        sleepData.push({
            date: date,
            hours: parseFloat(hours),
            timestamp: new Date().toISOString()
        });
    }
    
    localStorage.setItem('sleepData', JSON.stringify(sleepData));
    
    // Reset form
    document.getElementById('sleepHours').value = '';
    document.getElementById('sleepDate').valueAsDate = new Date();
    
    displaySleepHistory();
});

// Display Sleep History
function displaySleepHistory() {
    const sleepData = getSleepData();
    const container = document.getElementById('sleepHistory');
    
    if (sleepData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No sleep data logged yet</p>';
        return;
    }
    
    // Sort by date descending
    const sorted = sleepData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sorted.slice(0, 7).map((entry, index) => `
        <div class="history-item">
            <span class="history-date">${formatDate(entry.date)}</span>
            <span class="history-value">${entry.hours} hrs</span>
            <button class="history-delete" onclick="deleteSleepEntry('${entry.date}')">Delete</button>
        </div>
    `).join('');
}

// Delete Sleep Entry
function deleteSleepEntry(date) {
    const sleepData = getSleepData();
    const updated = sleepData.filter(s => s.date !== date);
    localStorage.setItem('sleepData', JSON.stringify(updated));
    displaySleepHistory();
}

// Water Tracker
document.getElementById('addWaterBtn').addEventListener('click', () => {
    const liters = document.getElementById('waterLiters').value;
    const date = document.getElementById('waterDate').value;
    
    if (!liters || !date) {
        alert('Please enter water intake and date');
        return;
    }
    
    const waterData = getWaterData();
    
    // Check if entry for this date already exists
    const existingIndex = waterData.findIndex(w => w.date === date);
    
    if (existingIndex >= 0) {
        if (confirm('Entry for this date already exists. Update it?')) {
            waterData[existingIndex].liters = parseFloat(liters);
        } else {
            return;
        }
    } else {
        waterData.push({
            date: date,
            liters: parseFloat(liters),
            timestamp: new Date().toISOString()
        });
    }
    
    localStorage.setItem('waterData', JSON.stringify(waterData));
    
    // Reset form
    document.getElementById('waterLiters').value = '';
    document.getElementById('waterDate').valueAsDate = new Date();
    
    displayWaterHistory();
});

// Display Water History
function displayWaterHistory() {
    const waterData = getWaterData();
    const container = document.getElementById('waterHistory');
    
    if (waterData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No water data logged yet</p>';
        return;
    }
    
    // Sort by date descending
    const sorted = waterData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sorted.slice(0, 7).map(entry => `
        <div class="history-item">
            <span class="history-date">${formatDate(entry.date)}</span>
            <span class="history-value">${entry.liters} L</span>
            <button class="history-delete" onclick="deleteWaterEntry('${entry.date}')">Delete</button>
        </div>
    `).join('');
}

// Delete Water Entry
function deleteWaterEntry(date) {
    const waterData = getWaterData();
    const updated = waterData.filter(w => w.date !== date);
    localStorage.setItem('waterData', JSON.stringify(updated));
    displayWaterHistory();
}

// Alarm Settings
document.getElementById('sleepAlarm').addEventListener('change', (e) => {
    localStorage.setItem('sleepAlarmEnabled', e.target.checked);
});

document.getElementById('waterAlarm').addEventListener('change', (e) => {
    localStorage.setItem('waterAlarmEnabled', e.target.checked);
});

// Load alarm settings
const sleepAlarmEnabled = localStorage.getItem('sleepAlarmEnabled');
if (sleepAlarmEnabled !== null) {
    document.getElementById('sleepAlarm').checked = sleepAlarmEnabled === 'true';
}

const waterAlarmEnabled = localStorage.getItem('waterAlarmEnabled');
if (waterAlarmEnabled !== null) {
    document.getElementById('waterAlarm').checked = waterAlarmEnabled === 'true';
}

// Initialize display
displayGoals();
updateSummary();
displaySleepHistory();
displayWaterHistory();
