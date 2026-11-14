/**
 * Toast Component - Non-blocking notifications
 */

import { createEl, $ } from '../utils/dom.js';

let toastContainer = null;
const toasts = new Map();
let toastId = 0;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = createEl('div', { class: 'toast-container', 'aria-live': 'polite', 'aria-atomic': 'true', 'aria-label': 'Notificações' });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function show(options = {}) {
  const {
    title = '',
    message = '',
    type = 'info', // info, success, warning, danger
    duration = 5000,
    persistent = false,
    action = null, // { label, onClick }
    onClose = null,
  } = options;

  ensureContainer();

  const id = `toast-${++toastId}-${Date.now()}`;
  const toast = createEl('div', {
    class: `toast toast--${type}`,
    role: 'alert',
    'aria-live': 'assertive',
    id,
  });

  const icon = getIcon(type);
  const content = createEl('div', { class: 'toast__content' });
  if (title) content.appendChild(createEl('div', { class: 'toast__title' }, title));
  if (message) content.appendChild(createEl('div', { class: 'toast__message' }, message));

  const closeBtn = createEl('button', {
    class: 'toast__close',
    'aria-label': 'Fechar notificação',
    type: 'button',
    onclick: () => dismiss(id),
  }, createCloseIcon());

  toast.append(icon, content);
  if (action) {
    const actionBtn = createEl('button', { class: 'toast__action', onclick: () => { action.onClick?.(); dismiss(id); } }, action.label);
    toast.appendChild(actionBtn);
  }
  toast.appendChild(closeBtn);

  toastContainer.appendChild(toast);

  // Force reflow for animation
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  const instance = {
    id,
    element: toast,
    timeout: null,
    onClose,
  };

  if (!persistent && duration > 0) {
    instance.timeout = setTimeout(() => dismiss(id), duration);
  }

  toasts.set(id, instance);

  // Pause on hover
  toast.addEventListener('mouseenter', () => {
    if (instance.timeout) clearTimeout(instance.timeout);
  });

  toast.addEventListener('mouseleave', () => {
    if (!persistent && duration > 0) {
      instance.timeout = setTimeout(() => dismiss(id), duration);
    }
  });

  return { id, dismiss: () => dismiss(id) };
}

function dismiss(id) {
  const instance = toasts.get(id);
  if (!instance) return;

  if (instance.timeout) clearTimeout(instance.timeout);

  instance.element.classList.remove('toast--visible');
  instance.element.addEventListener('transitionend', () => {
    instance.element.remove();
    toasts.delete(id);
    instance.onClose?.(id);
  }, { once: true });
}

function getIcon(type) {
  const icons = {
    info: createEl('svg', { class: 'toast__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true' }, [
      createEl('circle', { cx: '12', cy: '12', r: '10' }),
      createEl('path', { d: 'M12 16v-4' }),
      createEl('path', { d: 'M12 8h.01' }),
    ]),
    success: createEl('svg', { class: 'toast__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true' }, [
      createEl('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      createEl('polyline', { points: '22 4 12 14.01 9 11.01' }),
    ]),
    warning: createEl('svg', { class: 'toast__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true' }, [
      createEl('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      createEl('path', { d: 'M12 9v4' }),
      createEl('path', { d: 'M12 17h.01' }),
    ]),
    danger: createEl('svg', { class: 'toast__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20', 'aria-hidden': 'true' }, [
      createEl('circle', { cx: '12', cy: '12', r: '10' }),
      createEl('path', { d: 'M15 9l-6 6' }),
      createEl('path', { d: 'M9 9l6 6' }),
    ]),
  };
  return icons[type] || icons.info;
}

function createCloseIcon() {
  return createEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '16', height: '16', 'aria-hidden': 'true' }, [
    createEl('path', { d: 'M18 6L6 18' }),
    createEl('path', { d: 'M6 6l12 12' }),
  ]);
}

// Convenience methods
export function info(message, title, options = {}) {
  return show({ ...options, title, message, type: 'info' });
}

export function success(message, title, options = {}) {
  return show({ ...options, title, message, type: 'success' });
}

export function warning(message, title, options = {}) {
  return show({ ...options, title, message, type: 'warning' });
}

export function danger(message, title, options = {}) {
  return show({ ...options, title, message, type: 'danger' });
}

export function dismissAll() {
  toasts.forEach((_, id) => dismiss(id));
}

export function getInstance(id) {
  return toasts.get(id);
}

export default { show, info, success, warning, danger, dismissAll, getInstance };