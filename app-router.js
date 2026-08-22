const VIEW_ORDER = ['home', 'library', 'emulators', 'profile'];
const views = new Map([...document.querySelectorAll('[data-app-view]')].map(view => [view.dataset.appView, view]));
const scrollPositions = new Map();
let activeView = 'home';
let transitionToken = 0;

function requestedView() {
  const value = new URL(location.href).searchParams.get('view') || 'home';
  return views.has(value) ? value : 'home';
}

function initializeView(view) {
  if (!view.dataset.viewSrc || view.dataset.initialized) return;
  const frame = document.createElement('iframe');
  frame.className = 'app-view-frame';
  frame.src = view.dataset.viewSrc;
  frame.title = view.dataset.appView === 'profile' ? 'Perfil do usuário' : 'Biblioteca de emuladores';
  frame.loading = 'eager';
  view.replaceChildren(frame);
  view.dataset.initialized = 'true';
}

function updateNavigation(name) {
  document.querySelectorAll('[data-view-link]').forEach(link => {
    const selected = link.dataset.viewLink === name;
    link.toggleAttribute('aria-current', selected);
    if (selected) link.setAttribute('aria-current', 'page');
  });
}

function showView(name, { direction, restoreScroll = true } = {}) {
  if (!views.has(name)) name = 'home';
  const previousName = activeView;
  const previous = views.get(previousName);
  const next = views.get(name);
  const token = ++transitionToken;
  if (previous === next && !next.hidden) { updateNavigation(name); return; }

  scrollPositions.set(previousName, scrollY);
  initializeView(next);
  const movingForward = direction ?? VIEW_ORDER.indexOf(name) > VIEW_ORDER.indexOf(previousName);
  previous?.classList.add(movingForward ? 'view-exit-left' : 'view-exit-right');
  next.hidden = false;
  next.classList.add(movingForward ? 'view-enter-right' : 'view-enter-left');
  next.getBoundingClientRect();
  requestAnimationFrame(() => next.classList.add('view-transition-active'));
  activeView = name;
  updateNavigation(name);
  document.documentElement.dataset.activeView = name;

  window.setTimeout(() => {
    if (token !== transitionToken) return;
    if (previous) { previous.hidden = true; previous.className = previous.className.replace(/\s*view-(?:exit-(?:left|right)|transition-active)/g, ''); }
    next.classList.remove('view-enter-right', 'view-enter-left', 'view-transition-active');
    if (restoreScroll) scrollTo({ top: scrollPositions.get(name) || 0, behavior: 'instant' });
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
}

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
  const name = event.state?.view || requestedView();
  showView(name, { direction: VIEW_ORDER.indexOf(name) > VIEW_ORDER.indexOf(activeView) });
});

activeView = requestedView();
views.forEach((view, name) => { view.hidden = name !== activeView; });
initializeView(views.get(activeView));
updateNavigation(activeView);
document.documentElement.dataset.activeView = activeView;
history.replaceState({ view: activeView }, '', `${location.pathname}?view=${activeView}`);
