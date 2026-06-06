const CACHE_NAME = 'tinytrack-v4'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/components.css',
  '/js/constants.js',
  '/js/api.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/timer.js',
  '/js/router.js',
  '/js/components/activity-grid.js',
  '/js/components/bottom-sheet.js',
  '/js/components/charts.js',
  '/js/views/log.js',
  '/js/views/history.js',
  '/js/views/insights.js',
  '/js/views/settings.js',
  '/js/app.js',
  '/vendor/chartjs/chart.umd.js',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each asset individually so one failure doesn't abort the whole install
      await Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => null)
        )
      )
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all open tabs that the app is ready for offline use
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'SW_READY' }))
        })
      })
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Navigation requests: serve app shell from cache so the app loads
  // even when the home server is unreachable (off local network).
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = await caches.match('/')
      if (cached) {
        // Serve from SW cache immediately, but also fire a real network request
        // so iOS's HTTP disk cache stays populated. On iOS cold launch the SW
        // may not intercept the first navigation; the HTTP disk cache is the
        // only fallback, and it is only populated by actual network responses.
        fetch(e.request.url).then(r => {
          if (r && r.ok) caches.open(CACHE_NAME).then(c => c.put('/', r))
        }).catch(() => null)
        return cached
      }
      try {
        const response = await fetch(e.request)
        if (response.ok) caches.open(CACHE_NAME).then(c => c.put('/', response.clone()))
        return response
      } catch (_) {}
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TinyTrack</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>TinyTrack</h2><p>Open the app while connected to your home network once to enable offline mode.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    })())
    return
  }

  // API requests: network-only; return a structured offline error when unreachable.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    )
    return
  }

  // Static assets: cache-first, opportunistically update cache on network hit.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return response
      })
    })
  )
})
