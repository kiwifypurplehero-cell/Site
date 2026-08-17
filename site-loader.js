const overlay = document.querySelector('#site-loader');
const bar = overlay?.querySelector('.site-loader__bar');
const percentLabel = overlay?.querySelector('[data-loader-percent]');
const stageLabel = overlay?.querySelector('[data-loader-stage]');
const errorArea = overlay?.querySelector('[data-loader-error]');
const startedAt = performance.now();
const debug = new URL(location.href).searchParams.get('debug') === '1';
let progress = 0;
let emulatorModule;

function update(value, stage) {
  progress = Math.max(progress, Math.min(100, value));
  if (bar) bar.style.width = `${progress}%`;
  if (percentLabel) percentLabel.textContent = `${progress}%`;
  if (stageLabel) stageLabel.textContent = stage;
}

function waitFor(target, successEvent = 'load', timeout = 8000) {
  return new Promise(resolve => {
    let timer;
    const done = result => { clearTimeout(timer); resolve(result); };
    target.addEventListener(successEvent, () => done(true), {once: true});
    target.addEventListener('error', () => done(false), {once: true});
    timer = setTimeout(() => done(false), timeout);
  });
}

async function loadEmulators(view) {
  emulatorModule ||= import('./emulators.js');
  const module = await emulatorModule;
  if (view) module.setView(view);
  return module;
}

function requestedView() {
  const view = new URL(location.href).searchParams.get('view') || 'home';
  return ['home', 'emulators', 'ps1', 'gbc', 'ps2'].includes(view) ? view : 'home';
}

// Keep emulator code and its registry off the initial Home request path.
document.addEventListener('click', event => {
  const control = event.target.closest('[data-view-link]');
  if (!control || emulatorModule) return;
  const view = control.dataset.viewLink;
  if (view === 'home') return;
  event.preventDefault();
  loadEmulators(view).catch(error => console.error('Falha ao abrir a área de emuladores.', error));
});

function reportPerformance() {
  if (!debug) return;
  const resources = performance.getEntriesByType('resource');
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map(entry => [entry.name, Math.round(entry.startTime)]));
  console.info('[PLUMPGAMES PERFORMANCE]', {
    domContentLoaded: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
    load: Math.round(performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0),
    firstContentfulPaint: paints['first-contentful-paint'],
    overlayRemoved: Math.round(performance.now() - startedAt),
    requests: resources.length,
    transferredBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    scripts: resources.filter(entry => entry.initiatorType === 'script').map(entry => entry.name),
    images: resources.filter(entry => entry.initiatorType === 'img').map(entry => entry.name)
  });
  if ('PerformanceObserver' in window) {
    try { new PerformanceObserver(list => list.getEntries().forEach(entry => console.warn('[LONG TASK]', Math.round(entry.duration), 'ms'))).observe({type: 'longtask', buffered: true}); } catch {}
    try { new PerformanceObserver(list => { const entries = list.getEntries(); if (entries.length) console.info('[LCP]', Math.round(entries.at(-1).startTime), 'ms'); }).observe({type: 'largest-contentful-paint', buffered: true}); } catch {}
  }
}

async function bootstrap() {
  update(10, 'Carregando CSS e JavaScript principal');
  if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true}));
  const style = document.querySelector('[data-critical-style]');
  const cssReady = !style || style.sheet || await waitFor(style);
  if (!cssReady) console.warn('CSS principal não confirmou o carregamento dentro do limite.');
  update(40, 'Carregando assets essenciais');

  const criticalImages = [...document.querySelectorAll('img[data-critical-image]')];
  const imageResults = await Promise.all(criticalImages.map(image => image.complete ? image.naturalWidth > 0 : waitFor(image)));
  if (imageResults.includes(false)) console.warn('Um asset visual secundário não pôde ser carregado.');
  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 3000))]);
  update(70, 'Inicializando interface');

  if (requestedView() !== 'home') await loadEmulators();
  update(90, 'Preparando primeira view');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  update(100, 'Pronto');
  overlay?.classList.add('is-complete');
  setTimeout(() => { overlay?.remove(); reportPerformance(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
}

bootstrap().catch(error => {
  console.error('Falha crítica no bootstrap.', error);
  update(progress, 'Não foi possível iniciar');
  if (errorArea) {
    errorArea.hidden = false;
    errorArea.replaceChildren(document.createTextNode('A aplicação não pôde ser iniciada. '));
    const reload = document.createElement('button');
    reload.type = 'button'; reload.textContent = 'Recarregar'; reload.onclick = () => location.reload();
    errorArea.append(reload);
  }
});

if (debug) document.addEventListener('pointerdown', event => console.debug('[TOQUE INICIAL]', document.elementFromPoint(event.clientX, event.clientY), event.composedPath()), {once: true, capture: true, passive: true});
