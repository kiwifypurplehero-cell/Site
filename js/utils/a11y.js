/**
 * Accessibility Utilities - Focus management, announcements, keyboard/gamepad navigation
 */

import { prefersReducedMotion } from './dom.js';

// Live region for screen reader announcements
let liveRegion = null;
let assertiveRegion = null;

function ensureLiveRegions() {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  if (!assertiveRegion) {
    assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('role', 'alert');
    liveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);
  }
}

export function announce(message, priority = 'polite') {
  ensureLiveRegions();
  const region = priority === 'assertive' ? assertiveRegion : liveRegion;
  region.textContent = '';
  region.setAttribute('aria-live', priority);
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function announceAssertive(message) {
  announce(message, 'assertive');
}

// Focus trap
export function trapFocus(element, options = {}) {
  const {
    onEscape,
    onTabForward,
    onTabBackward,
    initialFocus,
    fallbackFocus = element,
  } = options;

  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    '[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    'details > summary:first-of-type:not([aria-hidden="true"])',
  ].join(', ');

  let focusableElements = [];
  let firstElement = null;
  let lastElement = null;

  function updateFocusableElements() {
    focusableElements = Array.from(element.querySelectorAll(focusableSelectors))
      .filter(el => isVisible(el));
    firstElement = focusableElements[0];
    lastElement = focusableElements[focusableElements.length - 1];
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetWidth > 0 &&
           el.offsetHeight > 0;
  }

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;

    updateFocusableElements();

    if (focusableElements.length === 0) {
      e.preventDefault();
      fallbackFocus?.focus();
      return;
    }

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
        onTabBackward?.(e);
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
        onTabForward?.(e);
      }
    }
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      onEscape?.(e);
    }
  }

  element.addEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', handleEscape);

  // Initial focus
  if (initialFocus) {
    initialFocus.focus();
  } else if (firstElement) {
    firstElement.focus();
  }

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('keydown', handleEscape);
  };
}

// Focus management for grids/lists
export function focusGrid(container, options = {}) {
  const {
    selector = '[data-focusable], button, a, [tabindex]:not([tabindex="-1"])',
    orientation = 'both', // 'horizontal', 'vertical', 'both'
    wrap = true,
    onMove,
  } = options;

  let items = [];
  let currentIndex = -1;

  function updateItems() {
    items = Array.from(container.querySelectorAll(selector))
      .filter(el => isVisible(el));
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetWidth > 0 &&
           el.offsetHeight > 0;
  }

  function focus(index) {
    updateItems();
    if (items.length === 0) return false;

    index = Math.max(0, Math.min(index, items.length - 1));
    items[index]?.focus();
    currentIndex = index;
    onMove?.(index, items[index]);
    return true;
  }

  function handleKeydown(e) {
    updateItems();
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement);
    if (current === -1) return;

    let nextIndex = current;

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap ? (current + 1) % items.length : Math.min(current + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap ? (current - 1 + items.length) % items.length : Math.max(current - 1, 0);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          // Calculate column count for grid navigation
          const cols = getColumnCount();
          nextIndex = wrap ? (current + cols) % items.length : Math.min(current + cols, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          const cols = getColumnCount();
          nextIndex = wrap ? (current - cols + items.length) % items.length : Math.max(current - cols, 0);
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    focus(nextIndex);
  }

  function getColumnCount() {
    const style = window.getComputedStyle(container);
    const gridTemplate = style.gridTemplateColumns;
    if (gridTemplate && gridTemplate !== 'none') {
      return gridTemplate.split(' ').length;
    }
    // Fallback: estimate from first row
    const firstItem = items[0];
    if (!firstItem) return 1;
    const containerRect = container.getBoundingClientRect();
    const itemRect = firstItem.getBoundingClientRect();
    return Math.max(1, Math.round(containerRect.width / itemRect.width));
  }

  container.addEventListener('keydown', handleKeydown);

  return {
    focus,
    focusNext: () => focus(currentIndex + 1),
    focusPrev: () => focus(currentIndex - 1),
    focusFirst: () => focus(0),
    focusLast: () => focus(items.length - 1),
    destroy: () => container.removeEventListener('keydown', handleKeydown),
  };
}

// Focus carousel/slider
export function focusCarousel(carousel, options = {}) {
  const { selector = '.hero-carousel__slide', onMove } = options;

  function handleKeydown(e) {
    const slides = carousel.querySelectorAll(selector);
    const activeSlide = carousel.querySelector('.hero-carousel__slide--active');
    const currentIndex = Array.from(slides).indexOf(activeSlide);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % slides.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + slides.length) % slides.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = slides.length - 1;
        break;
      default:
        return;
    }

    const nextSlide = slides[nextIndex];
    const indicator = nextSlide.querySelector('.hero-carousel__indicator') ||
                      carousel.querySelector(`.hero-carousel__indicator:nth-child(${nextIndex + 1})`);
    indicator?.click();
    onMove?.(nextIndex, nextSlide);
  }

  carousel.addEventListener('keydown', handleKeydown);

  return {
    destroy: () => carousel.removeEventListener('keydown', handleKeydown),
  };
}

// Skip link
export function createSkipLink(targetId, text = 'Pular para o conteúdo principal') {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'skip-link';
  link.textContent = text;
  return link;
}

// Reduced motion check
export const reducedMotion = prefersReducedMotion;

// High contrast check
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// Forced colors check
export function prefersForcedColors() {
  return window.matchMedia('(forced-colors: active)').matches;
}

// Get focusable elements in container
export function getFocusableElements(container) {
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details > summary:first-of-type',
  ].join(', ');
  return Array.from(container.querySelectorAll(selectors));
}

// Move focus to first/last focusable
export function focusFirst(container) {
  const elements = getFocusableElements(container);
  elements[0]?.focus();
  return elements[0];
}

export function focusLast(container) {
  const elements = getFocusableElements(container);
  elements[elements.length - 1]?.focus();
  return elements[elements.length - 1];
}

// Restore focus to previously focused element
let lastFocusedElement = null;

export function saveFocus() {
  lastFocusedElement = document.activeElement;
}

export function restoreFocus() {
  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
    return true;
  }
  return false;
}

// Gamepad to keyboard mapping
export const gamepadKeyMap = {
  0: 'Enter',      // A - Select/Confirm
  1: 'Escape',     // B - Back/Cancel
  2: ' ',          // X - Space (contextual)
  3: ' ',          // Y - Space (contextual)
  4: 'PageUp',     // LB - Previous tab/page
  5: 'PageDown',   // RB - Next tab/page
  6: 'ArrowUp',    // LT - Up (analog)
  7: 'ArrowDown',  // RT - Down (analog)
  8: 'Escape',     // Back/View - Escape
  9: 'Home',       // Start/Options - Home
  10: ' ',         // LS - Space
  11: ' ',         // RS - Space
  12: 'ArrowUp',   // D-pad Up
  13: 'ArrowDown', // D-pad Down
  14: 'ArrowLeft', // D-pad Left
  15: 'ArrowRight',// D-pad Right
  16: 'Home',      // Home/Guide - Home
};

// Convert gamepad event to keyboard event
export function gamepadEventToKeyboard(buttonIndex, pressed) {
  const key = gamepadKeyMap[buttonIndex];
  if (!key) return null;

  return new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });
}

export default {
  announce,
  announceAssertive,
  trapFocus,
  focusGrid,
  focusCarousel,
  createSkipLink,
  reducedMotion,
  prefersHighContrast,
  prefersForcedColors,
  getFocusableElements,
  focusFirst,
  focusLast,
  saveFocus,
  restoreFocus,
  gamepadKeyMap,
  gamepadEventToKeyboard,
};