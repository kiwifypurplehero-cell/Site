import {findEmulator} from './emulator-registry.js';

const emulator = findEmulator('ps2');
const romList = document.querySelector('#rom-list');
const gamesStatus = document.querySelector('#games-status');

async function loadLibrary() {
  if (!romList || !gamesStatus) return;
  try {
    const response = await fetch('/api/emulators/ps2/games');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error);
    gamesStatus.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : 'Nenhum jogo publicado ainda.';
    for (const game of payload.games) {
      const row = document.createElement('article');
      row.className = 'rom-card';
      row.innerHTML = `<div><strong>${game.title}</strong><small>${game.format} · ${Math.ceil(game.size / 1048576)} MiB</small></div><button class="button button--play" type="button">Preparar</button>`;
      row.querySelector('button').addEventListener('click', () => alert(emulator.core.status === 'pending' ? 'O núcleo PS2 WebAssembly ainda está em integração.' : 'Inicializando emulador…'));
      romList.append(row);
    }
  } catch (error) {
    gamesStatus.textContent = error.message || 'Não foi possível carregar a biblioteca.';
  }
}

loadLibrary();
