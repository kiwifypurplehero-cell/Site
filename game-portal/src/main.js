// Game data - mock games (você substitui por seus jogos reais depois)
// Thumbnails agora são SVGs inline (sem dependência externa)
const GAMES = [
  {
    id: 'snake-test',
    title: 'Snake Test 🐍',
    description: 'Snake funcional para testar o portal — setas/WASD, Espaço pausa/reinicia',
    thumbnail: 'snake',
    category: 'Arcade',
    url: 'games/snake-test/index.html',
    featured: true
  },
  {
    id: 'space-shooter',
    title: 'Space Shooter',
    description: 'Destrua naves alienígenas em ondas infinitas',
    thumbnail: 'spaceship',
    category: 'Ação',
    url: 'games/space-shooter/index.html',
    featured: false
  },
  {
    id: 'platformer',
    title: 'Pixel Platformer',
    description: 'Corra, pule e colete moedas em mundos pixelados',
    thumbnail: 'platformer',
    category: 'Plataforma',
    url: 'games/platformer/index.html',
    featured: false
  },
  {
    id: 'puzzle-merge',
    title: 'Merge Puzzle',
    description: 'Combine blocos iguais e alcance o 2048',
    thumbnail: 'puzzle',
    category: 'Puzzle',
    url: 'games/puzzle-merge/index.html',
    featured: false
  },
  {
    id: 'racing-neon',
    title: 'Neon Racer',
    description: 'Corra em pistas neon com física arcade',
    thumbnail: 'racing',
    category: 'Corrida',
    url: 'games/racing-neon/index.html',
    featured: true
  },
  {
    id: 'rpg-idle',
    title: 'Idle RPG',
    description: 'Evolua heróis automaticamente enquanto você está AFK',
    thumbnail: 'rpg',
    category: 'RPG',
    url: 'games/rpg-idle/index.html',
    featured: false
  },
  {
    id: 'snake-modern',
    title: 'Snake Modern',
    description: 'O clássico Snake com power-ups e multiplayer local',
    thumbnail: 'snake',
    category: 'Arcade',
    url: 'games/snake-modern/index.html',
    featured: false
  },
  {
    id: 'tower-defense',
    title: 'Tower Defense',
    description: 'Posicione torres e defenda sua base contra hordas',
    thumbnail: 'tower',
    category: 'Estratégia',
    url: 'games/tower-defense/index.html',
    featured: false
  },
  {
    id: 'breakout-revived',
    title: 'Breakout Revived',
    description: 'Quebre todos os tijolos com power-ups insanos',
    thumbnail: 'breakout',
    category: 'Arcade',
    url: 'games/breakout-revived/index.html',
    featured: true
  }
];

// Thumbnails SVG inline (zero dependência externa)
const THUMBNAILS = {
  snake: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><path d="M160 90 L180 90 L180 110 L200 110 L200 130 L180 130 L180 150 L160 150 L160 130 L140 130 L140 110 L160 110 L160 90" fill="#b84dff" opacity="0.3"/><circle cx="160" cy="90" r="8" fill="#b84dff"/><circle cx="140" cy="90" r="6" fill="#b84dff" opacity="0.7"/><circle cx="120" cy="90" r="6" fill="#00ffc8" opacity="0.5"/></svg>`,
  spaceship: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><path d="M160 40 L180 100 L160 130 L140 100 Z" fill="#b84dff" opacity="0.3"/><ellipse cx="160" cy="100" rx="30" ry="15" stroke="#b84dff" stroke-width="2" fill="none"/><circle cx="160" cy="100" r="8" fill="#00ffc8"/></svg>`,
  platformer: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><rect x="60" y="120" width="200" height="10" rx="2" fill="#2a0a3e"/><rect x="100" y="100" width="40" height="20" rx="2" fill="#b84dff" opacity="0.3"/><rect x="180" y="80" width="40" height="40" rx="2" fill="#b84dff" opacity="0.2"/><circle cx="160" cy="60" r="18" fill="#00ffc8" opacity="0.3"/><circle cx="160" cy="60" r="12" fill="#00ffc8"/></svg>`,
  puzzle: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><g fill="#b84dff" opacity="0.3"><rect x="80" y="50" width="50" height="50" rx="6"/><rect x="145" y="50" width="50" height="50" rx="6" fill="#00ffc8"/><rect x="80" y="115" width="50" height="50" rx="6" fill="#00ffc8"/><rect x="145" y="115" width="50" height="50" rx="6"/></g></svg>`,
  racing: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><path d="M20 140 Q160 60 300 140" stroke="#b84dff" stroke-width="8" fill="none" opacity="0.3"/><ellipse cx="160" cy="110" rx="35" ry="15" fill="#b84dff" opacity="0.2"/><ellipse cx="160" cy="115" rx="25" ry="10" fill="#00ffc8" opacity="0.3"/></svg>`,
  rpg: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><path d="M160 50 L190 110 L130 110 Z" fill="#b84dff" opacity="0.3"/><rect x="145" y="110" width="30" height="40" rx="3" fill="#b84dff" opacity="0.2"/><circle cx="160" cy="70" r="20" stroke="#00ffc8" stroke-width="2" fill="none"/><circle cx="160" cy="70" r="8" fill="#00ffc8"/></svg>`,
  tower: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><rect x="140" y="60" width="40" height="100" rx="4" fill="#b84dff" opacity="0.3"/><rect x="130" y="50" width="60" height="15" rx="3" fill="#b84dff" opacity="0.2"/><polygon points="160,30 180,50 140,50" fill="#00ffc8" opacity="0.5"/><circle cx="160" cy="100" r="12" fill="#b84dff"/></svg>`,
  breakout: `<svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="180" fill="#140020"/><g fill="#b84dff" opacity="0.3"><rect x="40" y="30" width="60" height="20" rx="2"/><rect x="110" y="30" width="60" height="20" rx="2" fill="#00ffc8"/><rect x="180" y="30" width="60" height="20" rx="2"/><rect x="250" y="30" width="60" height="20" rx="2" fill="#00ffc8"/></g><rect x="130" y="140" width="60" height="10" rx="3" fill="#b84dff"/><circle cx="160" cy="100" r="8" fill="#00ffc8"/></svg>`
};

// Estado da aplicação
let filteredGames = [...GAMES];
let selectedCategory = 'all';

// Elementos DOM
const app = document.querySelector('#app');

// Error overlay for mobile debugging
function setupErrorOverlay() {
  // Catch global errors
  window.addEventListener('error', (e) => {
    showErrorOverlay(`❌ JS Error: ${e.message}\n📄 ${e.filename}:${e.lineno}:${e.colno}`);
  });

  window.addEventListener('unhandledrejection', (e) => {
    showErrorOverlay(`❌ Promise Rejection: ${e.reason}`);
  });

  // Override console.error to catch
  const origError = console.error;
  console.error = (...args) => {
    origError.apply(console, args);
    if (args.some(a => typeof a === 'string' && a.includes('Error'))) {
      showErrorOverlay(`🔴 Console: ${args.join(' ')}`);
    }
  };
}

function showErrorOverlay(msg) {
  let overlay = document.getElementById('error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'error-overlay';
    overlay.style.cssText = `
      position: fixed; bottom: 10px; left: 10px; right: 10px; max-height: 40vh;
      background: rgba(10,0,20,0.98); border: 2px solid #ff3377; border-radius: 12px;
      padding: 12px; font: 12px/1.4 monospace; color: #ffcc00; z-index: 9999;
      overflow: auto; box-shadow: 0 0 30px rgba(255,51,119,0.5);
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(overlay);
  }
  const entry = document.createElement('div');
  entry.style.cssText = 'margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; white-space: pre-wrap;';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  overlay.appendChild(entry);
  overlay.scrollTop = overlay.scrollHeight;
}

// Inicialização
function init() {
  setupErrorOverlay();
  render();
  attachEvents();
}

// Render principal
function render() {
  const categories = ['all', ...new Set(GAMES.map(g => g.category))];

  app.innerHTML = `
    <!-- TEST BANNER - remove depois -->
    <div style="position:fixed;top:0;left:0;right:0;background:#b84dff;color:#05000a;text-align:center;padding:8px;font-weight:700;z-index:9999;font-family:system-ui;font-size:14px;">
      ✅ GAMEPORTAL CARREGOU — Se vê isto, HTML/JS/CSS funcionam
    </div>

    <!-- Top Footer -->
    <footer class="top-footer" role="contentinfo" aria-label="Links rápidos">
      <div class="top-footer-content">
        <nav class="top-footer-links" aria-label="Navegação principal">
          <a href="#jogos">Jogos</a>
          <span class="top-footer-divider" aria-hidden="true"></span>
          <a href="#sobre">Sobre</a>
          <span class="top-footer-divider" aria-hidden="true"></span>
          <a href="#comunidade">Comunidade</a>
          <span class="top-footer-divider" aria-hidden="true"></span>
          <a href="#suporte">Suporte</a>
        </nav>
        <div class="top-footer-status" aria-live="polite">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Online</span>
        </div>
      </div>
    </footer>

    <header class="header">
      <div class="header-content">
        <div class="logo" aria-label="GamePortal Home">
          <svg class="logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="currentColor"/>
            <path d="M8 12h16M8 16h12M8 20h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span class="logo-text">GamePortal</span>
        </div>

        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            id="search-input"
            placeholder="Buscar jogos..."
            aria-label="Buscar jogos"
            autocomplete="off"
          >
        </div>

        <div class="header-actions">
          <button class="btn-icon" id="theme-toggle" aria-label="Alternar tema" title="Alternar tema">
            <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </div>
      </div>

      <nav class="category-nav" aria-label="Categorias de jogos">
        <div class="category-scroll" id="category-scroll">
          ${categories.map(cat => `
            <button
              class="category-btn ${cat === 'all' ? 'active' : ''}"
              data-category="${cat}"
              aria-pressed="${cat === 'all'}"
            >
              ${cat === 'all' ? '🎮 Todos' : cat}
            </button>
          `).join('')}
        </div>
      </nav>
    </header>

    <main class="main">
      <div class="container">
        <div class="games-header">
          <h1 class="games-title">Biblioteca de Jogos</h1>
          <p class="games-subtitle">${filteredGames.length} jogo${filteredGames.length !== 1 ? 's' : ''} disponível${filteredGames.length !== 1 ? 'eis' : ''}</p>
        </div>

        <div class="games-grid" id="games-grid" role="list" aria-label="Lista de jogos">
          ${filteredGames.map(game => renderGameCard(game)).join('')}
        </div>

        ${filteredGames.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <h2>Nenhum jogo encontrado</h2>
            <p>Tente ajustar sua busca ou filtro</p>
          </div>
        ` : ''}
      </div>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <p>GamePortal — Seu portal de jogos HTML5</p>
        <div class="footer-links">
          <a href="#" aria-label="GitHub">GitHub</a>
          <a href="#" aria-label="Discord">Discord</a>
          <a href="#" aria-label="Sobre">Sobre</a>
        </div>
      </div>
    </footer>

    <!-- Modal de jogo -->
    <div class="game-modal" id="game-modal" role="dialog" aria-modal="true" aria-hidden="true" hidden>
      <div class="modal-backdrop" id="modal-backdrop"></div>
      <div class="modal-content" id="modal-content">
        <div class="modal-header">
          <div class="modal-game-info">
            <div class="modal-game-thumb" id="modal-game-thumb" aria-hidden="true"></div>
            <div>
              <h2 id="modal-game-title"></h2>
              <span class="modal-game-category" id="modal-game-category"></span>
            </div>
          </div>
          <button class="modal-close" id="modal-close" aria-label="Fechar jogo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <iframe
            id="game-iframe"
            src=""
            frameborder="0"
            allow="fullscreen; accelerometer; gyroscope"
            title="Jogo"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container" id="toast-container" aria-live="polite"></div>
  `;
}

// Render card de jogo
function renderGameCard(game) {
  const thumbSvg = THUMBNAILS[game.thumbnail] || THUMBNAILS.snake;
  return `
    <article class="game-card" data-game-id="${game.id}" role="listitem">
      <div class="game-thumb">
        <div class="thumb-svg" aria-hidden="true">${thumbSvg}</div>
        ${game.featured ? '<span class="featured-badge">⭐ Destaque</span>' : ''}
        <div class="game-overlay">
          <button class="play-btn" aria-label="Jogar ${game.title}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Jogar</span>
          </button>
        </div>
      </div>
      <div class="game-info">
        <span class="game-category">${game.category}</span>
        <h3 class="game-title">${game.title}</h3>
        <p class="game-desc">${game.description}</p>
      </div>
    </article>
  `;
}

// Anexar event listeners
function attachEvents() {
  // Busca
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', debounce(handleSearch, 150));

  // Categorias
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCategory(btn.dataset.category));
  });

  // Cards de jogo
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.play-btn')) {
        openGameModal(card.dataset.gameId);
      }
    });
    card.querySelector('.play-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openGameModal(card.dataset.gameId);
    });
  });

  // Modal
  document.getElementById('modal-close')?.addEventListener('click', closeGameModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeGameModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGameModal();
  });

  // Tema
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Scroll horizontal categorias (setas)
  setupCategoryScroll();
}

// Handlers
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  filterGames(query, selectedCategory);
}

function handleCategory(category) {
  selectedCategory = category;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
    btn.setAttribute('aria-pressed', btn.dataset.category === category);
  });
  const query = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  filterGames(query, category);
}

function filterGames(query, category) {
  filteredGames = GAMES.filter(game => {
    const matchesQuery = !query ||
      game.title.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.category.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || game.category === category;
    return matchesQuery && matchesCategory;
  });

  // Re-render apenas a grid
  const grid = document.getElementById('games-grid');
  grid.innerHTML = filteredGames.map(renderGameCard).join('');

  // Re-anexar eventos dos novos cards
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.play-btn')) {
        openGameModal(card.dataset.gameId);
      }
    });
    card.querySelector('.play-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openGameModal(card.dataset.gameId);
    });
  });

  // Atualizar contador
  const subtitle = document.querySelector('.games-subtitle');
  if (subtitle) {
    subtitle.textContent = `${filteredGames.length} jogo${filteredGames.length !== 1 ? 's' : ''} disponível${filteredGames.length !== 1 ? 'eis' : ''}`;
  }
}

function openGameModal(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;

  const modal = document.getElementById('game-modal');
  const iframe = document.getElementById('game-iframe');
  const thumbSvg = THUMBNAILS[game.thumbnail] || THUMBNAILS.snake;

  document.getElementById('modal-game-title').textContent = game.title;
  document.getElementById('modal-game-category').textContent = game.category;
  const thumbEl = document.getElementById('modal-game-thumb');
  thumbEl.innerHTML = thumbSvg;
  thumbEl.alt = game.title;

  // Mostrar modal primeiro, depois carregar iframe (animação suave)
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Pequeno delay para animação de entrada
  requestAnimationFrame(() => {
    modal.classList.add('open');
    iframe.src = game.url;
  });

  showToast(`Carregando ${game.title}...`);
}

function closeGameModal() {
  const modal = document.getElementById('game-modal');
  const iframe = document.getElementById('game-iframe');

  modal.classList.remove('open');
  document.body.style.overflow = '';

  // Esperar animação sair
  setTimeout(() => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    iframe.src = '';
  }, 250);
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  showToast(isDark ? '🌙 Modo escuro' : '☀️ Modo claro');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function setupCategoryScroll() {
  const scroll = document.getElementById('category-scroll');
  if (!scroll) return;

  let isDown = false;
  let startX, scrollLeft;

  scroll.addEventListener('mousedown', (e) => {
    isDown = true;
    scroll.classList.add('dragging');
    startX = e.pageX - scroll.offsetLeft;
    scrollLeft = scroll.scrollLeft;
  });

  scroll.addEventListener('mouseleave', () => { isDown = false; scroll.classList.remove('dragging'); });
  scroll.addEventListener('mouseup', () => { isDown = false; scroll.classList.remove('dragging'); });
  scroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scroll.offsetLeft;
    const walk = (x - startX) * 2;
    scroll.scrollLeft = scrollLeft - walk;
  });

  // Touch support
  scroll.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - scroll.offsetLeft;
    scrollLeft = scroll.scrollLeft;
  }, { passive: true });

  scroll.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - scroll.offsetLeft;
    const walk = (x - startX) * 2;
    scroll.scrollLeft = scrollLeft - walk;
  }, { passive: true });

  scroll.addEventListener('touchend', () => { isDown = false; });
}

// Debounce utility
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Inicializar tema salvo
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();

// Start
init();