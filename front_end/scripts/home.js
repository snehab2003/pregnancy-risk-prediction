// Check authentication
const user = checkAuth();

// Mood tracker
const moodJournals = {
    happy: {
        title: 'Perfect Mood for Journaling!',
        content: 'Try writing about: What made you smile today? Your baby\'s recent movements, future plans for your nursery, or positive affirmations for your pregnancy journey.'
    },
    calm: {
        title: 'A Peaceful Moment',
        content: 'Try writing about: Meditation experiences, peaceful moments you\'ve enjoyed, visualization exercises for labor, or gratitude for this special time.'
    },
    anxious: {
        title: 'Let\'s Work Through This',
        content: 'Try writing about: Your concerns and worries (this helps process them), breathing exercises you\'ve tried, questions for your next doctor visit, or positive birth stories you\'ve heard.'
    },
    tired: {
        title: 'Rest is Important',
        content: 'Try writing about: How you\'re taking care of yourself, small accomplishments today, your sleep patterns, or gentle self-care activities you enjoy.'
    },
    energetic: {
        title: 'Great Energy Today!',
        content: 'Try writing about: Activities you enjoyed today, preparations for baby\'s arrival, exercise routines, or fun memories you want to share with your baby someday.'
    }
};

// ===============================
// MOOD + JOURNAL RECOMMENDATION
// ===============================

function selectMood(mood, emoji) {
    const recommendationBox = document.getElementById("journalRecommendation");

    // remove previous selection
    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.remove("selected");
    });

    // highlight current
    const activeBtn = document.querySelector(`[data-mood="${mood}"]`);
    if (activeBtn) activeBtn.classList.add("selected");

    // Save mood
    localStorage.setItem("todayMood", mood);

    // Journal suggestions
    const prompts = {
        happy: {
            title: "That's wonderful!",
            text: "What made you smile today? Write about the moment you want to remember forever."
        },
        calm: {
            title: "Peaceful mind 🌸",
            text: "What helped you feel relaxed today? Any small gratitude you noticed?"
        },
        anxious: {
            title: "It's okay to feel this way 💛",
            text: "What is worrying you right now? Writing it down might make it lighter."
        },
        tired: {
            title: "You deserve rest 😴",
            text: "What drained your energy today? How can you be kind to yourself?"
        },
        energetic: {
            title: "Love the energy!",
            text: "What motivated you today? How can you use this momentum tomorrow?"
        }
    };

    const data = prompts[mood];

    recommendationBox.innerHTML = `
        <h4>${emoji} ${data.title}</h4>
        <p>${data.text}</p>
    `;

    recommendationBox.classList.add("show");
}


// ===============================
// LOAD SAVED MOOD ON PAGE OPEN
// ===============================

window.addEventListener("DOMContentLoaded", () => {
    const savedMood = localStorage.getItem("todayMood");

    if (savedMood) {
        const moodMap = {
            happy: "😊",
            calm: "😌",
            anxious: "😰",
            tired: "😴",
            energetic: "🤗"
        };

        selectMood(savedMood, moodMap[savedMood]);
    }
});

/*function selectMood(mood, emoji) {
    // Remove previous selection
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Add selection to clicked button
    event.target.closest('.mood-btn').classList.add('selected');
    
    // Save mood
    saveMood(mood, emoji);
    
    // Show journal recommendation
    const journalRec = document.getElementById('journalRecommendation');
    const journal = moodJournals[mood];
    journalRec.innerHTML = `
        <h4>${journal.title}</h4>
        <p>${journal.content}</p>
    `;
    journalRec.classList.add('show');
}
    
// Load today's mood if exists
const currentMood = getCurrentMood();
if (currentMood) {
    const moodBtn = document.querySelector(`[data-mood="${currentMood.mood}"]`);
    if (moodBtn) {
        moodBtn.classList.add('selected');
        const journal = moodJournals[currentMood.mood];
        const journalRec = document.getElementById('journalRecommendation');
        journalRec.innerHTML = `
            <h4>${journal.title}</h4>
            <p>${journal.content}</p>
        `;
        journalRec.classList.add('show');
    }
}
    */


// ===============================
// JOURNAL STORAGE SYSTEM
// ===============================

// open modal
function openJournalModal() {
    document.getElementById("journalModal").style.display = "flex";
}

// close modal
function closeJournalModal() {
    document.getElementById("journalModal").style.display = "none";
}

// save entry
function saveJournalEntry() {
    const title = document.getElementById("journalTitle").value.trim();
    const text = document.getElementById("journalText").value.trim();
    const mood = document.getElementById("journalMood").value;
    const moodEmoji = {
    happy: "😊",
    calm: "😌",
    sad: "😢" ,
    anxious: "😰",
    tired: "😴",
    energetic: "🤗"
};


if (!mood) {
    alert("Please select your mood");
    return;
}


    if (!title || !text) {
        alert("Please fill title and content");
        return;
    }

    const entry = {
    id: Date.now(),
    title,
    text,
    mood,
    emoji: moodEmoji[mood],
    date: new Date().toLocaleString()
};


    const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
    entries.unshift(entry);

    localStorage.setItem("journalEntries", JSON.stringify(entries));

    document.getElementById("journalTitle").value = "";
    document.getElementById("journalMood").value = "";
    document.getElementById("journalText").value = "";

    closeJournalModal();
    renderJournalEntries();
}

// show entries
function renderJournalEntries() {
    const container = document.getElementById("journalEntries");
    const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];

    if (entries.length === 0) {
        container.innerHTML = `<div class="no-entries">
            No journal entries yet. Start writing today ❤️
        </div>`;
        return;
    }

    container.innerHTML = entries.map(entry => `
    <div class="journal-entry mood-${entry.mood}" onclick="openJournalEntry(${entry.id})">
        <div class="journal-entry-header">
            <h4>${entry.emoji || ""} ${entry.title}</h4>
            <div class="journal-entry-meta">
                <span class="journal-date">${entry.date}</span>
                <button class="btn-delete-entry"
    onclick="event.stopPropagation(); deleteJournalEntry(${entry.id})">
    🗑
</button>

            </div>
        </div>
        <p class="journal-entry-content">${entry.text}</p>
        <small>Mood: ${entry.emoji || ""} ${entry.mood}</small>
    </div>
`).join("");

}



// delete entry
function deleteJournalEntry(id) {
    let entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem("journalEntries", JSON.stringify(entries));
    renderJournalEntries();
}


let currentEditingId = null;

// open entry
function openJournalEntry(id) {
    const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    currentEditingId = id;

    document.getElementById("editJournalTitle").value = entry.title;
    document.getElementById("editJournalText").value = entry.text;
    document.getElementById("editJournalMood").value = entry.mood;

    document.getElementById("viewJournalModal").style.display = "flex";
}

// close
function closeViewJournalModal() {
    document.getElementById("viewJournalModal").style.display = "none";
}

// update
function updateJournalEntry() {
    const title = document.getElementById("editJournalTitle").value.trim();
    const text = document.getElementById("editJournalText").value.trim();
    const mood = document.getElementById("editJournalMood").value;

    const moodEmoji = {
        happy: "😊",
        calm: "😌",
        anxious: "😰",
        tired: "😴",
        energetic: "🤗"
    };

    let entries = JSON.parse(localStorage.getItem("journalEntries")) || [];

    entries = entries.map(entry => {
        if (entry.id === currentEditingId) {
            return {
                ...entry,
                title,
                text,
                mood,
                emoji: moodEmoji[mood]
            };
        }
        return entry;
    });

    localStorage.setItem("journalEntries", JSON.stringify(entries));

    closeViewJournalModal();
    renderJournalEntries();
}

// load entries when page opens
window.addEventListener("DOMContentLoaded", () => {
    renderJournalEntries();
});


// Medicine Alert - Check for upcoming medicines
function checkMedicineAlerts() {
    const medicines = getMedicines();
    const now = new Date();
    const alertContainer = document.getElementById('medicineAlert');
    
    medicines.forEach(med => {
        const [hours, minutes] = med.time.split(':');
        const medTime = new Date();
        medTime.setHours(parseInt(hours), parseInt(minutes), 0);
        
        // Check if medicine is within 30 minutes
        const timeDiff = medTime - now;
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff > 0 && minutesDiff <= 30) {
            alertContainer.innerHTML = `
                <span style="font-size: 1.5rem;">💊</span>
                <div>
                    <strong>Medicine Reminder</strong>
                    <p>Time to take ${med.name} in ${Math.round(minutesDiff)} minutes</p>
                </div>
            `;
            alertContainer.classList.add('show');
        }
    });
}

checkMedicineAlerts();
setInterval(checkMedicineAlerts, 60000); // Check every minute

// Combined Health Metrics Chart
document.addEventListener('DOMContentLoaded', () => {
    createCombinedChart('homeCombinedChart');
});


// Weekly Goal Progress
function updateGoalProgress() {
    const goals = getGoals();
    if (goals.length === 0) {
        document.getElementById('overallProgress').textContent = '0%';
        document.getElementById('overallProgressBar').style.width = '0%';
        return;
    }

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    let totalProgress = 0;
    let goalCount = 0;

    goals.forEach(goal => {
        if (goal.progress !== undefined) {
            totalProgress += goal.progress;
            goalCount++;
        }
    });

    const averageProgress = goalCount > 0 ? Math.round(totalProgress / goalCount) : 0;
    document.getElementById('overallProgress').textContent = averageProgress + '%';
    document.getElementById('overallProgressBar').style.width = averageProgress + '%';
}

updateGoalProgress();

// Sleep & Water Tracker Summary
function updateTrackerSummary() {
    const sleepData = getSleepData();
    const waterData = getWaterData();
    
    // Calculate weekly average for sleep
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const recentSleep = sleepData.filter(s => new Date(s.date) >= weekAgo);
    const avgSleep = recentSleep.length > 0
        ? (recentSleep.reduce((sum, s) => sum + parseFloat(s.hours), 0) / recentSleep.length).toFixed(1)
        : '0';
    
    document.getElementById('sleepValue').textContent = avgSleep + ' hrs';
    
    // Calculate average daily water intake
    const recentWater = waterData.filter(w => new Date(w.date) >= weekAgo);
    const avgWater = recentWater.length > 0
        ? (recentWater.reduce((sum, w) => sum + parseFloat(w.liters), 0) / recentWater.length).toFixed(1)
        : '0';
    
    document.getElementById('waterValue').textContent = avgWater + ' L';
}

updateTrackerSummary();
