const VIEW_ORDER = ['workspace', 'emulators', 'utilities', 'profile'];
const DEFAULT_VIEW = 'workspace';
const views = new Map([...document.querySelectorAll('[data-app-view]')].map(view => [view.dataset.appView, view]));
const scrollPositions = new Map();
let activeView = DEFAULT_VIEW;
let transitionToken = 0;
let routerStarted = false;

function requestedView() {
  const value = new URLSearchParams(location.search).get('view');
  return value && views.has(value) ? value : DEFAULT_VIEW;
}

function initializeView(view) {
  if (!view.dataset.viewSrc || view.dataset.initialized) return;
  if (view.dataset.appView === 'profile' && window.plumpUser?.isGuest) {
    view.classList.add('guest-profile');
    view.innerHTML = `<section class="guest-profile__card"><span class="guest-profile__avatar" aria-hidden="true">🎮</span><p class="eyebrow">Sessão temporária</p><h1>${window.plumpUser.displayName}</h1><p>Crie uma conta para salvar seu progresso.</p><button class="button button--primary" type="button" data-guest-create>Criar conta</button><button class="button button--ghost" type="button" data-guest-exit>Sair</button></section>`;
    view.querySelector('[data-guest-create]').onclick=()=>location.href='/?register=1';
    view.querySelector('[data-guest-exit]').onclick=()=>window.PlumpAuth.logout();
    view.dataset.initialized = 'true';
    return;
  }
  const frame = document.createElement('iframe');
  frame.className = 'app-view-frame';
  frame.src = view.dataset.viewSrc;
  frame.title = view.dataset.appView === 'profile' ? 'Perfil do usuário' : 'Biblioteca de emuladores';
  frame.loading = 'eager';
  frame.scrolling = 'no';
  frame.addEventListener('load', () => connectFrameHeight(frame));
  view.replaceChildren(frame);
  view.dataset.initialized = 'true';
}

function connectFrameHeight(frame) {
  const document = frame.contentDocument;
  if (!document) return;

  document.documentElement.classList.add('embedded-app-view');
  const embeddedStyles = document.createElement('style');
  embeddedStyles.textContent = `
    html.embedded-app-view,html.embedded-app-view body{height:auto!important;min-height:0!important;overflow:hidden!important;background:transparent!important}
    html.embedded-app-view .site-header,html.embedded-app-view .profile-header{display:none!important}
    html.embedded-app-view .emulators-page{padding-top:32px!important}
    html.embedded-app-view .profile-main{padding-top:32px!important}
  `;
  document.head.append(embeddedStyles);

  const resize = () => {
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    if (Math.abs(frame.getBoundingClientRect().height - height) > 1) frame.style.height = `${height}px`;
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(document.body);
  frame._viewResizeObserver = observer;
  document.fonts?.ready.then(resize);
}

function updateNavigation(name) {
  document.querySelectorAll('[data-view-link]').forEach(link => {
    const selected = link.dataset.viewLink === name;
    link.toggleAttribute('aria-current', selected);
    if (selected) link.setAttribute('aria-current', 'page');
  });
}

function showView(name, { direction, restoreScroll = true } = {}) {
  if (!views.has(name)) name = DEFAULT_VIEW;
  const previousName = activeView;
  const previous = views.get(previousName);
  const next = views.get(name);
  const token = ++transitionToken;
  if (previous === next && !next.hidden) { updateNavigation(name); return; }

  views.forEach(view => {
    window.gsap?.killTweensOf(view);
    if (view !== previous && view !== next) {
      view.hidden = true;
      view.removeAttribute('style');
    }
  });

  scrollPositions.set(previousName, scrollY);
  initializeView(next);
  const movingForward = direction ?? VIEW_ORDER.indexOf(name) > VIEW_ORDER.indexOf(previousName);
  next.hidden = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  if (previous) {
    previous.style.position = 'absolute';
    previous.style.insetInline = '0';
    previous.style.pointerEvents = 'none';
  }
  activeView = name;
  updateNavigation(name);
  document.documentElement.dataset.activeView = name;

  const finish = () => {
    if (token !== transitionToken) return;
    if (previous) {
      previous.hidden = true;
      previous.removeAttribute('style');
    }
    window.gsap?.set([previous, next].filter(Boolean), { clearProps: 'transform,opacity,position,insetInline,pointerEvents' });
    next.removeAttribute('style');
    if (restoreScroll) scrollTo({ top: scrollPositions.get(name) || 0, behavior: 'instant' });
  };

  if (!gsap || reducedMotion) {
    finish();
  } else {
    gsap.killTweensOf([previous, next].filter(Boolean));
    gsap.set(next, { xPercent: movingForward ? 18 : -18, opacity: 0 });
    if (previous) gsap.to(previous, { xPercent: movingForward ? -18 : 18, opacity: 0, duration: .24, ease: 'power2.out' });
    gsap.to(next, { xPercent: 0, opacity: 1, duration: .24, ease: 'power2.out', onComplete: finish });
  }
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'plumpgames:profile-saved' || !event.data.user) return;
  window.plumpUser = { ...(window.plumpUser || {}), ...event.data.user };
  try { sessionStorage.setItem('plumpgames:profile', JSON.stringify(event.data.user)); } catch { /* D1 remains the source of truth. */ }
});

function navigate(name) {
  if (name === activeView) return;
  history.pushState({ view: name }, '', `${location.pathname}?view=${name}`);
  showView(name);
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-view-link]');
  if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.dataset.viewLink);
});

addEventListener('popstate', event => {
  if (!routerStarted) return;
  const name = event.state?.view || requestedView();
  showView(name, { direction: VIEW_ORDER.indexOf(name) > VIEW_ORDER.indexOf(activeView) });
});

function startRouter() {
  if (routerStarted) return;
  routerStarted = true;
  activeView = requestedView();
  views.forEach((view, name) => { view.hidden = name !== activeView; });
  initializeView(views.get(activeView));
  updateNavigation(activeView);
  document.documentElement.dataset.activeView = activeView;
  // Store the resolved fallback without rewriting a clean `/` to `?view=workspace`.
  history.replaceState({ view: activeView }, '', location.href);
}

// Authentication owns visibility of the app shell. Start view-specific work only
// after it has accepted a session, preventing protected UI from flashing first.
if (window.plumpUser) startRouter();
else window.addEventListener('plumpgames:authenticated', startRouter, { once: true });

// Avoid pinning the navigation above a virtual keyboard; the visual viewport is
// used only when the keyboard measurably reduces the visible page.
if (window.visualViewport) {
  const syncKeyboard = () => {
    const layoutHeight = Math.max(innerHeight, document.documentElement.clientHeight);
    const obscuredHeight = layoutHeight - window.visualViewport.height - window.visualViewport.offsetTop;
    document.documentElement.classList.toggle('keyboard-open', obscuredHeight > Math.min(180, layoutHeight * .2));
  };
  window.visualViewport.addEventListener('resize', syncKeyboard, {passive:true});
  window.visualViewport.addEventListener('scroll', syncKeyboard, {passive:true});
  addEventListener('orientationchange', syncKeyboard, {passive:true});
  syncKeyboard();
}
document.addEventListener('fullscreenchange',()=>document.documentElement.classList.toggle('app-fullscreen',Boolean(document.fullscreenElement)));
