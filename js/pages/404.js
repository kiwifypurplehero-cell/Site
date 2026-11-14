/**
 * 404 Page - Not found with friendly message and redirect
 */

import { createEl, $, onReady } from '../utils/dom.js';

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  main.innerHTML = `
    <div class="page page--404" data-page="404">
      <div class="page__404">
        <div class="page__404-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="120" height="120">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
        <h1 class="page__404-title">Página não encontrada</h1>
        <p class="page__404-message">Oops! Parece que esta página foi para o mundo dos jogos perdidos.</p>
        <div class="page__404-actions">
          <a href="#home" class="btn btn--primary btn--lg" id="back-home-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Voltar ao Início
          </a>
          <a href="#library" class="btn btn--secondary btn--lg" id="back-library-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Ir para Biblioteca
          </a>
        </div>
        <div class="page__404-suggestions" id="suggestions">
          <h2 class="page__404-suggestions-title">Talvez você queira:</h2>
          <div class="page__404-links">
            <a href="#store" class="page__404-link">Explorar a Loja</a>
            <a href="#profile" class="page__404-link">Ver seu Perfil</a>
            <a href="#settings" class="page__404-link">Configurações</a>
          </div>
        </div>
        <p class="page__404-redirect">Redirecionando automaticamente em <span id="countdown">5</span> segundos...</p>
      </div>
    </div>
  `;

  // Start countdown redirect
  startCountdown();

  // Bind button events
  $('#back-home-btn', main)?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#home';
  });

  $('#back-library-btn', main)?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#library';
  });

  return {};
}

function startCountdown() {
  const countdownEl = $('#countdown');
  if (!countdownEl) return;

  let count = 5;
  const interval = setInterval(() => {
    count--;
    countdownEl.textContent = count;
    if (count <= 0) {
      clearInterval(interval);
      window.location.hash = '#home';
    }
  }, 1000);
}

export function cleanup() {}

export default { render, cleanup };