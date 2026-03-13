// Check authentication
const user = checkAuth();

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

// AI Response templates
const aiResponses = {
    "foods to avoid": {
        response: `Here are foods you should avoid during pregnancy:
        
<ul>
<li><strong>Raw or undercooked meats:</strong> Risk of bacteria and parasites</li>
<li><strong>Raw fish and shellfish:</strong> Especially high-mercury fish like shark, swordfish</li>
<li><strong>Unpasteurized dairy:</strong> Can contain harmful bacteria</li>
<li><strong>Raw eggs:</strong> Risk of salmonella</li>
<li><strong>Deli meats:</strong> Unless heated to steaming hot</li>
<li><strong>Caffeine:</strong> Limit to 200mg per day</li>
<li><strong>Alcohol:</strong> No safe amount during pregnancy</li>
</ul>

Always consult with your healthcare provider about your specific dietary needs!`
    },
    "safe exercises": {
        response: `Here are generally safe exercises during pregnancy:
        
<ul>
<li><strong>Walking:</strong> Great low-impact cardio</li>
<li><strong>Swimming:</strong> Excellent full-body workout with no joint stress</li>
<li><strong>Prenatal yoga:</strong> Helps flexibility and relaxation</li>
<li><strong>Stationary cycling:</strong> Safe cardio option</li>
<li><strong>Modified pilates:</strong> Strengthens core safely</li>
<li><strong>Light strength training:</strong> Maintains muscle tone</li>
</ul>

<strong>Avoid:</strong> Contact sports, activities with fall risk, exercises lying flat on back after first trimester, and hot yoga.

Always get clearance from your doctor before starting any exercise program!`
    },
    "morning sickness": {
        response: `Here are tips to manage morning sickness:

<ul>
<li><strong>Eat small, frequent meals:</strong> Don't let your stomach get empty</li>
<li><strong>Try ginger:</strong> Ginger tea, candies, or supplements</li>
<li><strong>Stay hydrated:</strong> Sip water throughout the day</li>
<li><strong>Avoid triggers:</strong> Strong smells, spicy or fatty foods</li>
<li><strong>Eat bland foods:</strong> Crackers, toast, rice</li>
<li><strong>Vitamin B6:</strong> May help (consult your doctor first)</li>
<li><strong>Rest well:</strong> Fatigue can worsen nausea</li>
<li><strong>Fresh air:</strong> Open windows or take short walks</li>
</ul>

If you're experiencing severe nausea or vomiting that prevents eating/drinking, contact your healthcare provider immediately!`
    },
    "warning signs": {
        response: `Contact your healthcare provider immediately if you experience:

<ul>
<li><strong>Severe abdominal pain</strong></li>
<li><strong>Vaginal bleeding or spotting</strong></li>
<li><strong>Severe headaches</strong> that won't go away</li>
<li><strong>Vision changes:</strong> Blurriness, spots, light flashes</li>
<li><strong>Sudden swelling</strong> of face, hands, or feet</li>
<li><strong>Fever above 100.4°F (38°C)</strong></li>
<li><strong>Painful urination</strong> or decreased urination</li>
<li><strong>Severe vomiting</strong> that won't stop</li>
<li><strong>Decreased fetal movement</strong> (after 28 weeks)</li>
<li><strong>Fluid leaking</strong> from vagina</li>
<li><strong>Contractions before 37 weeks</strong></li>
</ul>

Trust your instincts - if something doesn't feel right, don't hesitate to call your doctor!`
    },
    "default": {
        response: `I'm here to help with pregnancy-related questions! Here are some topics I can assist with:

<ul>
<li>Nutrition and diet during pregnancy</li>
<li>Safe exercises and physical activity</li>
<li>Managing common pregnancy symptoms</li>
<li>Warning signs to watch for</li>
<li>Prenatal care and checkups</li>
<li>Preparing for labor and delivery</li>
</ul>

Remember, I'm an AI assistant and my responses should not replace professional medical advice. Always consult with your healthcare provider for personalized guidance!

What would you like to know more about?`
    }
};

// Chat form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addUserMessage(message);
    
    // Clear input
    chatInput.value = '';
    
    // Hide quick suggestions after first message
    document.getElementById('quickSuggestions').style.display = 'none';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate AI response delay
    setTimeout(() => {
        hideTypingIndicator();
        const response = getAIResponse(message);
        addBotMessage(response);
    }, 1500);
});

// Quick message function
function sendQuickMessage(message) {
    chatInput.value = message;
    chatForm.dispatchEvent(new Event('submit'));
}

// Add user message
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message
function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            ${message}
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Get AI response based on message
function getAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('avoid')) {
        return aiResponses['foods to avoid'].response;
    } else if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('physical')) {
        return aiResponses['safe exercises'].response;
    } else if (lowerMessage.includes('morning sickness') || lowerMessage.includes('nausea') || lowerMessage.includes('vomit')) {
        return aiResponses['morning sickness'].response;
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('danger') || lowerMessage.includes('emergency')) {
        return aiResponses['warning signs'].response;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `<p>Hello! I'm happy to assist you with your pregnancy questions. How can I help you today?</p>`;
    } else if (lowerMessage.includes('thank')) {
        return `<p>You're welcome! If you have any more questions, I'm here to help. Take care! 💜</p>`;
    } else {
        return aiResponses['default'].response;
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load chat history from localStorage
function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    
    if (history.length === 0) return;
    
    // Clear initial message
    chatMessages.innerHTML = '';
    
    history.forEach(msg => {
        if (msg.type === 'user') {
            addUserMessage(msg.content);
        } else {
            addBotMessage(msg.content);
        }
    });
    
    // Hide suggestions if there's history
    if (history.length > 0) {
        document.getElementById('quickSuggestions').style.display = 'none';
    }
}

// Save chat history
function saveChatHistory() {
    const messages = [];
    document.querySelectorAll('.user-message, .bot-message:not(.typing-message)').forEach(msg => {
        const type = msg.classList.contains('user-message') ? 'user' : 'bot';
        const content = msg.querySelector('.message-content').innerHTML;
        messages.push({ type, content });
    });
    
    // Keep only last 50 messages
    if (messages.length > 50) {
        messages.splice(0, messages.length - 50);
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(messages));
}

// Save on message add
const originalAddUserMessage = addUserMessage;
const originalAddBotMessage = addBotMessage;

addUserMessage = function(message) {
    originalAddUserMessage(message);
    saveChatHistory();
};

addBotMessage = function(message) {
    originalAddBotMessage(message);
    saveChatHistory();
};

// Load history on page load
// loadChatHistory(); // Commented out to always show fresh chat
