const DEFAULT_DEBOUNCE_MS = 120;

/** Return the largest native-aspect rectangle that fits inside the supplied area. */
export function fitEmulatorViewport({availableWidth, availableHeight, nativeWidth, nativeHeight}) {
  const width = Math.max(0, Number(availableWidth) || 0);
  const height = Math.max(0, Number(availableHeight) || 0);
  const sourceWidth = Math.max(1, Number(nativeWidth) || 1);
  const sourceHeight = Math.max(1, Number(nativeHeight) || 1);
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  return {width: Math.floor(sourceWidth * scale), height: Math.floor(sourceHeight * scale), scale};
}

/** Android can expose the post-rotation visual viewport before layout viewport values settle. */
export function readViewportSize(targetWindow = window) {
  const visual = targetWindow.visualViewport;
  return {
    width: Math.max(0, Number(visual?.width) || Number(targetWindow.innerWidth) || 0),
    height: Math.max(0, Number(visual?.height) || Number(targetWindow.innerHeight) || 0)
  };
}

/**
 * EmulatorJS inserts several elements between EJS_player and its canvas. In 4.2.3 the
 * canvas' immediate wrapper is sized as the game surface, while its ancestors also host
 * the menu and virtual gamepad. Marking those separately prevents controls from becoming
 * flex/grid columns that reduce the game to half of the player.
 */
export function identifyEmulatorDom(container, canvas) {
  if (!container || !canvas || !container.contains(canvas)) return null;
  const stage = canvas.parentElement;
  const wrappers = [];
  for (let node = stage?.parentElement; node && node !== container; node = node.parentElement) wrappers.push(node);
  return {stage, wrappers};
}

export class EmulatorViewportManager {
  constructor({shell, container, nativeWidth, nativeHeight, debounceMs = DEFAULT_DEBOUNCE_MS, debug = false}) {
    this.shell = shell;
    this.container = container;
    this.nativeWidth = nativeWidth;
    this.nativeHeight = nativeHeight;
    this.debounceMs = debounceMs;
    this.debug = debug;
    this.timer = 0;
    this.raf = 0;
    this.schedule = this.schedule.bind(this);
  }

  start() {
    for (const event of ['resize', 'orientationchange']) addEventListener(event, this.schedule, {passive: true});
    window.visualViewport?.addEventListener('resize', this.schedule, {passive: true});
    document.addEventListener('fullscreenchange', this.schedule);
    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(this.container, {childList: true, subtree: true});
    this.schedule();
    return this;
  }

  setNativeSize(width, height) {
    if (width > 0 && height > 0) [this.nativeWidth, this.nativeHeight] = [width, height];
    this.schedule();
  }

  schedule() {
    clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    // The timeout waits out Android's stale portrait metrics; rAF waits for the resulting layout.
    this.timer = setTimeout(() => { this.raf = requestAnimationFrame(() => this.fit()); }, this.debounceMs);
  }

  fit() {
    const canvas = this.container?.querySelector('canvas');
    const dom = identifyEmulatorDom(this.container, canvas);
    if (!dom || !this.shell) return;
    const viewport = readViewportSize();
    const fullscreen = document.fullscreenElement === this.shell;
    if (fullscreen) {
      this.shell.style.setProperty('--emulator-viewport-width', `${viewport.width}px`);
      this.shell.style.setProperty('--emulator-viewport-height', `${viewport.height}px`);
    }

    this.container.dataset.emulatorRoot = 'true';
    for (const wrapper of dom.wrappers) wrapper.dataset.emulatorWrapper = 'true';
    dom.stage.dataset.emulatorStage = 'true';

    const bounds = this.container.getBoundingClientRect();
    const nativeWidth = this.nativeWidth || canvas.width;
    const nativeHeight = this.nativeHeight || canvas.height;
    const fitted = fitEmulatorViewport({availableWidth: bounds.width, availableHeight: bounds.height, nativeWidth, nativeHeight});
    dom.stage.style.setProperty('--emulator-visual-width', `${fitted.width}px`);
    dom.stage.style.setProperty('--emulator-visual-height', `${fitted.height}px`);
    canvas.dataset.viewportFitted = 'true';
    this.renderDebug({viewport, canvas, stage: dom.stage, fitted, nativeWidth, nativeHeight});
  }

  renderDebug({viewport, canvas, stage, fitted, nativeWidth, nativeHeight}) {
    if (!this.debug) return;
    let output = this.shell.querySelector('[data-emulator-debug]');
    if (!output) {
      output = document.createElement('pre');
      output.dataset.emulatorDebug = 'true';
      this.shell.append(output);
    }
    const shellRect = this.shell.getBoundingClientRect(), rootRect = this.container.getBoundingClientRect(), gameRect = stage.getBoundingClientRect();
    const css = getComputedStyle(canvas);
    output.textContent = `viewport: ${viewport.width} x ${viewport.height}\nfullscreen element: ${document.fullscreenElement?.id || 'none'}\nshell: ${shellRect.width} x ${shellRect.height}\nEmulatorJS wrapper: ${rootRect.width} x ${rootRect.height}\ncanvas CSS: ${css.width} x ${css.height}\ncanvas internal: ${canvas.width} x ${canvas.height}\ngame boundingRect: ${gameRect.x}/${gameRect.y}/${gameRect.width}/${gameRect.height}\nfit: ${fitted.width} x ${fitted.height} (${nativeWidth}:${nativeHeight})`;
  }

  destroy() {
    clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    for (const event of ['resize', 'orientationchange']) removeEventListener(event, this.schedule);
    window.visualViewport?.removeEventListener('resize', this.schedule);
    document.removeEventListener('fullscreenchange', this.schedule);
  }
}
