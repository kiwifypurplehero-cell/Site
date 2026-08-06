(() => {
  const STORAGE_KEY = 'plumpJogosPreferences';
  const UPDATE_CACHE_KEY = 'plumpJogosUpdateCache';
  const CACHE_TTL = 15 * 60 * 1000;
  const REPOSITORIES = {
    site: 'https://api.github.com/repos/kiwifypurplehero-cell/Site/commits/main',
    cs16: 'https://api.github.com/repos/kiwifypurplehero-cell/CS1-6HTML/commits/main',
  };
  const themes = {
    original: { name: 'Plump Original', primary: '#8b5cf6', secondary: '#4776ff', accent: '#38d9f5', background: '#050611', surface: '#0d1021', text: '#f5f6ff', button: '#7055ed', glow: '#38d9f5', cardOpacity: 0.92, glowStrength: 0.42, animationStrength: 1 },
    blue: { name: 'Azul Neon', primary: '#2563eb', secondary: '#06b6d4', accent: '#67e8f9', background: '#04111f', surface: '#0b2036', text: '#eefaff', button: '#0ea5e9', glow: '#22d3ee', cardOpacity: 0.9, glowStrength: 0.5, animationStrength: 1 },
    purple: { name: 'Roxo Gamer', primary: '#a855f7', secondary: '#7c3aed', accent: '#f0abfc', background: '#10051c', surface: '#1d0b31', text: '#fff7ff', button: '#9333ea', glow: '#d946ef', cardOpacity: 0.9, glowStrength: 0.5, animationStrength: 1 },
    red: { name: 'Vermelho Arena', primary: '#ef4444', secondary: '#f97316', accent: '#facc15', background: '#160606', surface: '#2a1010', text: '#fff7ed', button: '#dc2626', glow: '#fb7185', cardOpacity: 0.9, glowStrength: 0.46, animationStrength: 1 },
    green: { name: 'Verde Terminal', primary: '#22c55e', secondary: '#16a34a', accent: '#86efac', background: '#020b06', surface: '#07180d', text: '#ecfdf5', button: '#15803d', glow: '#4ade80', cardOpacity: 0.88, glowStrength: 0.45, animationStrength: 0.8 },
    light: { name: 'Claro', primary: '#4f46e5', secondary: '#0284c7', accent: '#0891b2', background: '#f6f7fb', surface: '#ffffff', text: '#101422', button: '#4f46e5', glow: '#60a5fa', cardOpacity: 0.96, glowStrength: 0.22, animationStrength: 0.7 },
    dark: { name: 'Escuro', primary: '#7c3aed', secondary: '#2563eb', accent: '#22d3ee', background: '#030712', surface: '#111827', text: '#f9fafb', button: '#6d28d9', glow: '#38bdf8', cardOpacity: 0.94, glowStrength: 0.35, animationStrength: 0.8 },
  };
  const defaultThemeKey = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'original';
  let preferences = loadPreferences();
  let lastFocusedElement = null;

  function loadPreferences() {
    const fallback = { themeKey: defaultThemeKey, customTheme: themes[defaultThemeKey], gameViewMode: 'detailed', reduceAnimations: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
    try { return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return fallback; }
  }
  function savePreferences() { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-button', theme.button);
    root.style.setProperty('--color-glow', theme.glow);
    root.style.setProperty('--card-opacity', theme.cardOpacity);
    root.style.setProperty('--glow-strength', theme.glowStrength);
    root.style.setProperty('--animation-strength', preferences.reduceAnimations ? 0 : theme.animationStrength);
    document.body.classList.toggle('reduce-animations', preferences.reduceAnimations);
    updateContrastWarning(theme.background, theme.text);
  }
  function resetTheme() { preferences = { themeKey: 'original', customTheme: themes.original, gameViewMode: preferences.gameViewMode, reduceAnimations: false }; savePreferences(); syncSettingsControls(); applyTheme(themes.original); showToast('Configurações restauradas.'); }
  function getActiveTheme() { return preferences.themeKey === 'custom' ? preferences.customTheme : themes[preferences.themeKey] || themes.original; }
  function luminance(hex) { const rgb = hex.replace('#','').match(/.{2}/g).map((x)=>parseInt(x,16)/255).map((v)=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2]; }
  function updateContrastWarning(bg, text) { const warning = document.querySelector('#contrast-warning'); if (!warning) return; const ratio = (Math.max(luminance(bg), luminance(text)) + .05) / (Math.min(luminance(bg), luminance(text)) + .05); warning.hidden = ratio >= 4.5; }

  function setGameViewMode(mode) {
    preferences.gameViewMode = mode; savePreferences();
    document.querySelector('#games-list')?.setAttribute('data-view', mode);
    document.querySelectorAll('[data-view-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.viewMode === mode)));
  }

  async function fetchRepositoryUpdate(key, url) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
      const data = await response.json();
      const date = data?.commit?.committer?.date || data?.commit?.author?.date;
      if (!date) throw new Error('Data ausente');
      return { key, date, checkedAt: Date.now(), verified: true };
    } finally { clearTimeout(timeout); }
  }
  function formatUpdateDate(dateValue) { return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(dateValue)).replace(',', ' às'); }
  function formatRelativeTime(dateValue) {
    const diff = Date.now() - new Date(dateValue).getTime(); const mins = Math.max(1, Math.floor(diff / 60000));
    if (mins < 60) return `Atualizado há ${mins} minuto${mins > 1 ? 's' : ''}`;
    const hours = Math.floor(mins / 60); if (hours < 24) return `Atualizado há ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24); return `Atualizado há ${days} dia${days > 1 ? 's' : ''}`;
  }
  function renderUpdate(key, item, fallback = false) {
    const box = document.querySelector(`[data-update-project="${key}"]`); if (!box || !item) return;
    box.dataset.updateDate = item.date;
    box.querySelector('[data-update-date]').textContent = `${fallback ? 'Última atualização conhecida' : 'Última atualização'}: ${formatUpdateDate(item.date)}`;
    box.querySelector('[data-update-relative]').textContent = formatRelativeTime(item.date);
    box.querySelector('[data-update-status]').textContent = item.verified && !fallback ? 'Atualização verificada' : 'Não foi possível verificar agora';
  }
  async function refreshUpdateInformation(force = false) {
    const button = document.querySelector('[data-refresh-updates]'); if (button) button.textContent = 'Verificando atualização…';
    let cache = {}; try { cache = JSON.parse(localStorage.getItem(UPDATE_CACHE_KEY) || '{}'); } catch { cache = {}; }
    const fresh = cache.checkedAt && Date.now() - cache.checkedAt < CACHE_TTL;
    if (!force && fresh) { Object.entries(cache.items || {}).forEach(([key, item]) => renderUpdate(key, item)); if (button) button.textContent = 'Atualizar informações'; return; }
    try {
      const results = await Promise.all(Object.entries(REPOSITORIES).map(([key, url]) => fetchRepositoryUpdate(key, url)));
      const items = Object.fromEntries(results.map((item) => [item.key, item])); localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({ checkedAt: Date.now(), items }));
      Object.entries(items).forEach(([key, item]) => renderUpdate(key, item));
    } catch (error) { Object.entries(cache.items || {}).forEach(([key, item]) => renderUpdate(key, item, true)); document.querySelectorAll('[data-update-status]').forEach((el) => { if (!el.textContent.includes('conhecida')) el.textContent = 'Não foi possível verificar agora'; }); }
    if (button) button.textContent = 'Atualizar informações';
  }

  function showToast(message) { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
  function openSettingsPanel(trigger) { lastFocusedElement = trigger; document.querySelector('#settings-panel').hidden = false; trigger.setAttribute('aria-expanded', 'true'); document.body.classList.add('modal-open'); syncSettingsControls(); document.querySelector('#settings-close').focus(); }
  function closeSettingsPanel() { const panel = document.querySelector('#settings-panel'); if (panel.hidden) return; panel.hidden = true; document.querySelectorAll('[data-open-settings]').forEach((button) => button.setAttribute('aria-expanded', 'false')); document.body.classList.remove('modal-open'); lastFocusedElement?.focus(); }
  function syncSettingsControls() {
    const theme = getActiveTheme(); document.querySelector('#theme-select').value = preferences.themeKey;
    ['primary','secondary','accent','background','surface','text','button','glow'].forEach((name) => { document.querySelector(`#color-${name}`).value = theme[name]; });
    document.querySelector('#card-opacity').value = theme.cardOpacity; document.querySelector('#glow-strength').value = theme.glowStrength; document.querySelector('#animation-strength').value = theme.animationStrength; document.querySelector('#reduce-animations').checked = preferences.reduceAnimations; updatePreview(theme);
  }
  function readCustomTheme() { return { name: 'Personalizado', primary: colorPrimary.value, secondary: colorSecondary.value, accent: colorAccent.value, background: colorBackground.value, surface: colorSurface.value, text: colorText.value, button: colorButton.value, glow: colorGlow.value, cardOpacity: Number(cardOpacity.value), glowStrength: Number(glowStrength.value), animationStrength: Number(animationStrength.value) }; }
  function updatePreview(theme) { const preview = document.querySelector('.theme-preview'); if (!preview) return; preview.style.setProperty('--preview-bg', theme.background); preview.style.setProperty('--preview-surface', theme.surface); preview.style.setProperty('--preview-text', theme.text); preview.style.setProperty('--preview-primary', theme.primary); preview.style.setProperty('--preview-accent', theme.accent); updateContrastWarning(theme.background, theme.text); }

  const menuToggle = document.querySelector('.menu-toggle'); const menu = document.querySelector('.nav-links'); const navLinks = document.querySelectorAll('.nav-link'); const header = document.querySelector('.site-header');
  function closeMenu() { menu.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); menuToggle.setAttribute('aria-label','Abrir menu'); }
  menuToggle.addEventListener('click', () => { const isOpen = menu.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(isOpen)); menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu'); });
  navLinks.forEach((link) => link.addEventListener('click', closeMenu)); document.addEventListener('click', (event) => { if (!menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu(); });
  const sections = document.querySelectorAll('main section[id], header[id]'); function updateNavigation() { header.classList.toggle('scrolled', window.scrollY > 20); let current='inicio'; sections.forEach((section)=>{ if (window.scrollY >= section.offsetTop - 180) current = section.id; }); navLinks.forEach((link)=>link.classList.toggle('active', link.getAttribute('href') === `#${current}`)); } window.addEventListener('scroll', updateNavigation, { passive: true }); updateNavigation();

  document.querySelectorAll('[data-open-settings]').forEach((button) => button.addEventListener('click', (event) => openSettingsPanel(event.currentTarget)));
  document.querySelector('#settings-panel').addEventListener('click', (event) => { if (event.target.matches('[data-close-settings]')) closeSettingsPanel(); });
  document.querySelectorAll('[data-view-mode]').forEach((button) => button.addEventListener('click', () => setGameViewMode(button.dataset.viewMode)));
  document.querySelector('#theme-select').addEventListener('change', (event) => { if (event.target.value !== 'custom') { preferences.themeKey = event.target.value; preferences.customTheme = themes[event.target.value]; syncSettingsControls(); applyTheme(getActiveTheme()); savePreferences(); } });
  const colorPrimary = document.querySelector('#color-primary'), colorSecondary = document.querySelector('#color-secondary'), colorAccent = document.querySelector('#color-accent'), colorBackground = document.querySelector('#color-background'), colorSurface = document.querySelector('#color-surface'), colorText = document.querySelector('#color-text'), colorButton = document.querySelector('#color-button'), colorGlow = document.querySelector('#color-glow'), cardOpacity = document.querySelector('#card-opacity'), glowStrength = document.querySelector('#glow-strength'), animationStrength = document.querySelector('#animation-strength');
  document.querySelectorAll('.settings-panel input[type="color"], .settings-panel input[type="range"]').forEach((input) => input.addEventListener('input', () => { preferences.themeKey = 'custom'; preferences.customTheme = readCustomTheme(); document.querySelector('#theme-select').value = 'custom'; updatePreview(preferences.customTheme); }));
  document.querySelector('#apply-theme').addEventListener('click', () => { preferences.customTheme = readCustomTheme(); preferences.themeKey = document.querySelector('#theme-select').value === 'custom' ? 'custom' : preferences.themeKey; preferences.reduceAnimations = document.querySelector('#reduce-animations').checked; applyTheme(getActiveTheme()); savePreferences(); showToast('Aparência aplicada.'); });
  document.querySelector('#save-theme').addEventListener('click', () => { preferences.themeKey = 'custom'; preferences.customTheme = readCustomTheme(); preferences.reduceAnimations = document.querySelector('#reduce-animations').checked; applyTheme(preferences.customTheme); savePreferences(); showToast('Tema salvo neste navegador.'); });
  document.querySelector('#reset-theme').addEventListener('click', resetTheme);
  document.querySelector('#reduce-animations').addEventListener('change', (event) => { preferences.reduceAnimations = event.target.checked; applyTheme(getActiveTheme()); savePreferences(); });
  document.querySelector('[data-refresh-updates]').addEventListener('click', () => refreshUpdateInformation(true));
  setInterval(() => Object.keys(REPOSITORIES).forEach((key) => { const date = document.querySelector(`[data-update-project="${key}"]`)?.dataset.updateDate; if (date) renderUpdate(key, { date, verified: true }); }), 60000);

  const modal = document.querySelector('#site-modal'), modalTitle = document.querySelector('#modal-title'), modalContent = document.querySelector('#modal-content'), modalActions = document.querySelector('#modal-actions');
  const modalData = { install: { title:'Como instalar o CS 1.6 PLH', content:'<ol><li>Clique em Baixar.</li><li>Extraia o arquivo ZIP.</li><li>Abra a pasta extraída.</li><li>Localize o arquivo HTML principal.</li><li>Abra em um navegador atualizado.</li></ol>' }, credits: { title:'Créditos', content:'<p>Plump Jogos foi criada por Matheus (Plump), com ajuda do Codex no desenvolvimento do site.</p>' }, privacy: { title:'Política de privacidade', content:'<p>Este site não coleta dados pessoais, não utiliza rastreadores, anúncios ou cookies de análise. Links externos seguem as políticas dos respectivos serviços.</p>' } };
  function openModal(trigger, data, isDownload=false) { lastFocusedElement = trigger; modalTitle.textContent = data.title; modalContent.innerHTML = data.content; modalActions.innerHTML = isDownload ? '<button class="button button--ghost" type="button" data-close-modal>Cancelar</button><a class="button button--primary" href="https://github.com/kiwifypurplehero-cell/CS1-6HTML/archive/refs/heads/main.zip" target="_blank" rel="noopener noreferrer">Continuar download</a>' : '<button class="button button--primary" type="button" data-close-modal>Entendido</button>'; modal.hidden = false; document.body.classList.add('modal-open'); modal.querySelector('[data-close-modal]').focus(); }
  function closeModal() { if (modal.hidden) return; modal.hidden = true; document.body.classList.remove('modal-open'); lastFocusedElement?.focus(); }
  document.querySelectorAll('[data-open-download]').forEach((button) => button.addEventListener('click', (event) => openModal(event.currentTarget, { title:'Confirmar download', content:'<p>Você está prestes a baixar a versão mais recente do CS 1.6 PLH diretamente pelo GitHub.</p>' }, true)));
  document.querySelector('[data-open-install]').addEventListener('click', (event) => openModal(event.currentTarget, modalData.install)); document.querySelector('[data-open-credits]').addEventListener('click', (event) => openModal(event.currentTarget, modalData.credits)); document.querySelector('[data-open-privacy]').addEventListener('click', (event) => openModal(event.currentTarget, modalData.privacy)); modal.addEventListener('click', (event) => { if (event.target.closest('[data-close-modal]')) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeModal(); closeSettingsPanel(); } const trap = !modal.hidden ? modal : (!document.querySelector('#settings-panel').hidden ? document.querySelector('#settings-panel') : null); if (event.key === 'Tab' && trap) { const focusable = [...trap.querySelectorAll('button, a[href], input, select')]; const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } });

  const reducedMotion = preferences.reduceAnimations || window.matchMedia('(prefers-reduced-motion: reduce)').matches; const revealItems = document.querySelectorAll('.reveal'); if (reducedMotion || !('IntersectionObserver' in window)) revealItems.forEach((item)=>item.classList.add('visible')); else { const observer = new IntersectionObserver((entries,o)=>entries.forEach((entry)=>{ if(entry.isIntersecting){ entry.target.classList.add('visible'); o.unobserve(entry.target); } }), { threshold:.12 }); revealItems.forEach((item)=>observer.observe(item)); }
  applyTheme(getActiveTheme()); setGameViewMode(preferences.gameViewMode); refreshUpdateInformation();
})();
