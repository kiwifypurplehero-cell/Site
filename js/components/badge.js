/**
 * Badge Component - Status indicator, count badge, label badge
 */

import { createEl, $ } from '../utils/dom.js';

const badges = new Map();

export function init(container, options = {}) {
  const {
    content = '',
    variant = 'default', // default, success, warning, danger, info, ghost
    size = 'md', // sm, md, lg
    dot = false,
    dotColor = '',
    removable = false,
    onRemove = null,
    className = '',
  } = options;

  const badgeEl = typeof container === 'string' ? $(container) : container;
  if (!badgeEl) return;

  const badge = createEl('span', {
    class: `badge badge--${variant} badge--${size} ${dot ? 'badge--dot' : ''} ${removable ? 'badge--removable' : ''} ${className}`,
    'data-variant': variant,
  });

  if (dot) {
    const dotEl = createEl('span', { class: 'badge__dot', style: dotColor ? `--badge-dot-color: ${dotColor}` : '' });
    badge.appendChild(dotEl);
  }

  badge.appendChild(createEl('span', { class: 'badge__content' }, content));

  if (removable) {
    const removeBtn = createEl('button', {
      class: 'badge__remove',
      'aria-label': 'Remover',
      type: 'button',
      onclick: e => {
        e.stopPropagation();
        onRemove?.(instance);
        destroy(badgeEl);
      },
    }, '×');
    badge.appendChild(removeBtn);
  }

  badgeEl.innerHTML = '';
  badgeEl.appendChild(badge);

  const instance = {
    element: badgeEl,
    badge,
    content: badge.querySelector('.badge__content'),
    onRemove,
  };

  badges.set(badgeEl, instance);
  return instance;
}

export function setContent(badgeEl, content) {
  const instance = badges.get(badgeEl);
  if (!instance) return;
  if (instance.content) instance.content.textContent = content;
}

export function setVariant(badgeEl, variant) {
  const instance = badges.get(badgeEl);
  if (!instance) return;
  instance.badge.className = instance.badge.className.replace(/badge--\w+/, `badge--${variant}`);
  instance.badge.dataset.variant = variant;
}

export function setDot(badgeEl, show, color = '') {
  const instance = badges.get(badgeEl);
  if (!instance) return;

  let dot = instance.badge.querySelector('.badge__dot');
  if (show) {
    if (!dot) {
      dot = createEl('span', { class: 'badge__dot' });
      instance.badge.insertBefore(dot, instance.content);
    }
    if (color) dot.style.setProperty('--badge-dot-color', color);
    instance.badge.classList.add('badge--dot');
  } else if (dot) {
    dot.remove();
    instance.badge.classList.remove('badge--dot');
  }
}

export function getInstance(element) {
  return badges.get(element);
}

export function destroy(element) {
  badges.delete(element);
}

export default { init, setContent, setVariant, setDot, getInstance, destroy };