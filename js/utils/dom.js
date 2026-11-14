/**
 * DOM Utilities - Lightweight helpers for DOM manipulation
 * No dependencies, ~2KB gzipped
 */

// Select single element
export const $ = (selector, context = document) => context.querySelector(selector);

// Select all elements
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Create element with attributes and children
export function createEl(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') el.className = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset' && typeof value === 'object') Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
    else if (typeof value === 'boolean') { if (value) el.setAttribute(key, ''); }
    else el.setAttribute(key, value);
  });
  children.flat().forEach(child => {
    if (child == null) return;
    if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
    else if (Array.isArray(child)) child.forEach(c => el.append(c));
  });
  return el;
}

// Event delegation
export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, e => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) handler.call(target, e, target);
  });
}

// Ready promise
export const onReady = () => new Promise(resolve => {
  if (document.readyState !== 'loading') resolve();
  else document.addEventListener('DOMContentLoaded', resolve, { once: true });
});

// Query selector with optional fallback
export const qs = (selector, context = document) => context.querySelector(selector);
export const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Get closest parent matching selector
export const closest = (el, selector) => el.closest(selector);

// Toggle class
export const toggleClass = (el, className, force) => el.classList.toggle(className, force);

// Add/remove class
export const addClass = (el, ...classes) => el.classList.add(...classes);
export const removeClass = (el, ...classes) => el.classList.remove(...classes);
export const hasClass = (el, className) => el.classList.contains(className);

// Set attributes
export const setAttrs = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => {
  if (v == null) el.removeAttribute(k);
  else if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); else el.removeAttribute(k); }
  else el.setAttribute(k, v);
});

// Get data attribute
export const getData = (el, key, fallback = null) => {
  const value = el.dataset[key];
  return value !== undefined ? value : fallback;
};

// Set data attribute
export const setData = (el, key, value) => { el.dataset[key] = value; };

// Remove element
export const remove = (el) => el?.remove();

// Empty element
export const empty = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };

// Insert HTML
export const html = (el, htmlString, mode = 'beforeend') => el.insertAdjacentHTML(mode, htmlString);

// Find parent matching selector
export const findParent = (el, selector) => {
  while (el && el !== document.body) {
    if (el.matches(selector)) return el;
    el = el.parentElement;
  }
  return null;
};

// Check if element is visible
export const isVisible = (el) => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
};

// Focus trap
export function trapFocus(element) {
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleTab(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  element.addEventListener('keydown', handleTab);
  first?.focus();

  return () => element.removeEventListener('keydown', handleTab);
}

// Announce to screen readers
let liveRegion = null;
export function announce(message, priority = 'polite') {
  if (!liveRegion) {
    liveRegion = createEl('div', { role: 'status', 'aria-live': priority, 'aria-atomic': 'true', class: 'sr-only' });
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = '';
  liveRegion.setAttribute('aria-live', priority);
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

// Key map for gamepad -> keyboard
export const keyMap = {
  // Gamepad buttons
  0: 'a',      // A - Cross (PS) / A (Xbox)
  1: 'b',      // B - Circle (PS) / B (Xbox)
  2: 'x',      // X - Square (PS) / X (Xbox)
  3: 'y',      // Y - Triangle (PS) / Y (Xbox)
  4: 'lb',     // Left bumper
  5: 'rb',     // Right bumper
  6: 'lt',     // Left trigger
  7: 'rt',     // Right trigger
  8: 'back',   // Back / View / Share
  9: 'start',  // Start / Options
  10: 'ls',    // Left stick press
  11: 'rs',    // Right stick press
  12: 'up',    // D-pad up
  13: 'down',  // D-pad down
  14: 'left',  // D-pad left
  15: 'right', // D-pad right
  16: 'home',  // Home / Guide / PS button
};

// Reduced motion check
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// High contrast check
export const prefersHighContrast = () => window.matchMedia('(prefers-contrast: more)').matches;

// Forced colors check
export const prefersForcedColors = () => window.matchMedia('(forced-colors: active)').matches;

// Viewport size
export const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

// Breakpoint checks
export const breakpoints = {
  xs: () => window.matchMedia('(max-width: 479px)').matches,
  sm: () => window.matchMedia('(min-width: 480px) and (max-width: 767px)').matches,
  md: () => window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
  lg: () => window.matchMedia('(min-width: 1024px) and (max-width: 1279px)').matches,
  xl: () => window.matchMedia('(min-width: 1280px) and (max-width: 1535px)').matches,
  '2xl': () => window.matchMedia('(min-width: 1536px) and (max-width: 1919px)').matches,
  tv: () => window.matchMedia('(min-width: 1920px)').matches,
};

// Debounce
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle
export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep clone
export const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Unique ID generator
let uidCounter = 0;
export const uid = (prefix = '') => `${prefix}${++uidCounter}_${Date.now().toString(36)}`;