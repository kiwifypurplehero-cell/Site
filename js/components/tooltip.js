/**
 * Tooltip Component - Accessible tooltip with positioning
 */

import { createEl, $, $$ } from '../utils/dom.js';

const tooltips = new Map();
let tooltipContainer = null;

function ensureContainer() {
  if (!tooltipContainer) {
    tooltipContainer = createEl('div', { class: 'tooltip-container', 'aria-hidden': 'true' });
    document.body.appendChild(tooltipContainer);
  }
  return tooltipContainer;
}

export function init(trigger, options = {}) {
  const {
    content = '',
    position = 'top', // top, bottom, left, right
    offset = 8,
    delay = 150,
    hideDelay = 100,
    interactive = false,
    className = '',
    ariaLabel = '',
  } = options;

  const triggerEl = typeof trigger === 'string' ? $(trigger) : trigger;
  if (!triggerEl) return;

  ensureContainer();

  const id = `tooltip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const tooltip = createEl('div', {
    class: `tooltip tooltip--${position} ${className}`,
    role: 'tooltip',
    id,
    'aria-hidden': 'true',
  }, content);

  const arrow = createEl('div', { class: 'tooltip__arrow' });
  tooltip.appendChild(arrow);

  triggerEl.setAttribute('aria-describedby', id);
  triggerEl.setAttribute('data-tooltip-id', id);

  let showTimeout, hideTimeout;

  const show = () => {
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(() => {
      tooltipContainer.appendChild(tooltip);
      positionTooltip(triggerEl, tooltip, position, offset);
      tooltip.classList.add('tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'false');
    }, delay);
  };

  const hide = () => {
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(() => {
      tooltip.classList.remove('tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        if (tooltip.parentNode === tooltipContainer) {
          tooltipContainer.removeChild(tooltip);
        }
      }, 200);
    }, hideDelay);
  };

  const handleMouseEnter = () => show();
  const handleMouseLeave = () => hide();
  const handleFocus = () => show();
  const handleBlur = () => hide();

  triggerEl.addEventListener('mouseenter', handleMouseEnter);
  triggerEl.addEventListener('mouseleave', handleMouseLeave);
  triggerEl.addEventListener('focus', handleFocus);
  triggerEl.addEventListener('blur', handleBlur);

  if (interactive) {
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    tooltip.addEventListener('mouseleave', hide);
  }

  const instance = {
    element: triggerEl,
    tooltip,
    id,
    show,
    hide,
    options: { position, offset, delay, hideDelay },
    destroy: () => {
      triggerEl.removeEventListener('mouseenter', handleMouseEnter);
      triggerEl.removeEventListener('mouseleave', handleMouseLeave);
      triggerEl.removeEventListener('focus', handleFocus);
      triggerEl.removeEventListener('blur', handleBlur);
      tooltip.remove();
      triggerEl.removeAttribute('aria-describedby');
      triggerEl.removeAttribute('data-tooltip-id');
      tooltips.delete(triggerEl);
    },
  };

  tooltips.set(triggerEl, instance);
  return instance;
}

function positionTooltip(trigger, tooltip, position, offset) {
  const triggerRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top, left;

  switch (position) {
    case 'top':
      top = triggerRect.top + scrollY - tooltipRect.height - offset;
      left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left + scrollX - tooltipRect.width - offset;
      break;
    case 'right':
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + scrollX + offset;
      break;
  }

  // Viewport clamping
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 8;

  if (left < padding) left = padding;
  if (left + tooltipRect.width > viewportWidth - padding) {
    left = viewportWidth - tooltipRect.width - padding;
  }
  if (top < padding) top = padding;
  if (top + tooltipRect.height > viewportHeight - padding) {
    top = viewportHeight - tooltipRect.height - padding;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

export function setContent(triggerEl, content) {
  const instance = tooltips.get(triggerEl);
  if (!instance) return;
  instance.tooltip.textContent = '';
  instance.tooltip.append(content);
  const arrow = createEl('div', { class: 'tooltip__arrow' });
  instance.tooltip.appendChild(arrow);
}

export function setPosition(triggerEl, position) {
  const instance = tooltips.get(triggerEl);
  if (!instance) return;
  instance.tooltip.className = instance.tooltip.className.replace(/tooltip--\w+/, `tooltip--${position}`);
  instance.options.position = position;
}

export function show(triggerEl) {
  const instance = tooltips.get(triggerEl);
  if (!instance) return;
  instance.show();
}

export function hide(triggerEl) {
  const instance = tooltips.get(triggerEl);
  if (!instance) return;
  instance.hide();
}

export function getInstance(element) {
  return tooltips.get(element);
}

export function destroy(element) {
  const instance = tooltips.get(element);
  if (instance) instance.destroy();
}

export default { init, setContent, setPosition, show, hide, getInstance, destroy };