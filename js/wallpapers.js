import { $, $$, toast } from './ui.js';
import { authState, requireAuthentication, canAccessPersonalization } from './auth.js';

export const WALLPAPERS = [
  { id: 'cosmic-gradient', name: 'Gradiente Cósmico', description: 'Azul, roxo e ciano em movimento lento.', performance: 'Leve', visitor: true },
  { id: 'neon-particles', name: 'Partículas Neon', description: 'Pontos luminosos conectados em canvas.', performance: 'Médio', visitor: false },
  { id: 'digital-waves', name: 'Ondas Digitais', description: 'Ondas de energia criadas somente com CSS.', performance: 'Leve', visitor: false },
  { id: 'none', name: 'Sem animação', description: 'Fundo escuro estático, sem loops ativos.', performance: 'Mínimo', visitor: true },
];

const layer = $('#live-wallpaper');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selectedWallpaper = 'cosmic-gradient';
let animationFrame = 0;
let particles = [];
let canvas = null;
let context = null;
let paused = false;

function preferenceKey() {
  return authState.user?.id ? `plumpWallpaper:${authState.user.id}` : 'plumpWallpaper:visitor';
}

function renderSelection() {
  $$('.wallpaper-option').forEach((card) => card.classList.toggle('is-selected', card.dataset.wallpaper === selectedWallpaper));
  $$('.wallpaper-option [data-select-wallpaper]').forEach((button) => {
    const active = button.closest('.wallpaper-option').dataset.wallpaper === selectedWallpaper;
    button.textContent = active ? 'Selecionado' : 'Selecionar';
    button.setAttribute('aria-pressed', String(active));
  });
}

export function stopParticleWallpaper() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  canvas?.remove();
  canvas = null;
  context = null;
  particles = [];
}

export function startParticleWallpaper() {
  if (reducedMotion.matches || paused || document.hidden || selectedWallpaper !== 'neon-particles') return;
  stopParticleWallpaper();
  canvas = document.createElement('canvas');
  canvas.className = 'wallpaper-particle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  layer.append(canvas);
  context = canvas.getContext('2d');
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = innerWidth < 680 ? 24 : Math.min(52, Math.floor(innerWidth / 28));
    particles = Array.from({ length: count }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, radius: 1 + Math.random() * 1.4 }));
  };
  resize();
  const draw = () => {
    if (paused || document.hidden || selectedWallpaper !== 'neon-particles') return;
    context.clearRect(0, 0, innerWidth, innerHeight);
    particles.forEach((particle, index) => {
      particle.x = (particle.x + particle.vx + innerWidth) % innerWidth;
      particle.y = (particle.y + particle.vy + innerHeight) % innerHeight;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = index % 2 ? '#38d9f5' : '#a855f7';
      context.shadowBlur = 12;
      context.shadowColor = context.fillStyle;
      context.fill();
      const connectionLimit = innerWidth < 680 ? Math.min(index + 5, particles.length) : particles.length;
      for (let next = index + 1; next < connectionLimit; next += 1) {
        const other = particles[next];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < 105) {
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(82, 210, 255, ${.16 * (1 - distance / 105)})`;
          context.stroke();
        }
      }
    });
    animationFrame = requestAnimationFrame(draw);
  };
  draw();
}

export function setWallpaper(wallpaperId, { save = true, bypassAccess = false } = {}) {
  const wallpaper = WALLPAPERS.find((item) => item.id === wallpaperId) || WALLPAPERS[0];
  if (!bypassAccess && !wallpaper.visitor && !canAccessPersonalization()) {
    toast('Entre ou crie uma conta para usar este live wallpaper.', 'error');
    requireAuthentication();
    return false;
  }
  stopParticleWallpaper();
  selectedWallpaper = reducedMotion.matches ? 'none' : wallpaper.id;
  layer.className = `live-wallpaper wallpaper--${selectedWallpaper}`;
  layer.replaceChildren();
  if (save && !reducedMotion.matches) localStorage.setItem(preferenceKey(), selectedWallpaper);
  if (selectedWallpaper === 'neon-particles') startParticleWallpaper();
  renderSelection();
  return true;
}

export function loadWallpaperPreference() {
  if (reducedMotion.matches) return setWallpaper('none', { save: false, bypassAccess: true });
  const stored = localStorage.getItem(preferenceKey()) || 'cosmic-gradient';
  const allowed = WALLPAPERS.find((item) => item.id === stored)?.visitor || canAccessPersonalization();
  return setWallpaper(allowed ? stored : 'cosmic-gradient', { save: false, bypassAccess: true });
}

export function pauseWallpaper() {
  paused = true;
  layer.classList.add('is-paused');
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

export function resumeWallpaper() {
  if (reducedMotion.matches || document.hidden) return;
  paused = false;
  layer.classList.remove('is-paused');
  if (selectedWallpaper === 'neon-particles' && !animationFrame) startParticleWallpaper();
}

function renderCards() {
  const selector = $('#wallpaper-selector');
  selector.replaceChildren(...WALLPAPERS.map((wallpaper) => {
    const card = document.createElement('article');
    card.className = 'wallpaper-option';
    card.dataset.wallpaper = wallpaper.id;
    card.innerHTML = `<span class="wallpaper-thumb wallpaper-thumb--${wallpaper.id}" aria-hidden="true"></span><div><b>${wallpaper.name}</b><p>${wallpaper.description}</p><small>Desempenho: ${wallpaper.performance}${wallpaper.visitor ? '' : ' • Exclusivo'}</small></div><button class="button button--small button--ghost" type="button" data-select-wallpaper="${wallpaper.id}">Selecionar</button>`;
    return card;
  }));
  selector.addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-wallpaper]');
    if (button) setWallpaper(button.dataset.selectWallpaper);
  });
}

export function initWallpapers() {
  renderCards();
  loadWallpaperPreference();
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' ? pauseWallpaper() : resumeWallpaper());
  $('#pause-wallpaper')?.addEventListener('change', (event) => event.target.checked ? pauseWallpaper() : resumeWallpaper());
  window.addEventListener('resize', () => { if (selectedWallpaper === 'neon-particles') startParticleWallpaper(); });
  window.addEventListener('plump:auth', loadWallpaperPreference);
  window.addEventListener('plump:logout', (event) => {
    if (event.detail?.userId) localStorage.removeItem(`plumpWallpaper:${event.detail.userId}`);
    setWallpaper('cosmic-gradient', { bypassAccess: true });
  });
  reducedMotion.addEventListener?.('change', () => reducedMotion.matches ? setWallpaper('none', { save: false, bypassAccess: true }) : loadWallpaperPreference());
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-wallpapers]')) {
      if (!canAccessPersonalization()) { requireAuthentication(); return; }
      $('[data-open-settings]')?.click();
      requestAnimationFrame(() => $('#live-wallpaper-settings')?.scrollIntoView({ block: 'start' }));
    }
  });
}

Object.assign(window, { setWallpaper, loadWallpaperPreference, startParticleWallpaper, stopParticleWallpaper, pauseWallpaper, resumeWallpaper });
