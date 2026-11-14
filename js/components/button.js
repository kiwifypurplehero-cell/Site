/**
 * Button Component - Accessible button with variants, states, and loading
 */

import { createEl } from '../utils/dom.js';

export function createButton(options = {}) {
  const {
    variant = 'primary',
    size = 'md',
    label = '',
    icon = null,
    iconPosition = 'left',
    disabled = false,
    loading = false,
    ariaLabel = null,
    ariaPressed = null,
    ariaExpanded = null,
    ariaControls = null,
    type = 'button',
    onClick = null,
    className = '',
    ...attrs
  } = options;

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    className,
  ].filter(Boolean).join(' ');

  const children = [];

  if (loading) {
    classes += ' btn--loading';
  }

  // Icon before label
  if (icon && iconPosition === 'left') {
    children.push(createEl('span', { class: 'btn__icon', 'aria-hidden': 'true' }, icon));
  }

  // Label
  if (label) {
    children.push(createEl('span', { class: 'btn__label' }, label));
  }

  // Icon after label
  if (icon && iconPosition === 'right') {
    children.push(createEl('span', { class: 'btn__icon', 'aria-hidden': 'true' }, icon));
  }

  const button = createEl('button', {
    class: classes,
    type,
    disabled,
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
    onclick: onClick,
    ...attrs,
  }, children);

  return button;
}

export function render(button, container) {
  if (container) {
    container.appendChild(button);
  }
  return button;
}

// Quick button creators
export const Button = {
  primary: (label, onClick, options = {}) => createButton({ variant: 'primary', label, onClick, ...options }),
  secondary: (label, onClick, options = {}) => createButton({ variant: 'secondary', label, onClick, ...options }),
  ghost: (label, onClick, options = {}) => createButton({ variant: 'ghost', label, onClick, ...options }),
  danger: (label, onClick, options = {}) => createButton({ variant: 'danger', label, onClick, ...options }),
  outline: (label, onClick, options = {}) => createButton({ variant: 'outline', label, onClick, ...options }),
  icon: (icon, onClick, options = {}) => createButton({ variant: 'ghost', size: 'icon', icon, ariaLabel: options.ariaLabel || options.label, onClick, ...options }),
  loading: (label, onClick, options = {}) => createButton({ variant: 'primary', label, onClick, loading: true, ...options }),
  toggle: (label, pressed, onClick, options = {}) => createButton({ variant: 'ghost', label, onClick, ariaPressed: pressed, ...options }),
};

// Set loading state
export function setLoading(button, loading) {
  if (loading) {
    button.classList.add('btn--loading');
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-disabled', 'true');
    button.disabled = true;
  } else {
    button.classList.remove('btn--loading');
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-disabled');
    button.disabled = false;
  }
}

// Set disabled state
export function setDisabled(button, disabled) {
  button.disabled = disabled;
  button.setAttribute('aria-disabled', disabled);
}

// Toggle pressed state (for toggle buttons)
export function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', pressed);
}

export default { createButton, render, Button, setLoading, setDisabled, setPressed };