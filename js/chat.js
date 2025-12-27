// Chat functionality with backend API integration

let currentSessionId = null;
let apiConfig = null;
let isConfiguring = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if API config exists (via backend)
    await checkApiConfig();
    
    setupChatForm();
    setupSettingsModal();
    setupAutoResize();
});

function setupAutoResize() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
}

function setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    const modal = document.getElementById('settingsModal');
    const settingsForm = document.getElementById('settingsForm');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            modal.classList.add('show');
            // Load current config if exists
            loadConfigToForm();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSaveConfig);
    }
}

async function checkApiConfig() {
    try {
        const response = await configAPI.get();
        
        if (!response.exists || !response.config) {
            // Show settings modal on first load if no config
            const modal = document.getElementById('settingsModal');
            if (modal) {
                modal.classList.add('show');
                isConfiguring = true;
            }
        } else {
            apiConfig = response.config;
            // Hide welcome message and show chat interface
            hideWelcomeMessage();
        }
    } catch (error) {
        console.error('Error checking API config:', error);
        // If backend is not running, show config modal
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('show');
            isConfiguring = true;
        }
    }
}

function loadConfigToForm() {
    if (apiConfig) {
        document.getElementById('apiUrl').value = apiConfig.api_url || '';
        document.getElementById('modelName').value = apiConfig.model_name || '';
        // Don't load API key for security - user needs to re-enter it
    }
}

async function handleSaveConfig(e) {
    e.preventDefault();
    
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelName = document.getElementById('modelName').value.trim();

    if (!apiUrl || !apiKey || !modelName) {
        alert('请填写所有字段');
        return;
    }

    try {
        const response = await configAPI.save({
            api_url: apiUrl,
            api_key: apiKey,
            model_name: modelName
        });
        
        apiConfig = response.config;
        
        // Close modal
        document.getElementById('settingsModal').classList.remove('show');
        
        // Clear API key field for security
        document.getElementById('apiKey').value = '';
        
        // Hide welcome message
        hideWelcomeMessage();
        
        // Show success message
        showNotification('配置已保存！', 'success');
        
        isConfiguring = false;
    } catch (error) {
        console.error('Error saving config:', error);
        alert('保存配置失败: ' + error.message);
    }
}

function hideWelcomeMessage() {
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'none';
    }
}

function setupChatForm() {
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    // Check if API is configured
    if (!apiConfig) {
        alert('请先配置API设置');
        document.getElementById('settingsBtn').click();
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;

    // Create session if needed
    if (!currentSessionId) {
        try {
            const response = await chatAPI.createSession(`会话 ${new Date().toLocaleString('zh-CN')}`);
            currentSessionId = response.session.id;
        } catch (error) {
            console.error('Error creating session:', error);
            alert('创建会话失败: ' + error.message);
            return;
        }
    }

    // Add user message to UI
    addMessageToUI('user', message);
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Disable input
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="loading"></div>';

    try {
        // Get chat history (不等待，使用缓存或空数组)
        let history = [];
        // 异步获取历史，不阻塞当前请求
        chatAPI.getMessages(currentSessionId)
            .then(messagesResponse => {
                // 历史记录获取成功，但不影响当前请求
            })
            .catch(error => {
                console.error('Error getting history:', error);
            });
        
        // Call backend API (which will call AI API)
        // 使用AbortController支持超时取消
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 95000); // 95秒超时
        
        try {
            const response = await chatAPI.sendMessage(message, currentSessionId, history);
            clearTimeout(timeoutId);
            
            // Add assistant response to UI
            addMessageToUI('assistant', response.message);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        let errorMsg = error.message;
        if (error.message.includes('timeout') || error.message.includes('超时') || error.name === 'AbortError') {
            errorMsg = '请求超时，AI响应时间较长。智谱API可能需要更长时间处理，请稍后重试。';
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg = '无法连接到服务器。请确保后端服务器正在运行。';
        }
        addMessageToUI('assistant', '抱歉，发生了错误：' + errorMsg, true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        `;
        messageInput.focus();
    }
}

// Removed - now handled by backend

function addMessageToUI(role, content, isError = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Hide welcome message if visible
    hideWelcomeMessage();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} ${isError ? 'error' : ''}`;
    
    if (isError) {
        messageDiv.style.background = '#fee';
        messageDiv.style.color = '#c33';
        messageDiv.style.border = '1px solid #fcc';
    }

    messageDiv.innerHTML = `
        <div>${escapeHtml(content)}</div>
        <div class="message-time">${formatDateTime(new Date().toISOString())}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
