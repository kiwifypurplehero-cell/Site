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

/**
 * Fits only the canvas' CSS presentation size. The backing framebuffer is never resized.
 * One debounced listener handles resize, rotation and fullscreen; no ResizeObserver is used.
 */
export class EmulatorViewportManager {
  constructor({shell, container, nativeWidth, nativeHeight, debounceMs = DEFAULT_DEBOUNCE_MS}) {
    this.shell = shell;
    this.container = container;
    this.nativeWidth = nativeWidth;
    this.nativeHeight = nativeHeight;
    this.debounceMs = debounceMs;
    this.timer = 0;
    this.schedule = this.schedule.bind(this);
  }

  start() {
    for (const event of ['resize', 'orientationchange']) addEventListener(event, this.schedule, {passive: true});
    document.addEventListener('fullscreenchange', this.schedule);
    this.schedule();
    return this;
  }

  setNativeSize(width, height) {
    if (width > 0 && height > 0) [this.nativeWidth, this.nativeHeight] = [width, height];
    this.schedule();
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fit(), this.debounceMs);
  }

  fit() {
    const canvas = this.container?.querySelector('canvas');
    if (!canvas || !this.shell) return;
    const bounds = this.container.getBoundingClientRect();
    const nativeWidth = this.nativeWidth || canvas.width;
    const nativeHeight = this.nativeHeight || canvas.height;
    const fitted = fitEmulatorViewport({availableWidth: bounds.width, availableHeight: bounds.height, nativeWidth, nativeHeight});
    canvas.style.setProperty('width', `${fitted.width}px`, 'important');
    canvas.style.setProperty('height', `${fitted.height}px`, 'important');
    canvas.style.setProperty('max-width', '100%', 'important');
    canvas.style.setProperty('max-height', '100%', 'important');
    canvas.style.objectFit = 'contain';
    canvas.dataset.viewportFitted = 'true';
  }

  destroy() {
    clearTimeout(this.timer);
    for (const event of ['resize', 'orientationchange']) removeEventListener(event, this.schedule);
    document.removeEventListener('fullscreenchange', this.schedule);
  }
}
