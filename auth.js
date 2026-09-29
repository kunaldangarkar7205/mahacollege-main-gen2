// MahaCollege 2.0 - Supabase authentication
// Keeps authentication separate from the college features.

function showMessage(message, type = 'error') {
    const box = document.getElementById('message');
    if (!box) return;
    box.textContent = message;
    box.className = `auth-message ${type}`;
}

function authErrorMessage(error, action = 'authentication') {
    const message = (error?.message || '').trim();
    const status = error?.status;

    if (!message) return `Unable to complete ${action}. Please try again.`;

    if (/invalid path specified in (the )?requested url/i.test(message)) {
        return 'Supabase URL configuration is invalid. Open supabase-config.js and make sure the Project URL is copied exactly from Supabase → Project Settings → API (for example: https://YOUR_PROJECT_REF.supabase.co). Do not add /auth, /v1, /signup, or any other path.';
    }
    if (/invalid api key|apikey|jwt/i.test(message) || status === 401) {
        return 'Supabase API key is invalid. Copy the current Publishable/Anon key from Supabase → Project Settings → API into supabase-config.js.';
    }
    if (/already registered|user already registered/i.test(message)) {
        return 'This email is already registered. Please use the Login page or Forgot Password.';
    }
    if (/email not confirmed/i.test(message)) {
        return 'Please confirm your email from the Supabase confirmation email before logging in.';
    }
    if (/invalid login credentials/i.test(message)) {
        return 'Invalid email or password.';
    }
    return message;
}

function redirectTarget() {
    // MahaCollege always opens the main/front page after a successful login.
    return 'index.html';
}

async function requireLogin() {
    if (!window.supabaseClient) return;

    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error || !data.session) {
        const current = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
        const publicPages = ['login.html', 'signup.html', 'forgot-password.html', 'reset-password.html'];
        if (!publicPages.includes(current)) {
            window.location.replace('login.html');
        }
    }
}

async function createProfileIfMissing(user) {
    // Profile creation is handled by the database trigger in supabase/schema.sql.
    // This fallback is intentionally best-effort so a profile table/RLS problem
    // never prevents a successful Auth login or signup.
    if (!user || !window.supabaseClient) return;
    try {
        const name = user.user_metadata?.full_name || 'Student';
        await window.supabaseClient.from('profiles').upsert({
            id: user.id,
            full_name: name,
            email: user.email || '',
            role: user.user_metadata?.role || 'student'
        }, { onConflict: 'id', ignoreDuplicates: true });
    } catch (e) {
        console.warn('Profile creation skipped:', e);
    }
}

async function signupUser(event) {
    event.preventDefault();

    if (!window.supabaseClient) {
        showMessage('Supabase is not configured. Check supabase-config.js.');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name) { showMessage('Please enter your full name.'); return; }
    if (!email) { showMessage('Please enter your email address.'); return; }
    if (password !== confirmPassword) { showMessage('Passwords do not match.'); return; }
    if (password.length < 6) { showMessage('Password must contain at least 6 characters.'); return; }

    const button = document.getElementById('signupButton');
    button.disabled = true;
    button.textContent = 'Creating account...';

    const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: 'student' } }
    });

    if (error) {
        showMessage(authErrorMessage(error, 'account creation'));
        button.disabled = false;
        button.textContent = 'Create Account';
        return;
    }

    // Never allow signup to open the website automatically.
    if (data.session) {
        await window.supabaseClient.auth.signOut();
    }

    if (data.user) {
        showMessage('Account created successfully. Please log in to continue.', 'success');
        setTimeout(() => { window.location.href = 'login.html?registered=1'; }, 700);
    } else {
        showMessage('Account created. Check your email to confirm your account, then log in.', 'success');
        button.disabled = false;
        button.textContent = 'Create Account';
    }
}

async function sendPasswordReset(event) {
    event.preventDefault();
    if (!window.supabaseClient) { showMessage('Supabase is not configured. Check supabase-config.js.'); return; }

    const email = document.getElementById('resetEmail').value.trim();
    const button = document.getElementById('resetButton');
    if (!email) { showMessage('Please enter your email address.'); return; }

    button.disabled = true;
    button.textContent = 'Sending...';

    const resetUrl = new URL('reset-password.html', window.location.href).href;
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: resetUrl });

    if (error) {
        showMessage(authErrorMessage(error, 'password reset'));
        button.disabled = false;
        button.textContent = 'Send Reset Link';
        return;
    }

    showMessage('Password reset link sent. Check your email and open the link to create a new password.', 'success');
    button.textContent = 'Email Sent';
}

async function updatePassword(event) {
    event.preventDefault();
    if (!window.supabaseClient) { showMessage('Supabase is not configured. Check supabase-config.js.'); return; }

    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const button = document.getElementById('updatePasswordButton');

    if (password.length < 6) { showMessage('Password must contain at least 6 characters.'); return; }
    if (password !== confirmPassword) { showMessage('Passwords do not match.'); return; }

    button.disabled = true;
    button.textContent = 'Updating...';
    const { error } = await window.supabaseClient.auth.updateUser({ password });

    if (error) {
        showMessage(authErrorMessage(error, 'password update'));
        button.disabled = false;
        button.textContent = 'Set New Password';
        return;
    }

    await window.supabaseClient.auth.signOut();
    showMessage('Password changed successfully. Redirecting to login...', 'success');
    setTimeout(() => { window.location.href = 'login.html?password_reset=1'; }, 1000);
}

async function loginUser(event) {
    event.preventDefault();
    if (!window.supabaseClient) { showMessage('Supabase is not configured. Check supabase-config.js.'); return; }

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const button = document.getElementById('loginButton');

    if (!email || !password) { showMessage('Please enter your email and password.'); return; }

    button.disabled = true;
    button.textContent = 'Logging in...';
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage(authErrorMessage(error, 'login'));
        button.disabled = false;
        button.textContent = 'Login';
        return;
    }

    await createProfileIfMissing(data.user);
    showMessage('Login successful. Redirecting...', 'success');
    setTimeout(() => { window.location.href = redirectTarget(); }, 300);
}

async function logoutUser() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) { console.error(error); return; }
    window.location.href = 'login.html';
}

function applyMahaCollegeTheme() {
    const isDark = localStorage.getItem('mahacollege_theme') === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const theme = document.getElementById('theme-toggle');
    if (theme) {
        theme.textContent = isDark ? '☀️' : '🌙';
        theme.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        theme.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    }
}

function addThemeToggle() {
    const menu = document.querySelector('nav .menu');
    if (!menu || document.getElementById('theme-toggle')) return;
    const theme = document.createElement('a');
    theme.id = 'theme-toggle';
    theme.href = '#';
    theme.onclick = (event) => {
        event.preventDefault();
        const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('mahacollege_theme', next);
        applyMahaCollegeTheme();
    };
    menu.appendChild(theme);
    applyMahaCollegeTheme();
}

async function updateAuthUI() {
    addThemeToggle();
    if (!window.supabaseClient) return;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const loginLinks = document.querySelectorAll('.login-btn');
    loginLinks.forEach(link => {
        if (user) {
            link.textContent = 'Logout';
            link.href = '#';
            link.onclick = async (event) => { event.preventDefault(); await logoutUser(); };
        } else {
            link.textContent = 'Login';
            link.href = 'login.html';
            link.onclick = null;
        }
    });

    const menu = document.querySelector('nav .menu');
    if (menu && user && !document.getElementById('account-link')) {
        const account = document.createElement('a');
        account.id = 'account-link';
        account.href = 'dashboard.html';
        account.textContent = 'My Account';
        menu.insertBefore(account, menu.querySelector('.login-btn') || null);
    }
    addThemeToggle();
}

document.addEventListener('DOMContentLoaded', async () => {
    applyMahaCollegeTheme();
    const page = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    const publicPages = ['login.html', 'signup.html', 'forgot-password.html', 'reset-password.html'];
    if (!publicPages.includes(page)) await requireLogin();
    await updateAuthUI();
});

window.signupUser = signupUser;
window.loginUser = loginUser;
window.sendPasswordReset = sendPasswordReset;
window.updatePassword = updatePassword;
window.logoutUser = logoutUser;
