'use strict';

const { KNOWN_GAMES, FIXED_RESOLUTIONS, getGamePlayUrl, parseResolution, validCustomResolution, fitResolution } = PlumpPlay;
const params = new URLSearchParams(location.search);
const requestedRepo = (params.get('repo') || '').trim();
const knownGame = KNOWN_GAMES[requestedRepo.toLowerCase()];
const game = { repo:knownGame?.repo || requestedRepo, name:knownGame?.name || (params.get('name') || requestedRepo || 'Jogo').slice(0,100), playUrl:params.get('url') || '' };
const gameKey = (game.repo || 'game').toLowerCase();
const playUrl = getGamePlayUrl(game);
const frame = document.querySelector('#game-frame');
const stage = document.querySelector('#game-stage');
const resolutionFrame = document.querySelector('#game-resolution-frame');
const settingsButton = document.querySelector('#game-settings-button');
const settingsMenu = document.querySelector('#game-settings-menu');
const resolutionOptions = document.querySelector('#resolution-options');
const loadoutsContent = document.querySelector('#loadouts-content');
const DEFAULT_ACTIONS = ['Cima','Baixo','Esquerda','Direita','Pular','Ação principal','Ação secundária','Interagir','Pausar','Confirmar','Voltar'];
const PC_KEYS = ['W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Shift','Ctrl','Alt',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',...'0123456789',...'F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12'.split(' ')];
const PS5_KEYS = ['△ Triângulo','○ Círculo','× X','□ Quadrado','L1','R1','L2','R2','L3','R3','D-pad Cima','D-pad Baixo','D-pad Esquerda','D-pad Direita','Options','Create','Touchpad Press','Analógico esquerdo','Analógico direito'];
const gameDisplayState = { mode:'auto', targetWidth:null, targetHeight:null, scale:1, fitMode:'contain' };
let loadTimer;
let messageTimer;
let editingLoadout = null;

document.querySelector('#game-name').textContent = game.name;
frame.title = game.name;
document.title = `${game.name} — PlumpGames`;
document.querySelector('#direct').href = playUrl || '#';

function showMessage(text) {
  const message = document.querySelector('#message');
  clearTimeout(messageTimer);
  message.textContent = text;
  message.hidden = false;
  messageTimer = setTimeout(() => { message.hidden = true; }, 3500);
}

function availableSize() {
  const box = stage.getBoundingClientRect();
  return { width:Math.max(1,box.width), height:Math.max(1,box.height) };
}

function applyResolution() {
  const available = availableSize();
  resolutionFrame.style.transform = 'none';
  if (gameDisplayState.mode === 'fixed' || gameDisplayState.mode === 'custom') {
    const fitted = fitResolution(available.width, available.height, gameDisplayState.targetWidth, gameDisplayState.targetHeight);
    gameDisplayState.scale = fitted?.scale || 1;
    resolutionFrame.style.width = `${gameDisplayState.targetWidth}px`;
    resolutionFrame.style.height = `${gameDisplayState.targetHeight}px`;
    resolutionFrame.style.transform = `scale(${gameDisplayState.scale})`;
  } else {
    gameDisplayState.targetWidth = Math.round(available.width);
    gameDisplayState.targetHeight = Math.round(available.height);
    gameDisplayState.scale = 1;
    resolutionFrame.style.width = '100%';
    resolutionFrame.style.height = '100%';
  }
  if (!document.querySelector('#resolution-view').hidden) renderResolutionOptions();
}

function resolutionButton(value, label) {
  const selected = value === gameDisplayState.mode || (gameDisplayState.mode === 'fixed' && value === `${gameDisplayState.targetWidth}x${gameDisplayState.targetHeight}`);
  return `<button class="resolution-option" type="button" role="radio" data-resolution="${value}" aria-checked="${selected}">${label}</button>`;
}

function renderResolutionOptions() {
  const size = availableSize();
  resolutionOptions.innerHTML = resolutionButton('auto','Automático / Ajustado') + resolutionButton('current',`Resolução atual — ${Math.round(size.width)} × ${Math.round(size.height)}`) + FIXED_RESOLUTIONS.map(value => resolutionButton(value,value.replace('x',' × '))).join('') + resolutionButton('custom','Personalizado') + (gameDisplayState.mode === 'custom' ? `<form class="custom-fields"><label>Largura<input name="width" type="number" min="320" max="7680" required value="${gameDisplayState.targetWidth}"></label><label>Altura<input name="height" type="number" min="240" max="4320" required value="${gameDisplayState.targetHeight}"></label><button type="submit">Aplicar</button></form>` : '');
}

function showView(name) {
  document.querySelectorAll('.menu-view').forEach(view => { view.hidden = view.id !== `${name === 'main' ? 'settings' : name}-view` && !(name === 'main' && view.id === 'settings-main'); });
  if (name === 'resolution') renderResolutionOptions();
  if (name === 'loadouts') renderLoadouts();
}

function setSettingsOpen(open, restoreFocus = false) {
  settingsMenu.hidden = !open;
  settingsButton.setAttribute('aria-expanded', String(open));
  if (open) { showView('main'); settingsMenu.querySelector('button')?.focus(); }
  else if (restoreFocus) settingsButton.focus();
}

function chooseResolution(value) {
  if (value === 'auto' || value === 'current') Object.assign(gameDisplayState,{mode:value,targetWidth:null,targetHeight:null,scale:1,fitMode:value === 'auto' ? 'contain' : 'native'});
  else if (value === 'custom') Object.assign(gameDisplayState,{mode:'custom',targetWidth:gameDisplayState.targetWidth || 1280,targetHeight:gameDisplayState.targetHeight || 720,fitMode:'contain'});
  else { const target = parseResolution(value); Object.assign(gameDisplayState,{mode:'fixed',targetWidth:target.width,targetHeight:target.height,fitMode:'contain'}); }
  applyResolution();
  if (value !== 'custom') setSettingsOpen(false, true);
}

function loadGame() {
  clearTimeout(loadTimer);
  document.querySelector('#loading').hidden = false;
  document.querySelector('#error').hidden = true;
  if (!playUrl) return showLoadError();
  frame.src = 'about:blank';
  requestAnimationFrame(() => { frame.src = playUrl; loadTimer = setTimeout(showLoadError, 20000); });
}

function showLoadError() {
  clearTimeout(loadTimer);
  document.querySelector('#loading').hidden = true;
  document.querySelector('#error').hidden = false;
}

function readLoadoutStore() {
  try { const parsed = JSON.parse(localStorage.getItem('plumpgamesLoadouts') || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
  catch { return {}; }
}

function gameLoadouts() {
  const entry = readLoadoutStore()[gameKey];
  return entry && Array.isArray(entry.loadouts) ? entry : { selected:null, hud:false, loadouts:[] };
}

function saveGameLoadouts(entry) {
  const store = readLoadoutStore();
  store[gameKey] = entry;
  try { localStorage.setItem('plumpgamesLoadouts', JSON.stringify(store)); updateHud(entry); }
  catch { showMessage('Não foi possível salvar localmente.'); }
}

function defaultMappings(type) {
  const defaults = type === 'PC' ? ['W','S','A','D','Space','Enter','Shift','E','Escape','Enter','Escape'] : ['D-pad Cima','D-pad Baixo','D-pad Esquerda','D-pad Direita','× X','□ Quadrado','△ Triângulo','○ Círculo','Options','× X','○ Círculo'];
  return DEFAULT_ACTIONS.map((action,index) => ({ action, input:defaults[index] }));
}

function escapeHtml(value) {
  const element = document.createElement('span'); element.textContent = String(value); return element.innerHTML;
}

function renderLoadouts() {
  const entry = gameLoadouts();
  const selected = entry.loadouts.find(item => item.id === entry.selected);
  loadoutsContent.innerHTML = `<p class="loadout-summary">Loadout atual: <strong>${escapeHtml(selected?.name || 'Nenhum')}</strong></p><div class="loadout-list">${entry.loadouts.map(item => `<button type="button" class="loadout-card ${item.id === entry.selected ? 'selected' : ''}" data-select-loadout="${item.id}"><strong>${escapeHtml(item.name)}</strong><small>${item.type}</small></button>`).join('') || '<p class="loadout-summary">Nenhum loadout salvo.</p>'}</div><div class="loadout-actions"><button type="button" data-create="PC">Criar Loadout PC</button><button type="button" data-create="PS5">Criar Loadout PS5</button>${selected ? '<button type="button" data-loadout-action="rename">Renomear</button><button type="button" data-loadout-action="edit">Editar</button><button type="button" data-loadout-action="duplicate">Duplicar</button><button type="button" data-loadout-action="delete">Excluir</button>' : ''}<button type="button" data-loadout-action="restore">Restaurar padrão</button></div><label class="hud-toggle"><input type="checkbox" data-hud ${entry.hud ? 'checked' : ''}> Mostrar HUD de referência</label>`;
}

function editLoadout(loadout) {
  editingLoadout = JSON.parse(JSON.stringify(loadout));
  const keys = editingLoadout.type === 'PC' ? PC_KEYS : PS5_KEYS;
  loadoutsContent.innerHTML = `<form id="loadout-editor"><div class="editor-fields"><label class="wide">Nome<input name="name" maxlength="50" required value="${escapeHtml(editingLoadout.name)}"></label></div><div id="mapping-list">${editingLoadout.mappings.map((mapping,index) => mappingRow(mapping,index,keys)).join('')}</div><button type="button" data-add-action>+ Adicionar ação personalizada</button>${editingLoadout.type === 'PS5' ? '<div id="controller-preview" class="controller-preview"></div>' : ''}<div class="editor-footer"><button type="button" data-cancel-editor>Cancelar</button><button type="submit">Salvar</button></div></form>`;
  renderPreview();
}

function mappingRow(mapping,index,keys) {
  const options = keys.map(key => `<option ${key === mapping.input ? 'selected' : ''}>${escapeHtml(key)}</option>`).join('');
  return `<div class="mapping-row" data-index="${index}"><label>Ação<input data-action maxlength="40" required value="${escapeHtml(mapping.action)}"></label><label>${editingLoadout.type === 'PC' ? 'Tecla' : 'Botão'}<select data-input>${options}</select></label><button type="button" data-remove-action aria-label="Remover ação">×</button></div>`;
}

function syncEditor() {
  editingLoadout.mappings = [...loadoutsContent.querySelectorAll('.mapping-row')].map(row => ({ action:row.querySelector('[data-action]').value.trim(), input:row.querySelector('[data-input]').value }));
}

function renderPreview() {
  const preview = document.querySelector('#controller-preview');
  if (!preview) return;
  syncEditor();
  preview.innerHTML = editingLoadout.mappings.filter(item => item.action).map(item => `<span><strong>${escapeHtml(item.input.split(' ')[0])}</strong> ${escapeHtml(item.action)}</span>`).join('');
}

function updateHud(entry = gameLoadouts()) {
  const hud = document.querySelector('#loadout-hud');
  const selected = entry.loadouts.find(item => item.id === entry.selected);
  hud.hidden = !entry.hud || !selected;
  hud.innerHTML = selected ? `<strong>${escapeHtml(selected.name)} · ${selected.type}</strong><br>${selected.mappings.slice(0,5).map(item => `${escapeHtml(item.input)} — ${escapeHtml(item.action)}`).join('<br>')}` : '';
}

function loadoutAction(action) {
  const entry = gameLoadouts();
  const selected = entry.loadouts.find(item => item.id === entry.selected);
  if (action === 'restore') { entry.selected = null; entry.loadouts = []; saveGameLoadouts(entry); renderLoadouts(); return; }
  if (!selected) return;
  if (action === 'edit') return editLoadout(selected);
  if (action === 'rename') { const name = prompt('Novo nome do loadout:', selected.name)?.trim(); if (name) selected.name = name.slice(0,50); }
  if (action === 'duplicate') { const copy = JSON.parse(JSON.stringify(selected)); copy.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`; copy.name = `${copy.name} (cópia)`; entry.loadouts.push(copy); entry.selected = copy.id; }
  if (action === 'delete' && confirm(`Excluir “${selected.name}”?`)) { entry.loadouts = entry.loadouts.filter(item => item.id !== selected.id); entry.selected = entry.loadouts[0]?.id || null; }
  saveGameLoadouts(entry); renderLoadouts();
}

frame.addEventListener('load', () => { if (frame.src === 'about:blank') return; clearTimeout(loadTimer); document.querySelector('#loading').hidden = true; document.querySelector('#error').hidden = true; });
settingsButton.addEventListener('click', () => setSettingsOpen(settingsMenu.hidden, true));
settingsMenu.addEventListener('click', async event => {
  const view = event.target.closest('[data-view]')?.dataset.view;
  if (view) return showView(view);
  if (event.target.closest('[data-back]')) return showView('main');
  const command = event.target.closest('[data-command]')?.dataset.command;
  if (command === 'restart') { setSettingsOpen(false); return loadGame(); }
  if (command === 'close') { setSettingsOpen(false); window.close(); return setTimeout(() => { if (!window.closed) showMessage('Você pode fechar esta aba pelo navegador.'); },150); }
  if (command === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); setSettingsOpen(false); } catch { showMessage('Tela cheia não está disponível neste navegador.'); } }
  const resolution = event.target.closest('[data-resolution]')?.dataset.resolution;
  if (resolution) return chooseResolution(resolution);
  const type = event.target.closest('[data-create]')?.dataset.create;
  if (type) return editLoadout({ id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, name:`Meu Loadout ${type}`, type, mappings:defaultMappings(type) });
  const selectedId = event.target.closest('[data-select-loadout]')?.dataset.selectLoadout;
  if (selectedId) { const entry = gameLoadouts(); entry.selected = selectedId; saveGameLoadouts(entry); return renderLoadouts(); }
  const action = event.target.closest('[data-loadout-action]')?.dataset.loadoutAction;
  if (action) return loadoutAction(action);
  if (event.target.closest('[data-add-action]')) { syncEditor(); editingLoadout.mappings.push({action:'Nova ação',input:editingLoadout.type === 'PC' ? 'Space' : '× X'}); return editLoadout(editingLoadout); }
  if (event.target.closest('[data-remove-action]')) { syncEditor(); editingLoadout.mappings.splice(Number(event.target.closest('.mapping-row').dataset.index),1); return editLoadout(editingLoadout); }
  if (event.target.closest('[data-cancel-editor]')) renderLoadouts();
});
settingsMenu.addEventListener('input', event => { if (event.target.matches('[data-action],[data-input]')) renderPreview(); });
settingsMenu.addEventListener('change', event => { if (event.target.matches('[data-hud]')) { const entry = gameLoadouts(); entry.hud = event.target.checked; saveGameLoadouts(entry); } });
settingsMenu.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.matches('.custom-fields')) { const data = new FormData(event.target); const width = Number(data.get('width')); const height = Number(data.get('height')); if (!validCustomResolution(width,height)) return showMessage('Use valores entre 320 × 240 e 7680 × 4320.'); Object.assign(gameDisplayState,{mode:'custom',targetWidth:width,targetHeight:height,fitMode:'contain'}); applyResolution(); return setSettingsOpen(false,true); }
  if (event.target.id === 'loadout-editor') { syncEditor(); const name = new FormData(event.target).get('name').trim(); editingLoadout.name = name; const entry = gameLoadouts(); const index = entry.loadouts.findIndex(item => item.id === editingLoadout.id); if (index < 0) entry.loadouts.push(editingLoadout); else entry.loadouts[index] = editingLoadout; entry.selected = editingLoadout.id; saveGameLoadouts(entry); showMessage('Loadout salvo.'); renderLoadouts(); }
});
document.addEventListener('pointerdown', event => { if (!settingsMenu.hidden && !event.target.closest('.settings-control')) setSettingsOpen(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !settingsMenu.hidden) { event.preventDefault(); setSettingsOpen(false,true); } });
stage.addEventListener('pointerdown', () => setSettingsOpen(false));
document.querySelector('#retry').addEventListener('click', loadGame);
document.addEventListener('fullscreenchange', applyResolution);
window.addEventListener('resize', applyResolution);
window.addEventListener('orientationchange', applyResolution);
window.visualViewport?.addEventListener('resize', applyResolution);

applyResolution();
updateHud();
loadGame();
