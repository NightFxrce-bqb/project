// API Base URL - adjust for production
const API_BASE = window.location.origin + '/api';

// State
let authToken = localStorage.getItem('pifpaf_token');
let currentUser = JSON.parse(localStorage.getItem('pifpaf_user') || 'null');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (authToken && currentUser) {
    showDashboard();
  } else {
    showAuth();
  }
});

// Auth Functions
function showAuth() {
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('user-name').textContent = currentUser.name;
  loadReels();
  loadAnalytics();
}

function showRegister() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Ошибка входа';
      return;
    }

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('pifpaf_token', authToken);
    localStorage.setItem('pifpaf_user', JSON.stringify(currentUser));
    
    errorEl.textContent = '';
    showDashboard();
  } catch (err) {
    errorEl.textContent = 'Ошибка соединения';
  }
});

// Register Form
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Ошибка регистрации';
      return;
    }

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('pifpaf_token', authToken);
    localStorage.setItem('pifpaf_user', JSON.stringify(currentUser));
    
    errorEl.textContent = '';
    showDashboard();
  } catch (err) {
    errorEl.textContent = 'Ошибка соединения';
  }
});

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('pifpaf_token');
  localStorage.removeItem('pifpaf_user');
  showAuth();
}

// API Helpers
async function apiRequest(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error('Session expired');
  }

  return res.json();
}

// Reels Functions
async function loadReels() {
  const grid = document.getElementById('reels-grid');
  const emptyState = document.getElementById('empty-state');
  
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await apiRequest('/reels');
    const reels = data.reels || [];

    grid.innerHTML = '';

    if (reels.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    reels.forEach(reel => {
      const card = createReelCard(reel);
      grid.innerHTML += card;
    });
  } catch (err) {
    grid.innerHTML = '<p style="color: var(--error)">Ошибка загрузки</p>';
  }
}

function createReelCard(reel) {
  const views = formatNumber(reel.views);
  const date = formatDate(reel.published_at);
  const thumbnail = reel.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400';

  return `
    <div class="reel-card" data-id="${reel.id}">
      <div class="reel-thumbnail">
        <img src="${thumbnail}" alt="Reel thumbnail" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'">
        <div class="reel-overlay">
          <div class="reel-stats">
            <span class="reel-views">👁 ${views}</span>
            <span class="reel-date">${date}</span>
          </div>
        </div>
      </div>
      <div class="reel-actions">
        <button onclick="refreshReel(${reel.id})">🔄 Обновить</button>
        <button class="delete" onclick="deleteReel(${reel.id})">🗑 Удалить</button>
      </div>
    </div>
  `;
}

async function deleteReel(id) {
  if (!confirm('Удалить этот Reel?')) return;

  try {
    await apiRequest(`/reels/${id}`, { method: 'DELETE' });
    loadReels();
    loadAnalytics();
  } catch (err) {
    alert('Ошибка удаления');
  }
}

async function refreshReel(id) {
  const card = document.querySelector(`.reel-card[data-id="${id}"]`);
  card.style.opacity = '0.5';

  try {
    await apiRequest(`/reels/${id}/refresh`, { method: 'POST' });
    loadReels();
    loadAnalytics();
  } catch (err) {
    alert('Ошибка обновления');
  } finally {
    card.style.opacity = '1';
  }
}

// Analytics Functions
async function loadAnalytics() {
  const period = document.getElementById('period-filter').value;

  try {
    const data = await apiRequest(`/analytics/summary?period=${period}`);
    const summary = data.summary || {};

    document.getElementById('total-views').textContent = formatNumber(summary.total_views);
    document.getElementById('total-reels').textContent = formatNumber(summary.total_reels);
    document.getElementById('avg-views').textContent = formatNumber(Math.round(summary.avg_views));
  } catch (err) {
    console.error('Analytics error:', err);
  }
}

// Modal Functions
function showAddReelModal() {
  document.getElementById('add-reel-modal').classList.remove('hidden');
}

function hideAddReelModal() {
  document.getElementById('add-reel-modal').classList.add('hidden');
  document.getElementById('add-reel-form').reset();
  document.getElementById('add-reel-error').textContent = '';
}

document.getElementById('add-reel-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = document.getElementById('reel-url').value;
  const errorEl = document.getElementById('add-reel-error');

  try {
    const res = await fetch(`${API_BASE}/reels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ reelUrl: url })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Ошибка добавления';
      return;
    }

    hideAddReelModal();
    loadReels();
    loadAnalytics();
  } catch (err) {
    errorEl.textContent = 'Ошибка соединения';
  }
});

// Utility Functions
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Close modal on outside click
document.getElementById('add-reel-modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    hideAddReelModal();
  }
});