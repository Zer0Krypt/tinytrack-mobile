const CACHE_NAME = 'tinytrack-v5'
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

// The local Electron server URL, e.g. "http://192.168.1.100:3000".
// Persisted in the SW cache so it survives worker restarts.
let _serverUrl = ''

async function getServerUrl() {
  if (_serverUrl) return _serverUrl
  try {
    const cached = await caches.match('/__sw-config')
    if (cached) _serverUrl = (await cached.json()).serverUrl || ''
  } catch (_) {}
  return _serverUrl
}

async function setServerUrl(url) {
  _serverUrl = url
  const cache = await caches.open(CACHE_NAME)
  await cache.put('/__sw-config', new Response(JSON.stringify({ serverUrl: url }), {
    headers: { 'Content-Type': 'application/json' },
  }))
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_SERVER_URL') setServerUrl(event.data.url)
})

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => null))
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
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'SW_READY' }))
        })
      })
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Navigation: cache-first, background refresh
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = await caches.match('/')
      if (cached) {
        fetch(e.request.url).then(r => {
          if (r?.ok) caches.open(CACHE_NAME).then(c => c.put('/', r))
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

  // API requests: proxy to local Electron server via stored server URL.
  // Service workers can fetch HTTP URLs even when the SW origin is HTTPS.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith((async () => {
      const serverUrl = await getServerUrl()
      if (!serverUrl) {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const target = serverUrl.replace(/\/$/, '') + url.pathname + url.search
      try {
        const body = ['GET', 'HEAD'].includes(e.request.method)
          ? undefined
          : await e.request.clone().arrayBuffer()
        const response = await fetch(target, {
          method: e.request.method,
          headers: e.request.headers,
          body,
        })
        return response
      } catch (_) {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    })())
    return
  }

  // Static assets: cache-first, opportunistic update
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response?.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return response
      })
    })
  )
})
