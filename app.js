// app.js - Dark-PLP Main Application
import * as Auth from './js/auth.js';

const grid = document.getElementById('games-grid');
const toggle = document.getElementById('theme-toggle');
let GAMES = [];

// ============ Auth & Session Management ============
let guestTimerInterval = null;
let lastFocused = null;

async function initAuth() {
  const session = Auth.getSession();
  if (!session) {
    // First visit → create guest session
    Auth.createGuestSession();
    startGuestTimer();
  } else if (session.isGuest) {
    if (Auth.isGuestExpired(session)) {
      showGuestExpiredModal();
    } else {
      startGuestTimer(session.guestExpiresAt);
    }
  } else {
    // Logged in user
    updateUIForUser(session);
  }
}

function updateUIForUser(session) {
  const timerEl = document.getElementById('guest-timer');
  timerEl.hidden = true;
  clearInterval(guestTimerInterval);

  // Update profile section in settings if open
  populateProfileSettings(session);
}

function startGuestTimer(expiresAt = null) {
  const timerEl = document.getElementById('guest-timer');
  const textEl = document.getElementById('guest-timer-text');
  const endTime = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 30 * 60 * 1000;

  function update() {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      clearInterval(guestTimerInterval);
      showGuestExpiredModal();
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    textEl.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
    timerEl.classList.toggle('warning', remaining < 60000);
    timerEl.classList.toggle('expired', remaining < 10000);
  }
  update();
  guestTimerInterval = setInterval(update, 1000);
  timerEl.hidden = false;
}

// ============ Games Loading & Rendering ============
async function loadGames() {
  try {
    const res = await fetch('./data/games.json');
    if (!res.ok) throw new Error('Failed to load games');
    GAMES = await res.json();
    renderGames();
  } catch (err) {
    console.error('Error loading games:', err);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--fg);">
        <p>Erro ao carregar jogos. Tente recarregar a página.</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent); color: #fff; border: none; border-radius: var(--radius); cursor: pointer;">Recarregar</button>
      </div>
    `;
  }
}

function renderGames() {
  const session = Auth.getSession();
  const isGuest = session?.isGuest ?? true;

  grid.innerHTML = GAMES.map(game => `
    <article class="game-card" data-id="${game.id}" tabindex="0">
      <img class="game-thumb" src="${game.thumb}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22%3E%3Crect fill=%22%231a1a2e%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2224%22%3E${encodeURIComponent(game.title)}%3C/text%3E%3C/svg%22'">
      <div class="game-info">
        <h2 class="game-title">${game.title}</h2>
        ${game.comingSoon ? '<span class="badge">Em desenvolvimento</span>' : ''}
        ${isGuest && !game.comingSoon ? '<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #fbbf24); margin-top: 0.25rem;">Login para jogar</span>' : ''}
      </div>
      <a class="game-link" href="${game.url}" target="_blank" rel="noopener noreferrer" aria-label="Jogar ${game.title}"></a>
    </article>
  `).join('');
}

// ============ Theme ============
function initTheme() {
  const saved = localStorage.getItem('darkplp-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  updateToggleIcon(theme);

  // Apply saved accent color
  const savedAccent = localStorage.getItem('darkplp-accent');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent', savedAccent);
    document.documentElement.style.setProperty('--accent-glow', hexToRgba(savedAccent, 0.4));
    document.documentElement.style.setProperty('--accent-strong', lightenColor(savedAccent, 20));
  }
}

function updateToggleIcon(theme) {
  toggle.innerHTML = theme === 'dark'
    ? '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
}

toggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('darkplp-theme', next);
  updateToggleIcon(next);
});

// Cross-tab theme sync
window.addEventListener('storage', e => {
  if (e.key === 'darkplp-theme' && e.newValue) {
    document.documentElement.dataset.theme = e.newValue;
    updateToggleIcon(e.newValue);
  }
  if (e.key === 'darkplp-accent' && e.newValue) {
    document.documentElement.style.setProperty('--accent', e.newValue);
    document.documentElement.style.setProperty('--accent-glow', hexToRgba(e.newValue, 0.4));
    document.documentElement.style.setProperty('--accent-strong', lightenColor(e.newValue, 20));
  }
});

// ============ Keyboard activation for cards ============
grid.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.game-card')) {
    e.preventDefault();
    const link = e.target.closest('.game-card').querySelector('.game-link');
    if (link) link.click();
  }
});

// ============ Footer Buttons ============
document.getElementById('footer-games').addEventListener('click', () => {
  document.getElementById('games-grid').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('footer-search').addEventListener('click', openSearchModal);
document.getElementById('footer-settings').addEventListener('click', openSettingsPanel);

// ============ Search Modal ============
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.hidden = false;
  document.getElementById('search-input').focus();
  document.body.style.overflow = 'hidden';
  renderSearchResults(GAMES);
  trapFocus(modal);
}

function closeSearchModal() {
  document.getElementById('search-modal').hidden = true;
  document.body.style.overflow = '';
  releaseFocus();
}

function renderSearchResults(games) {
  const container = document.getElementById('search-results');
  if (games.length === 0) {
    container.innerHTML = '<p class="search-empty">Nenhum jogo encontrado</p>';
    return;
  }
  const session = Auth.getSession();
  const isGuest = session?.isGuest ?? true;
  container.innerHTML = games.map(game => `
    <article class="game-card search-result-card" data-id="${game.id}" tabindex="0">
      <img class="game-thumb" src="${game.thumb}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22%3E%3Crect fill=%22%231a1a2e%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2224%22%3E${encodeURIComponent(game.title)}%3C/text%3E%3C/svg%22'">
      <div class="game-info">
        <h2 class="game-title">${game.title}</h2>
        ${game.comingSoon ? '<span class="badge">Em desenvolvimento</span>' : ''}
        ${isGuest && !game.comingSoon ? '<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #fbbf24); margin-top: 0.25rem;">Login para jogar</span>' : ''}
      </div>
      <a class="game-link" href="${game.url}" target="_blank" rel="noopener noreferrer" aria-label="Jogar ${game.title}"></a>
    </article>
  `).join('');
}

let searchDebounce = null;
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = GAMES.filter(g => g.title.toLowerCase().includes(query));
    renderSearchResults(filtered);
  }, 150);
});

// Close search modal on backdrop click or ESC
document.getElementById('search-modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
    closeSearchModal();
  }
});

// ============ Settings Panel ============
function openSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const profileSection = document.getElementById('settings-profile');
  const logoutBtn = document.getElementById('settings-logout');
  const session = Auth.getSession();

  // Show/hide profile section based on auth
  profileSection.hidden = !session || session.isGuest;
  logoutBtn.hidden = !session || session.isGuest;

  // Populate profile fields if logged in
  if (session && !session.isGuest) {
    populateProfileSettings(session);
  }

  // Load saved settings
  loadSettings();

  panel.hidden = false;
  document.body.style.overflow = 'hidden';
  trapFocus(panel);
}

function closeSettingsPanel() {
  document.getElementById('settings-panel').hidden = true;
  document.body.style.overflow = '';
  releaseFocus();
}

function populateProfileSettings(session) {
  const profile = Auth.getProfile();
  if (!profile) return;

  document.getElementById('setting-username').value = profile.username || '';
  document.getElementById('setting-avatar').value = profile.avatar || '🎮';
}

function loadSettings() {
  // Theme
  const savedTheme = localStorage.getItem('darkplp-theme') || 'system';
  document.getElementById('setting-theme').value = savedTheme;

  // Accent color
  const savedAccent = localStorage.getItem('darkplp-accent') || '#a855f7';
  document.getElementById('setting-accent').value = savedAccent;

  // Accessibility
  document.getElementById('setting-reduced-motion').checked = localStorage.getItem('darkplp-reduced-motion') === 'true';
  document.getElementById('setting-high-contrast').checked = localStorage.getItem('darkplp-high-contrast') === 'true';
  document.getElementById('setting-font-size').value = localStorage.getItem('darkplp-font-size') || '1';

  // Apply accessibility settings
  applyAccessibilitySettings();
}

function applyAccessibilitySettings() {
  const reducedMotion = localStorage.getItem('darkplp-reduced-motion') === 'true';
  const highContrast = localStorage.getItem('darkplp-high-contrast') === 'true';
  const fontSize = localStorage.getItem('darkplp-font-size') || '1';

  document.documentElement.style.setProperty('--font-scale', fontSize);
  document.documentElement.classList.toggle('high-contrast', highContrast);

  if (reducedMotion) {
    document.documentElement.style.setProperty('--transition', '0ms');
  } else {
    document.documentElement.style.setProperty('--transition', '200ms ease');
  }
}

function initSettingsControls() {
  // Theme select
  document.getElementById('setting-theme').addEventListener('change', (e) => {
    const theme = e.target.value;
    localStorage.setItem('darkplp-theme', theme);
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      document.documentElement.dataset.theme = theme;
    }
    updateToggleIcon(document.documentElement.dataset.theme);
  });

  // Accent color
  document.getElementById('setting-accent').addEventListener('input', (e) => {
    const color = e.target.value;
    localStorage.setItem('darkplp-accent', color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', hexToRgba(color, 0.4));
    document.documentElement.style.setProperty('--accent-strong', lightenColor(color, 20));
  });

  // Reduced motion
  document.getElementById('setting-reduced-motion').addEventListener('change', (e) => {
    localStorage.setItem('darkplp-reduced-motion', e.target.checked);
    applyAccessibilitySettings();
  });

  // High contrast
  document.getElementById('setting-high-contrast').addEventListener('change', (e) => {
    localStorage.setItem('darkplp-high-contrast', e.target.checked);
    applyAccessibilitySettings();
  });

  // Font size
  document.getElementById('setting-font-size').addEventListener('input', (e) => {
    localStorage.setItem('darkplp-font-size', e.target.value);
    applyAccessibilitySettings();
  });

  // Username update
  document.getElementById('setting-username').addEventListener('blur', async (e) => {
    const username = e.target.value.trim();
    if (username && username.length >= 2 && username.length <= 20) {
      try {
        await Auth.updateProfile({ username });
        showToast('Nome atualizado!');
      } catch (err) {
        showToast('Erro ao atualizar', 'error');
        e.target.value = Auth.getProfile()?.username || '';
      }
    }
  });

  // Avatar update
  document.getElementById('setting-avatar').addEventListener('change', async (e) => {
    try {
      await Auth.updateProfile({ avatar: e.target.value });
      showToast('Avatar atualizado!');
    } catch (err) {
      showToast('Erro ao atualizar', 'error');
    }
  });

  // Delete account
  document.getElementById('settings-delete-account').addEventListener('click', handleDeleteAccount);

  // Logout
  document.getElementById('settings-logout').addEventListener('click', async () => {
    Auth.logout();
    closeSettingsPanel();
    location.reload();
  });
}

// ============ Auth Modals ============
let currentAuthMode = 'login';

function showAuthModal(mode = 'login') {
  currentAuthMode = mode;
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-title');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const switchText = document.getElementById('auth-switch-text');
  const toggleBtn = document.getElementById('auth-toggle');

  // Clear errors
  document.querySelectorAll('.error').forEach(el => el.textContent = '');
  loginForm.reset();
  registerForm.reset();

  if (mode === 'login') {
    title.textContent = 'Entrar';
    loginForm.hidden = false;
    registerForm.hidden = true;
    switchText.textContent = 'Não tem conta? ';
    toggleBtn.textContent = 'Criar conta';
  } else {
    title.textContent = 'Criar Conta';
    loginForm.hidden = true;
    registerForm.hidden = false;
    switchText.textContent = 'Já tem conta? ';
    toggleBtn.textContent = 'Fazer login';
  }

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  trapFocus(modal);

  // Focus first input
  setTimeout(() => {
    const firstInput = mode === 'login'
      ? document.getElementById('login-email')
      : document.getElementById('reg-username');
    firstInput?.focus();
  }, 100);
}

function hideAuthModal() {
  document.getElementById('auth-modal').hidden = true;
  document.body.style.overflow = '';
  releaseFocus();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-email-error');

  try {
    await Auth.login(email, password);
    hideAuthModal();
    location.reload();
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  // Clear previous errors
  document.querySelectorAll('#register-form .error').forEach(el => el.textContent = '');

  let hasError = false;
  if (!username || username.length < 2) {
    document.getElementById('reg-username-error').textContent = 'Mínimo 2 caracteres';
    hasError = true;
  }
  if (!email.includes('@')) {
    document.getElementById('reg-email-error').textContent = 'Email inválido';
    hasError = true;
  }
  if (password.length < 8) {
    document.getElementById('reg-password-error').textContent = 'Mínimo 8 caracteres';
    hasError = true;
  }
  if (password !== confirm) {
    document.getElementById('reg-confirm-error').textContent = 'Senhas não coincidem';
    hasError = true;
  }
  if (hasError) return;

  try {
    await Auth.register(username, email, password);
    hideAuthModal();
    location.reload();
  } catch (err) {
    document.getElementById('reg-email-error').textContent = err.message;
  }
}

document.getElementById('auth-toggle').addEventListener('click', () => {
  showAuthModal(currentAuthMode === 'login' ? 'register' : 'login');
});

document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('register-form').addEventListener('submit', handleRegister);

// Close auth modal on backdrop click or close button
document.getElementById('auth-modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
    hideAuthModal();
  }
});

// ============ Guest Expired Modal ============
function showGuestExpiredModal() {
  document.getElementById('guest-timer').hidden = true;
  clearInterval(guestTimerInterval);
  document.getElementById('guest-expired-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  trapFocus(document.getElementById('guest-expired-modal'));
}

document.getElementById('guest-to-register').addEventListener('click', () => {
  document.getElementById('guest-expired-modal').hidden = true;
  showAuthModal('register');
});

document.getElementById('guest-to-login').addEventListener('click', () => {
  document.getElementById('guest-expired-modal').hidden = true;
  showAuthModal('login');
});

// Close guest expired modal on backdrop click
document.getElementById('guest-expired-modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    // Don't allow closing - they must choose
  }
});

// ============ Delete Account Flow ============
async function handleDeleteAccount() {
  const warningEl = document.getElementById('delete-warning');
  const confirmInput = document.getElementById('delete-confirm-input');
  const username = confirmInput.value.trim();
  const session = Auth.getSession();
  const profile = Auth.getProfile();

  if (!session || session.isGuest || !profile) return;

  // Show warning and confirmation input
  warningEl.hidden = false;
  confirmInput.hidden = false;
  confirmInput.focus();

  // Replace button with confirmation flow
  const deleteBtn = document.getElementById('settings-delete-account');
  deleteBtn.textContent = 'Confirmar Exclusão';
  deleteBtn.onclick = async () => {
    if (username !== profile.username) {
      showToast('Nome de usuário incorreto', 'error');
      confirmInput.value = '';
      return;
    }

    // Ask for password confirmation
    const password = prompt('Digite sua senha para confirmar a exclusão permanente:');
    if (!password) return;

    try {
      // Use emailHash from session for secure deletion
      await Auth.deleteAccountByHash(session.userEmailHash, password);
      showToast('Conta excluída permanentemente');
      closeSettingsPanel();
      location.reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

// ============ Focus Trap ============
function trapFocus(element) {
  lastFocused = document.activeElement;
  const focusable = element.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleTabTrap(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTabTrap);
  element._focusTrapHandler = handleTabTrap;
  first?.focus();
}

function releaseFocus() {
  const panel = document.getElementById('settings-panel');
  const searchModal = document.getElementById('search-modal');
  const authModal = document.getElementById('auth-modal');
  const guestModal = document.getElementById('guest-expired-modal');

  [panel, searchModal, authModal, guestModal].forEach(el => {
    if (el._focusTrapHandler) {
      el.removeEventListener('keydown', el._focusTrapHandler);
      el._focusTrapHandler = null;
    }
  });

  lastFocused?.focus();
  lastFocused = null;
}

// ============ Utility Functions ============
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex, percent) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * percent / 100));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: ${type === 'error' ? '#ef4444' : 'var(--accent)'};
    color: #fff; padding: 1rem 1.5rem; border-radius: var(--radius);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 1000;
    animation: toast-in 200ms ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 200ms ease forwards';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes toast-out { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }
  .high-contrast { filter: contrast(1.5); }
  html { font-size: calc(16px * var(--font-scale, 1)); }
`;
document.head.appendChild(style);

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadGames();
  await initAuth();
  initSettingsControls();

  // Close modals on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('search-modal').hidden) closeSearchModal();
      if (!document.getElementById('settings-panel').hidden) closeSettingsPanel();
      if (!document.getElementById('auth-modal').hidden) hideAuthModal();
      // Guest expired modal cannot be closed with ESC
    }
  });
});