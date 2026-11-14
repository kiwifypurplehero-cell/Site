/**
 * Skeleton Component - Loading placeholder with shimmer animation
 */

import { createEl, $ } from '../utils/dom.js';

const skeletons = new Map();

export function init(container, options = {}) {
  const {
    variant = 'text', // text, circular, rectangular, card, avatar
    rows = 3,
    width = '100%',
    height = '',
    animated = true,
    className = '',
  } = options;

  const skeletonEl = typeof container === 'string' ? $(container) : container;
  if (!skeletonEl) return;

  const skeleton = createEl('div', {
    class: `skeleton skeleton--${variant} ${animated ? 'skeleton--animated' : ''} ${className}`,
    'aria-hidden': 'true',
    role: 'status',
    'aria-label': 'Carregando...',
    style: `--skeleton-width: ${width}; ${height ? `--skeleton-height: ${height};` : ''}`,
  });

  switch (variant) {
    case 'text':
      for (let i = 0; i < rows; i++) {
        skeleton.appendChild(createEl('div', { class: 'skeleton__line' }));
      }
      break;
    case 'circular':
      skeleton.appendChild(createEl('div', { class: 'skeleton__circle' }));
      break;
    case 'rectangular':
      skeleton.appendChild(createEl('div', { class: 'skeleton__rect' }));
      break;
    case 'avatar':
      skeleton.appendChild(createEl('div', { class: 'skeleton__avatar' }));
      break;
    case 'card':
      skeleton.appendChild(createEl('div', { class: 'skeleton__card-image' }));
      for (let i = 0; i < Math.max(2, rows); i++) {
        skeleton.appendChild(createEl('div', { class: 'skeleton__line' }));
      }
      break;
    default:
      for (let i = 0; i < rows; i++) {
        skeleton.appendChild(createEl('div', { class: 'skeleton__line' }));
      }
  }

  skeletonEl.innerHTML = '';
  skeletonEl.appendChild(skeleton);

  const instance = {
    element: skeletonEl,
    skeleton,
    variant,
  };

  skeletons.set(skeletonEl, instance);
  return instance;
}

export function show(skeletonEl) {
  const instance = skeletons.get(skeletonEl);
  if (!instance) return;
  instance.skeleton.hidden = false;
  instance.skeleton.style.display = '';
}

export function hide(skeletonEl) {
  const instance = skeletons.get(skeletonEl);
  if (!instance) return;
  instance.skeleton.hidden = true;
}

export function setRows(skeletonEl, rows) {
  const instance = skeletons.get(skeletonEl);
  if (!instance || instance.variant !== 'text') return;

  const lines = instance.skeleton.querySelectorAll('.skeleton__line');
  const currentRows = lines.length;

  if (rows > currentRows) {
    for (let i = currentRows; i < rows; i++) {
      instance.skeleton.appendChild(createEl('div', { class: 'skeleton__line' }));
    }
  } else if (rows < currentRows) {
    for (let i = rows; i < currentRows; i++) {
      lines[i]?.remove();
    }
  }
}

export function getInstance(element) {
  return skeletons.get(element);
}

export function destroy(element) {
  skeletons.delete(element);
}

export default { init, show, hide, setRows, getInstance, destroy };