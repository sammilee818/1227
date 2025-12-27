// Dashboard functionality

let moodChart = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    setupMoodForm();
    setupMoodChart();
    loadRecentSessions();
    setupExerciseButtons();
    setupReportButton();
    // setupLogout(); // 已移除登录功能，不需要登出
});

function setupMoodForm() {
    const moodForm = document.getElementById('moodForm');
    const moodScore = document.getElementById('moodScore');
    const moodScoreValue = document.getElementById('moodScoreValue');

    if (moodScore && moodScoreValue) {
        moodScore.addEventListener('input', (e) => {
            moodScoreValue.textContent = e.target.value;
        });
    }

    if (moodForm) {
        moodForm.addEventListener('submit', handleMoodRecord);
    }
}

async function handleMoodRecord(e) {
    e.preventDefault();
    
    const moodScoreEl = document.getElementById('moodScore');
    const moodTypeEl = document.getElementById('moodType');
    const moodNotesEl = document.getElementById('moodNotes');
    const moodScoreValueEl = document.getElementById('moodScoreValue');
    const moodFormEl = document.getElementById('moodForm');
    
    if (!moodScoreEl || !moodTypeEl || !moodNotesEl) {
        console.error('情绪记录表单元素未找到');
        return;
    }
    
    const moodData = {
        mood_score: parseInt(moodScoreEl.value),
        mood_type: moodTypeEl.value,
        notes: moodNotesEl.value
    };

    try {
        await moodAPI.recordMood(moodData);
        
        // 显示成功消息
        const moodMessageEl = document.getElementById('moodMessage');
        if (moodMessageEl) {
            moodMessageEl.textContent = '情绪记录成功！';
            moodMessageEl.style.display = 'block';
            moodMessageEl.style.backgroundColor = '#d4edda';
            moodMessageEl.style.color = '#155724';
            moodMessageEl.style.border = '1px solid #c3e6cb';
            setTimeout(() => {
                moodMessageEl.style.display = 'none';
            }, 3000);
        }
        
        // 重置表单
        if (moodFormEl) {
            moodFormEl.reset();
        }
        
        // 重置评分显示
        if (moodScoreValueEl) {
            moodScoreValueEl.textContent = '5';
        }
        
        // 重新加载图表
        loadMoodChart();
    } catch (error) {
        console.error('记录情绪失败:', error);
        const moodMessageEl = document.getElementById('moodMessage');
        if (moodMessageEl) {
            moodMessageEl.textContent = '记录情绪失败: ' + (error.message || '未知错误');
            moodMessageEl.style.display = 'block';
            moodMessageEl.style.backgroundColor = '#f8d7da';
            moodMessageEl.style.color = '#721c24';
            moodMessageEl.style.border = '1px solid #f5c6cb';
            setTimeout(() => {
                moodMessageEl.style.display = 'none';
            }, 5000);
        } else {
            alert('记录情绪失败: ' + (error.message || '未知错误'));
        }
    }
}

async function setupMoodChart() {
    const ctx = document.getElementById('moodChart');
    if (!ctx) return;

    await loadMoodChart();
}

async function loadMoodChart() {
    try {
        const response = await moodAPI.getTrends('week');
        const trends = response.trends || [];

        const ctx = document.getElementById('moodChart');
        if (!ctx) return;

        if (trends.length === 0) {
            ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--text-light);">暂无情绪数据</p>';
            return;
        }

        const labels = trends.map(t => new Date(t.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        const scores = trends.map(t => t.average_score);

        if (moodChart) {
            moodChart.destroy();
        }

        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '情绪评分',
                    data: scores,
                    borderColor: 'rgb(74, 144, 226)',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to load mood chart:', error);
        const ctx = document.getElementById('moodChart');
        if (ctx && ctx.parentElement) {
            ctx.parentElement.innerHTML = `
                <p style="text-align: center; color: var(--error-color);">
                    加载失败: ${error.message}<br>
                    <small>请确保后端服务器正在运行</small>
                </p>
            `;
        }
    }
}

async function loadRecentSessions() {
    const recentSessions = document.getElementById('recentSessions');
    if (!recentSessions) return;

    try {
        const response = await chatAPI.getSessions();
        const sessions = (response.sessions || []).slice(0, 5);

        if (sessions.length === 0) {
            recentSessions.innerHTML = '<p>暂无会话记录</p>';
            return;
        }

        recentSessions.innerHTML = sessions.map(session => `
            <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                <div style="font-weight: 500; margin-bottom: 5px;">
                    <a href="chat.html" style="color: var(--primary-color); text-decoration: none;">
                        ${escapeHtml(session.session_name || '新会话')}
                    </a>
                </div>
                <div style="font-size: 0.85em; color: var(--text-light);">
                    ${formatDate(session.created_at)}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent sessions:', error);
        recentSessions.innerHTML = `
            <p style="color: var(--error-color);">
                加载失败: ${error.message}<br>
                <small>请确保后端服务器正在运行</small>
            </p>
        `;
    }
}

function setupExerciseButtons() {
    const exerciseButtons = document.querySelectorAll('.exercise-btn');
    exerciseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const exerciseType = btn.dataset.type;
            handleExercise(exerciseType);
        });
    });
}

function handleExercise(exerciseType) {
    // This would open a modal or navigate to an exercise page
    alert(`开始 ${exerciseType} 练习`);
    // In a full implementation, this would open a modal with the exercise form
}

function setupReportButton() {
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
}

async function generateReport() {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    reportContent.innerHTML = '<p>正在生成报告...</p>';

    try {
        const response = await reportAPI.generateReport('week');
        const report = response.report;

        reportContent.innerHTML = `
            <div style="margin-top: 20px;">
                <h3>${report.period_start} 至 ${report.period_end}</h3>
                <div style="margin-top: 15px;">
                    <p><strong>情绪趋势：</strong>${report.mood_summary || '暂无数据'}</p>
                    <p><strong>聊天频率：</strong>${report.chat_frequency || 0} 次</p>
                    <p><strong>练习完成：</strong>${report.exercises_completed || 0} 项</p>
                    <p><strong>建议：</strong>${report.recommendations || '继续坚持使用平台'}</p>
                </div>
            </div>
        `;
    } catch (error) {
        reportContent.innerHTML = '<p style="color: var(--error-color);">生成报告失败</p>';
        console.error('Failed to generate report:', error);
    }
}


