const API = '/api';

// ── Auth Guard ───────────────────────────────────────────────
const token = localStorage.getItem('sw_token');
const username = localStorage.getItem('sw_username');
if (!token) window.location.href = '/';

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function logout() {
  localStorage.removeItem('sw_token');
  localStorage.removeItem('sw_username');
  window.location.href = '/';
}

const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Bills: '📄',
  Education: '📚', Other: '📦'
};

const CATEGORY_COLORS = [
  '#7c6ff7','#22d3a5','#fbbf24','#f87171',
  '#a78bfa','#38bdf8','#fb923c','#34d399'
];

let currentPage = 'dashboard';
let allExpenses = [];

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const monthVal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('month-picker').value = monthVal;
  document.getElementById('current-month-label').textContent =
    now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Show username
  if (username) {
    document.getElementById('user-name').textContent = username;
  }

  document.getElementById('month-picker').addEventListener('change', refreshAll);
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('exp-date').value = now.toISOString().split('T')[0];

  refreshAll();
});

function getMonth() {
  return document.getElementById('month-picker').value;
}

async function refreshAll() {
  await loadSummary();
  await loadExpenses();
  await loadAnalytics();
}

/* ── Navigation ─────────────────────────────────────────── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById(`nav-${page}`).classList.add('active');
  document.getElementById('page-title').textContent =
    { dashboard:'Dashboard', expenses:'Expenses', analytics:'Analytics', budget:'Budget' }[page];
  currentPage = page;
  if (page === 'budget') loadBudget();
  if (page === 'analytics') loadAnalytics();
  document.getElementById('sidebar').classList.remove('open');
  return false;
}

/* ── Summary / Dashboard ────────────────────────────────── */
async function loadSummary() {
  try {
    const res = await fetch(`${API}/summary?month=${getMonth()}`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const d = await res.json();

    document.getElementById('stat-total').textContent = fmt(d.total);
    document.getElementById('stat-budget').textContent = fmt(d.budget);
    document.getElementById('stat-count').textContent = d.count;

    const rem = d.remaining;
    const remEl = document.getElementById('stat-remaining');
    remEl.textContent = fmt(Math.abs(rem));
    remEl.style.color = rem < 0 ? 'var(--red)' : 'var(--green)';

    if (d.budget > 0) {
      const pct = Math.min((d.total / d.budget) * 100, 100);
      const fill = document.getElementById('budget-progress');
      fill.style.width = pct + '%';
      fill.classList.toggle('danger', pct >= 90);
      document.getElementById('budget-pct-badge').textContent = pct.toFixed(1) + '%';
      document.getElementById('budget-caption').textContent =
        rem >= 0
          ? `${fmt(rem)} remaining of ${fmt(d.budget)} budget`
          : `⚠️ Over budget by ${fmt(Math.abs(rem))}!`;
    }

    const recentRes = await fetch(`${API}/expenses?month=${getMonth()}`, { headers: authHeaders() });
    const expenses = await recentRes.json();
    allExpenses = expenses;
    renderExpenseList(expenses.slice(0, 5), 'recent-list');
  } catch (e) { console.error(e); }
}

/* ── Expenses ───────────────────────────────────────────── */
async function loadExpenses() {
  try {
    const res = await fetch(`${API}/expenses?month=${getMonth()}`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    allExpenses = await res.json();
    const cat = document.getElementById('filter-category').value;
    const q = document.getElementById('filter-search').value.toLowerCase();
    let filtered = allExpenses;
    if (cat) filtered = filtered.filter(e => e.category === cat);
    if (q)   filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || (e.note||'').toLowerCase().includes(q));
    renderExpenseList(filtered, 'expenses-list');
  } catch (e) { console.error(e); }
}

function renderExpenseList(expenses, containerId) {
  const el = document.getElementById(containerId);
  if (!expenses.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🌟</div><p>No expenses here yet.</p></div>`;
    return;
  }
  el.innerHTML = expenses.map(e => `
    <div class="expense-item" id="exp-${e.id}">
      <div class="exp-icon">${CATEGORY_ICONS[e.category] || '📦'}</div>
      <div class="exp-info">
        <div class="exp-title">${escHtml(e.title)}</div>
        <div class="exp-meta">${e.category} · ${fmtDate(e.date)}${e.note ? ' · ' + escHtml(e.note) : ''}</div>
      </div>
      <div class="exp-right">
        <div class="exp-amount">-${fmt(e.amount)}</div>
        <div class="exp-actions">
          <button class="action-btn" title="Edit" onclick="editExpense(${e.id})">✏️</button>
          <button class="action-btn" title="Delete" onclick="deleteExpense(${e.id})">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Analytics ──────────────────────────────────────────── */
async function loadAnalytics() {
  try {
    const res = await fetch(`${API}/summary?month=${getMonth()}`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const d = await res.json();
    const cats = d.by_category || {};
    const total = d.total || 1;
    const entries = Object.entries(cats).sort((a,b) => b[1]-a[1]);

    const chartEl = document.getElementById('category-chart');
    if (!entries.length) {
      chartEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><p>No data yet.</p></div>`;
    } else {
      const maxVal = entries[0][1];
      chartEl.innerHTML = entries.map(([cat, amt], i) => `
        <div class="chart-bar-item">
          <div class="chart-bar-label">
            <span>${CATEGORY_ICONS[cat] || '📦'} ${cat}</span>
            <span>${fmt(amt)}</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${(amt/maxVal)*100}%;background:${CATEGORY_COLORS[i%CATEGORY_COLORS.length]}"></div>
          </div>
        </div>
      `).join('');
    }

    const bEl = document.getElementById('breakdown-list');
    if (!entries.length) {
      bEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No data yet.</p></div>`;
    } else {
      bEl.innerHTML = entries.map(([cat, amt], i) => `
        <div class="breakdown-item">
          <div class="breakdown-left">
            <div class="breakdown-dot" style="background:${CATEGORY_COLORS[i%CATEGORY_COLORS.length]}"></div>
            <div>
              <div class="breakdown-cat">${CATEGORY_ICONS[cat] || '📦'} ${cat}</div>
              <div class="breakdown-pct">${((amt/total)*100).toFixed(1)}% of total</div>
            </div>
          </div>
          <div class="breakdown-amt">${fmt(amt)}</div>
        </div>
      `).join('');
    }
  } catch (e) { console.error(e); }
}

/* ── Budget ─────────────────────────────────────────────── */
async function loadBudget() {
  try {
    const res = await fetch(`${API}/budget`, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const d = await res.json();
    document.getElementById('budget-input').value = d.monthly_budget || '';
    if (d.monthly_budget > 0) {
      const statusEl = document.getElementById('budget-status');
      statusEl.textContent = `✅ Current budget: ${fmt(d.monthly_budget)}/month`;
      statusEl.classList.add('show');
    }
  } catch (e) { console.error(e); }
}

async function saveBudget() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (isNaN(val) || val < 0) { showToast('Enter a valid budget amount', true); return; }
  try {
    await fetch(`${API}/budget`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ monthly_budget: val })
    });
    const statusEl = document.getElementById('budget-status');
    statusEl.textContent = `✅ Budget set to ${fmt(val)}/month — saved to file!`;
    statusEl.classList.add('show');
    showToast('Budget saved & exported to file!');
    await loadSummary();
  } catch (e) { showToast('Failed to save budget', true); }
}

/* ── Modal ──────────────────────────────────────────────── */
function openModal(expense = null) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = expense ? 'Edit Expense' : 'Add Expense';
  document.getElementById('expense-id').value = expense ? expense.id : '';
  document.getElementById('exp-title').value = expense ? expense.title : '';
  document.getElementById('exp-amount').value = expense ? expense.amount : '';
  document.getElementById('exp-category').value = expense ? expense.category : '';
  document.getElementById('exp-date').value = expense ? expense.date : new Date().toISOString().split('T')[0];
  document.getElementById('exp-note').value = expense ? (expense.note || '') : '';
  overlay.classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

async function saveExpense() {
  const id = document.getElementById('expense-id').value;
  const title = document.getElementById('exp-title').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const category = document.getElementById('exp-category').value;
  const date = document.getElementById('exp-date').value;
  const note = document.getElementById('exp-note').value.trim();

  if (!title) { showToast('Please enter a title', true); return; }
  if (isNaN(amount) || amount <= 0) { showToast('Please enter a valid amount', true); return; }
  if (!category) { showToast('Please select a category', true); return; }
  if (!date) { showToast('Please select a date', true); return; }

  const payload = { title, amount, category, date, note };
  try {
    if (id) {
      await fetch(`${API}/expenses/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
      showToast('Expense updated!');
    } else {
      await fetch(`${API}/expenses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      showToast('Expense added!');
    }
    document.getElementById('modal-overlay').classList.remove('open');
    await refreshAll();
  } catch (e) { showToast('Failed to save expense', true); }
}

function editExpense(id) {
  const exp = allExpenses.find(e => e.id === id);
  if (exp) openModal(exp);
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await fetch(`${API}/expenses/${id}`, { method: 'DELETE', headers: authHeaders() });
    showToast('Expense deleted');
    await refreshAll();
  } catch (e) { showToast('Failed to delete', true); }
}

/* ── Helpers ────────────────────────────────────────────── */
function fmt(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
