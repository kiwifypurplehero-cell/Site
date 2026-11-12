/**
 * PlumpGames - Main Entry Point
 * Initializes all modules and coordinates the application
 */

import { preferencesManager } from './preferences/preferences.js';
import { initWallpaperManager, selectWallpaper, pauseWallpaper, resumeWallpaper, renderWallpapers, syncControls } from './preferences/wallpaper-manager.js';
import { GamesManager } from './games/games.js';
import { setupCommunityForm } from './community/community.js';
import { setupAssistant } from './assistant/assistant.js';
import { setupUI, createGameCard, setGamesMessage, openGameDetails, openGamePage } from './ui/ui.js';
import { getGamePlayUrl, buildPlayPageUrl } from '../../play-utils.js';

// Export for global access (legacy compatibility)
window.PlumpGames = {
  getGamePlayUrl,
  buildPlayPageUrl,
  createGameCard,
  openGamePage,
  openGameDetails
};

// Initialize UI
setupUI();

// Initialize wallpaper manager
initWallpaperManager();

// Initialize games manager
export const gamesManager = new GamesManager();
gamesManager.setCreateGameCard(createGameCard);
gamesManager.setOnModeChange(mode => {
  preferencesManager.set('view', mode);
  preferencesManager.scheduleSave();
});

// Initialize community form
setupCommunityForm();

// Initialize assistant with games context
setupAssistant(() => gamesManager.getGamesContext());

// Wire up preference controls
document.querySelector('#theme-select')?.addEventListener('change', event => {
  preferencesManager.set('theme', event.target.value);
  if (event.target.value !== 'custom') {
    preferencesManager.set('custom', { ...preferencesManager.themes[event.target.value] || preferencesManager.defaults.custom });
  }
  preferencesManager.set('wallpaperColors', false);
  syncControls();
});

document.querySelector('#apply-theme')?.addEventListener('click', () => {
  const custom = Object.fromEntries(
    ['primary', 'secondary', 'accent', 'menu', 'button', 'glow'].map(key =>
      [key, document.querySelector(`#color-${key}`)?.value]
    )
  );
  preferencesManager.set('custom', custom);
  preferencesManager.set('theme', 'custom');
  preferencesManager.set('wallpaperColors', false);
  syncControls();
});

document.querySelector('#reset-theme')?.addEventListener('click', () => {
  preferencesManager.reset();
  syncControls();
  selectWallpaper('none');
});

document.querySelector('#wallpaper-colors')?.addEventListener('change', event => {
  preferencesManager.set('wallpaperColors', event.target.checked);
  syncControls();
});

document.querySelector('#menu-opacity')?.addEventListener('input', event => {
  preferencesManager.set('menuOpacity', Number(event.target.value));
  syncControls();
});

document.querySelectorAll('[data-view-mode]').forEach(button =>
  button.addEventListener('click', () => {
    preferencesManager.set('view', button.dataset.viewMode);
    gamesManager.gameLibrary?.setMode(button.dataset.viewMode);
    syncControls();
  })
);

document.querySelector('#economy-mode')?.addEventListener('change', event => {
  preferencesManager.set('economy', event.target.checked);
  syncControls();
  if (preferencesManager.get('economy')) selectWallpaper(preferencesManager.get('wallpaper'));
});

document.querySelector('#reduce-motion')?.addEventListener('change', event => {
  preferencesManager.set('reduceMotion', event.target.checked);
  syncControls();
  selectWallpaper(preferencesManager.get('wallpaper'));
});

[['glow-strength', 'glow'], ['card-opacity', 'opacity'], ['animation-strength', 'animation']]
  .forEach(([id, key]) =>
    document.querySelector(`#${id}`)?.addEventListener('input', event => {
      preferencesManager.set(key, Number(event.target.value));
      syncControls();
    })
  );

document.querySelector('#wallpaper-pause')?.addEventListener('click', () => {
  pauseWallpaper(true);
  setGamesMessage('Wallpaper pausado.');
});

document.querySelector('#wallpaper-resume')?.addEventListener('click', resumeWallpaper);
document.querySelector('#wallpaper-retry')?.addEventListener('click', () =>
  selectWallpaper(preferencesManager.get('wallpaper'))
);

// Initialize games
gamesManager.init(preferencesManager.getAll());

// Mark main ready
window.__PLUMPGAMES_MAIN_READY__ = true;
document.dispatchEvent(new CustomEvent('plumpgames:critical-ready'));

// Make games manager globally accessible for debugging/legacy
window.gamesManager = gamesManager;