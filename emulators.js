import {EMULATORS} from './emulator-registry.js';

const list = document.querySelector('#emulator-list');
const status = document.querySelector('#emulator-status');
const dialog = document.querySelector('#games-dialog');
const romList = document.querySelector('#rom-list');
const gamesStatus = document.querySelector('#games-status');

function card(emulator) {
  const article = document.createElement('article');
  article.className = 'emulator-card';
  article.innerHTML = `<span class="emulator-badge">${emulator.shortName}</span><h2>${emulator.name}</h2><p>${emulator.description}</p><button class="button button--primary" type="button">Abrir biblioteca</button>`;
  article.querySelector('button').addEventListener('click', () => openLibrary(emulator));
  return article;
}

async function openLibrary(emulator) {
  document.querySelector('#games-title').textContent = `Biblioteca ${emulator.shortName}`;
  romList.replaceChildren(); gamesStatus.textContent = 'Detectando jogos no armazenamento…'; dialog.showModal();
  try {
    const response = await fetch(`/api/emulators/${emulator.id}/games`);
    const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
    gamesStatus.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : 'Nenhum jogo publicado ainda.';
    for (const game of payload.games) {
      const row = document.createElement('article'); row.className = 'rom-card';
      row.innerHTML = `<div><strong>${game.title}</strong><small>${game.format} · ${Math.ceil(game.size / 1048576)} MiB</small></div><button class="button button--play" type="button">Preparar</button>`;
      row.querySelector('button').addEventListener('click', () => alert(emulator.core.status === 'pending' ? 'O catálogo e o streaming estão prontos; o núcleo PS2 WebAssembly ainda precisa ser integrado.' : 'Inicializando emulador…'));
      romList.append(row);
    }
  } catch (error) { gamesStatus.textContent = error.message || 'Não foi possível carregar a biblioteca.'; }
}

EMULATORS.forEach(emulator => list.append(card(emulator)));
status.textContent = `${EMULATORS.length} sistema(s) disponível(is).`;
document.querySelector('#close-games').addEventListener('click', () => dialog.close());
