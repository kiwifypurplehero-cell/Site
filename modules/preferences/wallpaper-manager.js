/**
 * Wallpaper Manager module
 * Handles live wallpaper loading, transitions, and playback control
 */

import { preferencesManager } from './preferences.js';

const wallpaperManager = {
  active: null,
  pending: null,
  request: 0,
  manuallyPaused: false,
  resumeAfterHidden: false,

  reduced() {
    return preferencesManager.get('reduceMotion') ||
           preferencesManager.get('economy') ||
           matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

function syncWallpaperState(hasLiveWallpaper = Boolean(wallpaperManager.active)) {
  document.documentElement.classList.toggle('has-live-wallpaper', hasLiveWallpaper);
  document.documentElement.classList.toggle('no-live-wallpaper', !hasLiveWallpaper);
}

function createWallpaperVideo(item) {
  const video = document.createElement('video');
  video.className = 'live-wallpaper-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-hidden', 'true');
  video.src = item.url;
  return video;
}

function loadWallpaper(item) {
  const video = createWallpaperVideo(item);
  return new Promise((resolve, reject) => {
    const done = () => { cleanup(); resolve(video); };
    const fail = () => { cleanup(); reject(new Error('wallpaper-load')); };
    const cleanup = () => {
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('canplay', done);
      video.removeEventListener('error', fail);
    };
    video.addEventListener('loadeddata', done, { once: true });
    video.addEventListener('canplay', done, { once: true });
    video.addEventListener('error', fail, { once: true });
    video.load();
  });
}

function destroyVideo(video) {
  if (!video) return;
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
}

function destroyWallpaper() {
  destroyVideo(wallpaperManager.pending);
  destroyVideo(wallpaperManager.active);
  wallpaperManager.pending = null;
  wallpaperManager.active = null;
}

function pauseWallpaper(manual = true) {
  if (manual) wallpaperManager.manuallyPaused = true;
  wallpaperManager.active?.pause();
  wallpaperManager.pending?.pause();
}

function resumeWallpaper() {
  wallpaperManager.manuallyPaused = false;
  if (!document.hidden && !wallpaperManager.reduced()) {
    wallpaperManager.active?.play().catch(() =>
      setStatus('O navegador bloqueou a reprodução.', true)
    );
  }
}

async function transitionWallpaper(next, old, token) {
  if (token !== wallpaperManager.request) { destroyVideo(next); return false; }
  next.style.willChange = 'opacity';
  if (old) old.style.willChange = 'opacity';
  next.classList.add('is-visible');
  old?.classList.remove('is-visible');

  await new Promise(resolve =>
    setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420)
  );

  if (token !== wallpaperManager.request) {
    destroyVideo(next);
    old?.classList.add('is-visible');
    if (old) old.style.willChange = '';
    return false;
  }
  destroyVideo(old);
  next.style.willChange = '';
  wallpaperManager.active = next;
  wallpaperManager.pending = null;
  return true;
}

let setStatus = (msg, error = false) => {
  const status = document.querySelector('#wallpaper-status');
  if (status) {
    status.textContent = msg;
    status.classList.toggle('is-error', error);
    const retry = document.querySelector('#wallpaper-retry');
    if (retry) retry.hidden = !error;
  }
};

export function setStatusCallback(fn) { setStatus = fn; }

export async function applyWallpaper(item, restoring = false) {
  const token = ++wallpaperManager.request;
  destroyVideo(wallpaperManager.pending);
  wallpaperManager.pending = null;

  if (!item.url || wallpaperManager.reduced()) {
    destroyWallpaper();
    syncWallpaperState(false);
    preferencesManager.set('wallpaper', item.id);
    applyColors(preferencesManager.themeColors);
    renderWallpapers();
    setStatus(item.url ? 'Movimento reduzido ou modo desempenho ativo: usando fundo estático.' : 'Wallpaper sem animação ativo.');
    return;
  }

  setStatus('Carregando wallpaper…');
  try {
    const next = await loadWallpaper(item);
    if (token !== wallpaperManager.request) { destroyVideo(next); return; }
    wallpaperManager.pending = next;
    document.querySelector('#wallpaper-stage')?.append(next);
    await next.play();
    const applied = await transitionWallpaper(next, wallpaperManager.active, token);
    if (!applied) return;
    syncWallpaperState(true);
    preferencesManager.set('wallpaper', item.id);
    applyColors(preferencesManager.themeColors);
    renderWallpapers();
    setStatus(`${item.name} ativo.`);
  } catch {
    destroyVideo(wallpaperManager.pending);
    wallpaperManager.pending = null;
    setStatus('Não foi possível carregar o wallpaper. O anterior foi mantido.', true);
    if (!restoring && !wallpaperManager.manuallyPaused) {
      wallpaperManager.active?.play().catch(() => {});
    }
  }
}

export function selectWallpaper(id, restoring = false) {
  const item = wallpapers.find(entry => entry.id === id);
  return item ? applyWallpaper(item, restoring) : Promise.resolve();
}

function renderWallpapers() {
  const container = document.querySelector('#wallpaper-selector');
  if (!container) return;
  container.innerHTML = wallpapers.map(item => `
    <article class="wallpaper-card${item.id === preferencesManager.get('wallpaper') ? ' is-selected' : ''}">
      <div class="wallpaper-thumb wallpaper-thumb--${item.id}" aria-hidden="true"></div>
      <div><strong>${item.name}</strong><small>${item.performance}</small></div>
      <button class="button button--small" type="button" data-wallpaper="${item.id}"
        ${item.id === preferencesManager.get('wallpaper') ? 'aria-pressed="true"' : ''}>
        ${item.id === preferencesManager.get('wallpaper') ? 'Selecionado' : 'Selecionar'}
      </button>
    </article>
  `).join('');
  container.querySelectorAll('[data-wallpaper]').forEach(button =>
    button.addEventListener('click', () => selectWallpaper(button.dataset.wallpaper))
  );
}

function applyColors(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
  root.style.setProperty('--menu-border', `${colors.primary}88`);
  root.style.setProperty('--menu-hover', `${colors.primary}26`);
  root.style.setProperty('--menu-opacity', preferencesManager.get('menuOpacity'));
}

function syncControls() {
  const themeSelect = document.querySelector('#theme-select');
  if (themeSelect) themeSelect.value = preferencesManager.get('theme');

  const wallpaperColors = document.querySelector('#wallpaper-colors');
  if (wallpaperColors) wallpaperColors.checked = preferencesManager.get('wallpaperColors');

  const menuOpacity = document.querySelector('#menu-opacity');
  if (menuOpacity) menuOpacity.value = preferencesManager.get('menuOpacity');

  const economyMode = document.querySelector('#economy-mode');
  if (economyMode) economyMode.checked = preferencesManager.get('economy');

  const glowStrength = document.querySelector('#glow-strength');
  if (glowStrength) glowStrength.value = preferencesManager.get('glow');

  const cardOpacity = document.querySelector('#card-opacity');
  if (cardOpacity) cardOpacity.value = preferencesManager.get('opacity');

  const animationStrength = document.querySelector('#animation-strength');
  if (animationStrength) animationStrength.value = preferencesManager.get('animation');

  const customColors = preferencesManager.get('custom');
  ['primary', 'secondary', 'accent', 'menu', 'button', 'glow'].forEach(key => {
    const el = document.querySelector(`#color-${key}`);
    if (el) el.value = customColors[key];
  });

  document.querySelectorAll('[data-view-mode]').forEach(button =>
    button.setAttribute('aria-pressed', String(button.dataset.viewMode === preferencesManager.get('view')))
  );

  const gamesList = document.querySelector('#games-list');
  if (gamesList) gamesList.dataset.view = preferencesManager.get('view');

  document.body.classList.toggle('reduce-animations', preferencesManager.get('reduceMotion'));
  document.body.classList.toggle('high-contrast', preferencesManager.get('highContrast'));
  document.documentElement.classList.toggle('performance-mode', preferencesManager.get('economy'));
  document.documentElement.style.setProperty('--glow-strength', preferencesManager.get('glow'));
  document.documentElement.style.setProperty('--card-opacity', preferencesManager.get('opacity'));
  document.documentElement.style.setProperty('--animation-strength', preferencesManager.get('animation'));
  applyColors(preferencesManager.themeColors);
}

export function initWallpaperManager() {
  syncWallpaperState(false);
  renderWallpapers();
  syncControls();

  // Restore wallpaper on loader complete
  if (preferencesManager.get('wallpaper') !== 'none') {
    document.addEventListener('plumpgames:loader-complete', () =>
      setTimeout(() => selectWallpaper(preferencesManager.get('wallpaper'), true), 0),
      { once: true }
    );
  }

  // Visibility change handling
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      wallpaperManager.resumeAfterHidden = Boolean(
        wallpaperManager.active && !wallpaperManager.active.paused && !wallpaperManager.manuallyPaused
      );
      pauseWallpaper(false);
    } else if (wallpaperManager.resumeAfterHidden && !wallpaperManager.manuallyPaused) {
      wallpaperManager.resumeAfterHidden = false;
      resumeWallpaper();
    }
  });

  // Reduced motion preference change
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  motionPreference.addEventListener?.('change', () => selectWallpaper(preferencesManager.get('wallpaper'), true));

  // Performance suggestion
  const weakDevice = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                     (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const suggestion = document.querySelector('#performance-suggestion');
  if (suggestion) suggestion.hidden = !weakDevice || preferencesManager.get('economy');
}

export { wallpaperManager, pauseWallpaper, resumeWallpaper, renderWallpapers, syncControls, applyColors };
export { themes, wallpapers, defaults, DEFAULT_COLORS } from './preferences.js';