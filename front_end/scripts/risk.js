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
document.getElementById('healthDataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = document.getElementById('dataType').value;
    const date = document.getElementById('dataDate').value;
    const healthData = getHealthData();
    
    switch(type) {
        case 'bloodPressureSys': {
            const systolic = parseInt(document.getElementById('systolicValue').value);
            healthData.bloodPressureSys.push({ 
                id: Date.now(),
                date, 
                value: systolic });
            break;
        }
        case 'bloodPressureDia': {
            const diastolic = parseInt(document.getElementById('diastolicValue').value);
            healthData.bloodPressureDia.push({ 
                id: Date.now(),
                date, 
                value: diastolic });
            break;  
        }
        case 'bloodSugar': {
            const bsValue = parseFloat(document.getElementById('bloodSugarValue').value);
            healthData.bloodSugar.push({
                id: Date.now(),
                date,
                value: bsValue
            });

            break;
        }
        case 'bodyTemp': {
            const tValue = parseFloat(document.getElementById('bodyTempValue').value);
            if (!healthData.bodyTemp) healthData.bodyTemp = [];
            healthData.bodyTemp.push({ 
                id: Date.now(), 
                date, 
                value: tValue });
            break;
        }
        case 'heartRate': {
            const hrValue = parseInt(document.getElementById('heartRateValue').value);
            healthData.heartRate.push({ 
                id: Date.now(),
                date, 
                value: hrValue });
            break;
        }
    }
    
    saveHealthData(healthData);

updateMetricSummaries();
updateAllCharts();
renderHealthEntries();

closeHealthModalFunc();

alert('Health data saved successfully!');

});

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
            maintainAspectRatio: true,
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
            maintainAspectRatio: true,
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
            maintainAspectRatio: true,
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
            maintainAspectRatio: true,
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
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }
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
                <div>
                    <button onclick="editHealthEntry('${typeKey}', ${entry.id})">Edit</button>
                    <button onclick="deleteHealthEntry('${typeKey}', ${entry.id})">Delete</button>

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
if (editingEntryId) {
    healthData[type] = healthData[type].filter(e => e.id !== editingEntryId);
    editingEntryId = null;
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

    // Simple ML simulation
    let riskScore = 0;
    let riskFactors = [];
    let recommendations = [];
    
    // Blood Sugar Analysis
    if (healthData.bloodSugar.length > 0) {
        const avgBS = parseFloat(calculateAverage(healthData.bloodSugar));
        if (avgBS > 140) {
            riskScore += 30;
            riskFactors.push('Elevated blood sugar levels detected');
            recommendations.push('Monitor blood sugar closely and consult with your doctor about gestational diabetes');
        } else if (avgBS < 70) {
            riskScore += 15;
            riskFactors.push('Low blood sugar levels detected');
            recommendations.push('Ensure regular meals and discuss with your healthcare provider');
        } else {
            recommendations.push('Blood sugar levels are within normal range - continue monitoring');
        }
    }
    
    // Blood Pressure Analysis
    if (healthData.bloodPressureSys.length > 0) {
        const latest = getLatestByDate(healthData.bloodPressureSys);
        if (latest.value > 140) {
            riskScore += 35;
            riskFactors.push('High systolic blood pressure detected');
            recommendations.push('Contact your healthcare provider immediately about elevated blood pressure');
        } else if (latest.value < 90) {
            riskScore += 10;
            riskFactors.push('Low systolic blood pressure detected');
            recommendations.push('Stay hydrated and discuss symptoms with your doctor');
        } else {
            recommendations.push('Blood pressure is within normal range');
        }
    }

    // Diastolic Blood Pressure Analysis
    if (healthData.bloodPressureDia.length > 0) {
        const latest = getLatestByDate(healthData.bloodPressureDia);
        if (latest.value > 90) {
            riskScore += 30;
            riskFactors.push('High diastolic blood pressure detected');
            recommendations.push('Contact your healthcare provider immediately about elevated blood pressure');
        } else if (latest.value < 60) {
            riskScore += 10;
            riskFactors.push('Low diastolic blood pressure detected');
            recommendations.push('Stay hydrated and discuss symptoms with your doctor');
        } else {
            recommendations.push('Blood pressure is within normal range');
        }
    }
    
    // body Temperature Analysis
    if (healthData.bodyTemp && healthData.bodyTemp.length > 0) {
        const avgTemp = parseFloat(calculateAverage(healthData.bodyTemp));
        if (avgTemp > 38) {
            riskScore += 20;
            riskFactors.push('Elevated body temperature detected');
            recommendations.push('Monitor for signs of infection and contact your healthcare provider');
        } else if (avgTemp < 36) {
            riskScore += 10;
            riskFactors.push('Lower body temperature than typical for pregnancy');
            recommendations.push('Ensure proper nutrition and discuss with your healthcare provider');
        } else {
            recommendations.push('Body temperature is within expected range for pregnancy');
        }
    }   

    // Heart Rate Analysis
    if (healthData.heartRate.length > 0) {
        const avgHR = parseFloat(calculateAverage(healthData.heartRate));
        if (avgHR > 100) {
            riskScore += 15;
            riskFactors.push('Elevated heart rate detected');
            recommendations.push('Monitor heart rate and report persistent elevation to your doctor');
        } else if (avgHR < 60) {
            riskScore += 10;
            riskFactors.push('Lower heart rate than typical for pregnancy');
            recommendations.push('Discuss heart rate with your healthcare provider');
        } else {
            recommendations.push('Heart rate is within expected range for pregnancy');
        }
    }
    
    
    
    // Determine Risk Level
    let riskLevel = 'Low';
    let riskClass = 'low';
    if (riskScore > 50) {
        riskLevel = 'High';
        riskClass = 'high';
    } else if (riskScore > 25) {
        riskLevel = 'Medium';
        riskClass = 'medium';
    }
    
    // Display Results
    const resultDiv = document.getElementById('riskResult');
    resultDiv.innerHTML = `
        <div class="risk-level ${riskClass}">
            ${riskLevel} Risk
        </div>
        <div class="risk-details">
            ${riskFactors.length > 0 ? `
                <h4>Risk Factors Identified:</h4>
                <ul>
                    ${riskFactors.map(f => `<li>${f}</li>`).join('')}
                </ul>
            ` : '<h4>No significant risk factors identified</h4>'}
            
            <h4>Recommendations:</h4>
            <ul>
                ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
        <div class="risk-disclaimer">
            <strong>⚠️ Important:</strong> This is a simplified risk assessment based on limited data. 
            It is NOT a substitute for professional medical advice. Always consult with your healthcare 
            provider for accurate diagnosis and personalized medical guidance.
        </div>
    `;
    resultDiv.classList.add('show');
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {

    // Set today's date
    const dateInput = document.getElementById('dataDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    updateMetricSummaries();
    updateAllCharts();
    renderHealthEntries();

});


