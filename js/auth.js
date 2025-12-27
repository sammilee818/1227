// Authentication logic

document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const errorMsg = document.getElementById('errorMessage');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await authAPI.login({ username, password });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError('errorMessage', error.message || '登录失败，请检查用户名和密码');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const errorMsg = document.getElementById('errorMessage');
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('errorMessage', '两次输入的密码不一致');
        return;
    }

    if (password.length < 6) {
        showError('errorMessage', '密码长度至少为6位');
        return;
    }

    try {
        const response = await authAPI.register({ username, email, password });
        showSuccess('errorMessage', '注册成功！正在跳转...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        showError('errorMessage', error.message || '注册失败，请重试');
    }
}

async function handleLogout() {
    try {
        await authAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}



