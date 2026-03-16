// Check authentication
const user = checkAuth();

// Chart instances
let bloodSugarChartInstance = null;
let bloodPressureSysChartInstance = null;
let bloodPressureDiaChartInstance = null;
let heartRateChartInstance = null;
let bodyTempChartInstance = null;
let combinedChartInstance = null;
let editingEntryId = null;



// Modal functions
const healthModal = document.getElementById('healthModal');
const closeHealthModal = document.getElementById('closeHealthModal');
const blurOverlay = document.getElementById('blurOverlay');

function openHealthModal(type) {
    document.getElementById('dataType').value = type;
    
    // Hide all relevant modal fields (safe if some IDs are absent)
    const hideIfExists = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
    hideIfExists('systolicField');
    hideIfExists('diastolicField');
    hideIfExists('bloodSugarField');
    hideIfExists('bodyTempField');
    hideIfExists('heartRateField');

    // Show relevant field and update title
    let title = '';
    switch(type) {
        case 'bloodPressureSys':
            if (document.getElementById('systolicField')) document.getElementById('systolicField').style.display = 'block';
            if (document.getElementById('systolicValue')) document.getElementById('systolicValue').required = true;
            title = 'Add Systolic Blood Pressure Data';
            break;
        case 'bloodPressureDia':
            if (document.getElementById('diastolicField')) document.getElementById('diastolicField').style.display = 'block';
            if (document.getElementById('diastolicValue')) document.getElementById('diastolicValue').required = true;
            title = 'Add Diastolic Blood Pressure Data';
            break;
        case 'bloodSugar':
            if (document.getElementById('bloodSugarField')) document.getElementById('bloodSugarField').style.display = 'block';
            if (document.getElementById('bloodSugarValue')) document.getElementById('bloodSugarValue').required = true;
            title = 'Add Blood Sugar Data';
            break;
        case 'bodyTemp':
            if (document.getElementById('bodyTempField')) document.getElementById('bodyTempField').style.display = 'block';
            if (document.getElementById('bodyTempValue')) document.getElementById('bodyTempValue').required = true;
            title = 'Add Body Temperature Data';
            break;
        case 'heartRate':
            if (document.getElementById('heartRateField')) document.getElementById('heartRateField').style.display = 'block';
            if (document.getElementById('heartRateValue')) document.getElementById('heartRateValue').required = true;
            title = 'Add Heart Rate Data';
            break;
        default:
            title = 'Add Health Data';
    }
    
    document.getElementById('modalTitle').textContent = title;
    healthModal.classList.add('active');
    blurOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHealthModalFunc() {
    healthModal.classList.remove('active');
    blurOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('healthDataForm').reset();
    document.getElementById('dataDate').valueAsDate = new Date();
}

closeHealthModal.addEventListener('click', closeHealthModalFunc);
blurOverlay.addEventListener('click', (e) => {
    if (e.target === blurOverlay) {
        closeHealthModalFunc();
        const profileModal = document.getElementById('profileModal');
        if (profileModal.classList.contains('active')) {
            profileModal.classList.remove('active');
        }
    }
});

// Health Data Form Submission
document.getElementById('healthDataForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('dataType').value;
    const date = document.getElementById('dataDate').value;
    
    // Prepare data for backend
    const healthData = {
        date: date
    };
    
    // Add the specific metric based on type
    switch(type) {
        case 'bloodPressureSys':
            healthData.systolic_bp = parseInt(document.getElementById('systolicValue').value);
            break;
        case 'bloodPressureDia':
            healthData.diastolic_bp = parseInt(document.getElementById('diastolicValue').value);
            break;
        case 'bloodSugar':
            healthData.blood_sugar = parseFloat(document.getElementById('bloodSugarValue').value);
            break;
        case 'bodyTemp':
            healthData.body_temp = parseFloat(document.getElementById('bodyTempValue').value);
            break;
        case 'heartRate':
            healthData.heart_rate = parseInt(document.getElementById('heartRateValue').value);
            break;
    }
    
    try {
        // Save to backend
        const response = await fetch('/api/save-health-data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(healthData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save health data');
        }
        
        // Update local data and UI
        await loadHealthDataFromBackend();
        
        updateMetricSummaries();
        updateAllCharts();
        renderHealthEntries();
        
        closeHealthModalFunc();
        alert('Health data saved successfully!');
        
    } catch (error) {
        console.error('Error saving health data:', error);
        alert('Failed to save health data: ' + error.message);
    }
});

// Helper function - put this near calculateAverage
function getLatestByDate(arr) {
    if (!arr || arr.length === 0) return null;

    return arr.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
}

// Update Metric Summaries
function updateMetricSummaries() {
    const healthData = getHealthData();
    
    // Systolic
    if (healthData.bloodPressureSys.length > 0) {
        const latestSys = getLatestByDate(healthData.bloodPressureSys);
        const avgSys = calculateAverage(healthData.bloodPressureSys);

        document.getElementById('bloodPressureSysCurrent').textContent =
            latestSys ? latestSys.value : 'N/A';

        document.getElementById('bloodPressureSysAvg').textContent =
            avgSys || 'N/A';
    }

    // Diastolic
    if (healthData.bloodPressureDia.length > 0) {
        const latestDia = getLatestByDate(healthData.bloodPressureDia);
        const avgDia = calculateAverage(healthData.bloodPressureDia);

        document.getElementById('bloodPressureDiaCurrent').textContent =
            latestDia ? latestDia.value : 'N/A';

        document.getElementById('bloodPressureDiaAvg').textContent =
            avgDia || 'N/A';
    }

    // Blood Sugar
    if (healthData.bloodSugar.length > 0) {
        const latest = healthData.bloodSugar[healthData.bloodSugar.length - 1];
        document.getElementById('bloodSugarCurrent').textContent = latest.value;
        const avg = calculateAverage(healthData.bloodSugar);
        document.getElementById('bloodSugarAvg').textContent = avg;
    }
    
    // Body Temperature
    if (healthData.bodyTemp && healthData.bodyTemp.length > 0) {
        const latest = healthData.bodyTemp[healthData.bodyTemp.length - 1];
        const elCurrent = document.getElementById('bodyTempCurrent');
        if (elCurrent) elCurrent.textContent = latest.value;
        const avg = calculateAverage(healthData.bodyTemp);
        const elAvg = document.getElementById('bodyTempAvg');
        if (elAvg) elAvg.textContent = avg;
    }
    
    // Heart Rate
    if (healthData.heartRate.length > 0) {
        const latest = healthData.heartRate[healthData.heartRate.length - 1];
        document.getElementById('heartRateCurrent').textContent = latest.value;
        const avg = calculateAverage(healthData.heartRate);
        document.getElementById('heartRateAvg').textContent = avg;
    }
}

// Create Individual Charts
function createIndividualCharts() {
    const healthData = getHealthData();

    healthData.bloodPressureSys = healthData.bloodPressureSys || [];
    healthData.bloodPressureDia = healthData.bloodPressureDia || [];
    healthData.bloodSugar = healthData.bloodSugar || [];
    healthData.bodyTemp = healthData.bodyTemp || [];
    healthData.heartRate = healthData.heartRate || [];
    
        // Blood Pressure Systolic Chart
    const bpsCtx = document.getElementById('bloodPressureSysChart').getContext('2d');
    const bpsData = [...healthData.bloodPressureSys]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

    if (bloodPressureSysChartInstance) bloodPressureSysChartInstance.destroy();
    bloodPressureSysChartInstance = new Chart(bpsCtx, {
        type: 'line',
        data: {
            labels: bpsData.map(d => formatDate(d.date)),
            datasets: [{
                data: bpsData.map(d => d.value),
                borderColor: '#f093fb',
                backgroundColor: 'rgba(240, 147, 251, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
    
    // Blood Pressure Diastolic Chart
    const bpdCtx = document.getElementById('bloodPressureDiaChart').getContext('2d');
    const bpdData = [...healthData.bloodPressureDia]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);
    if (bloodPressureDiaChartInstance) bloodPressureDiaChartInstance.destroy();
    bloodPressureDiaChartInstance = new Chart(bpdCtx, {
        type: 'line',
        data: {
            labels: bpdData.map(d => formatDate(d.date)),
            datasets: [{
                data: bpdData.map(d => d.value),
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });

    // Heart Rate Chart
    const hrCtx = document.getElementById('heartRateChart').getContext('2d');
    const hrData = [...healthData.heartRate]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);
    if (heartRateChartInstance) heartRateChartInstance.destroy();
    heartRateChartInstance = new Chart(hrCtx, {
        type: 'line',
        data: {
            labels: hrData.map(d => formatDate(d.date)),
            datasets: [{
                data: hrData.map(d => d.value),
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });

    // Blood Sugar Chart
    const bsCtx = document.getElementById('bloodSugarChart').getContext('2d');
    const bsData = [...healthData.bloodSugar]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);
    if (bloodSugarChartInstance) bloodSugarChartInstance.destroy();
    bloodSugarChartInstance = new Chart(bsCtx, {
        type: 'line',
        data: {
            labels: bsData.map(d => formatDate(d.date)),
            datasets: [{
                data: bsData.map(d => d.value),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
    

    // Body Temperature Chart
    const btEl = document.getElementById('bodyTempChart');
    if (btEl) {
        const btCtx = btEl.getContext('2d');
        const btData = [...(healthData.bodyTemp || [])]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);
        if (typeof bodyTempChartInstance !== 'undefined' && bodyTempChartInstance) bodyTempChartInstance.destroy();
        bodyTempChartInstance = new Chart(btCtx, {
            type: 'line',
            data: {
                labels: btData.map(d => formatDate(d.date)),
                datasets: [{
                    data: btData.map(d => d.value),
                    borderColor: '#ffb86b',
                    backgroundColor: 'rgba(255, 184, 107, 0.08)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }
}

function createCombinedChart(canvasId) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // IMPORTANT FIX
    if (combinedChartInstance) {
        combinedChartInstance.destroy();
    }

    const healthData = getHealthData();

    combinedChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Update All Charts
function updateAllCharts() {
    createIndividualCharts();
    createCombinedChart('combinedChart');
}

//render function
function renderHealthEntries() {
    const healthData = getHealthData();

    function renderList(dataArray, containerId, typeKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!dataArray || dataArray.length === 0) {
            container.innerHTML = "<p>No entries yet</p>";
            return;
        }

        container.innerHTML = dataArray.map(entry => `
            <div class="entry-item">
                <span>${entry.date} - ${entry.value}</span>
                <div class="entry-actions">
                    <button class="btn-edit" onclick="editHealthEntry('${typeKey}', ${entry.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteHealthEntry('${typeKey}', ${entry.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderList(healthData.bloodSugar, 'bloodSugarList', 'bloodSugar');
    renderList(healthData.bloodPressureSys, 'bloodPressureSysList', 'bloodPressureSys');
    renderList(healthData.bloodPressureDia, 'bloodPressureDiaList', 'bloodPressureDia');
    renderList(healthData.bodyTemp, 'bodyTempList', 'bodyTemp');
    renderList(healthData.heartRate, 'heartRateList', 'heartRate');
}



//delete function
function deleteHealthEntry(type, id) {
    const healthData = getHealthData();

    healthData[type] = healthData[type].filter(entry => entry.id !== id);

    saveHealthData(healthData);

    renderHealthEntries();
    updateAllCharts();
    updateMetricSummaries();
}

//edit function
function editHealthEntry(type, id) {
    const healthData = getHealthData();
    const entry = healthData[type].find(e => e.id === id);
    if (!entry) return;

    editingEntryId = id; // store id
    openHealthModal(type);

    document.getElementById('dataDate').value = entry.date;

    if (type === 'bloodSugar')
        document.getElementById('bloodSugarValue').value = entry.value;

    if (type === 'bloodPressureSys')
        document.getElementById('systolicValue').value = entry.value;

    if (type === 'bloodPressureDia')
        document.getElementById('diastolicValue').value = entry.value;

    if (type === 'bodyTemp')
        document.getElementById('bodyTempValue').value = entry.value;

    if (type === 'heartRate')
        document.getElementById('heartRateValue').value = entry.value;
}



// Toggle Detailed View
function toggleDetailedView() {
    alert('Detailed view with more metrics and analysis coming soon!');
}

// Check Risk Button
document.getElementById('checkRiskBtn').addEventListener('click', () => {
    const healthData = getHealthData();
    
    if (
    healthData.bloodSugar.length === 0 &&
    healthData.bloodPressureSys.length === 0 &&
    healthData.bloodPressureDia.length === 0 &&
    healthData.bodyTemp.length === 0 &&
    healthData.heartRate.length === 0) {
        alert('Please add health data before checking risk');
        return;
    }

    // Get latest values for prediction
    const latestSys = getLatestByDate(healthData.bloodPressureSys);
    const latestDia = getLatestByDate(healthData.bloodPressureDia);
    const latestBS = getLatestByDate(healthData.bloodSugar);
    const latestTemp = getLatestByDate(healthData.bodyTemp);
    const latestHR = getLatestByDate(healthData.heartRate);
    
    if (!latestSys || !latestDia || !latestBS || !latestTemp || !latestHR) {
        alert('Please ensure you have data for all health metrics');
        return;
    }

    // Get user age from profile
    const age = document.getElementById('profileAge') ? 
        parseInt(document.getElementById('profileAge').value) : null;
    
    if (!age || age < 19) {
        alert('Please update your age in your profile (must be 19 or older)');
        return;
    }

    // Prepare data for API
    const predictionData = {
        age: age,
        systolic_bp: latestSys.value,
        diastolic_bp: latestDia.value,
        blood_sugar: latestBS.value,
        body_temp: latestTemp.value, // Already in Celsius
        heart_rate: latestHR.value
    };

    // Show loading
    const resultDiv = document.getElementById('riskResult');
    resultDiv.innerHTML = '<div class="risk-loading">🤖 Analyzing your health data with AI...</div>';
    resultDiv.classList.add('show');

    // Call the prediction API
    fetch('/api/predict-risk/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(predictionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Display results
        displayRiskResults(data, latestSys, latestDia, latestBS, latestTemp, latestHR);
    })
    .catch(error => {
        console.error('Prediction error:', error);
        resultDiv.innerHTML = `
            <div class="risk-error">
                <h4>❌ Prediction Failed</h4>
                <p>${error.message}</p>
                <p>Please try again or contact support if the problem persists.</p>
            </div>
        `;
    });
});

// Helper function to display risk results
function displayRiskResults(data, latestSys, latestDia, latestBS, latestTemp, latestHR) {
    const resultDiv = document.getElementById('riskResult');
    
    // Determine CSS class based on risk level
    let riskClass = 'low';
    if (data.risk_level === 'HIGH RISK') riskClass = 'high';
    else if (data.risk_level === 'MEDIUM RISK') riskClass = 'medium';
    
    // Generate recommendations based on the actual values
    let recommendations = [];
    let riskFactors = [];
    
    // Blood Pressure Analysis
    if (latestSys.value > 140 || latestDia.value > 90) {
        riskFactors.push('High blood pressure detected');
        recommendations.push('Contact your healthcare provider immediately about elevated blood pressure');
    } else if (latestSys.value < 90 || latestDia.value < 60) {
        riskFactors.push('Low blood pressure detected');
        recommendations.push('Stay hydrated and discuss symptoms with your doctor');
    } else {
        recommendations.push('Blood pressure is within normal range');
    }
    
    // Blood Sugar Analysis
    if (latestBS.value > 140) {
        riskFactors.push('Elevated blood sugar levels detected');
        recommendations.push('Monitor blood sugar closely and consult with your doctor about gestational diabetes');
    } else if (latestBS.value < 70) {
        riskFactors.push('Low blood sugar levels detected');
        recommendations.push('Ensure regular meals and discuss with your healthcare provider');
    } else {
        recommendations.push('Blood sugar levels are within normal range - continue monitoring');
    }
    
    // Body Temperature Analysis
    if (latestTemp.value > 38) {
        riskFactors.push('Elevated body temperature detected');
        recommendations.push('Monitor for signs of infection and contact your healthcare provider');
    } else if (latestTemp.value < 36) {
        riskFactors.push('Lower body temperature than typical for pregnancy');
        recommendations.push('Ensure proper nutrition and discuss with your healthcare provider');
    } else {
        recommendations.push('Body temperature is within expected range for pregnancy');
    }
    
    // Heart Rate Analysis
    if (latestHR.value > 100) {
        riskFactors.push('Elevated heart rate detected');
        recommendations.push('Monitor heart rate and report persistent elevation to your doctor');
    } else if (latestHR.value < 60) {
        riskFactors.push('Lower heart rate than typical for pregnancy');
        recommendations.push('Discuss heart rate with your healthcare provider');
    } else {
        recommendations.push('Heart rate is within expected range for pregnancy');
    }
    
    resultDiv.innerHTML = `
        <div class="risk-level ${riskClass}">
            ${data.risk_level}
        </div>
        <div class="risk-details">
            <h4>AI Prediction Probabilities:</h4>
            <div class="probabilities">
                <div class="prob-bar">
                    <span>Low Risk: ${(data.probabilities.low_risk * 100).toFixed(1)}%</span>
                    <div class="bar" style="width: ${data.probabilities.low_risk * 100}%"></div>
                </div>
                <div class="prob-bar">
                    <span>Medium Risk: ${(data.probabilities.medium_risk * 100).toFixed(1)}%</span>
                    <div class="bar" style="width: ${data.probabilities.medium_risk * 100}%"></div>
                </div>
                <div class="prob-bar">
                    <span>High Risk: ${(data.probabilities.high_risk * 100).toFixed(1)}%</span>
                    <div class="bar" style="width: ${data.probabilities.high_risk * 100}%"></div>
                </div>
            </div>
            
            ${riskFactors.length > 0 ? `
                <h4>Risk Factors Identified:</h4>
                <ul>
                    ${riskFactors.map(f => `<li>${f}</li>`).join('')}
                </ul>
            ` : '<h4>No significant risk factors identified from current metrics</h4>'}
            
            <h4>Recommendations:</h4>
            <ul>
                ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
        <div class="risk-disclaimer">
            <strong>⚠️ Important:</strong> ${data.fallback ? 
                'This assessment uses rule-based analysis due to technical limitations. For full AI-powered predictions, TensorFlow needs to be properly configured.' : 
                'This AI-powered risk assessment uses machine learning trained on maternal health data.'} 
            It is NOT a substitute for professional medical advice. Always consult with your healthcare 
            provider for accurate diagnosis and personalized medical guidance.
        </div>
    `;
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Initialize


// Helper Functions for Health Data Management

// Update local storage after saving to backend
function updateLocalHealthData(type, date, data) {
    const healthData = getHealthData();
    
    // Create entry object
    const entry = {
        id: Date.now(),
        date: date,
        value: null
    };
    
    // Set the value based on type
    switch(type) {
        case 'bloodPressureSys':
            entry.value = data.systolic_bp;
            healthData.bloodPressureSys.push(entry);
            break;
        case 'bloodPressureDia':
            entry.value = data.diastolic_bp;
            healthData.bloodPressureDia.push(entry);
            break;
        case 'bloodSugar':
            entry.value = data.blood_sugar;
            healthData.bloodSugar.push(entry);
            break;
        case 'bodyTemp':
            entry.value = data.body_temp;
            if (!healthData.bodyTemp) healthData.bodyTemp = [];
            healthData.bodyTemp.push(entry);
            break;
        case 'heartRate':
            entry.value = data.heart_rate;
            healthData.heartRate.push(entry);
            break;
    }
    
    saveHealthData(healthData);
}

// Load health data from backend and merge with local data
async function loadHealthDataFromBackend() {
    try {
        const response = await fetch('/api/get-health-data/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (response.ok) {
            const backendData = await response.json();
            mergeBackendData(backendData);
        }
    } catch (error) {
        console.log('Could not load backend data, using local data only:', error);
    }
}

// Merge backend data with local data
function mergeBackendData(backendData) {
    const newLocalData = {
        bloodPressureSys: [],
        bloodPressureDia: [],
        bloodSugar: [],
        bodyTemp: [],
        heartRate: []
    };
    
    backendData.forEach(item => {
        const dateStr = item.date;
        
        if (item.systolic_bp !== null) {
            newLocalData.bloodPressureSys.push({
                id: Date.now() + Math.random(),
                date: dateStr,
                value: parseInt(item.systolic_bp)
            });
        }
        
        if (item.diastolic_bp !== null) {
            newLocalData.bloodPressureDia.push({
                id: Date.now() + Math.random(),
                date: dateStr,
                value: parseInt(item.diastolic_bp)
            });
        }
        
        if (item.blood_sugar !== null) {
            newLocalData.bloodSugar.push({
                id: Date.now() + Math.random(),
                date: dateStr,
                value: parseFloat(item.blood_sugar)
            });
        }
        
        if (item.body_temp !== null) {
            newLocalData.bodyTemp.push({
                id: Date.now() + Math.random(),
                date: dateStr,
                value: parseFloat(item.body_temp)
            });
        }
        
        if (item.heart_rate !== null) {
            newLocalData.heartRate.push({
                id: Date.now() + Math.random(),
                date: dateStr,
                value: parseInt(item.heart_rate)
            });
        }
    });

    saveHealthData(newLocalData);
}

// Initialize - load data from backend on page load
document.addEventListener('DOMContentLoaded', async () => {

    const dateInput = document.getElementById('dataDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    await loadHealthDataFromBackend();

    updateMetricSummaries();
    updateAllCharts();
    renderHealthEntries();

});

