'use strict';

const { KNOWN_GAMES, FIXED_RESOLUTIONS, getGamePlayUrl, parseResolution, validCustomResolution, fitResolution } = PlumpPlay;
const params = new URLSearchParams(location.search);
const requestedRepo = (params.get('repo') || '').trim();
const knownGame = KNOWN_GAMES[requestedRepo.toLowerCase()];
const game = { repo: knownGame?.repo || requestedRepo, name: knownGame?.name || (params.get('name') || requestedRepo || 'Jogo').slice(0, 100), playUrl: params.get('url') || '' };
const gameKey = (game.repo || game.playUrl || 'game').toLowerCase();
const playUrl = getGamePlayUrl(game);
const frame = document.querySelector('#game-frame');
const stage = document.querySelector('#game-stage');
const resolutionFrame = document.querySelector('#game-resolution-frame');
const overlay = document.querySelector('#loadout-overlay');
const ldtPanel = document.querySelector('#ldt-panel');
const settingsButton = document.querySelector('#game-settings-button');
const settingsMenu = document.querySelector('#game-settings-menu');
const resolutionOptions = document.querySelector('#resolution-options');
const loadoutsContent = document.querySelector('#loadouts-content');
const INPUT_KEYS = ['W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Shift', 'Ctrl', 'E', 'F', 'Q', 'R', 'Z', 'X', 'C', '1', '2', '3', '4', 'Escape'];
const PS5_LABELS = ['△', '○', '×', '□', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'Options', 'Create'];
const KEY_DATA = { Space: [' ', 'Space'], Enter: ['Enter', 'Enter'], Shift: ['Shift', 'ShiftLeft'], Ctrl: ['Control', 'ControlLeft'], Escape: ['Escape', 'Escape'], ArrowUp: ['ArrowUp', 'ArrowUp'], ArrowDown: ['ArrowDown', 'ArrowDown'], ArrowLeft: ['ArrowLeft', 'ArrowLeft'], ArrowRight: ['ArrowRight', 'ArrowRight'] };
const gameDisplayState = { mode: 'auto', targetWidth: null, targetHeight: null, scale: 1, fitMode: 'contain' };
let loadTimer;
let messageTimer;
let layoutEditing = false;
let selectedButtonId = null;
let positioningButtonId = null;
let bridgeAvailable = null;
let bridgeTimer;
const activePointers = new Map();
const buttonPointers = new Map();

const makeId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const escapeHtml = value => { const el = document.createElement('span'); el.textContent = String(value); return el.innerHTML; };

document.querySelector('#game-name').textContent = game.name;
frame.title = game.name;
document.title = `${game.name} — PlumpGames`;
document.querySelector('#direct').href = playUrl || '#';

function showMessage(text) { const el = document.querySelector('#message'); clearTimeout(messageTimer); el.textContent = text; el.hidden = false; messageTimer = setTimeout(() => { el.hidden = true; }, 3500); }
function availableSize() { const box = stage.getBoundingClientRect(); return { width: Math.max(1, box.width), height: Math.max(1, box.height) }; }
function applyResolution() { const available = availableSize(); resolutionFrame.style.transform = 'none'; if (gameDisplayState.mode === 'fixed' || gameDisplayState.mode === 'custom') { const fitted = fitResolution(available.width, available.height, gameDisplayState.targetWidth, gameDisplayState.targetHeight); gameDisplayState.scale = fitted?.scale || 1; resolutionFrame.style.width = `${gameDisplayState.targetWidth}px`; resolutionFrame.style.height = `${gameDisplayState.targetHeight}px`; resolutionFrame.style.transform = `scale(${gameDisplayState.scale})`; } else { gameDisplayState.targetWidth = Math.round(available.width); gameDisplayState.targetHeight = Math.round(available.height); gameDisplayState.scale = 1; resolutionFrame.style.width = '100%'; resolutionFrame.style.height = '100%'; } if (!document.querySelector('#resolution-view').hidden) renderResolutionOptions(); renderOverlay(); }
function resolutionButton(value, label) { const selected = value === gameDisplayState.mode || (gameDisplayState.mode === 'fixed' && value === `${gameDisplayState.targetWidth}x${gameDisplayState.targetHeight}`); return `<button class="resolution-option" type="button" role="radio" data-resolution="${value}" aria-checked="${selected}">${label}</button>`; }
function renderResolutionOptions() { const size = availableSize(); resolutionOptions.innerHTML = resolutionButton('auto', 'Automático / Ajustado') + resolutionButton('current', `Resolução atual — ${Math.round(size.width)} × ${Math.round(size.height)}`) + FIXED_RESOLUTIONS.map(v => resolutionButton(v, v.replace('x', ' × '))).join('') + resolutionButton('custom', 'Personalizado') + (gameDisplayState.mode === 'custom' ? `<form class="custom-fields"><label>Largura<input name="width" type="number" min="320" max="7680" required value="${gameDisplayState.targetWidth}"></label><label>Altura<input name="height" type="number" min="240" max="4320" required value="${gameDisplayState.targetHeight}"></label><button type="submit">Aplicar</button></form>` : ''); }
function showView(name) { document.querySelectorAll('.menu-view').forEach(v => { v.hidden = v.id !== `${name === 'main' ? 'settings' : name}-view` && !(name === 'main' && v.id === 'settings-main'); }); if (name === 'resolution') renderResolutionOptions(); if (name === 'loadouts') renderLoadouts(); }
function setSettingsOpen(open, restoreFocus = false) { settingsMenu.hidden = !open; settingsButton.setAttribute('aria-expanded', String(open)); if (open) { showView('main'); settingsMenu.querySelector('button')?.focus(); } else if (restoreFocus) settingsButton.focus(); }
function chooseResolution(value) { if (value === 'auto' || value === 'current') Object.assign(gameDisplayState, { mode: value, targetWidth: null, targetHeight: null, scale: 1, fitMode: value === 'auto' ? 'contain' : 'native' }); else if (value === 'custom') Object.assign(gameDisplayState, { mode: 'custom', targetWidth: gameDisplayState.targetWidth || 1280, targetHeight: gameDisplayState.targetHeight || 720, fitMode: 'contain' }); else { const target = parseResolution(value); Object.assign(gameDisplayState, { mode: 'fixed', targetWidth: target.width, targetHeight: target.height, fitMode: 'contain' }); } applyResolution(); if (value !== 'custom') setSettingsOpen(false, true); }
function loadGame() { releaseAll(); clearTimeout(loadTimer); document.querySelector('#loading').hidden = false; document.querySelector('#error').hidden = true; if (!playUrl) return showLoadError(); frame.src = 'about:blank'; requestAnimationFrame(() => { frame.src = playUrl; loadTimer = setTimeout(showLoadError, 20000); }); }
function showLoadError() { clearTimeout(loadTimer); document.querySelector('#loading').hidden = true; document.querySelector('#error').hidden = false; }

function readLoadoutStore() { try { const parsed = JSON.parse(localStorage.getItem('plumpgamesLoadouts') || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; } }
function keyboardData(input) { if (KEY_DATA[input]) return KEY_DATA[input]; return [input.length === 1 ? input.toLowerCase() : input, /^[A-Z]$/.test(input) ? `Key${input}` : /^\d$/.test(input) ? `Digit${input}` : input]; }
function normalizeButton(item, index = 0) { const input = item.key || item.input || 'Space'; const [key, code] = keyboardData(input); return { id: item.id || makeId(), type: item.type || 'key', key, code: item.code || code, xPercent: Number(item.xPercent ?? item.x ?? (20 + index * 10)), yPercent: Number(item.yPercent ?? item.y ?? 70), size: Number(item.size || 58), opacity: Number(item.opacity ?? .10), color: item.color || '#7c3aed', label: item.label || (item.action && item.action.length <= 12 ? item.action : input) }; }
function normalizeLoadout(item) { const oldButtons = item.buttons || (item.mappings || []).map(m => ({ ...m, key: m.input })); return { id: item.id || makeId(), name: item.name || 'Meu LDT', type: item.type || 'PC', buttons: oldButtons.map(normalizeButton) }; }
function gameLoadouts() { const entry = readLoadoutStore()[gameKey]; if (entry && Array.isArray(entry.loadouts)) return { selected: entry.selected || null, visible: entry.visible ?? entry.hud ?? true, loadouts: entry.loadouts.map(normalizeLoadout) }; return { selected: null, visible: true, loadouts: [] }; }
function saveGameLoadouts(entry, rerender = true) { const store = readLoadoutStore(); store[gameKey] = entry; try { localStorage.setItem('plumpgamesLoadouts', JSON.stringify(store)); if (rerender) renderOverlay(entry); } catch { showMessage('Não foi possível salvar localmente.'); } }
function current(entry = gameLoadouts()) { return entry.loadouts.find(item => item.id === entry.selected); }
function makeButton(input, xPercent = 50, yPercent = 50, type = 'key', label = input) { const [key, code] = keyboardData(input); return { id: makeId(), type, key, code, xPercent, yPercent, size: 58, opacity: .10, color: '#7c3aed', label }; }
function presetButtons(name) {
  if (name === 'Setas + Enter') return [['ArrowUp', 18, 64], ['ArrowLeft', 10, 78], ['ArrowDown', 18, 78], ['ArrowRight', 26, 78], ['Enter', 84, 76]].map(v => makeButton(...v));
  if (name === 'PS5 básico') { const data = [['D-pad ↑', 'ArrowUp', 18, 64], ['D-pad ←', 'ArrowLeft', 10, 78], ['D-pad ↓', 'ArrowDown', 18, 78], ['D-pad →', 'ArrowRight', 26, 78], ['×', 'Space', 80, 80], ['□', 'Z', 68, 70], ['△', 'X', 80, 58], ['○', 'Escape', 90, 70], ['L1', 'Q', 12, 12], ['R1', 'E', 88, 12], ['L2', '1', 12, 23], ['R2', '2', 88, 23], ['L3', 'Shift', 34, 86], ['R3', 'Ctrl', 62, 86], ['Options', 'Enter', 55, 90], ['Create', 'C', 45, 90]]; return data.map(([label, key, x, y]) => makeButton(key, x, y, 'ps5', label)); }
  return [['W', 18, 64], ['A', 10, 78], ['S', 18, 78], ['D', 26, 78], ['Space', 84, 76]].map(v => makeButton(...v));
}
function createLoadout(type = 'PC', preset = null) { const entry = gameLoadouts(); const loadout = { id: makeId(), name: type === 'PS5' ? 'Meu LDT PS5' : 'Meu LDT', type, buttons: preset ? presetButtons(preset) : [] }; entry.loadouts.push(loadout); entry.selected = loadout.id; entry.visible = true; saveGameLoadouts(entry); layoutEditing = true; setSettingsOpen(false); renderOverlay(entry); if (type === 'PC' && !preset) openCreationPanel(); else ldtPanel.hidden = true; }

function bridgeNote() { return bridgeAvailable === false ? '<p class="bridge-note">Este jogo externo não possui suporte ao bridge de controles da PlumpGames.</p>' : ''; }
function renderLoadouts() { const entry = gameLoadouts(); const selected = current(entry); loadoutsContent.innerHTML = `<p class="loadout-summary">LDT atual: <strong>${escapeHtml(selected?.name || 'Nenhum')}</strong></p><div class="loadout-list">${entry.loadouts.map(item => `<button type="button" class="loadout-card ${item.id === entry.selected ? 'selected' : ''}" data-select-loadout="${item.id}"><strong>${escapeHtml(item.name)}</strong><small>${item.type === 'PS5' ? 'PS5' : 'Teclado'} · ${item.buttons.length} botões</small></button>`).join('') || '<p class="loadout-summary">Nenhum LDT salvo.</p>'}</div><label class="hud-toggle"><input type="checkbox" data-visible ${entry.visible ? 'checked' : ''}> Mostrar controles na tela</label><div class="loadout-actions"><button type="button" data-create="PC">Criar LDT</button><button type="button" data-create="PS5">Criar LDT PS5</button><button type="button" data-preset="WASD + Space">WASD + Space</button><button type="button" data-preset="Setas + Enter">Setas + Enter</button><button type="button" data-preset="PS5 básico">PS5 básico</button>${selected ? '<button type="button" data-layout>Editar LDT</button><button type="button" data-delete-loadout>Excluir LDT</button>' : ''}</div>${bridgeNote()}`; }
function keyOptions(selected) { return INPUT_KEYS.map(k => `<option value="${k}" ${k === selected ? 'selected' : ''}>${k}</option>`).join(''); }
function openCreationPanel(type = 'PC') { selectedButtonId = null; ldtPanel.hidden = false; ldtPanel.innerHTML = `<form id="ldt-create-form"><strong>${type === 'PS5' ? 'Adicionar botão PS5' : 'Adicionar botão'}</strong>${type === 'PS5' ? `<label>Botão visual<select name="label">${PS5_LABELS.map(v => `<option>${v}</option>`).join('')}</select></label>` : ''}<label>Tecla a simular<select name="key">${keyOptions('W')}</select></label><div class="ldt-panel-actions"><button type="submit">Criar botão</button><button type="button" data-finish-edit>Concluir</button></div></form>`; }
function openProperties(button) { selectedButtonId = button.id; positioningButtonId = null; ldtPanel.hidden = false; ldtPanel.innerHTML = `<form id="ldt-properties-form"><strong>Propriedades do botão</strong><label>Tecla simulada<select name="key">${keyOptions(displayKey(button))}</select></label><label>Tamanho <output>${button.size}px</output><input name="size" type="range" min="36" max="120" step="2" value="${button.size}"></label><label>Transparência <output>${Math.round(button.opacity * 100)}%</output><input name="opacity" type="range" min="0.05" max="0.5" step="0.05" value="${button.opacity}"></label><label>Cor<input name="color" type="color" value="${escapeHtml(button.color)}"></label><div class="ldt-panel-actions"><button type="button" class="danger" data-delete-button>Excluir botão</button><button type="button" data-finish-edit>Concluir</button></div></form>`; }
function displayKey(button) { return Object.keys(KEY_DATA).find(k => KEY_DATA[k][1] === button.code) || (/^Key/.test(button.code) ? button.code.slice(3) : /^Digit/.test(button.code) ? button.code.slice(5) : button.key); }
function finishEditing() { layoutEditing = false; selectedButtonId = null; positioningButtonId = null; ldtPanel.hidden = true; settingsButton.textContent = '⚙'; settingsButton.setAttribute('aria-label', 'Configurações do jogo'); saveGameLoadouts(gameLoadouts()); showMessage('LDT salvo automaticamente.'); }
function startLayoutEditing() { if (!current()) return; layoutEditing = true; setSettingsOpen(false); settingsButton.textContent = 'Concluir'; settingsButton.setAttribute('aria-label', 'Concluir edição do LDT'); renderOverlay(); ldtPanel.hidden = true; }
function renderOverlay(entry = gameLoadouts()) { releaseAll(); const selected = current(entry); overlay.hidden = !entry.visible || !selected; overlay.classList.toggle('editing', layoutEditing); overlay.innerHTML = selected ? selected.buttons.map(b => `<button type="button" class="virtual-control ${b.type === 'ps5' ? 'ps5' : ''} ${b.id === selectedButtonId ? 'selected' : ''}" data-button-id="${b.id}" style="--x:${b.xPercent}%;--y:${b.yPercent}%;--size:${b.size}px;--idle:${b.opacity};--control-color:${b.color}" aria-label="${escapeHtml(b.label || displayKey(b))}"><span>${escapeHtml(b.label || displayKey(b))}</span></button>`).join('') : ''; }

function sameOriginWindow() { try { const win = frame.contentWindow; void win.document.location.href; return win; } catch { return null; } }
function sendVirtualKey(input) {
  const action = input.action;
  const key = input.key;
  const code = input.code;
  const win = sameOriginWindow();
  if (win) { const target = win.document.activeElement || win.document.body || win; target.dispatchEvent(new win.KeyboardEvent(action, { key, code, bubbles: true, cancelable: true, composed: true })); return true; }
  if (bridgeAvailable) { frame.contentWindow?.postMessage({ type: 'plumpgames-input', action, key, code }, frameOrigin()); return true; }
  return false;
}
function frameOrigin() { try { return new URL(playUrl, location.href).origin; } catch { return '*'; } }
function detectBridge() { clearTimeout(bridgeTimer); bridgeAvailable = null; if (sameOriginWindow()) { bridgeAvailable = true; return; } frame.contentWindow?.postMessage({ type: 'plumpgames-input-ping' }, frameOrigin()); bridgeTimer = setTimeout(() => { if (bridgeAvailable === null) bridgeAvailable = false; }, 900); }
function press(buttonEl, pointerId) { const button = current()?.buttons.find(b => b.id === buttonEl.dataset.buttonId); if (!button) return; buttonEl.setPointerCapture?.(pointerId); buttonEl.classList.add('pressed'); activePointers.set(pointerId, { buttonId: button.id, buttonEl }); const pointers = buttonPointers.get(button.id) || new Set(); const first = pointers.size === 0; pointers.add(pointerId); buttonPointers.set(button.id, pointers); if (first) sendVirtualKey({ action: 'keydown', key: button.key, code: button.code }); }
function release(pointerId) { const active = activePointers.get(pointerId); if (!active) return; const button = current()?.buttons.find(b => b.id === active.buttonId); const pointers = buttonPointers.get(active.buttonId); pointers?.delete(pointerId); if (!pointers?.size) { active.buttonEl.classList.remove('pressed'); buttonPointers.delete(active.buttonId); if (button) sendVirtualKey({ action: 'keyup', key: button.key, code: button.code }); } activePointers.delete(pointerId); }
function releaseAll() { for (const id of [...activePointers.keys()]) release(id); }

function beginDrag(event, el, button, entry) { const rect = overlay.getBoundingClientRect(); const startX = event.clientX; const startY = event.clientY; let moved = false; el.setPointerCapture(event.pointerId); const move = e => { moved ||= Math.hypot(e.clientX - startX, e.clientY - startY) > 4; button.xPercent = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)); button.yPercent = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)); el.style.setProperty('--x', `${button.xPercent}%`); el.style.setProperty('--y', `${button.yPercent}%`); };
  const done = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', done); el.removeEventListener('pointercancel', done); saveGameLoadouts(entry, false); positioningButtonId = null; if (!moved) openProperties(button); };
  el.addEventListener('pointermove', move); el.addEventListener('pointerup', done); el.addEventListener('pointercancel', done); }

overlay.addEventListener('pointerdown', event => { const el = event.target.closest('.virtual-control'); if (!el) return; event.preventDefault(); const entry = gameLoadouts(); const button = current(entry)?.buttons.find(b => b.id === el.dataset.buttonId); if (!button) return; if (layoutEditing) beginDrag(event, el, button, entry); else press(el, event.pointerId); });
overlay.addEventListener('pointerup', e => release(e.pointerId));
overlay.addEventListener('pointercancel', e => release(e.pointerId));
window.addEventListener('message', event => { if (event.source === frame.contentWindow && event.origin === frameOrigin() && event.data?.type === 'plumpgames-input-ready') { bridgeAvailable = true; clearTimeout(bridgeTimer); } });
frame.addEventListener('load', () => { if (frame.src === 'about:blank') return; clearTimeout(loadTimer); document.querySelector('#loading').hidden = true; document.querySelector('#error').hidden = true; detectBridge(); });
settingsButton.addEventListener('click', () => { if (layoutEditing) return finishEditing(); setSettingsOpen(settingsMenu.hidden, true); });
settingsMenu.addEventListener('click', async event => { const view = event.target.closest('[data-view]')?.dataset.view; if (view) return showView(view); if (event.target.closest('[data-back]')) return showView('main'); const command = event.target.closest('[data-command]')?.dataset.command; if (command === 'restart') { setSettingsOpen(false); return loadGame(); } if (command === 'close') { setSettingsOpen(false); window.close(); return; } if (command === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); setSettingsOpen(false); } catch { showMessage('Tela cheia não está disponível neste navegador.'); } } const resolution = event.target.closest('[data-resolution]')?.dataset.resolution; if (resolution) return chooseResolution(resolution); const type = event.target.closest('[data-create]')?.dataset.create; if (type) return createLoadout(type, type === 'PS5' ? 'PS5 básico' : null); const preset = event.target.closest('[data-preset]')?.dataset.preset; if (preset) return createLoadout(preset === 'PS5 básico' ? 'PS5' : 'PC', preset); const id = event.target.closest('[data-select-loadout]')?.dataset.selectLoadout; if (id) { const entry = gameLoadouts(); entry.selected = id; saveGameLoadouts(entry); return renderLoadouts(); } if (event.target.closest('[data-layout]')) return startLayoutEditing(); if (event.target.closest('[data-delete-loadout]')) { const entry = gameLoadouts(); entry.loadouts = entry.loadouts.filter(i => i.id !== entry.selected); entry.selected = entry.loadouts[0]?.id || null; saveGameLoadouts(entry); renderLoadouts(); } });
settingsMenu.addEventListener('change', event => { if (event.target.matches('[data-visible]')) { const entry = gameLoadouts(); entry.visible = event.target.checked; saveGameLoadouts(entry); } });
settingsMenu.addEventListener('submit', event => { if (!event.target.matches('.custom-fields')) return; event.preventDefault(); const data = new FormData(event.target); const width = Number(data.get('width')); const height = Number(data.get('height')); if (!validCustomResolution(width, height)) return showMessage('Use valores entre 320 × 240 e 7680 × 4320.'); Object.assign(gameDisplayState, { mode: 'custom', targetWidth: width, targetHeight: height, fitMode: 'contain' }); applyResolution(); setSettingsOpen(false, true); });
ldtPanel.addEventListener('submit', event => { event.preventDefault(); if (event.target.id !== 'ldt-create-form') return; const data = new FormData(event.target); const entry = gameLoadouts(); const selected = current(entry); const key = data.get('key'); const created = makeButton(key, 50, 50, selected.type === 'PS5' ? 'ps5' : 'key', selected.type === 'PS5' ? data.get('label') : key); selected.buttons.push(created); positioningButtonId = created.id; saveGameLoadouts(entry); renderOverlay(entry); showMessage('Arraste o novo botão para posicioná-lo.'); });
ldtPanel.addEventListener('input', event => { if (!event.target.closest('#ldt-properties-form')) return; const entry = gameLoadouts(); const button = current(entry)?.buttons.find(b => b.id === selectedButtonId); if (!button) return; const form = event.target.form; const chosen = form.elements.key.value; const [key, code] = keyboardData(chosen); Object.assign(button, { key, code, size: Number(form.elements.size.value), opacity: Number(form.elements.opacity.value), color: form.elements.color.value }); form.elements.size.previousElementSibling.textContent = `${button.size}px`; form.elements.opacity.previousElementSibling.textContent = `${Math.round(button.opacity * 100)}%`; saveGameLoadouts(entry); });
ldtPanel.addEventListener('click', event => { if (event.target.closest('[data-finish-edit]')) finishEditing(); if (event.target.closest('[data-delete-button]')) { const entry = gameLoadouts(); const selected = current(entry); selected.buttons = selected.buttons.filter(b => b.id !== selectedButtonId); selectedButtonId = null; saveGameLoadouts(entry); ldtPanel.hidden = true; } });
document.addEventListener('pointerdown', event => { if (!settingsMenu.hidden && !event.target.closest('.settings-control')) setSettingsOpen(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !settingsMenu.hidden) { event.preventDefault(); setSettingsOpen(false, true); } });
window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
stage.addEventListener('pointerdown', event => { if (!event.target.closest('.virtual-control')) setSettingsOpen(false); });
document.querySelector('#retry').addEventListener('click', loadGame);
document.addEventListener('fullscreenchange', applyResolution);
window.addEventListener('resize', applyResolution);
window.addEventListener('orientationchange', applyResolution);
window.visualViewport?.addEventListener('resize', applyResolution);
applyResolution();
renderOverlay();
loadGame();
