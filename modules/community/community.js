/**
 * Community games module
 * Handles community game submission dialog and form
 */

import { formatRepositoryName, formatDate, isSafeHttpsUrl } from '../games/games.js';

let communitySubmitting = false;
let metadataRequest = 0;

function communityStatus(message, error = false) {
  const area = document.querySelector('#community-form-status');
  if (area) {
    area.textContent = message;
    area.classList.toggle('is-error', error);
  }
}

function openCommunityDialog() {
  closePanel({ restoreFocus: false });
  lastFocus = document.activeElement;
  const dialog = document.querySelector('#community-dialog');
  if (dialog) {
    dialog.hidden = false;
    lockPageScroll('community');
    setTimeout(() => dialog.querySelector('[name="githubUrl"]')?.focus(), 0);
  }
}

function closeCommunityDialog() {
  if (communitySubmitting) return;
  const dialog = document.querySelector('#community-dialog');
  if (dialog) {
    dialog.hidden = true;
    unlockPageScroll('community');
    lastFocus?.focus();
  }
}

function setupCommunityForm() {
  const form = document.querySelector('#community-game-form');
  if (!form) return;

  const openBtn = document.querySelector('#open-add-game');
  if (openBtn) openBtn.addEventListener('click', openCommunityDialog);

  document.querySelectorAll('[data-close-community]').forEach(button =>
    button.addEventListener('click', closeCommunityDialog)
  );

  const showCommunityBtn = document.querySelector('#show-community-games');
  if (showCommunityBtn) {
    showCommunityBtn.addEventListener('click', () => {
      closePanel({ restoreFocus: false });
      const cards = document.querySelectorAll('#games-list [data-catalog]');
      cards.forEach(card => card.hidden = card.dataset.catalog !== 'community');
      const jogos = document.querySelector('#jogos');
      if (jogos) jogos.scrollIntoView({ behavior: preferences.reduceMotion ? 'auto' : 'smooth' });
      // This would need access to games manager to get communityGames count
    });
  }

  const githubUrlInput = form.elements.githubUrl;
  if (githubUrlInput) {
    githubUrlInput.addEventListener('change', async event => {
      const request = ++metadataRequest;
      const match = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/.exec(event.target.value.trim());
      if (!match) {
        const preview = document.querySelector('#github-preview');
        if (preview) preview.textContent = 'Use uma URL como https://github.com/usuario/repositorio';
        return;
      }
      const preview = document.querySelector('#github-preview');
      if (preview) preview.textContent = 'Consultando informações públicas do GitHub…';
      try {
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!response.ok) throw new Error();
        const repo = await response.json();
        if (request !== metadataRequest) return;
        if (!form.elements.name.value) form.elements.name.value = formatRepositoryName(repo.name);
        if (!form.elements.creator.value) form.elements.creator.value = repo.owner?.login || match[1];
        if (!form.elements.description.value && repo.description) form.elements.description.value = repo.description.slice(0, 1000);
        if (preview) preview.textContent = `${repo.language || 'Linguagem não informada'} • ${repo.license?.spdx_id || 'licença não informada'} • ${repo.stargazers_count || 0} estrelas • atualizado em ${formatDate(repo.updated_at)}`;
      } catch {
        if (preview) preview.textContent = 'Não foi possível preencher automaticamente. Confira os dados manualmente.';
      }
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (communitySubmitting || !form.reportValidity()) return;
    communitySubmitting = true;
    const submitBtn = document.querySelector('#community-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }
    communityStatus('Enviando…');

    const data = new FormData(form);
    const payload = {
      name: data.get('name'),
      creator: data.get('creator'),
      githubUrl: data.get('githubUrl'),
      playUrl: data.get('playUrl'),
      gameType: data.get('gameType'),
      description: data.get('description'),
      platform: data.get('platform'),
      coverUrl: data.get('coverUrl'),
      confirmed: data.get('confirmed') === 'on'
    };

    try {
      const response = await fetch('/api/community-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Não foi possível adicionar o jogo.');
      communityStatus('Jogo adicionado com sucesso.');
      if (submitBtn) submitBtn.textContent = 'Ver jogo no catálogo';
      setTimeout(() => {
        communitySubmitting = false;
        closeCommunityDialog();
        const jogos = document.querySelector('#jogos');
        if (jogos) jogos.scrollIntoView({ behavior: 'smooth' });
        form.reset();
        if (submitBtn) { submitBtn.textContent = 'Adicionar ao catálogo'; submitBtn.disabled = false; }
      }, 900);
      return;
    } catch (error) {
      communityStatus(error.message, true);
    }
    communitySubmitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Adicionar ao catálogo'; }
  });
}

export { openCommunityDialog, closeCommunityDialog, setupCommunityForm };