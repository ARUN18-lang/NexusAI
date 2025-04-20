    document.addEventListener('DOMContentLoaded', function() {
        const chatHistory = document.getElementById('chatHistory');
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const newChatBtn = document.getElementById('newChatBtn');
        const conversationList = document.getElementById('conversationList');
        
        let currentConversationId = generateConversationId();
        let conversations = loadConversationsFromStorage();
        
        // Initialize the UI
        renderConversationList();
        loadCurrentConversation();
        
        // Event listeners
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        newChatBtn.addEventListener('click', startNewConversation);
        
        function sendMessage() {
            const message = userInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            addMessageToConversation({
                content: message,
                type: 'user',
                timestamp: new Date().toISOString()
            });
            
            userInput.value = '';
            showTypingIndicator();
            
            // Send message to server
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    conversationId: currentConversationId
                })
            })
            .then(handleResponse)
            .then(data => {
                removeTypingIndicator();
                
                if (data.error) {
                    addMessageToConversation({
                        content: `Error: ${data.error}`,
                        type: 'system',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    addMessageToConversation({
                        content: data.response,
                        type: 'assistant',
                        timestamp: new Date().toISOString()
                    });
                    
                    // Update conversation title if first assistant message
                    updateConversationTitle(data.response);
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addMessageToConversation({
                    content: `Error: ${error.message}`,
                    type: 'system',
                    timestamp: new Date().toISOString()
                });
                console.error('Error:', error);
            });
        }
        
        function addMessageToConversation(message) {
            // Find current conversation
            const conversation = conversations.find(c => c.id === currentConversationId) || {
                id: currentConversationId,
                title: 'New Conversation',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add message
            conversation.messages.push(message);
            conversation.updatedAt = new Date().toISOString();
            
            // Update or add conversation
            const index = conversations.findIndex(c => c.id === currentConversationId);
            if (index === -1) {
                conversations.unshift(conversation);
            } else {
                conversations[index] = conversation;
            }
            
            // Save and update UI
            saveConversationsToStorage();
            renderConversationList();
            renderMessages(conversation.messages);
        }
        
        function updateConversationTitle(assistantResponse) {
            const conversation = conversations.find(c => c.id === currentConversationId);
            if (!conversation) return;
            
            // Only update title if it's still the default
            if (conversation.title === 'New Conversation') {
                // Create a short title from the first response
                const shortResponse = assistantResponse.length > 30 
                    ? assistantResponse.substring(0, 30) + '...' 
                    : assistantResponse;
                
                conversation.title = shortResponse;
                saveConversationsToStorage();
                renderConversationList();
            }
        }
        
        function startNewConversation() {
            currentConversationId = generateConversationId();
            chatHistory.innerHTML = '';
            userInput.focus();
            
            // Add welcome message to new conversation
            addMessageToConversation({
                content: 'Hello! How can I assist you today?',
                type: 'assistant',
                timestamp: new Date().toISOString()
            });
        }
        
        function loadConversation(conversationId) {
            currentConversationId = conversationId;
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                renderMessages(conversation.messages);
            }
            userInput.focus();
            renderConversationList();
        }
        
        function deleteConversation(conversationId, event) {
            event.stopPropagation();
            
            if (confirm('Are you sure you want to delete this conversation?')) {
                conversations = conversations.filter(c => c.id !== conversationId);
                saveConversationsToStorage();
                
                if (currentConversationId === conversationId) {
                    startNewConversation();
                }
                
                renderConversationList();
            }
        }
        
        function renderMessages(messages) {
            chatHistory.innerHTML = '';
            messages.forEach(message => {
                addMessageToUI(message, message.type);
            });
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function renderConversationList() {
            conversationList.innerHTML = '';
            
            conversations.forEach(conversation => {
                const isActive = conversation.id === currentConversationId;
                const item = document.createElement('div');
                item.className = `conversation-item ${isActive ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="conversation-title">${conversation.title}</div>
                    <div class="conversation-delete" onclick="deleteConversation('${conversation.id}', event)">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                `;
                item.addEventListener('click', () => loadConversation(conversation.id));
                conversationList.appendChild(item);
            });
        }
        
        function addMessageToUI(message, senderType = null) {
            const messageDiv = document.createElement('div');
            const actualType = senderType || message.type;
            messageDiv.classList.add('message', `${actualType}-message`);
            
            const content = typeof message === 'object' ? message.content : message;
            
            if (actualType === 'assistant' || actualType === 'system') {
                messageDiv.innerHTML = formatResponse(content);
            } else {
                messageDiv.textContent = content;
            }
            
            const timestamp = document.createElement('div');
            timestamp.classList.add('timestamp');
            timestamp.textContent = new Date(message.timestamp || new Date()).toLocaleTimeString();
            messageDiv.appendChild(timestamp);
            
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('typing-indicator');
            typingDiv.id = 'typingIndicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            chatHistory.appendChild(typingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function removeTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        function handleResponse(response) {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }
        
        function formatResponse(text) {
            if (!text) return '';
            
            // Enhanced markdown to HTML conversion
            text = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            return `<p>${text}</p>`;
        }
        
        function generateConversationId() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }
        
        function loadConversationsFromStorage() {
            try {
                const saved = localStorage.getItem('chatConversations');
                return saved ? JSON.parse(saved) : [];
            } catch {
                return [];
            }
        }
        
        function saveConversationsToStorage() {
            localStorage.setItem('chatConversations', JSON.stringify(conversations));
        }
        
        function loadCurrentConversation() {
            const conversation = conversations.find(c => c.id === currentConversationId);
            if (conversation) {
                renderMessages(conversation.messages);
            } else {
                startNewConversation();
            }
        }
        
        // Make delete function available globally for the onclick handler
        window.deleteConversation = deleteConversation;
    });