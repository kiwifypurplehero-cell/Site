(() => {
  const root = document.documentElement;
  let scheduled = false;

  const viewportWidth = () => Math.round(window.visualViewport?.width || window.innerWidth || root.clientWidth);
  const applyLayout = () => {
    scheduled = false;
    const width = viewportWidth();
    const layout = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    root.dataset.layout = layout;
    root.dataset.orientation = matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
    root.style.setProperty('--viewport-width', `${width}px`);
  };
  const scheduleLayout = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(applyLayout); }
  };

  applyLayout();
  addEventListener('resize', scheduleLayout, { passive: true });
  addEventListener('orientationchange', scheduleLayout, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleLayout, { passive: true });
})();
