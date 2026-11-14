/**
 * Modal Component - Accessible dialog with focus trap, animations, and multiple sizes
 */

import { createEl, $, trapFocus, announce } from '../utils/dom.js';

let activeModal = null;
let modalStack = [];

export function createModal(options = {}) {
  const {
    id = `modal-${Date.now()}`,
    title = '',
    content = '',
    size = 'md',
    closable = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    footer = null,
    onClose = null,
    onOpen = null,
    role = 'dialog',
    ariaLabelledby = null,
    ariaDescribedby = null,
  } = options;

  const sizeClasses = {
    sm: 'modal__panel--sm',
    md: '',
    lg: 'modal__panel--lg',
    xl: 'modal__panel--xl',
    full: 'modal__panel--full',
  };

  const modal = createEl('dialog', {
    class: 'modal',
    id,
    role,
    'aria-modal': 'true',
    'aria-labelledby': ariaLabelledby || (title ? `${id}-title` : null),
    'aria-describedby': ariaDescribedby,
  }, [
    createEl('div', { class: 'modal__backdrop', tabindex: '-1' }),
    createEl('div', { class: `modal__panel ${sizeClasses[size] || ''}` }, [
      (title || showCloseButton) && createEl('header', { class: 'modal__header' }, [
        title && createEl('h2', { class: 'modal__title', id: `${id}-title` }, title),
        closable && showCloseButton && createEl('button', {
          class: 'modal__close',
          'aria-label': 'Fechar',
          onclick: () => close(modal),
        }, createEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '24', height: '24', 'aria-hidden': 'true' }, [
          createEl('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
          createEl('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
        ])),
      ]),
      createEl('div', { class: 'modal__content' }, typeof content === 'string' ? content : ''),
      footer && createEl('footer', { class: 'modal__footer' }, footer),
    ]),
  ]);

  // Store options on element
  modal._options = { onClose, onOpen, closeOnBackdrop, closeOnEscape };

  // Backdrop click
  if (closeOnBackdrop) {
    modal.querySelector('.modal__backdrop').addEventListener('click', () => close(modal));
  }

  // Prevent panel click from closing
  modal.querySelector('.modal__panel').addEventListener('click', e => e.stopPropagation());

  return modal;
}

export function open(modal) {
  if (!(modal instanceof HTMLElement)) {
    console.error('Modal.open expects a modal element');
    return;
  }

  document.body.appendChild(modal);
  modalStack.push(modal);
  activeModal = modal;

  // Show modal
  modal.showModal();

  // Focus trap
  const panel = modal.querySelector('.modal__panel');
  const cleanup = trapFocus(panel, {
    onEscape: () => {
      if (modal._options.closeOnEscape) close(modal);
    },
    initialFocus: panel.querySelector('[autofocus]') || panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  });
  modal._focusCleanup = cleanup;

  // Call onOpen
  modal._options.onOpen?.(modal);

  // Announce
  const title = modal.querySelector('.modal__title');
  if (title) announce(`Diálogo aberto: ${title.textContent}`);

  return modal;
}

export function close(modal) {
  if (!modal || !modalStack.includes(modal)) return;

  // Remove from stack
  const index = modalStack.indexOf(modal);
  modalStack.splice(index, 1);
  activeModal = modalStack[modalStack.length - 1] || null;

  // Cleanup focus trap
  modal._focusCleanup?.();

  // Call onClose
  modal._options.onClose?.(modal);

  // Close dialog
  modal.close();

  // Remove from DOM after animation
  setTimeout(() => {
    if (modal.parentNode) modal.remove();
  }, 200);

  // Restore focus to previous modal or trigger
  if (activeModal) {
    const panel = activeModal.querySelector('.modal__panel');
    panel?.focus();
  }
}

export function closeAll() {
  [...modalStack].forEach(close);
}

export function getActiveModal() {
  return activeModal;
}

export function isOpen(modal) {
  return modalStack.includes(modal);
}

// Alert modal
export function alert(message, options = {}) {
  const modal = createModal({
    title: options.title || 'Aviso',
    content: `<p>${message}</p>`,
    size: 'sm',
    footer: createEl('button', {
      class: 'btn btn--primary',
      onclick: () => close(modal),
    }, options.okText || 'OK'),
    onClose: options.onClose,
  });
  return open(modal);
}

// Confirm modal
export function confirm(message, options = {}) {
  return new Promise(resolve => {
    const modal = createModal({
      title: options.title || 'Confirmar',
      content: `<p>${message}</p>`,
      size: 'sm',
      footer: [
        createEl('button', {
          class: 'btn btn--ghost',
          onclick: () => { close(modal); resolve(false); },
        }, options.cancelText || 'Cancelar'),
        createEl('button', {
          class: `btn btn--${options.danger ? 'danger' : 'primary'}`,
          onclick: () => { close(modal); resolve(true); },
        }, options.okText || 'Confirmar'),
      ],
      onClose: () => resolve(false),
    });
    open(modal);
  });
}

// Prompt modal
export function prompt(message, options = {}) {
  return new Promise(resolve => {
    const inputId = `prompt-input-${Date.now()}`;
    const modal = createModal({
      title: options.title || 'Entrada',
      content: `
        <p>${message}</p>
        <input type="${options.type || 'text'}"
               id="${inputId}"
               class="modal__input"
               value="${options.defaultValue || ''}"
               placeholder="${options.placeholder || ''}"
               autocomplete="off"
               autofocus>
        ${options.error ? `<p class="modal__error">${options.error}</p>` : ''}
      `,
      size: 'sm',
      footer: [
        createEl('button', {
          class: 'btn btn--ghost',
          onclick: () => { close(modal); resolve(null); },
        }, options.cancelText || 'Cancelar'),
        createEl('button', {
          class: 'btn btn--primary',
          onclick: () => {
            const input = modal.querySelector(`#${inputId}`);
            close(modal);
            resolve(input?.value || '');
          },
        }, options.okText || 'OK'),
      ],
      onClose: () => resolve(null),
    });
    open(modal);
  });
}

// Form modal helper
export function form(formContent, options = {}) {
  const modal = createModal({
    title: options.title || '',
    content: formContent,
    size: options.size || 'md',
    footer: options.footer || [
      createEl('button', {
        class: 'btn btn--ghost',
        onclick: () => close(modal),
      }, options.cancelText || 'Cancelar'),
      createEl('button', {
        class: 'btn btn--primary',
        type: 'submit',
        form: options.formId,
      }, options.submitText || 'Salvar'),
    ],
    onClose: options.onClose,
  });
  return open(modal);
}

export default { createModal, open, close, closeAll, getActiveModal, isOpen, alert, confirm, prompt, form };