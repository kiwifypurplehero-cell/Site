/**
 * ProgressRing Component - Circular progress indicator
 */

import { createEl, $ } from '../utils/dom.js';

const progressRings = new Map();

export function init(container, options = {}) {
  const {
    value = 0,
    max = 100,
    min = 0,
    size = 'md', // sm, md, lg, xl
    strokeWidth = 4,
    showValue = true,
    formatValue = v => `${Math.round((v / max) * 100)}%`,
    animated = true,
    className = '',
    'aria-label': ariaLabel = 'Progresso',
  } = options;

  const ringEl = typeof container === 'string' ? $(container) : container;
  if (!ringEl) return;

  const sizes = { sm: 32, md: 48, lg: 72, xl: 120 };
  const radius = (sizes[size] || sizes.md) / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const ring = createEl('div', {
    class: `progress-ring progress-ring--${size} ${animated ? 'progress-ring--animated' : ''} ${className}`,
    role: 'progressbar',
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-label': ariaLabel,
    style: `--progress-ring-size: ${sizes[size] || sizes.md}px; --stroke-width: ${strokeWidth}px; --radius: ${radius}px;`,
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'progress-ring__svg');
  svg.setAttribute('viewBox', `0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`);

  const track = document.createElementNS(svgNS, 'circle');
  track.setAttribute('class', 'progress-ring__track');
  track.setAttribute('cx', radius + strokeWidth);
  track.setAttribute('cy', radius + strokeWidth);
  track.setAttribute('r', radius);
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke-width', strokeWidth);

  const progress = document.createElementNS(svgNS, 'circle');
  progress.setAttribute('class', 'progress-ring__progress');
  progress.setAttribute('cx', radius + strokeWidth);
  progress.setAttribute('cy', radius + strokeWidth);
  progress.setAttribute('r', radius);
  progress.setAttribute('fill', 'none');
  progress.setAttribute('stroke-width', strokeWidth);
  progress.setAttribute('stroke-linecap', 'round');
  progress.setAttribute('stroke-dasharray', circumference);
  progress.setAttribute('stroke-dashoffset', circumference);
  progress.style.transition = animated ? 'stroke-dashoffset 0.5s ease-out' : 'none';

  svg.append(track, progress);
  ring.appendChild(svg);

  if (showValue) {
    ring.appendChild(createEl('div', { class: 'progress-ring__value' }, formatValue(value)));
  }

  ringEl.innerHTML = '';
  ringEl.appendChild(ring);

  const instance = {
    element: ringEl,
    ring,
    progress,
    valueEl: ring.querySelector('.progress-ring__value'),
    circumference,
    value,
    max,
    min,
    formatValue,
    animated,
  };

  progressRings.set(ringEl, instance);
  setProgress(instance, value);

  return instance;
}

function setProgress(instance, value) {
  value = Math.max(instance.min, Math.min(instance.max, value));
  instance.value = value;
  instance.ring.setAttribute('aria-valuenow', value);

  const percentage = (value - instance.min) / (instance.max - instance.min);
  const offset = instance.circumference * (1 - percentage);
  instance.progress.setAttribute('stroke-dashoffset', offset);

  if (instance.valueEl) {
    instance.valueEl.textContent = instance.formatValue(value);
  }
}

export function setValue(ringEl, value) {
  const instance = progressRings.get(ringEl);
  if (!instance) return;
  setProgress(instance, value);
}

export function getValue(ringEl) {
  const instance = progressRings.get(ringEl);
  return instance?.value;
}

export function setMax(ringEl, max) {
  const instance = progressRings.get(ringEl);
  if (!instance) return;
  instance.max = max;
  setProgress(instance, instance.value);
}

export function setMin(ringEl, min) {
  const instance = progressRings.get(ringEl);
  if (!instance) return;
  instance.min = min;
  setProgress(instance, instance.value);
}

export function getInstance(element) {
  return progressRings.get(element);
}

export function destroy(element) {
  progressRings.delete(element);
}

export default { init, setValue, getValue, setMax, setMin, getInstance, destroy };