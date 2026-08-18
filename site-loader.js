const MINIMUM_VISIBLE_TIME = 3000;
const MAXIMUM_BOOT_TIME = 18000;
const FADE_TIME = 280;

const overlay = document.querySelector('#site-loader');
const bar = overlay?.querySelector('.site-loader__bar');
const track = overlay?.querySelector('[role="progressbar"]');
const percentLabel = overlay?.querySelector('[data-loader-percent]');
const overlayStart = performance.now();
const debug = new URL(location.href).searchParams.get('debug') === '1';
let state = 'boot';
let realProgress = 10;
let visualProgress = 10;
let animationFrame;
let safetyTimer;
let emulatorModule;

function setState(nextState) {
  state = nextState;
  if (overlay) overlay.dataset.state = nextState;
}

function renderProgress(value) {
  visualProgress = Math.max(visualProgress, Math.min(100, Math.round(value)));
  if (bar) bar.style.width = `${visualProgress}%`;
  if (percentLabel) percentLabel.textContent = `${visualProgress}%`;
  track?.setAttribute('aria-valuenow', String(visualProgress));
}

function reachMilestone(value) {
  realProgress = Math.max(realProgress, Math.min(99, value));
  renderProgress(realProgress);
}

function interpolateProgress() {
  if (state !== 'loading') return;
  const elapsedRatio = Math.min(1, (performance.now() - overlayStart) / MINIMUM_VISIBLE_TIME);
  // Real milestones are authoritative; interpolation only fills the remaining visual time.
  const interpolated = realProgress + (99 - realProgress) * elapsedRatio * 0.72;
  renderProgress(Math.min(99, interpolated));
  animationFrame = requestAnimationFrame(interpolateProgress);
}

function waitForEvent(target, successEvent = 'load', timeout = 8000) {
  return new Promise(resolve => {
    let timer;
    const done = result => { clearTimeout(timer); resolve(result); };
    target.addEventListener(successEvent, () => done(true), {once: true});
    target.addEventListener('error', () => done(false), {once: true});
    timer = setTimeout(() => done(false), timeout);
  });
}

function waitForMainScript() {
  if (window.__PLUMPGAMES_MAIN_READY__) return Promise.resolve();
  return new Promise(resolve => document.addEventListener('plumpgames:critical-ready', resolve, {once: true}));
}

async function loadEmulators(view) {
  emulatorModule ||= import('./emulators.js');
  const module = await emulatorModule;
  if (view) module.setView(view, {historyMode: 'replace'});
}

function requestedView() {
  const view = new URL(location.href).searchParams.get('view') || 'home';
  return ['home', 'emulators', 'ps1', 'gbc', 'ps2'].includes(view) ? view : 'home';
}

// Internal navigation remains instant and only lazily downloads emulator code.
document.addEventListener('click', event => {
  const control = event.target.closest('[data-view-link]');
  const view = control?.dataset.viewLink;
  if (!control || view === 'home' || emulatorModule) return;
  event.preventDefault();
  loadEmulators(view).catch(error => console.error('Falha ao abrir a área de emuladores.', error));
});

function cleanup() {
  cancelAnimationFrame(animationFrame);
  clearTimeout(safetyTimer);
  document.body.classList.remove('loading-active');
  // These properties are class-owned during boot; removing them guarantees the first gesture is free.
  document.body.style.removeProperty('overflow-y');
  document.body.style.removeProperty('touch-action');
  document.body.style.removeProperty('pointer-events');
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('touch-action');
  setState('hidden');
  overlay?.remove();
}

function showSafetyFallback(error) {
  if (state === 'hidden') return;
  // Never release the page as ready when its critical bootstrap did not finish.
  console.error('Falha crítica no bootstrap.', error);
}

function reportPerformance() {
  if (!debug) return;
  console.info('[PLUMPGAMES PERFORMANCE]', {
    overlayRemoved: Math.round(performance.now() - overlayStart),
    requests: performance.getEntriesByType('resource').length
  });
}

async function bootstrap() {
  setState('loading');
  renderProgress(10);
  animationFrame = requestAnimationFrame(interpolateProgress);
  safetyTimer = setTimeout(() => showSafetyFallback(new Error('Tempo máximo de bootstrap excedido.')), MAXIMUM_BOOT_TIME);

  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true}));
  }
  reachMilestone(20);

  await waitForMainScript();
  reachMilestone(30);

  const style = document.querySelector('[data-critical-style]');
  const cssReady = !style || style.sheet || await waitForEvent(style);
  if (!cssReady) console.warn('CSS principal não confirmou o carregamento; o bootstrap continuará.');
  const criticalImages = [...document.querySelectorAll('img[data-critical-image]')];
  const results = await Promise.all(criticalImages.map(image => image.complete ? image.naturalWidth > 0 : waitForEvent(image)));
  if (results.includes(false)) console.warn('Um asset não crítico não pôde ser carregado; o bootstrap continuará.');
  reachMilestone(50);

  const view = requestedView();
  if (view !== 'home') await loadEmulators(view);
  reachMilestone(70);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  reachMilestone(90);
  window.siteCriticalReady = true;

  const remaining = Math.max(0, MINIMUM_VISIBLE_TIME - (performance.now() - overlayStart));
  await new Promise(resolve => setTimeout(resolve, remaining));
  setState('ready');
  cancelAnimationFrame(animationFrame);
  renderProgress(100);
  overlay?.classList.add('is-complete');
  setTimeout(() => { cleanup(); reportPerformance(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : FADE_TIME);
}

bootstrap().catch(showSafetyFallback);

if (debug) document.addEventListener('pointerdown', event => console.debug('[TOQUE INICIAL]', document.elementFromPoint(event.clientX, event.clientY)), {once: true, capture: true, passive: true});
