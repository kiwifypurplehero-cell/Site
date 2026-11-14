/**
 * Settings Page - User settings with categories and various options
 */

import { createEl, $, $$, onReady, delegate } from '../utils/dom.js';
import { getCurrentUser } from '../data.js';
import { init as initTabs } from '../components/tabs.js';
import { init as initToggle } from '../components/toggle.js';
import { init as initSlider } from '../components/slider.js';
import { init as initDropdown } from '../components/dropdown.js';
import { init as initButton } from '../components/button.js';
import { init as initAvatar } from '../components/avatar.js';
import { storage } from '../utils/storage.js';

let tabsInstance = null;
let settings = {};

const DEFAULT_SETTINGS = {
  // General
  language: 'pt-BR',
  region: 'BR',
  theme: 'dark', // dark, light, system
  autoSignIn: true,
  startupPage: 'home', // home, library, store

  // Display
  motionReduced: false,
  highContrast: false,
  colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
  uiScale: 100,
  showGameArt: true,
  compactMode: false,

  // Notifications
  notificationsEnabled: true,
  achievementNotifications: true,
  friendNotifications: true,
  partyNotifications: true,
  gameUpdateNotifications: true,
  marketingNotifications: false,

  // Privacy
  profileVisibility: 'friends', // public, friends, private
  showOnlineStatus: true,
  showCurrentGame: true,
  showPlayHistory: true,
  shareGameData: false,
  allowFriendRequests: true,

  // Audio
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 80,
  voiceVolume: 90,
  monoAudio: false,
  muteWhenUnfocused: true,

  // Gameplay
  vibrationEnabled: true,
  vibrationIntensity: 70,
  invertYAxis: false,
  autoSaveCloud: true,
  gameDvrEnabled: true,
  screenshotShortcut: true,

  // Network
  bandwidthLimit: 'unlimited', // unlimited, 50, 100, 200, 500 (Mbps)
  allowBackgroundDownloads: true,
  downloadOnStandby: true,
  meteredConnection: false,

  // Accessibility
  textToSpeech: false,
  textToSpeechRate: 100,
  textToSpeechVoice: 'default',
  closedCaptions: false,
  captionSize: 'medium',
  captionStyle: 'default',
  highContrastCaptions: false,
  narrationEnabled: false,
};

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  // Load saved settings
  settings = { ...DEFAULT_SETTINGS, ...storage.get('settings', {}) };

  const user = getCurrentUser();

  main.innerHTML = `
    <div class="page page--settings" data-page="settings">
      <!-- Settings Header -->
      <header class="settings__header">
        <div class="settings__user">
          <div class="settings__avatar" id="settings-avatar"></div>
          <div class="settings__user-info">
            <h1 class="settings__title">Configurações</h1>
            <p class="settings__subtitle">${user?.name} • ${user?.gamertag}</p>
          </div>
        </div>
        <div class="settings__actions">
          <button class="btn btn--secondary" id="reset-settings-btn">Restaurar padrões</button>
          <button class="btn btn--primary" id="save-settings-btn">Salvar alterações</button>
        </div>
      </header>

      <!-- Settings Navigation -->
      <nav class="settings__nav" aria-label="Categorias de configurações">
        <div class="tabs" id="settings-tabs" role="tablist" aria-orientation="vertical"></div>
      </nav>

      <!-- Settings Panels -->
      <div class="settings__panels" id="settings-panels"></div>
    </div>
  `;

  // Initialize avatar
  initSettingsAvatar(main);

  // Initialize tabs
  initSettingsTabs(main);

  // Bind header actions
  bindHeaderActions(main);

  return { tabsInstance };
}

function initSettingsAvatar(main) {
  const container = $('#settings-avatar', main);
  if (!container) return;

  const user = getCurrentUser();
  initAvatar(container, {
    src: user?.avatar,
    alt: user?.name,
    fallback: user?.name,
    size: 'xl',
    ring: true,
    editable: true,
    onEdit: (dataUrl) => {
      storage.set('user-avatar', dataUrl);
      import('../components/toast.js').then(({ success }) => {
        success('Avatar atualizado', 'Configurações');
      });
    },
  });
}

function initSettingsTabs(main) {
  const tabsContainer = $('#settings-tabs', main);
  const panelsContainer = $('#settings-panels', main);
  if (!tabsContainer || !panelsContainer) return;

  const tabsConfig = [
    { label: 'Geral', id: 'general', content: '' },
    { label: 'Tela e vídeo', id: 'display', content: '' },
    { label: 'Notificações', id: 'notifications', content: '' },
    { label: 'Privacidade', id: 'privacy', content: '' },
    { label: 'Áudio', id: 'audio', content: '' },
    { label: 'Jogabilidade', id: 'gameplay', content: '' },
    { label: 'Rede', id: 'network', content: '' },
    { label: 'Acessibilidade', id: 'accessibility', content: '' },
    { label: 'Conta', id: 'account', content: '' },
  ];

  tabsInstance = initTabs(tabsContainer, {
    tabs: tabsConfig,
    defaultIndex: 0,
    vertical: true,
    onChange: (index, trigger, panel) => {
      const tabId = tabsConfig[index].id;
      renderSettingsPanel(tabId, panelsContainer);
    },
  });

  // Render initial panel
  renderSettingsPanel('general', panelsContainer);
}

function renderSettingsPanel(tabId, container) {
  container.innerHTML = '';

  const panel = createEl('div', { class: `settings__panel settings__panel--${tabId}`, role: 'tabpanel' });

  switch (tabId) {
    case 'general':
      renderGeneralSettings(panel);
      break;
    case 'display':
      renderDisplaySettings(panel);
      break;
    case 'notifications':
      renderNotificationSettings(panel);
      break;
    case 'privacy':
      renderPrivacySettings(panel);
      break;
    case 'audio':
      renderAudioSettings(panel);
      break;
    case 'gameplay':
      renderGameplaySettings(panel);
      break;
    case 'network':
      renderNetworkSettings(panel);
      break;
    case 'accessibility':
      renderAccessibilitySettings(panel);
      break;
    case 'account':
      renderAccountSettings(panel);
      break;
  }

  container.appendChild(panel);
}

function renderGeneralSettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Idioma e região</h2>
      <div class="settings__field">
        <label for="language-select" class="settings__label">Idioma</label>
        <div id="language-select" class="settings__control"></div>
      </div>
      <div class="settings__field">
        <label for="region-select" class="settings__label">Região</label>
        <div id="region-select" class="settings__control"></div>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Aparência</h2>
      <div class="settings__field">
        <label for="theme-select" class="settings__label">Tema</label>
        <div id="theme-select" class="settings__control"></div>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Inicialização</h2>
      <div class="settings__field">
        <div class="settings__control" id="auto-signin-toggle"></div>
        <label for="auto-signin-toggle" class="settings__label">Entrar automaticamente</label>
      </div>
      <div class="settings__field">
        <label for="startup-page-select" class="settings__label">Página inicial</label>
        <div id="startup-page-select" class="settings__control"></div>
      </div>
    </div>
  `;

  // Language dropdown
  initDropdown($('#language-select', panel), {
    items: [
      { label: 'Português (Brasil)', value: 'pt-BR', active: settings.language === 'pt-BR' },
      { label: 'English (US)', value: 'en-US', active: settings.language === 'en-US' },
      { label: 'Español (Latinoamérica)', value: 'es-419', active: settings.language === 'es-419' },
      { label: 'Français (France)', value: 'fr-FR', active: settings.language === 'fr-FR' },
      { label: 'Deutsch (Deutschland)', value: 'de-DE', active: settings.language === 'de-DE' },
      { label: '日本語', value: 'ja-JP', active: settings.language === 'ja-JP' },
      { label: '한국어', value: 'ko-KR', active: settings.language === 'ko-KR' },
      { label: '中文 (简体)', value: 'zh-CN', active: settings.language === 'zh-CN' },
    ],
    placeholder: 'Selecionar idioma',
    onSelect: (item) => { settings.language = item.value; applyLanguage(item.value); },
  });

  // Region dropdown
  initDropdown($('#region-select', panel), {
    items: [
      { label: 'Brasil', value: 'BR', active: settings.region === 'BR' },
      { label: 'Estados Unidos', value: 'US', active: settings.region === 'US' },
      { label: 'México', value: 'MX', active: settings.region === 'MX' },
      { label: 'Argentina', value: 'AR', active: settings.region === 'AR' },
      { label: 'Portugal', value: 'PT', active: settings.region === 'PT' },
      { label: 'Espanha', value: 'ES', active: settings.region === 'ES' },
      { label: 'França', value: 'FR', active: settings.region === 'FR' },
      { label: 'Alemanha', value: 'DE', active: settings.region === 'DE' },
      { label: 'Japão', value: 'JP', active: settings.region === 'JP' },
      { label: 'Coreia do Sul', value: 'KR', active: settings.region === 'KR' },
    ],
    placeholder: 'Selecionar região',
    onSelect: (item) => { settings.region = item.value; },
  });

  // Theme dropdown
  initDropdown($('#theme-select', panel), {
    items: [
      { label: 'Escuro', value: 'dark', active: settings.theme === 'dark' },
      { label: 'Claro', value: 'light', active: settings.theme === 'light' },
      { label: 'Sistema', value: 'system', active: settings.theme === 'system' },
    ],
    placeholder: 'Selecionar tema',
    onSelect: (item) => { settings.theme = item.value; applyTheme(item.value); },
  });

  // Auto sign-in toggle
  initToggle($('#auto-signin-toggle', panel), {
    checked: settings.autoSignIn,
    label: '',
    onChange: (checked) => { settings.autoSignIn = checked; },
  });

  // Startup page dropdown
  initDropdown($('#startup-page-select', panel), {
    items: [
      { label: 'Início', value: 'home', active: settings.startupPage === 'home' },
      { label: 'Biblioteca', value: 'library', active: settings.startupPage === 'library' },
      { label: 'Loja', value: 'store', active: settings.startupPage === 'store' },
    ],
    placeholder: 'Selecionar página',
    onSelect: (item) => { settings.startupPage = item.value; },
  });
}

function renderDisplaySettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Acessibilidade visual</h2>
      <div class="settings__field">
        <div class="settings__control" id="reduced-motion-toggle"></div>
        <label for="reduced-motion-toggle" class="settings__label">Reduzir animações</label>
        <p class="settings__description">Desativa transições e efeitos de movimento</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="high-contrast-toggle"></div>
        <label for="high-contrast-toggle" class="settings__label">Alto contraste</label>
        <p class="settings__description">Aumenta o contraste das cores da interface</p>
      </div>
      <div class="settings__field">
        <label for="colorblind-select" class="settings__label">Filtro para daltonismo</label>
        <div id="colorblind-select" class="settings__control"></div>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Escala da interface</h2>
      <div class="settings__field">
        <div class="settings__control" id="ui-scale-slider"></div>
        <label for="ui-scale-slider" class="settings__label">Tamanho: <span id="ui-scale-value">${settings.uiScale}%</span></label>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Conteúdo</h2>
      <div class="settings__field">
        <div class="settings__control" id="show-game-art-toggle"></div>
        <label for="show-game-art-toggle" class="settings__label">Mostrar capas dos jogos</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="compact-mode-toggle"></div>
        <label for="compact-mode-toggle" class="settings__label">Modo compacto</label>
        <p class="settings__description">Reduz o espaçamento para mostrar mais conteúdo</p>
      </div>
    </div>
  `;

  initToggle($('#reduced-motion-toggle', panel), {
    checked: settings.motionReduced,
    onChange: (checked) => { settings.motionReduced = checked; applyReducedMotion(checked); },
  });

  initToggle($('#high-contrast-toggle', panel), {
    checked: settings.highContrast,
    onChange: (checked) => { settings.highContrast = checked; applyHighContrast(checked); },
  });

  initDropdown($('#colorblind-select', panel), {
    items: [
      { label: 'Desativado', value: 'none', active: settings.colorBlindMode === 'none' },
      { label: 'Protanopia (vermelho)', value: 'protanopia', active: settings.colorBlindMode === 'protanopia' },
      { label: 'Deuteranopia (verde)', value: 'deuteranopia', active: settings.colorBlindMode === 'deuteranopia' },
      { label: 'Tritanopia (azul)', value: 'tritanopia', active: settings.colorBlindMode === 'tritanopia' },
    ],
    placeholder: 'Selecionar filtro',
    onSelect: (item) => { settings.colorBlindMode = item.value; applyColorBlindFilter(item.value); },
  });

  initSlider($('#ui-scale-slider', panel), {
    min: 75,
    max: 150,
    step: 5,
    value: settings.uiScale,
    showValue: false,
    onInput: (value) => {
      settings.uiScale = value;
      $('#ui-scale-value', panel).textContent = `${value}%`;
      applyUIScale(value);
    },
  });

  initToggle($('#show-game-art-toggle', panel), {
    checked: settings.showGameArt,
    onChange: (checked) => { settings.showGameArt = checked; },
  });

  initToggle($('#compact-mode-toggle', panel), {
    checked: settings.compactMode,
    onChange: (checked) => { settings.compactMode = checked; applyCompactMode(checked); },
  });
}

function renderNotificationSettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Geral</h2>
      <div class="settings__field">
        <div class="settings__control" id="notifications-enabled-toggle"></div>
        <label for="notifications-enabled-toggle" class="settings__label">Ativar notificações</label>
        <p class="settings__description">Ativa ou desativa todas as notificações do sistema</p>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Tipos de notificação</h2>
      <div class="settings__field">
        <div class="settings__control" id="achievement-notifications-toggle"></div>
        <label for="achievement-notifications-toggle" class="settings__label">Conquistas desbloqueadas</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="friend-notifications-toggle"></div>
        <label for="friend-notifications-toggle" class="settings__label">Amigos online/convites</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="party-notifications-toggle"></div>
        <label for="party-notifications-toggle" class="settings__label">Party e chat de voz</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="game-update-notifications-toggle"></div>
        <label for="game-update-notifications-toggle" class="settings__label">Atualizações de jogos</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="marketing-notifications-toggle"></div>
        <label for="marketing-notifications-toggle" class="settings__label">Ofertas e novidades</label>
      </div>
    </div>
  `;

  initToggle($('#notifications-enabled-toggle', panel), {
    checked: settings.notificationsEnabled,
    onChange: (checked) => { settings.notificationsEnabled = checked; },
  });

  initToggle($('#achievement-notifications-toggle', panel), {
    checked: settings.achievementNotifications,
    onChange: (checked) => { settings.achievementNotifications = checked; },
  });

  initToggle($('#friend-notifications-toggle', panel), {
    checked: settings.friendNotifications,
    onChange: (checked) => { settings.friendNotifications = checked; },
  });

  initToggle($('#party-notifications-toggle', panel), {
    checked: settings.partyNotifications,
    onChange: (checked) => { settings.partyNotifications = checked; },
  });

  initToggle($('#game-update-notifications-toggle', panel), {
    checked: settings.gameUpdateNotifications,
    onChange: (checked) => { settings.gameUpdateNotifications = checked; },
  });

  initToggle($('#marketing-notifications-toggle', panel), {
    checked: settings.marketingNotifications,
    onChange: (checked) => { settings.marketingNotifications = checked; },
  });
}

function renderPrivacySettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Perfil e presença</h2>
      <div class="settings__field">
        <label for="profile-visibility-select" class="settings__label">Visibilidade do perfil</label>
        <div id="profile-visibility-select" class="settings__control"></div>
        <p class="settings__description">Quem pode ver seu perfil e conquistas</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="show-online-status-toggle"></div>
        <label for="show-online-status-toggle" class="settings__label">Mostrar status online</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="show-current-game-toggle"></div>
        <label for="show-current-game-toggle" class="settings__label">Mostrar jogo atual</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="show-play-history-toggle"></div>
        <label for="show-play-history-toggle" class="settings__label">Mostrar histórico de jogos</label>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Dados e comunicações</h2>
      <div class="settings__field">
        <div class="settings__control" id="share-game-data-toggle"></div>
        <label for="share-game-data-toggle" class="settings__label">Compartilhar dados de jogo</label>
        <p class="settings__description">Ajuda a melhorar recomendações e recursos</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="allow-friend-requests-toggle"></div>
        <label for="allow-friend-requests-toggle" class="settings__label">Permitir solicitações de amizade</label>
      </div>
    </div>
  `;

  initDropdown($('#profile-visibility-select', panel), {
    items: [
      { label: 'Público', value: 'public', active: settings.profileVisibility === 'public' },
      { label: 'Apenas amigos', value: 'friends', active: settings.profileVisibility === 'friends' },
      { label: 'Privado', value: 'private', active: settings.profileVisibility === 'private' },
    ],
    placeholder: 'Selecionar visibilidade',
    onSelect: (item) => { settings.profileVisibility = item.value; },
  });

  initToggle($('#show-online-status-toggle', panel), {
    checked: settings.showOnlineStatus,
    onChange: (checked) => { settings.showOnlineStatus = checked; },
  });

  initToggle($('#show-current-game-toggle', panel), {
    checked: settings.showCurrentGame,
    onChange: (checked) => { settings.showCurrentGame = checked; },
  });

  initToggle($('#show-play-history-toggle', panel), {
    checked: settings.showPlayHistory,
    onChange: (checked) => { settings.showPlayHistory = checked; },
  });

  initToggle($('#share-game-data-toggle', panel), {
    checked: settings.shareGameData,
    onChange: (checked) => { settings.shareGameData = checked; },
  });

  initToggle($('#allow-friend-requests-toggle', panel), {
    checked: settings.allowFriendRequests,
    onChange: (checked) => { settings.allowFriendRequests = checked; },
  });
}

function renderAudioSettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Volumes</h2>
      <div class="settings__field">
        <div class="settings__control" id="master-volume-slider"></div>
        <label for="master-volume-slider" class="settings__label">Volume principal: <span id="master-volume-value">${settings.masterVolume}%</span></label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="music-volume-slider"></div>
        <label for="music-volume-slider" class="settings__label">Música: <span id="music-volume-value">${settings.musicVolume}%</span></label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="sfx-volume-slider"></div>
        <label for="sfx-volume-slider" class="settings__label">Efeitos sonoros: <span id="sfx-volume-value">${settings.sfxVolume}%</span></label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="voice-volume-slider"></div>
        <label for="voice-volume-slider" class="settings__label">Chat de voz: <span id="voice-volume-value">${settings.voiceVolume}%</span></label>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Opções de áudio</h2>
      <div class="settings__field">
        <div class="settings__control" id="mono-audio-toggle"></div>
        <label for="mono-audio-toggle" class="settings__label">Áudio mono</label>
        <p class="settings__description">Combina canais esquerdo e direito</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="mute-unfocused-toggle"></div>
        <label for="mute-unfocused-toggle" class="settings__label">Mutar ao perder foco</label>
        <p class="settings__description">Silencia o jogo quando a janela não está ativa</p>
      </div>
    </div>
  `;

  initSlider($('#master-volume-slider', panel), {
    min: 0, max: 100, step: 1, value: settings.masterVolume,
    onInput: (value) => { settings.masterVolume = value; $('#master-volume-value', panel).textContent = `${value}%`; },
  });

  initSlider($('#music-volume-slider', panel), {
    min: 0, max: 100, step: 1, value: settings.musicVolume,
    onInput: (value) => { settings.musicVolume = value; $('#music-volume-value', panel).textContent = `${value}%`; },
  });

  initSlider($('#sfx-volume-slider', panel), {
    min: 0, max: 100, step: 1, value: settings.sfxVolume,
    onInput: (value) => { settings.sfxVolume = value; $('#sfx-volume-value', panel).textContent = `${value}%`; },
  });

  initSlider($('#voice-volume-slider', panel), {
    min: 0, max: 100, step: 1, value: settings.voiceVolume,
    onInput: (value) => { settings.voiceVolume = value; $('#voice-volume-value', panel).textContent = `${value}%`; },
  });

  initToggle($('#mono-audio-toggle', panel), {
    checked: settings.monoAudio,
    onChange: (checked) => { settings.monoAudio = checked; },
  });

  initToggle($('#mute-unfocused-toggle', panel), {
    checked: settings.muteWhenUnfocused,
    onChange: (checked) => { settings.muteWhenUnfocused = checked; },
  });
}

function renderGameplaySettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Controle</h2>
      <div class="settings__field">
        <div class="settings__control" id="vibration-toggle"></div>
        <label for="vibration-toggle" class="settings__label">Vibração do controle</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="vibration-intensity-slider"></div>
        <label for="vibration-intensity-slider" class="settings__label">Intensidade da vibração: <span id="vibration-intensity-value">${settings.vibrationIntensity}%</span></label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="invert-y-toggle"></div>
        <label for="invert-y-toggle" class="settings__label">Inverter eixo Y</label>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Captura e salvamento</h2>
      <div class="settings__field">
        <div class="settings__control" id="auto-save-cloud-toggle"></div>
        <label for="auto-save-cloud-toggle" class="settings__label">Salvamento automático na nuvem</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="game-dvr-toggle"></div>
        <label for="game-dvr-toggle" class="settings__label">Gravação de jogo (Game DVR)</label>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="screenshot-shortcut-toggle"></div>
        <label for="screenshot-shortcut-toggle" class="settings__label">Atalho de captura de tela</label>
      </div>
    </div>
  `;

  initToggle($('#vibration-toggle', panel), {
    checked: settings.vibrationEnabled,
    onChange: (checked) => { settings.vibrationEnabled = checked; },
  });

  initSlider($('#vibration-intensity-slider', panel), {
    min: 0, max: 100, step: 5, value: settings.vibrationIntensity,
    onInput: (value) => { settings.vibrationIntensity = value; $('#vibration-intensity-value', panel).textContent = `${value}%`; },
  });

  initToggle($('#invert-y-toggle', panel), {
    checked: settings.invertYAxis,
    onChange: (checked) => { settings.invertYAxis = checked; },
  });

  initToggle($('#auto-save-cloud-toggle', panel), {
    checked: settings.autoSaveCloud,
    onChange: (checked) => { settings.autoSaveCloud = checked; },
  });

  initToggle($('#game-dvr-toggle', panel), {
    checked: settings.gameDvrEnabled,
    onChange: (checked) => { settings.gameDvrEnabled = checked; },
  });

  initToggle($('#screenshot-shortcut-toggle', panel), {
    checked: settings.screenshotShortcut,
    onChange: (checked) => { settings.screenshotShortcut = checked; },
  });
}

function renderNetworkSettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Largura de banda</h2>
      <div class="settings__field">
        <label for="bandwidth-select" class="settings__label">Limite de download</label>
        <div id="bandwidth-select" class="settings__control"></div>
        <p class="settings__description">Limita a velocidade de download de jogos e atualizações</p>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Downloads</h2>
      <div class="settings__field">
        <div class="settings__control" id="background-downloads-toggle"></div>
        <label for="background-downloads-toggle" class="settings__label">Downloads em segundo plano</label>
        <p class="settings__description">Permite downloads enquanto usa outros apps</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="download-standby-toggle"></div>
        <label for="download-standby-toggle" class="settings__label">Baixar em standby</label>
        <p class="settings__description">Continua downloads no modo de baixo consumo</p>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="metered-connection-toggle"></div>
        <label for="metered-connection-toggle" class="settings__label">Conexão medida</label>
        <p class="settings__description">Reduz uso de dados em conexões limitadas</p>
      </div>
    </div>
  `;

  initDropdown($('#bandwidth-select', panel), {
    items: [
      { label: 'Ilimitado', value: 'unlimited', active: settings.bandwidthLimit === 'unlimited' },
      { label: '50 Mbps', value: '50', active: settings.bandwidthLimit === '50' },
      { label: '100 Mbps', value: '100', active: settings.bandwidthLimit === '100' },
      { label: '200 Mbps', value: '200', active: settings.bandwidthLimit === '200' },
      { label: '500 Mbps', value: '500', active: settings.bandwidthLimit === '500' },
    ],
    placeholder: 'Selecionar limite',
    onSelect: (item) => { settings.bandwidthLimit = item.value; },
  });

  initToggle($('#background-downloads-toggle', panel), {
    checked: settings.allowBackgroundDownloads,
    onChange: (checked) => { settings.allowBackgroundDownloads = checked; },
  });

  initToggle($('#download-standby-toggle', panel), {
    checked: settings.downloadOnStandby,
    onChange: (checked) => { settings.downloadOnStandby = checked; },
  });

  initToggle($('#metered-connection-toggle', panel), {
    checked: settings.meteredConnection,
    onChange: (checked) => { settings.meteredConnection = checked; },
  });
}

function renderAccessibilitySettings(panel) {
  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Narração e texto para fala</h2>
      <div class="settings__field">
        <div class="settings__control" id="tts-toggle"></div>
        <label for="tts-toggle" class="settings__label">Texto para fala</label>
      </div>
      <div class="settings__field" id="tts-rate-field" style="${settings.textToSpeech ? '' : 'display:none'}">
        <div class="settings__control" id="tts-rate-slider"></div>
        <label for="tts-rate-slider" class="settings__label">Velocidade: <span id="tts-rate-value">${settings.textToSpeechRate}%</span></label>
      </div>
      <div class="settings__field" id="tts-voice-field" style="${settings.textToSpeech ? '' : 'display:none'}">
        <label for="tts-voice-select" class="settings__label">Voz</label>
        <div id="tts-voice-select" class="settings__control"></div>
      </div>
      <div class="settings__field">
        <div class="settings__control" id="narration-toggle"></div>
        <label for="narration-toggle" class="settings__label">Narração de interface</label>
        <p class="settings__description">Lê elementos da interface ao navegar</p>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Legendas</h2>
      <div class="settings__field">
        <div class="settings__control" id="captions-toggle"></div>
        <label for="captions-toggle" class="settings__label">Legendas fechadas</label>
      </div>
      <div class="settings__field" id="caption-size-field" style="${settings.closedCaptions ? '' : 'display:none'}">
        <label for="caption-size-select" class="settings__label">Tamanho</label>
        <div id="caption-size-select" class="settings__control"></div>
      </div>
      <div class="settings__field" id="caption-style-field" style="${settings.closedCaptions ? '' : 'display:none'}">
        <label for="caption-style-select" class="settings__label">Estilo</label>
        <div id="caption-style-select" class="settings__control"></div>
      </div>
      <div class="settings__field" id="caption-contrast-field" style="${settings.closedCaptions ? '' : 'display:none'}">
        <div class="settings__control" id="caption-contrast-toggle"></div>
        <label for="caption-contrast-toggle" class="settings__label">Alto contraste nas legendas</label>
      </div>
    </div>
  `;

  const ttsToggle = initToggle($('#tts-toggle', panel), {
    checked: settings.textToSpeech,
    onChange: (checked) => {
      settings.textToSpeech = checked;
      $('#tts-rate-field', panel).style.display = checked ? '' : 'none';
      $('#tts-voice-field', panel).style.display = checked ? '' : 'none';
    },
  });

  initSlider($('#tts-rate-slider', panel), {
    min: 50, max: 200, step: 10, value: settings.textToSpeechRate,
    onInput: (value) => { settings.textToSpeechRate = value; $('#tts-rate-value', panel).textContent = `${value}%`; },
  });

  initDropdown($('#tts-voice-select', panel), {
    items: [
      { label: 'Padrão do sistema', value: 'default', active: settings.textToSpeechVoice === 'default' },
      { label: 'Voz masculina', value: 'male', active: settings.textToSpeechVoice === 'male' },
      { label: 'Voz feminina', value: 'female', active: settings.textToSpeechVoice === 'female' },
    ],
    placeholder: 'Selecionar voz',
    onSelect: (item) => { settings.textToSpeechVoice = item.value; },
  });

  initToggle($('#narration-toggle', panel), {
    checked: settings.narrationEnabled,
    onChange: (checked) => { settings.narrationEnabled = checked; },
  });

  const captionsToggle = initToggle($('#captions-toggle', panel), {
    checked: settings.closedCaptions,
    onChange: (checked) => {
      settings.closedCaptions = checked;
      $('#caption-size-field', panel).style.display = checked ? '' : 'none';
      $('#caption-style-field', panel).style.display = checked ? '' : 'none';
      $('#caption-contrast-field', panel).style.display = checked ? '' : 'none';
    },
  });

  initDropdown($('#caption-size-select', panel), {
    items: [
      { label: 'Pequeno', value: 'small', active: settings.captionSize === 'small' },
      { label: 'Médio', value: 'medium', active: settings.captionSize === 'medium' },
      { label: 'Grande', value: 'large', active: settings.captionSize === 'large' },
      { label: 'Extra grande', value: 'xlarge', active: settings.captionSize === 'xlarge' },
    ],
    placeholder: 'Selecionar tamanho',
    onSelect: (item) => { settings.captionSize = item.value; },
  });

  initDropdown($('#caption-style-select', panel), {
    items: [
      { label: 'Padrão', value: 'default', active: settings.captionStyle === 'default' },
      { label: 'Branco com sombra', value: 'white-shadow', active: settings.captionStyle === 'white-shadow' },
      { label: 'Amarelo com fundo', value: 'yellow-bg', active: settings.captionStyle === 'yellow-bg' },
      { label: 'Preto com fundo branco', value: 'black-white', active: settings.captionStyle === 'black-white' },
    ],
    placeholder: 'Selecionar estilo',
    onSelect: (item) => { settings.captionStyle = item.value; },
  });

  initToggle($('#caption-contrast-toggle', panel), {
    checked: settings.highContrastCaptions,
    onChange: (checked) => { settings.highContrastCaptions = checked; },
  });
}

function renderAccountSettings(panel) {
  const user = getCurrentUser();

  panel.innerHTML = `
    <div class="settings__section">
      <h2 class="settings__section-title">Informações da conta</h2>
      <div class="account__info">
        <div class="account__field">
          <span class="account__label">Nome</span>
          <span class="account__value">${user?.name}</span>
        </div>
        <div class="account__field">
          <span class="account__label">Gamertag</span>
          <span class="account__value">${user?.gamertag}</span>
        </div>
        <div class="account__field">
          <span class="account__label">Email</span>
          <span class="account__value">${user?.email}</span>
        </div>
        <div class="account__field">
          <span class="account__label">ID do Xbox</span>
          <span class="account__value">${user?.xuid}</span>
        </div>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Segurança</h2>
      <div class="settings__actions-row">
        <button class="btn btn--secondary" id="change-password-btn">Alterar senha</button>
        <button class="btn btn--secondary" id="two-factor-btn">Autenticação de dois fatores</button>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Dados e armazenamento</h2>
      <div class="settings__actions-row">
        <button class="btn btn--secondary" id="manage-storage-btn">Gerenciar armazenamento</button>
        <button class="btn btn--secondary" id="export-data-btn">Exportar dados</button>
        <button class="btn btn--danger" id="delete-account-btn">Excluir conta</button>
      </div>
    </div>

    <div class="settings__section">
      <h2 class="settings__section-title">Sobre</h2>
      <div class="account__version">
        <p>Xbox Purple Gaming Dashboard v1.0.0</p>
        <p>Desenvolvido com vanilla HTML/CSS/JS</p>
        <p>Compatível com GitHub Pages, Netlify, Vercel</p>
      </div>
    </div>
  `;

  $('#change-password-btn', panel)?.addEventListener('click', () => {
    import('../components/modal.js').then(({ prompt }) => {
      prompt('Alterar senha', 'Nova senha:', '', (value) => {
        if (value) import('../components/toast.js').then(({ success }) => success('Senha alterada', 'Conta'));
      }, { type: 'password' });
    });
  });

  $('#two-factor-btn', panel)?.addEventListener('click', () => {
    import('../components/toast.js').then(({ info }) => info('Configure 2FA em account.microsoft.com', 'Segurança'));
  });

  $('#manage-storage-btn', panel)?.addEventListener('click', () => {
    import('../components/modal.js').then(({ alert }) => alert('Armazenamento', 'Gerenciamento de armazenamento será implementado em breve.'));
  });

  $('#export-data-btn', panel)?.addEventListener('click', () => {
    const data = JSON.stringify(storage.getAll(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = createEl('a', { href: url, download: 'dashboard-data.json' });
    a.click();
    URL.revokeObjectURL(url);
    import('../components/toast.js').then(({ success }) => success('Dados exportados', 'Conta'));
  });

  $('#delete-account-btn', panel)?.addEventListener('click', () => {
    import('../components/modal.js').then(({ confirm }) => {
      confirm('Excluir conta', 'Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.', () => {
        storage.clear();
        import('../components/toast.js').then(({ success }) => success('Conta excluída', 'Conta'));
        setTimeout(() => window.location.reload(), 1500);
      });
    });
  });
}

function bindHeaderActions(main) {
  const saveBtn = $('#save-settings-btn', main);
  saveBtn?.addEventListener('click', saveSettings);

  const resetBtn = $('#reset-settings-btn', main);
  resetBtn?.addEventListener('click', () => {
    import('../components/modal.js').then(({ confirm }) => {
      confirm('Restaurar padrões', 'Todas as configurações voltarão aos valores padrão. Continuar?', () => {
        settings = { ...DEFAULT_SETTINGS };
        storage.set('settings', settings);
        import('../components/toast.js').then(({ success }) => success('Configurações restauradas', 'Configurações'));
        // Re-render current tab
        const activeTab = tabsInstance?.element?.querySelector('.tabs__trigger--active')?.dataset.id || 'general';
        renderSettingsPanel(activeTab, $('#settings-panels', main));
      });
    });
  });
}

function saveSettings() {
  storage.set('settings', settings);
  import('../components/toast.js').then(({ success }) => {
    success('Configurações salvas', 'Configurações');
  });

  // Apply settings that need immediate effect
  applyTheme(settings.theme);
  applyReducedMotion(settings.motionReduced);
  applyHighContrast(settings.highContrast);
  applyColorBlindFilter(settings.colorBlindMode);
  applyUIScale(settings.uiScale);
  applyCompactMode(settings.compactMode);
}

// Apply functions
function applyLanguage(lang) {
  document.documentElement.lang = lang;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function applyReducedMotion(enabled) {
  document.documentElement.classList.toggle('reduce-motion', enabled);
}

function applyHighContrast(enabled) {
  document.documentElement.classList.toggle('high-contrast', enabled);
}

function applyColorBlindFilter(mode) {
  const root = document.documentElement;
  root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
  if (mode !== 'none') {
    root.classList.add(`colorblind-${mode}`);
  }
}

function applyUIScale(scale) {
  document.documentElement.style.setProperty('--ui-scale', `${scale / 100}`);
}

function applyCompactMode(enabled) {
  document.documentElement.classList.toggle('compact-mode', enabled);
}

export function cleanup() {
  tabsInstance = null;
}

export default { render, cleanup };