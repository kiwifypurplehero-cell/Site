/**
 * Avatar Component - User avatar with fallback, editable state
 */

import { createEl, $ } from '../utils/dom.js';

const avatars = new Map();

export function init(container, options = {}) {
  const {
    src = '',
    alt = '',
    fallback = '',
    size = 'md',
    editable = false,
    onEdit = null,
    status = null, // 'online', 'away', 'offline'
    ring = false,
    className = '',
  } = options;

  const avatarEl = typeof container === 'string' ? $(container) : container;
  if (!avatarEl) return;

  const sizes = {
    sm: 32, md: 48, lg: 72, xl: 120, '2xl': 160,
  };

  const sizePx = sizes[size] || sizes.md;

  const avatar = createEl('div', {
    class: `avatar avatar--${size} ${ring ? 'avatar--ring' : ''} ${editable ? 'avatar--editable' : ''} ${className}`,
    style: `--avatar-size: ${sizePx}px`,
  });

  if (src) {
    avatar.appendChild(createEl('img', {
      class: 'avatar__image',
      src,
      alt: alt || '',
      width: sizePx,
      height: sizePx,
    }));
  } else {
    avatar.appendChild(createEl('div', { class: 'avatar__fallback' }, fallback || getInitials(alt)));
  }

  if (editable) {
    const editOverlay = createEl('div', { class: 'avatar__edit-overlay' }, [
      createEl('input', { type: 'file', accept: 'image/*', class: 'avatar__file-input', hidden: true }),
      createEl('button', {
        class: 'avatar__edit-btn',
        'aria-label': 'Alterar avatar',
        onclick: e => handleEdit(e, instance),
      }, createEditIcon(sizePx)),
    ]);
    avatar.appendChild(editOverlay);
  }

  if (status) {
    avatar.appendChild(createEl('span', { class: `avatar__status avatar__status--${status}` }));
  }

  avatarEl.innerHTML = '';
  avatarEl.appendChild(avatar);

  const instance = {
    element: avatarEl,
    avatar,
    img: avatar.querySelector('.avatar__image'),
    fallback: avatar.querySelector('.avatar__fallback'),
    input: avatar.querySelector('.avatar__file-input'),
    onEdit,
    size: sizePx,
  };

  avatars.set(avatarEl, instance);

  if (instance.input) {
    instance.input.addEventListener('change', e => handleFileSelect(e, instance));
  }

  return instance;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function createEditIcon(size) {
  const iconSize = Math.max(14, size * 0.2);
  return createEl('svg', { class: 'avatar__edit-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: iconSize, height: iconSize }, [
    createEl('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
    createEl('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }),
  ]);
}

function handleEdit(e, instance) {
  e.stopPropagation();
  instance.input?.click();
}

function handleFileSelect(e, instance) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecione uma imagem válida.');
    return;
  }

  const reader = new FileReader();
  reader.onload = event => {
    const dataUrl = event.target.result;
    updateAvatar(instance, dataUrl);
    instance.onEdit?.(dataUrl, file, instance);
  };
  reader.readAsDataURL(file);
}

function updateAvatar(instance, src) {
  if (instance.img) {
    instance.img.src = src;
    instance.img.style.display = 'block';
  }
  if (instance.fallback) {
    instance.fallback.style.display = 'none';
  }
}

export function setSrc(avatarEl, src) {
  const instance = avatars.get(avatarEl);
  if (!instance) return;
  updateAvatar(instance, src);
}

export function setFallback(avatarEl, text) {
  const instance = avatars.get(avatarEl);
  if (!instance) return;

  if (instance.fallback) {
    instance.fallback.textContent = text || getInitials(text);
  }
}

export function setStatus(avatarEl, status) {
  const instance = avatars.get(avatarEl);
  if (!instance) return;

  let statusEl = instance.avatar.querySelector('.avatar__status');
  if (status) {
    if (!statusEl) {
      statusEl = createEl('span', { class: 'avatar__status' });
      instance.avatar.appendChild(statusEl);
    }
    statusEl.className = `avatar__status avatar__status--${status}`;
  } else if (statusEl) {
    statusEl.remove();
  }
}

export function getInstance(element) {
  return avatars.get(element);
}

export function destroy(element) {
  avatars.delete(element);
}

export default { init, setSrc, setFallback, setStatus, getInstance, destroy };