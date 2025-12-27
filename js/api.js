// API configuration and utility functions

const API_BASE_URL = 'http://localhost:3000/api';

// Make API request
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        // 对于聊天请求，使用更长的超时时间
        const isChatRequest = endpoint.includes('/chat');
        const timeout = isChatRequest ? 95000 : 30000; // 聊天95秒，其他30秒
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                let errorMessage = '请求失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
    } catch (error) {
        console.error('API Error:', error);
        
        // Provide more helpful error messages
        if (error.name === 'AbortError') {
            throw new Error('请求超时，请稍后重试');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('无法连接到服务器。请确保后端服务器正在运行在 http://localhost:3000');
        }
        
        throw error;
    }
}

// Config API
const configAPI = {
    get: async () => {
        return apiRequest('/config');
    },
    save: async (configData) => {
        return apiRequest('/config', {
            method: 'POST',
            body: JSON.stringify(configData),
        });
    },
};

// Chat API
const chatAPI = {
    sendMessage: async (message, sessionId, history = []) => {
        return apiRequest('/chat', {
            method: 'POST',
            body: JSON.stringify({
                message,
                session_id: sessionId,
                history
            }),
        });
    },
    createSession: async (sessionName) => {
        return apiRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({ session_name: sessionName }),
        });
    },
    getSessions: async () => {
        return apiRequest('/sessions');
    },
    getMessages: async (sessionId) => {
        return apiRequest(`/sessions/${sessionId}/messages`);
    },
};

// Mood API
const moodAPI = {
    recordMood: async (moodData) => {
        return apiRequest('/mood/record', {
            method: 'POST',
            body: JSON.stringify(moodData),
        });
    },
    getRecords: async () => {
        return apiRequest('/mood/records');
    },
    getTrends: async (period = 'week') => {
        return apiRequest(`/mood/trends?period=${period}`);
    },
};

// Exercise API
const exerciseAPI = {
    getTypes: async () => {
        return apiRequest('/exercises/types');
    },
    createExercise: async (exerciseData) => {
        return apiRequest('/exercises', {
            method: 'POST',
            body: JSON.stringify(exerciseData),
        });
    },
    getExercises: async () => {
        return apiRequest('/exercises');
    },
};

// Report API
const reportAPI = {
    generateReport: async (period = 'week') => {
        return apiRequest(`/reports/generate?period=${period}`);
    },
    getReports: async () => {
        return apiRequest('/reports');
    },
};
