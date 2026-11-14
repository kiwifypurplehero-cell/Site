/**
 * SearchModal Component - Global search with keyboard shortcut (Ctrl/Cmd+K)
 */

import { createEl, $, $$, onReady, trapFocus, keyMap } from '../utils/dom.js';
import { searchGames } from '../data.js';
import { formatNumber } from '../utils/format.js';

let searchModalInstance = null;

export function init(options = {}) {
  const {
    trigger = 'global-search',
    placeholder = 'Buscar jogos, amigos, conquistas...',
    shortcut = 'Mod+K',
    onResultClick = null,
    onClose = null,
    maxResults = 8,
  } = options;

  // Create modal structure
  const modal = createEl('div', { class: 'search-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Busca global', hidden: true });
  const overlay = createEl('div', { class: 'search-modal__overlay' });
  const panel = createEl('div', { class: 'search-modal__panel' });

  const header = createEl('div', { class: 'search-modal__header' }, [
    createEl('svg', { class: 'search-modal__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true' }, [
      createEl('circle', { cx: '11', cy: '11', r: '8' }),
      createEl('path', { d: 'M21 21l-4.35-4.35' }),
    ]),
    createEl('input', {
      class: 'search-modal__input',
      type: 'search',
      placeholder,
      autocomplete: 'off',
      'aria-label': placeholder,
      'aria-autocomplete': 'list',
      'aria-controls': 'search-results',
    }),
    createEl('kbd', { class: 'search-modal__shortcut' }, formatShortcut(shortcut)),
  ]);

  const results = createEl('div', { class: 'search-modal__results', id: 'search-results', role: 'listbox' });

  const footer = createEl('div', { class: 'search-modal__footer' }, [
    createEl('span', { class: 'search-modal__hint' }, `Pressione ${formatShortcut(shortcut)} para fechar`),
  ]);

  panel.append(header, results, footer);
  modal.append(overlay, panel);
  document.body.appendChild(modal);

  const input = modal.querySelector('.search-modal__input');
  let debounceTimer = null;
  let selectedIndex = -1;
  let currentResults = [];

  const instance = {
    element: modal,
    input,
    results,
    open: false,
    options: { onResultClick, onClose, maxResults, shortcut },
    selectedIndex: -1,
  };

  searchModalInstance = instance;

  // Event handlers
  function handleInput(e) {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(query), 100);
  }

  function performSearch(query) {
    if (!query) {
      showEmptyState();
      return;
    }

    const results = searchGames(query).slice(0, instance.options.maxResults);
    currentResults = results;
    selectedIndex = -1;
    renderResults(results);
  }

  function renderResults(results) {
    results.innerHTML = '';

    if (results.length === 0) {
      showEmptyState();
      return;
    }

    results.forEach((game, index) => {
      const item = createEl('button', {
        class: 'search-modal__item',
        role: 'option',
        'aria-selected': 'false',
        'data-index': index,
        'data-id': game.id,
      }, [
        createEl('div', { class: 'search-modal__item-cover' }, [
          createEl('img', { src: game.cover, alt: '', width: '48', height: '64', loading: 'lazy' }),
        ]),
        createEl('div', { class: 'search-modal__item-info' }, [
          createEl('span', { class: 'search-modal__item-title' }, game.title),
          createEl('span', { class: 'search-modal__item-meta' }, `${game.genre} · ${formatNumber(game.rating)} ⭐`),
        ]),
      ]);

      item.addEventListener('click', () => selectResult(game));
      item.addEventListener('mouseenter', () => setSelected(index));
      results.appendChild(item);
    });
  }

  function showEmptyState() {
    results.innerHTML = '';
    results.appendChild(createEl('div', { class: 'search-modal__empty' }, 'Nenhum resultado encontrado'));
    selectedIndex = -1;
  }

  function setSelected(index) {
    const items = results.querySelectorAll('.search-modal__item');
    items.forEach((item, i) => {
      const selected = i === index;
      item.classList.toggle('search-modal__item--selected', selected);
      item.setAttribute('aria-selected', selected);
    });
    selectedIndex = index;
  }

  function selectResult(game) {
    close();
    instance.options.onResultClick?.(game, instance);
  }

  function open() {
    if (instance.open) return;
    instance.open = true;
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('search-modal--open');
      input.focus();
      input.value = '';
      performSearch('');
    });
    trapFocus(modal);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!instance.open) return;
    instance.open = false;
    modal.classList.remove('search-modal--open');
    setTimeout(() => {
      modal.hidden = true;
      input.value = '';
      results.innerHTML = '';
    }, 200);
    document.body.style.overflow = '';
    instance.options.onClose?.(instance);
  }

  function handleKeydown(e) {
    const items = results.querySelectorAll('.search-modal__item');
    const itemCount = items.length;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (itemCount > 0) {
          const next = selectedIndex < itemCount - 1 ? selectedIndex + 1 : 0;
          setSelected(next);
          items[next]?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (itemCount > 0) {
          const prev = selectedIndex > 0 ? selectedIndex - 1 : itemCount - 1;
          setSelected(prev);
          items[prev]?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && currentResults[selectedIndex]) {
          selectResult(currentResults[selectedIndex]);
        }
        break;
      case 'Tab':
        // Allow default tab behavior but close if tabbing out
        if (e.shiftKey && document.activeElement === input) {
          e.preventDefault();
          items[itemCount - 1]?.focus();
        } else if (!e.shiftKey && document.activeElement === items[itemCount - 1]) {
          e.preventDefault();
          input.focus();
        }
        break;
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlay) close();
  }

  function handleShortcut(e) {
    if (keyMap.matches(e, shortcut)) {
      e.preventDefault();
      instance.open ? close() : open();
    }
  }

  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeydown);
  overlay.addEventListener('click', handleOverlayClick);
  document.addEventListener('keydown', handleShortcut);

  // Cleanup
  instance.destroy = () => {
    input.removeEventListener('input', handleInput);
    input.removeEventListener('keydown', handleKeydown);
    overlay.removeEventListener('click', handleOverlayClick);
    document.removeEventListener('keydown', handleShortcut);
    modal.remove();
    searchModalInstance = null;
  };

  return instance;
}

function formatShortcut(shortcut) {
  return shortcut
    .replace('Mod', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace(' ', ' + ');
}

export function open() {
  searchModalInstance?.open?.();
}

export function close() {
  searchModalInstance?.close?.();
}

export function toggle() {
  if (searchModalInstance?.open) close();
  else open();
}

export function getInstance() {
  return searchModalInstance;
}

export default { init, open, close, toggle, getInstance };