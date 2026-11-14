/**
 * Dropdown Component - Accessible dropdown with keyboard navigation
 */

import { createEl, $, $$, onReady } from '../utils/dom.js';

const dropdowns = new Map();

export function init(trigger, options = {}) {
  const {
    items = [],
    position = 'bottom-left',
    onSelect = null,
    closeOnSelect = true,
    searchable = false,
    placeholder = 'Selecione...',
  } = options;

  // Create dropdown structure
  const dropdown = createEl('div', { class: 'dropdown' });
  const triggerEl = createTrigger(trigger, placeholder);
  const menu = createMenu(items, options);

  dropdown.append(triggerEl, menu);
  triggerEl.parentNode?.replaceChild(dropdown, triggerEl);

  const instance = {
    element: dropdown,
    trigger: triggerEl,
    menu,
    items,
    options,
    open: false,
    selectedIndex: -1,
    searchQuery: '',
  };

  dropdowns.set(dropdown, instance);
  bindEvents(instance);

  return instance;
}

function createTrigger(trigger, placeholder) {
  if (typeof trigger === 'string') {
    return createEl('button', {
      class: 'dropdown__trigger',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-label': placeholder,
    }, [
      createEl('span', { class: 'dropdown__trigger-label' }, placeholder),
      createEl('svg', { class: 'dropdown__icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '16', height: '16', 'aria-hidden': 'true' }, [
        createEl('polyline', { points: '6 9 12 15 18 9' }),
      ]),
    ]);
  }
  return trigger;
}

function createMenu(items, options) {
  const menu = createEl('div', {
    class: 'dropdown__menu',
    role: 'listbox',
    'aria-label': options.ariaLabel || 'Opções',
  });

  if (options.searchable) {
    const search = createEl('input', {
      class: 'dropdown__search',
      type: 'search',
      placeholder: 'Filtrar...',
      'aria-label': 'Filtrar opções',
    });
    menu.appendChild(search);
  }

  const list = createEl('div', { class: 'dropdown__list' });
  items.forEach((item, index) => {
    const itemEl = createMenuItem(item, index);
    list.appendChild(itemEl);
  });
  menu.appendChild(list);

  return menu;
}

function createMenuItem(item, index) {
  const isDivider = item === 'divider' || item.divider;
  if (isDivider) {
    return createEl('div', { class: 'dropdown__divider', role: 'separator' });
  }

  const label = item.label || item;
  const value = item.value ?? item.id ?? index;
  const icon = item.icon;
  const disabled = item.disabled;
  const active = item.active;
  const danger = item.danger;

  return createEl('button', {
    class: `dropdown__item ${active ? 'dropdown__item--active' : ''} ${danger ? 'dropdown__item--danger' : ''}`,
    role: 'option',
    'aria-selected': active,
    'aria-disabled': disabled,
    'data-value': value,
    'data-index': index,
    disabled,
  }, [
    icon && createEl('span', { class: 'dropdown__item-icon', 'aria-hidden': 'true' }, icon),
    createEl('span', { class: 'dropdown__item-label' }, label),
    item.shortcut && createEl('kbd', { class: 'dropdown__item-shortcut' }, item.shortcut),
  ]);
}

function bindEvents(instance) {
  const { element, trigger, menu, options } = instance;

  // Toggle on trigger click
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    toggle(instance);
  });

  // Keyboard on trigger
  trigger.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        open(instance);
        focusFirstItem(instance);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggle(instance);
        break;
      case 'Escape':
        close(instance);
        break;
    }
  });

  // Menu keyboard navigation
  menu.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusNextItem(instance);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusPrevItem(instance);
        break;
      case 'Home':
        e.preventDefault();
        focusFirstItem(instance);
        break;
      case 'End':
        e.preventDefault();
        focusLastItem(instance);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focused = menu.querySelector('.dropdown__item:focus, [role="option"]:focus');
        if (focused) selectItem(instance, focused);
        break;
      case 'Escape':
        e.preventDefault();
        close(instance);
        trigger.focus();
        break;
      case 'Tab':
        close(instance);
        break;
    }
  });

  // Item click
  menu.addEventListener('click', e => {
    const item = e.target.closest('.dropdown__item');
    if (item && !item.disabled) {
      selectItem(instance, item);
    }
  });

  // Search filter
  const search = menu.querySelector('.dropdown__search');
  if (search) {
    search.addEventListener('input', debounce(() => filterItems(instance, search.value), 150));
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') e.stopPropagation();
    });
  }

  // Close on outside click
  document.addEventListener('click', e => {
    if (instance.open && !element.contains(e.target)) {
      close(instance);
    }
  });
}

function toggle(instance) {
  instance.open ? close(instance) : open(instance);
}

function open(instance) {
  if (instance.open) return;
  instance.open = true;
  instance.element.classList.add('dropdown--open');
  instance.trigger.setAttribute('aria-expanded', 'true');
  instance.menu.hidden = false;
  // Force reflow for animation
  requestAnimationFrame(() => instance.menu.classList.add('dropdown__menu--open'));
}

function close(instance) {
  if (!instance.open) return;
  instance.open = false;
  instance.element.classList.remove('dropdown--open');
  instance.trigger.setAttribute('aria-expanded', 'false');
  instance.menu.classList.remove('dropdown__menu--open');
  setTimeout(() => { instance.menu.hidden = true; }, 200);
  instance.searchQuery = '';
  const search = instance.menu.querySelector('.dropdown__search');
  if (search) search.value = '';
  showAllItems(instance);
}

function selectItem(instance, itemEl) {
  const value = itemEl.dataset.value;
  const index = parseInt(itemEl.dataset.index, 10);
  const item = instance.items[index];

  instance.options.onSelect?.(item, value, instance);
  instance.trigger.querySelector('.dropdown__trigger-label').textContent = item.label || item;

  // Update active state
  instance.menu.querySelectorAll('.dropdown__item--active').forEach(el => {
    el.classList.remove('dropdown__item--active');
    el.setAttribute('aria-selected', 'false');
  });
  itemEl.classList.add('dropdown__item--active');
  itemEl.setAttribute('aria-selected', 'true');

  if (instance.options.closeOnSelect) close(instance);
}

function focusFirstItem(instance) {
  const items = instance.menu.querySelectorAll('.dropdown__item:not([disabled])');
  items[0]?.focus();
}

function focusLastItem(instance) {
  const items = instance.menu.querySelectorAll('.dropdown__item:not([disabled])');
  items[items.length - 1]?.focus();
}

function focusNextItem(instance) {
  const items = Array.from(instance.menu.querySelectorAll('.dropdown__item:not([disabled])'));
  const current = items.indexOf(document.activeElement);
  if (current >= 0 && current < items.length - 1) {
    items[current + 1].focus();
  }
}

function focusPrevItem(instance) {
  const items = Array.from(instance.menu.querySelectorAll('.dropdown__item:not([disabled])'));
  const current = items.indexOf(document.activeElement);
  if (current > 0) {
    items[current - 1].focus();
  }
}

function filterItems(instance, query) {
  instance.searchQuery = query.toLowerCase();
  const items = instance.menu.querySelectorAll('.dropdown__item');
  let visibleCount = 0;

  items.forEach((item, index) => {
    const label = instance.items[index]?.label || instance.items[index];
    if (!label) return; // divider

    const matches = label.toLowerCase().includes(instance.searchQuery);
    item.hidden = !matches;
    if (matches) visibleCount++;
  });

  // Show/hide no results
  let noResults = instance.menu.querySelector('.dropdown__no-results');
  if (visibleCount === 0 && instance.searchQuery) {
    if (!noResults) {
      noResults = createEl('div', { class: 'dropdown__no-results' }, 'Nenhum resultado');
      instance.menu.querySelector('.dropdown__list').appendChild(noResults);
    }
  } else if (noResults) {
    noResults.remove();
  }
}

function showAllItems(instance) {
  instance.menu.querySelectorAll('.dropdown__item').forEach(item => {
    item.hidden = false;
  });
  const noResults = instance.menu.querySelector('.dropdown__no-results');
  noResults?.remove();
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getInstance(element) {
  return dropdowns.get(element);
}

export function destroy(element) {
  dropdowns.delete(element);
}

export default { init, getInstance, destroy };