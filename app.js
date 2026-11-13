// app.js
import GAMES from './data/games.json' assert { type: 'json' };

const grid = document.getElementById('games-grid');
const toggle = document.getElementById('theme-toggle');

function renderGames() {
  grid.innerHTML = GAMES.map(game => `
    <article class="game-card" data-id="${game.id}" tabindex="0">
      <img class="game-thumb" src="${game.thumb}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22%3E%3Crect fill=%22%231a1a2e%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23a855f7%22 font-size=%2224%22%3E${encodeURIComponent(game.title)}%3C/text%3E%3C/svg%22'">
      <div class="game-info">
        <h2 class="game-title">${game.title}</h2>
        ${game.comingSoon ? '<span class="badge">Em desenvolvimento</span>' : ''}
      </div>
      <a class="game-link" href="${game.url}" target="_blank" rel="noopener noreferrer" aria-label="Jogar ${game.title}"></a>
    </article>
  `).join('');
}

function initTheme() {
  const saved = localStorage.getItem('darkplp-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  updateToggleIcon(theme);
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

// Keyboard activation for cards
grid.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.game-card')) {
    e.preventDefault();
    const link = e.target.closest('.game-card').querySelector('.game-link');
    if (link) link.click();
  }
});

// Cross-tab theme sync
window.addEventListener('storage', e => {
  if (e.key === 'darkplp-theme' && e.newValue) {
    document.documentElement.dataset.theme = e.newValue;
    updateToggleIcon(e.newValue);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderGames();
});