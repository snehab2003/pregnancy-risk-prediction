// Check authentication
const user = checkAuth();

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

// The AI responses are now handled by the backend.

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
    
    // Call API for AI response
    fetch('/api/chat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Function presumably available or need to add
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        hideTypingIndicator();
        if (data.error) {
            addBotMessage("Sorry, I encountered an error: " + data.error);
        } else {
            // Convert markdown-like response to HTML if needed or just use as is
            const reply = data.reply.replace(/\n/g, '<br>');
            addBotMessage(reply);
        }
    })
    .catch(error => {
        hideTypingIndicator();
        console.error('Chat error:', error);
        addBotMessage("Sorry, I'm having trouble connecting right now.");
    });
});

// Helper to get CSRF token if not already in common.js
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

// getAIResponse is removed because we call the backend directly

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
