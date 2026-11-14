/**
 * Gamepad Navigation - Maps gamepad input to UI navigation
 * Supports Xbox, PlayStation, and generic gamepads
 */

import { announce } from './a11y.js';

const DEADZONE = 0.15;
const REPEAT_DELAY = 300;
const REPEAT_INTERVAL = 100;

let gamepadIndex = -1;
let gamepadState = null;
let animationFrameId = null;
let buttonStates = new Map();
let axisStates = { x: 0, y: 0 };
let repeatTimers = new Map();
let listeners = new Set();
let connected = false;

// Gamepad button mapping (standard layout)
const BUTTON_MAP = {
  0: 'a',      // A / Cross - Confirm/Select
  1: 'b',      // B / Circle - Cancel/Back
  2: 'x',      // X / Square - Contextual
  3: 'y',      // Y / Triangle - Contextual
  4: 'lb',     // Left Bumper / L1
  5: 'rb',     // Right Bumper / R1
  6: 'lt',     // Left Trigger / L2
  7: 'rt',     // Right Trigger / R2
  8: 'back',   // Back / View / Share
  9: 'start',  // Start / Options
  10: 'ls',    // Left Stick Press / L3
  11: 'rs',    // Right Stick Press / R3
  12: 'up',    // D-pad Up
  13: 'down',  // D-pad Down
  14: 'left',  // D-pad Left
  15: 'right', // D-pad Right
  16: 'home',  // Home / Guide / PS Button
};

const AXIS_MAP = {
  0: 'lx',  // Left Stick X
  1: 'ly',  // Left Stick Y
  2: 'rx',  // Right Stick X
  3: 'ry',  // Right Stick Y
};

// Direction mapping for navigation
const DIRECTIONS = {
  up:    { key: 'ArrowUp',    gamepad: 'up' },
  down:  { key: 'ArrowDown',  gamepad: 'down' },
  left:  { key: 'ArrowLeft',  gamepad: 'left' },
  right: { key: 'ArrowRight', gamepad: 'right' },
};

function getGamepad() {
  const gamepads = navigator.getGamepads();
  return gamepadIndex >= 0 ? gamepads[gamepadIndex] : null;
}

function findGamepad() {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (gp && gp.connected) {
      return i;
    }
  }
  return -1;
}

function emit(event, detail = {}) {
  listeners.forEach(cb => {
    try {
      cb({ type: event, detail, gamepad: gamepadState });
    } catch (e) {
      console.warn('Gamepad listener error:', e);
    }
  });

  // Also dispatch custom event for global listeners
  window.dispatchEvent(new CustomEvent(`gamepad:${event}`, { detail }));
}

function createKeyboardEvent(key, type) {
  return new KeyboardEvent(type, {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
}

function dispatchKeyboard(key, type) {
  const event = createKeyboardEvent(key, type);
  document.dispatchEvent(event);
}

function handleButtonPress(buttonIndex, pressed) {
  const buttonName = BUTTON_MAP[buttonIndex];
  if (!buttonName) return;

  const wasPressed = buttonStates.get(buttonIndex) || false;
  if (pressed === wasPressed) return;

  buttonStates.set(buttonIndex, pressed);

  if (pressed) {
    emit('button:down', { button: buttonName, index: buttonIndex });
    emit(`button:${buttonName}:down`);

    // Map to keyboard for UI navigation
    switch (buttonName) {
      case 'a':
        dispatchKeyboard('Enter', 'keydown');
        break;
      case 'b':
        dispatchKeyboard('Escape', 'keydown');
        break;
      case 'start':
        dispatchKeyboard('Home', 'keydown');
        break;
      case 'back':
        dispatchKeyboard('Escape', 'keydown');
        break;
      case 'lb':
        dispatchKeyboard('PageUp', 'keydown');
        break;
      case 'rb':
        dispatchKeyboard('PageDown', 'keydown');
        break;
    }
  } else {
    emit('button:up', { button: buttonName, index: buttonIndex });
    emit(`button:${buttonName}:up`);

    // Release keyboard
    switch (buttonName) {
      case 'a':
        dispatchKeyboard('Enter', 'keyup');
        break;
      case 'b':
        dispatchKeyboard('Escape', 'keyup');
        break;
      case 'start':
        dispatchKeyboard('Home', 'keyup');
        break;
      case 'back':
        dispatchKeyboard('Escape', 'keyup');
        break;
      case 'lb':
        dispatchKeyboard('PageUp', 'keyup');
        break;
      case 'rb':
        dispatchKeyboard('PageDown', 'keyup');
        break;
    }
  }
}

function handleAxis(axisIndex, value) {
  const axisName = AXIS_MAP[axisIndex];
  if (!axisName) return;

  // Apply deadzone
  if (Math.abs(value) < DEADZONE) value = 0;

  // Left stick for navigation
  if (axisName === 'lx' || axisName === 'ly') {
    const isHorizontal = axisName === 'lx';
    const direction = isHorizontal ? (value > 0 ? 'right' : 'left') : (value > 0 ? 'down' : 'up');

    if (value !== 0) {
      axisStates[isHorizontal ? 'x' : 'y'] = value;

      // Handle repeat for held direction
      const dirKey = isHorizontal ? (value > 0 ? 'right' : 'left') : (value > 0 ? 'down' : 'up');
      startRepeat(dirKey);
    } else {
      axisStates[isHorizontal ? 'x' : 'y'] = 0;
      stopRepeat(isHorizontal ? 'horizontal' : 'vertical');
    }
  }
}

function startRepeat(direction) {
  if (repeatTimers.has(direction)) return;

  const dirInfo = DIRECTIONS[direction];
  if (!dirInfo) return;

  // Initial press
  dispatchKeyboard(dirInfo.key, 'keydown');
  emit('direction', { direction, ...dirInfo });

  // Start repeat timer
  const initialTimer = setTimeout(() => {
    const repeatTimer = setInterval(() => {
      dispatchKeyboard(dirInfo.key, 'keydown');
      emit('direction:repeat', { direction, ...dirInfo });
    }, REPEAT_INTERVAL);
    repeatTimers.set(direction, repeatTimer);
  }, REPEAT_DELAY);

  repeatTimers.set(`${direction}_initial`, initialTimer);
}

function stopRepeat(axis) {
  const directions = axis === 'horizontal' ? ['left', 'right'] : ['up', 'down'];

  directions.forEach(dir => {
    const initialTimer = repeatTimers.get(`${dir}_initial`);
    if (initialTimer) {
      clearTimeout(initialTimer);
      repeatTimers.delete(`${dir}_initial`);
    }

    const repeatTimer = repeatTimers.get(dir);
    if (repeatTimer) {
      clearInterval(repeatTimer);
      repeatTimers.delete(dir);
    }

    const dirInfo = DIRECTIONS[dir];
    if (dirInfo) {
      dispatchKeyboard(dirInfo.key, 'keyup');
    }
  });
}

function pollGamepad() {
  const gp = getGamepad();
  if (!gp) {
    if (connected) {
      connected = false;
      emit('disconnected');
      announce('Controle desconectado');
    }
    animationFrameId = requestAnimationFrame(pollGamepad);
    return;
  }

  if (!connected) {
    connected = true;
    emit('connected', { id: gp.id, index: gp.index });
    announce('Controle conectado');
  }

  gamepadState = {
    id: gp.id,
    index: gp.index,
    timestamp: gp.timestamp,
    buttons: gp.buttons.map(b => ({ pressed: b.pressed, value: b.value })),
    axes: Array.from(gp.axes),
  };

  // Poll buttons
  gp.buttons.forEach((button, i) => {
    handleButtonPress(i, button.pressed);
  });

  // Poll axes
  gp.axes.forEach((value, i) => {
    handleAxis(i, value);
  });

  animationFrameId = requestAnimationFrame(pollGamepad);
}

export function init() {
  if (animationFrameId) return; // Already initialized

  // Listen for gamepad connection events
  window.addEventListener('gamepadconnected', e => {
    if (gamepadIndex === -1) {
      gamepadIndex = e.gamepad.index;
    }
  });

  window.addEventListener('gamepaddisconnected', e => {
    if (e.gamepad.index === gamepadIndex) {
      gamepadIndex = findGamepad();
    }
  });

  // Find existing gamepad
  gamepadIndex = findGamepad();

  // Start polling
  pollGamepad();

  return {
    destroy: () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      repeatTimers.forEach(timer => {
        if (typeof timer === 'number') clearTimeout(timer);
        else clearInterval(timer);
      });
      repeatTimers.clear();
      buttonStates.clear();
      listeners.clear();
      window.removeEventListener('gamepadconnected', null);
      window.removeEventListener('gamepaddisconnected', null);
    },
  };
}

export function on(event, callback) {
  const wrapped = ({ detail }) => callback(detail, gamepadState);
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

export function off(event, callback) {
  // Not directly removable without storing reference
  // Use returned function from on()
}

export function getState() {
  return gamepadState;
}

export function isConnected() {
  return connected;
}

export function getGamepadIndex() {
  return gamepadIndex;
}

export function vibrate(duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.5) {
  const gp = getGamepad();
  if (gp?.vibrationActuator) {
    gp.vibrationActuator.playEffect('dual-rumble', {
      duration,
      strongMagnitude,
      weakMagnitude,
    }).catch(() => {});
  } else if (gp?.hapticActuators) {
    gp.hapticActuators.forEach(actuator => {
      actuator.pulse(weakMagnitude, duration).catch(() => {});
    });
  }
}

export function vibrateTrigger(duration = 100, magnitude = 0.5) {
  const gp = getGamepad();
  if (gp?.vibrationActuator) {
    gp.vibrationActuator.playEffect('trigger-rumble', {
      duration,
      strongMagnitude: magnitude,
      weakMagnitude: 0,
    }).catch(() => {});
  }
}

export default {
  init,
  on,
  off,
  getState,
  isConnected,
  getGamepadIndex,
  vibrate,
  vibrateTrigger,
  BUTTON_MAP,
  AXIS_MAP,
};