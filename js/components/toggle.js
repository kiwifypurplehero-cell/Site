/**
 * Toggle Component - Accessible toggle switch
 */

import { createEl, $ } from '../utils/dom.js';

const toggles = new Map();

export function init(container, options = {}) {
  const {
    checked = false,
    disabled = false,
    label = '',
    description = '',
    onChange = null,
    id = `toggle-${Date.now()}`,
    size = 'md',
  } = options;

  const toggleEl = typeof container === 'string' ? $(container) : container;
  if (!toggleEl) return;

  const toggle = createEl('label', { class: `toggle toggle--${size}` });

  const input = createEl('input', {
    class: 'toggle__input',
    type: 'checkbox',
    id,
    checked,
    disabled,
    'aria-describedby': description ? `${id}-desc` : null,
  });

  const track = createEl('div', { class: 'toggle__track' });
  const thumb = createEl('div', { class: 'toggle__thumb' });

  track.appendChild(thumb);
  toggle.append(input, track);

  if (label) {
    const labelEl = createEl('span', { class: 'toggle__label' }, label);
    toggle.appendChild(labelEl);
  }

  if (description) {
    const descEl = createEl('span', { class: 'toggle__description', id: `${id}-desc` }, description);
    toggle.appendChild(descEl);
  }

  toggleEl.innerHTML = '';
  toggleEl.appendChild(toggle);

  const instance = {
    element: toggleEl,
    toggle,
    input,
    track,
    thumb,
    onChange,
  };

  toggles.set(toggleEl, instance);
  bindEvents(instance);

  return instance;
}

function bindEvents(instance) {
  const { input, toggle } = instance;

  input.addEventListener('change', () => {
    instance.onChange?.(input.checked, instance);
  });

  // Click on label/track also toggles (handled by native checkbox)
  toggle.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      input.click();
    }
  });
}

export function setChecked(toggleEl, checked) {
  const instance = toggles.get(toggleEl);
  if (!instance) return;

  instance.input.checked = checked;
  instance.onChange?.(checked, instance);
}

export function getChecked(toggleEl) {
  const instance = toggles.get(toggleEl);
  return instance?.input.checked ?? false;
}

export function setDisabled(toggleEl, disabled) {
  const instance = toggles.get(toggleEl);
  if (!instance) return;

  instance.input.disabled = disabled;
}

export function getInstance(element) {
  return toggles.get(element);
}

export function destroy(element) {
  toggles.delete(element);
}

export default { init, setChecked, getChecked, setDisabled, getInstance, destroy };