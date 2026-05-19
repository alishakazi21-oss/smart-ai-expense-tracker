const API = '/api';

// ── Redirect if already logged in ───────────────────────────
const token = localStorage.getItem('sw_token');
if (token) window.location.href = '/app';

// ── Tab Switching ────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent = '';
}

// ── Login ────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed'; return; }
    localStorage.setItem('sw_token', data.token);
    localStorage.setItem('sw_username', data.username);
    window.location.href = '/app';
  } catch (err) {
    errEl.textContent = 'Server error. Is Flask running?';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
}

// ── Register ─────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const errEl = document.getElementById('reg-error');
  const btn = document.getElementById('reg-btn');

  errEl.textContent = '';
  if (password !== confirm) { errEl.textContent = 'Passwords do not match'; return; }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Registration failed'; return; }
    localStorage.setItem('sw_token', data.token);
    localStorage.setItem('sw_username', data.username);
    window.location.href = '/app';
  } catch (err) {
    errEl.textContent = 'Server error. Is Flask running?';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}
