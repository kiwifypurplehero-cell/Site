const enabled = new URLSearchParams(location.search).has('debug') || localStorage.getItem('plumpgames-debug') === 'true';
if (enabled) {
  const metrics = window.__PLUMPGAMES_METRICS__ ||= {};
  const navigation = performance.getEntriesByType('navigation')[0];
  metrics.initialRequests = performance.getEntriesByType('resource').length;
  metrics.initialJsBytes = performance.getEntriesByType('resource').filter(item => /\.js(?:\?|$)/.test(item.name)).reduce((sum,item)=>sum+(item.transferSize||0),0);
  metrics.domReadyMs = Math.round(navigation?.domContentLoadedEventEnd || 0);
  document.addEventListener('plumpgames:critical-ready',()=>{metrics.homeUsableMs=Math.round(performance.now());console.debug('[performance] Home utilizável',metrics);},{once:true});
  document.addEventListener('plumpgames:loader-complete',()=>console.debug('[performance] Loading finalizado',metrics),{once:true});
  try {
    new PerformanceObserver(list=>{for(const entry of list.getEntries())metrics.lcpMs=Math.round(entry.startTime);}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{metrics.longTasks=(metrics.longTasks||0)+list.getEntries().length;}).observe({type:'longtask',buffered:true});
  } catch (error) { console.debug('[performance] métricas avançadas indisponíveis',error); }
}
