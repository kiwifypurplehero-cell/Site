'use strict';

const STORAGE_KEY = 'plumpgames-preferences-v3';
const OFFICIAL_URL = 'https://site.kiwifypurplehero.workers.dev/';
const DEFAULT_COLORS = { primary: '#7c3aed', secondary: '#06b6d4', accent: '#f0abfc', glow: '#a855f7', menu: '#0b0c19', button: '#7c3aed' };
const themes = {
  original: DEFAULT_COLORS,
  blue: { primary:'#22d3ee', secondary:'#0ea5e9', accent:'#bae6fd', glow:'#67e8f9', menu:'#07131e', button:'#0284c7' },
  purple: { primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#100b20', button:'#7c3aed' },
  red: { primary:'#ef4444', secondary:'#be123c', accent:'#fecdd3', glow:'#fb7185', menu:'#1b080d', button:'#e11d48' },
  green: { primary:'#22c55e', secondary:'#059669', accent:'#bbf7d0', glow:'#4ade80', menu:'#06170e', button:'#16a34a' },
  light: { primary:'#4f46e5', secondary:'#0284c7', accent:'#312e81', glow:'#818cf8', menu:'#e8eaf5', button:'#4f46e5' },
  dark: { primary:'#94a3b8', secondary:'#64748b', accent:'#f8fafc', glow:'#cbd5e1', menu:'#050611', button:'#475569' }
};
const wallpapers = [
  { id:'lantern', name:'Lantern Moths', performance:'Leve', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Lantern-Moths.mp4', colors:{ primary:'#f59e0b', secondary:'#f97316', accent:'#fde68a', glow:'#fbbf24', menu:'#160d04', button:'#f59e0b' } },
  { id:'cafe', name:'Cafe by the Beach', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Cafe-by-the-Beach.mp4', colors:{ primary:'#22d3ee', secondary:'#0ea5e9', accent:'#fef3c7', glow:'#67e8f9', menu:'#06151b', button:'#0891b2' } },
  { id:'miyabi', name:'Hoshimi Miyabi ZZZ', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Hoshimi-Miyabi-ZZZ-1.mp4', colors:{ primary:'#38bdf8', secondary:'#6366f1', accent:'#e0f2fe', glow:'#60a5fa', menu:'#080d20', button:'#4f46e5' } },
  { id:'minecraft', name:'Minecraft Mountain Cabin', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Minecraft-Mountain-Cabin.mp4', colors:{ primary:'#22c55e', secondary:'#65a30d', accent:'#d9f99d', glow:'#4ade80', menu:'#07160b', button:'#16a34a' } },
  { id:'sung', name:'Sung Jin Woo and Beru', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Anime/PREVIEW-Sung-Jin-Woo-and-Beru.mp4', colors:{ primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#0e0920', button:'#7c3aed' } },
  { id:'none', name:'Sem animação', performance:'Muito leve', url:null, colors:DEFAULT_COLORS }
];
const defaults = { wallpaper:'none', wallpaperColors:true, theme:'original', custom:DEFAULT_COLORS, menuOpacity:.88, view:'detailed', reduceMotion:false, economy:false, highContrast:false, glow:1, opacity:.86, animation:1 };
let storedPreferences = {};
try { storedPreferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { localStorage.removeItem(STORAGE_KEY); }
let preferences = { ...defaults, ...storedPreferences, custom: { ...DEFAULT_COLORS, ...(storedPreferences.custom || {}) } };
let lastFocus = null;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
const currentWallpaper = () => wallpapers.find(item => item.id === preferences.wallpaper) || wallpapers.at(-1);

function applyColors(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key,value]) => root.style.setProperty(`--color-${key}`, value));
  root.style.setProperty('--menu-border', `${colors.primary}88`);
  root.style.setProperty('--menu-hover', `${colors.primary}26`);
  root.style.setProperty('--menu-opacity', preferences.menuOpacity);
}
function activeColors() {
  if (preferences.wallpaperColors) return currentWallpaper().colors;
  return preferences.theme === 'custom' ? preferences.custom : (themes[preferences.theme] || DEFAULT_COLORS);
}
function syncControls() {
  $('#theme-select').value = preferences.theme;
  $('#wallpaper-colors').checked = preferences.wallpaperColors;
  $('#menu-opacity').value = preferences.menuOpacity;
  $('#reduce-animations').checked = preferences.reduceMotion;
  $('#economy-mode').checked = preferences.economy;
  $('#high-contrast').checked = preferences.highContrast;
  $('#glow-strength').value = preferences.glow;
  $('#card-opacity').value = preferences.opacity;
  $('#animation-strength').value = preferences.animation;
  const colors = preferences.custom;
  ['primary','secondary','accent','menu','button','glow'].forEach(key => $(`#color-${key}`).value = colors[key]);
  $$('[data-view-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewMode === preferences.view)));
  $('#games-list').dataset.view = preferences.view;
  document.body.classList.toggle('reduce-animations', preferences.reduceMotion);
  document.body.classList.toggle('high-contrast', preferences.highContrast);
  document.documentElement.style.setProperty('--glow-strength', preferences.glow);
  document.documentElement.style.setProperty('--card-opacity', preferences.opacity);
  document.documentElement.style.setProperty('--animation-strength', preferences.animation);
  applyColors(activeColors());
}

function setStatus(message, error = false) {
  const status = $('#wallpaper-status');
  status.textContent = message;
  status.classList.toggle('is-error', error);
}
async function selectWallpaper(id, restoring = false) {
  const selected = wallpapers.find(item => item.id === id);
  if (!selected) return;
  const reduce = preferences.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!selected.url || reduce || preferences.economy) {
    const video = $('#live-wallpaper-video');
    video.pause(); video.removeAttribute('src'); video.load(); video.classList.remove('is-visible');
    preferences.wallpaper = reduce ? 'none' : selected.id;
    applyColors(preferences.wallpaperColors ? (reduce ? DEFAULT_COLORS : selected.colors) : activeColors());
    save(); renderWallpapers();
    setStatus(reduce && selected.url ? 'Movimento reduzido ativo: usando fundo estático.' : 'Wallpaper sem animação ativo.');
    return;
  }
  setStatus('Carregando wallpaper…');
  const oldVideo = $('#live-wallpaper-video');
  const next = document.createElement('video');
  next.className = 'live-wallpaper-video'; next.muted = true; next.loop = true; next.playsInline = true; next.autoplay = true;
  next.setAttribute('aria-hidden','true'); next.preload = 'auto'; next.src = selected.url;
  $('#wallpaper-stage').append(next);
  try {
    await new Promise((resolve, reject) => { next.addEventListener('canplay', resolve, {once:true}); next.addEventListener('error', reject, {once:true}); next.load(); });
    await next.play();
    next.classList.add('is-visible'); oldVideo.classList.remove('is-visible');
    preferences.wallpaper = selected.id; save(); applyColors(activeColors()); renderWallpapers();
    setTimeout(() => { oldVideo.remove(); next.id = 'live-wallpaper-video'; }, 450);
    setStatus(`${selected.name} ativo.`);
  } catch {
    next.remove(); setStatus('Não foi possível carregar o wallpaper. O anterior foi mantido.', true);
    if (!restoring) oldVideo.play().catch(() => {});
  }
}
function renderWallpapers() {
  $('#wallpaper-selector').innerHTML = wallpapers.map(item => `<article class="wallpaper-card${item.id === preferences.wallpaper ? ' is-selected' : ''}"><div class="wallpaper-thumb wallpaper-thumb--${item.id}" aria-hidden="true"></div><div><strong>${item.name}</strong><small>${item.performance}</small></div><button class="button button--small" type="button" data-wallpaper="${item.id}" ${item.id === preferences.wallpaper ? 'aria-pressed="true"' : ''}>${item.id === preferences.wallpaper ? 'Selecionado' : 'Selecionar'}</button></article>`).join('');
  $$('[data-wallpaper]').forEach(button => button.addEventListener('click', () => selectWallpaper(button.dataset.wallpaper)));
}

function openPanel() { const panel=$('#gx-side-panel'); lastFocus=document.activeElement; panel.hidden=false; $('#gx-panel-backdrop').hidden=false; requestAnimationFrame(()=>panel.classList.add('is-open')); $('#gx-menu-button').setAttribute('aria-expanded','true'); document.body.classList.add('panel-open'); $('#gx-panel-close').focus(); }
function closePanel() { const panel=$('#gx-side-panel'); panel.classList.remove('is-open'); $('#gx-menu-button').setAttribute('aria-expanded','false'); document.body.classList.remove('panel-open'); setTimeout(()=>{panel.hidden=true;$('#gx-panel-backdrop').hidden=true;},220); lastFocus?.focus(); }
function togglePanel() { $('#gx-side-panel').hidden ? openPanel() : closePanel(); }
$('#gx-menu-button').addEventListener('click', togglePanel); $('#gx-panel-close').addEventListener('click', closePanel); $('#gx-panel-backdrop').addEventListener('click', closePanel);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#gx-side-panel').hidden) closePanel(); });
$$('.gx-accordion__button').forEach(button => button.addEventListener('click', () => { const open=button.getAttribute('aria-expanded')==='true'; button.setAttribute('aria-expanded', String(!open)); document.getElementById(button.getAttribute('aria-controls')).hidden=open; }));

$('#theme-select').addEventListener('change', event => { preferences.theme=event.target.value; if (event.target.value!=='custom') preferences.custom={...(themes[event.target.value]||DEFAULT_COLORS)}; preferences.wallpaperColors=false; save(); syncControls(); });
$('#apply-theme').addEventListener('click', () => { preferences.custom=Object.fromEntries(['primary','secondary','accent','menu','button','glow'].map(key=>[key,$(`#color-${key}`).value])); preferences.theme='custom'; preferences.wallpaperColors=false; save(); syncControls(); });
$('#reset-theme').addEventListener('click', () => { preferences={...defaults, custom:{...DEFAULT_COLORS}}; save(); syncControls(); selectWallpaper('none'); });
$('#wallpaper-colors').addEventListener('change', event => { preferences.wallpaperColors=event.target.checked; save(); syncControls(); });
$('#menu-opacity').addEventListener('input', event => { preferences.menuOpacity=Number(event.target.value); save(); syncControls(); });
$$('[data-view-mode]').forEach(button => button.addEventListener('click', () => { preferences.view=button.dataset.viewMode; save(); syncControls(); }));
[['reduce-animations','reduceMotion'],['economy-mode','economy'],['high-contrast','highContrast']].forEach(([id,key]) => $(`#${id}`).addEventListener('change', event => { preferences[key]=event.target.checked; save(); syncControls(); if(key==='reduceMotion'||key==='economy') selectWallpaper(preferences.wallpaper); }));
[['glow-strength','glow'],['card-opacity','opacity'],['animation-strength','animation']].forEach(([id,key]) => $(`#${id}`).addEventListener('input', event => { preferences[key]=Number(event.target.value); save(); syncControls(); }));
$('#wallpaper-pause').addEventListener('click', () => { $('#live-wallpaper-video').pause(); setStatus('Wallpaper pausado.'); });
$('#wallpaper-resume').addEventListener('click', () => { if(!preferences.reduceMotion&&!preferences.economy) $('#live-wallpaper-video').play().catch(()=>setStatus('O navegador bloqueou a reprodução.',true)); });
document.addEventListener('visibilitychange', () => { const video=$('#live-wallpaper-video'); if(document.hidden) video.pause(); else if(!preferences.reduceMotion&&!preferences.economy&&currentWallpaper().url) video.play().catch(()=>{}); });

const future = ['Contas','Perfis','Favoritos','Biblioteca','Conquistas','Comentários','Mais wallpapers'];
$('#future-content').innerHTML = future.map(item => `<div class="future-card"><strong>${item}</strong><span>Em desenvolvimento</span></div>`).join('');
function showModal(title, html, actions='') { $('#modal-title').textContent=title; $('#modal-content').innerHTML=html; $('#modal-actions').innerHTML=actions; $('#site-modal').hidden=false; }
$$('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>$('#site-modal').hidden=true));
$('[data-open-download]').addEventListener('click',()=>showModal('Baixar CS 1.6 PLH','<p>O download é hospedado no repositório oficial do jogo.</p>','<a class="button button--primary" href="https://github.com/kiwifypurplehero-cell/CS1-6HTML/archive/refs/heads/main.zip">Baixar pelo GitHub</a>'));
$('[data-open-install]').addEventListener('click',()=>showModal('Sobre o jogo','<p>Projeto gratuito em HTML, atualmente em desenvolvimento. Extraia o arquivo baixado e abra o arquivo principal no navegador.</p>'));
$('[data-open-credits]').addEventListener('click',()=>showModal('Créditos','<p>PlumpGames é criado por Matheus (Plump), com ajuda do Codex.</p>'));
$('[data-open-privacy]').addEventListener('click',()=>showModal('Política de Privacidade','<p>As preferências ficam somente no localStorage deste navegador. O site não possui contas nem envia dados pessoais a um banco.</p>'));
$('[data-open-terms]').addEventListener('click',()=>showModal('Termos de Uso','<p>Os projetos são oferecidos como estão. Consulte o repositório de cada jogo para detalhes.</p>'));

if (!location.href.startsWith(OFFICIAL_URL) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') console.info(`Site oficial: ${OFFICIAL_URL}`);
renderWallpapers(); syncControls(); selectWallpaper(preferences.wallpaper, true);

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), {threshold:.08});
$$('.reveal').forEach(item => revealObserver.observe(item));
window.addEventListener('scroll', () => $('.site-header').classList.toggle('scrolled', scrollY > 20), {passive:true});
async function updateProjectDates() {
  const projects = { cs16:'https://api.github.com/repos/kiwifypurplehero-cell/CS1-6HTML', site:'https://api.github.com/repos/kiwifypurplehero-cell/Site' };
  await Promise.all(Object.entries(projects).map(async ([id,url]) => {
    const area=$(`[data-update-project="${id}"]`); if(!area) return;
    try { const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'}}); if(!response.ok) throw new Error(); const data=await response.json(); const date=new Date(data.pushed_at); area.querySelector('[data-update-date]').textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(date); area.querySelector('[data-update-relative]').textContent='Dados do repositório oficial'; area.querySelector('[data-update-status]').textContent='Atualizado'; }
    catch { area.querySelector('[data-update-date]').textContent='Informação indisponível'; area.querySelector('[data-update-status]').textContent='Tente novamente mais tarde'; }
  }));
}
$('[data-refresh-updates]').addEventListener('click',updateProjectDates); updateProjectDates();
