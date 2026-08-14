/* PlumpGames virtual input bridge — include this file in games embedded by PlumpGames. */
(function installPlumpGamesInputBridge() {
  'use strict';

  const PLUMPGAMES_ORIGIN = 'https://site.kiwifypurplehero.workers.dev';
  const pressedCodes = new Set();

  function dispatch(action, key, code) {
    const isDown = action === 'keydown';
    if (isDown ? pressedCodes.has(code) : !pressedCodes.has(code)) return;
    if (isDown) pressedCodes.add(code);
    else pressedCodes.delete(code);
    const target = document.activeElement || document.body || window;
    target.dispatchEvent(new KeyboardEvent(action, {
      key,
      code,
      bubbles: true,
      cancelable: true,
      composed: true
    }));
  }

  function releaseAll() {
    for (const code of [...pressedCodes]) dispatch('keyup', keyFromCode(code), code);
  }

  function keyFromCode(code) {
    if (code === 'Space') return ' ';
    if (code.startsWith('Key')) return code.slice(3).toLowerCase();
    if (code.startsWith('Digit')) return code.slice(5);
    return code === 'ControlLeft' ? 'Control' : code === 'ShiftLeft' ? 'Shift' : code;
  }

  window.addEventListener('message', event => {
    if (event.origin !== PLUMPGAMES_ORIGIN || event.source !== window.parent) return;
    const data = event.data;
    if (data?.type === 'plumpgames-input-ping') {
      event.source.postMessage({ type: 'plumpgames-input-ready' }, event.origin);
      return;
    }
    if (data?.type !== 'plumpgames-input' || !['keydown', 'keyup'].includes(data.action)) return;
    if (typeof data.key !== 'string' || typeof data.code !== 'string') return;
    dispatch(data.action, data.key, data.code);
  });
  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  window.addEventListener('beforeunload', releaseAll);
}());
