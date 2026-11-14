/**
 * Tabs Component - Accessible tabbed interface with keyboard navigation
 */

import { createEl, $, $$ } from '../utils/dom.js';

const tabInstances = new Map();

export function init(container, options = {}) {
  const {
    tabs: tabConfig = [],
    defaultIndex = 0,
    onChange = null,
    vertical = false,
  } = options;

  const tabsEl = typeof container === 'string' ? $(container) : container;
  if (!tabsEl) return;

  // Create structure
  const list = createEl('div', { class: 'tabs__list', role: 'tablist', 'aria-orientation': vertical ? 'vertical' : 'horizontal' });
  const panels = [];

  tabConfig.forEach((tab, index) => {
    const trigger = createEl('button', {
      class: `tabs__trigger ${index === defaultIndex ? 'tabs__trigger--active' : ''}`,
      role: 'tab',
      'aria-selected': index === defaultIndex,
      'aria-controls': `tabpanel-${index}`,
      id: `tab-${index}`,
      'data-index': index,
    }, tab.label);

    const panel = createEl('div', {
      class: 'tabs__panel',
      role: 'tabpanel',
      id: `tabpanel-${index}`,
      'aria-labelledby': `tab-${index}`,
      hidden: index !== defaultIndex,
    }, tab.content);

    list.appendChild(trigger);
    panels.push(panel);
  });

  tabsEl.innerHTML = '';
  tabsEl.appendChild(list);
  panels.forEach(p => tabsEl.appendChild(p));

  const instance = {
    element: tabsEl,
    list,
    panels,
    triggers: $$('.tabs__trigger', tabsEl),
    activeIndex: defaultIndex,
    options: { onChange, vertical },
  };

  tabInstances.set(tabsEl, instance);
  bindEvents(instance);

  return instance;
}

function bindEvents(instance) {
  const { element, triggers, panels, options } = instance;

  // Click handlers
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const index = parseInt(trigger.dataset.index, 10);
      activateTab(instance, index);
    });
  });

  // Keyboard navigation
  element.addEventListener('keydown', e => {
    const currentIndex = instance.activeIndex;
    let nextIndex = currentIndex;

    switch (e.key) {
      case options.vertical ? 'ArrowDown' : 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % triggers.length;
        break;
      case options.vertical ? 'ArrowUp' : 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = triggers.length - 1;
        break;
      default:
        return;
    }

    activateTab(instance, nextIndex);
    triggers[nextIndex].focus();
  });
}

function activateTab(instance, index) {
  const { triggers, panels, activeIndex, options } = instance;

  if (index === activeIndex || index < 0 || index >= triggers.length) return;

  // Deactivate current
  triggers[activeIndex].classList.remove('tabs__trigger--active');
  triggers[activeIndex].setAttribute('aria-selected', 'false');
  panels[activeIndex].hidden = true;

  // Activate new
  triggers[index].classList.add('tabs__trigger--active');
  triggers[index].setAttribute('aria-selected', 'true');
  panels[index].hidden = false;

  instance.activeIndex = index;
  options.onChange?.(index, triggers[index], panels[index]);
}

export function activate(instanceOrElement, index) {
  const instance = instanceOrElement instanceof HTMLElement
    ? tabInstances.get(instanceOrElement)
    : instanceOrElement;
  if (instance) activateTab(instance, index);
}

export function getActiveIndex(instanceOrElement) {
  const instance = instanceOrElement instanceof HTMLElement
    ? tabInstances.get(instanceOrElement)
    : instanceOrElement;
  return instance?.activeIndex ?? -1;
}

export function getInstance(element) {
  return tabInstances.get(element);
}

export function destroy(element) {
  tabInstances.delete(element);
}

export default { init, activate, getActiveIndex, getInstance, destroy };