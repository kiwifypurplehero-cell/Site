const LOADING_MAX_DURATION = 3000;
const LOADING_MIN_FINISH = 260;
const startedAt = performance.now();
const overlay = document.querySelector('#site-loader');
const backdrop = overlay?.querySelector('.loading-backdrop');
const bar = overlay?.querySelector('.site-loader__bar');
const track = overlay?.querySelector('[role="progressbar"]');
const percent = overlay?.querySelector('[data-loader-percent]');
const message = overlay?.querySelector('[data-loader-status]');
let progress = 0;
let finished = false;
let frame = 0;

function paint(value, label) {
  progress = Math.max(progress, Math.min(100, Math.round(value)));
  if (bar) bar.style.width = `${progress}%`;
  if (percent) percent.textContent = `${progress}%`;
  if (track) track.setAttribute('aria-valuenow', String(progress));
  if (label && message) message.textContent = label;
}

function unlockPage() {
  document.body?.classList.remove('loading-active');
  document.body?.classList.remove('loading');
  document.documentElement.classList.remove('loading-active');
  document.documentElement.classList.remove('loading');
  for (const node of [document.body, document.documentElement]) {
    node?.style.removeProperty('overflow');
    node?.style.removeProperty('touch-action');
    node?.style.removeProperty('pointer-events');
  }
}

function removeOverlay(degraded = false) {
  if (finished) return;
  finished = true;
  cancelAnimationFrame(frame);
  paint(100, degraded ? 'Site pronto em modo básico' : 'Pronto');
  const elapsed = performance.now() - startedAt;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transition = reduced ? 0 : Math.max(120, LOADING_MIN_FINISH - Math.min(elapsed, LOADING_MIN_FINISH));
  setTimeout(() => {
    overlay?.classList.add('is-complete');
    if (overlay) overlay.style.pointerEvents='none';
    unlockPage();
    setTimeout(() => { if (backdrop) backdrop.remove(); if (overlay) overlay.remove(); }, reduced ? 0 : 220);
    window.siteCriticalReady = true;
    window.__PLUMPGAMES_METRICS__ = {...(window.__PLUMPGAMES_METRICS__ || {}), overlayMs: Math.round(performance.now() - startedAt)};
    document.dispatchEvent(new CustomEvent('plumpgames:loader-complete', {detail:{degraded}}));
  }, transition);
}

function animate() {
  if (finished) return;
  const elapsed = performance.now() - startedAt;
  // Time supplies continuous progress, while leaving room for a smooth bootstrap finish.
  paint(Math.min(92, 4 + (elapsed / LOADING_MAX_DURATION) * 88));
  frame = requestAnimationFrame(animate);
}

async function mainBootstrap() {
  try {
    paint(0, 'Iniciando…');
    frame = requestAnimationFrame(animate);
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
    }
    paint(45, 'Interface pronta');
    // Authentication/profile/wallpaper/AI are deliberately not part of this critical path.
    await Promise.race([
      new Promise(resolve => document.addEventListener('plumpgames:critical-ready', resolve, {once:true})),
      new Promise(resolve => setTimeout(resolve, 900))
    ]);
    paint(96, 'Finalizando…');
  } catch (error) {
    console.debug('[loader] bootstrap não bloqueante', error);
  } finally {
    removeOverlay(false);
  }
}

// Absolute escape hatch: no rejected promise or unavailable service can leave blur behind.
const hardFallback = setTimeout(() => removeOverlay(true), LOADING_MAX_DURATION - 240);
mainBootstrap().finally(() => {
  if (finished) clearTimeout(hardFallback);
});
