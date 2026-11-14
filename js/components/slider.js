/**
 * Slider Component - Accessible range slider with tooltip
 */

import { createEl, $, $$ } from '../utils/dom.js';

const sliders = new Map();

export function init(container, options = {}) {
  const {
    min = 0,
    max = 100,
    step = 1,
    value = min,
    vertical = false,
    showTooltip = true,
    showValue = true,
    formatValue = v => v,
    onChange = null,
    onInput = null,
    label = '',
    id = `slider-${Date.now()}`,
  } = options;

  const sliderEl = typeof container === 'string' ? $(container) : container;
  if (!sliderEl) return;

  const slider = createEl('div', { class: `slider ${vertical ? 'slider--vertical' : ''}` });

  if (label) {
    slider.appendChild(createEl('label', { class: 'slider__label', for: id }, label));
  }

  const track = createEl('div', { class: 'slider__track', role: 'slider', 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-orientation': vertical ? 'vertical' : 'horizontal', tabindex: 0, id });

  const fill = createEl('div', { class: 'slider__fill' });
  const thumb = createEl('div', { class: 'slider__thumb', tabindex: -1 });

  track.append(fill, thumb);

  if (showTooltip) {
    const tooltip = createEl('div', { class: 'slider__tooltip', role: 'tooltip' }, formatValue(value));
    thumb.appendChild(tooltip);
  }

  if (showValue) {
    const valueEl = createEl('output', { class: 'slider__value', for: id }, formatValue(value));
    slider.appendChild(valueEl);
  }

  slider.appendChild(track);
  sliderEl.innerHTML = '';
  sliderEl.appendChild(slider);

  const instance = {
    element: sliderEl,
    track,
    fill,
    thumb,
    valueEl: slider.querySelector('.slider__value'),
    tooltip: thumb.querySelector('.slider__tooltip'),
    min,
    max,
    step,
    value,
    vertical,
    formatValue,
    onChange,
    onInput,
    dragging: false,
  };

  sliders.set(sliderEl, instance);
  bindEvents(instance);
  updateVisuals(instance);

  return instance;
}

function bindEvents(instance) {
  const { track, thumb, vertical } = instance;

  // Mouse events
  thumb.addEventListener('mousedown', e => startDrag(instance, e));
  track.addEventListener('mousedown', e => startDragFromTrack(instance, e));

  document.addEventListener('mousemove', e => drag(instance, e));
  document.addEventListener('mouseup', () => endDrag(instance));

  // Touch events
  thumb.addEventListener('touchstart', e => startDrag(instance, e), { passive: false });
  track.addEventListener('touchstart', e => startDragFromTrack(instance, e), { passive: false });

  document.addEventListener('touchmove', e => drag(instance, e), { passive: false });
  document.addEventListener('touchend', () => endDrag(instance));

  // Keyboard
  track.addEventListener('keydown', e => handleKeydown(instance, e));
}

function startDrag(instance, e) {
  instance.dragging = true;
  instance.track.classList.add('slider__track--dragging');
  instance.thumb.focus();
  e.preventDefault();
}

function startDragFromTrack(instance, e) {
  instance.dragging = true;
  instance.track.classList.add('slider__track--dragging');
  updateFromEvent(instance, e);
  instance.thumb.focus();
  e.preventDefault();
}

function drag(instance, e) {
  if (!instance.dragging) return;
  updateFromEvent(instance, e);
  e.preventDefault();
}

function endDrag(instance) {
  if (!instance.dragging) return;
  instance.dragging = false;
  instance.track.classList.remove('slider__track--dragging');
  instance.onChange?.(instance.value, instance);
}

function updateFromEvent(instance, e) {
  const rect = instance.track.getBoundingClientRect();
  let percentage;

  if (instance.vertical) {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    percentage = 1 - (clientY - rect.top) / rect.height;
  } else {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    percentage = (clientX - rect.left) / rect.width;
  }

  percentage = Math.max(0, Math.min(1, percentage));
  const rawValue = instance.min + percentage * (instance.max - instance.min);
  const steppedValue = Math.round(rawValue / instance.step) * instance.step;
  const clampedValue = Math.max(instance.min, Math.min(instance.max, steppedValue));

  if (clampedValue !== instance.value) {
    instance.value = clampedValue;
    instance.track.setAttribute('aria-valuenow', clampedValue);
    updateVisuals(instance);
    instance.onInput?.(clampedValue, instance);
  }
}

function handleKeydown(instance, e) {
  let newValue = instance.value;
  const step = instance.step;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault();
      newValue = Math.min(instance.max, instance.value + step);
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault();
      newValue = Math.max(instance.min, instance.value - step);
      break;
    case 'Home':
      e.preventDefault();
      newValue = instance.min;
      break;
    case 'End':
      e.preventDefault();
      newValue = instance.max;
      break;
    case 'PageUp':
      e.preventDefault();
      newValue = Math.min(instance.max, instance.value + step * 10);
      break;
    case 'PageDown':
      e.preventDefault();
      newValue = Math.max(instance.min, instance.value - step * 10);
      break;
    default:
      return;
  }

  if (newValue !== instance.value) {
    instance.value = newValue;
    instance.track.setAttribute('aria-valuenow', newValue);
    updateVisuals(instance);
    instance.onInput?.(newValue, instance);
    instance.onChange?.(newValue, instance);
  }
}

function updateVisuals(instance) {
  const { track, fill, thumb, valueEl, tooltip, min, max, value, vertical, formatValue } = instance;
  const percentage = (value - min) / (max - min);

  if (vertical) {
    fill.style.height = `${percentage * 100}%`;
    thumb.style.bottom = `${percentage * 100}%`;
  } else {
    fill.style.width = `${percentage * 100}%`;
    thumb.style.left = `${percentage * 100}%`;
  }

  if (valueEl) valueEl.textContent = formatValue(value);
  if (tooltip) tooltip.textContent = formatValue(value);
}

export function setValue(sliderEl, value) {
  const instance = sliders.get(sliderEl);
  if (!instance) return;

  value = Math.max(instance.min, Math.min(instance.max, value));
  instance.value = value;
  instance.track.setAttribute('aria-valuenow', value);
  updateVisuals(instance);
  instance.onChange?.(value, instance);
}

export function getValue(sliderEl) {
  const instance = sliders.get(sliderEl);
  return instance?.value;
}

export function getInstance(element) {
  return sliders.get(element);
}

export function destroy(element) {
  sliders.delete(element);
}

export default { init, setValue, getValue, getInstance, destroy };