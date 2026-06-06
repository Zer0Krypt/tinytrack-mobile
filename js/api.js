;(function () {
  'use strict'

  async function request(method, path, body) {
    const url = path
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const opts = { method, headers: { 'Content-Type': 'application/json' }, signal: controller.signal }
    if (body !== undefined) opts.body = JSON.stringify(body)
    let res
    try {
      res = await fetch(url, opts)
    } finally {
      clearTimeout(timer)
    }
    if (res.status === 204) return null
    if (!res.ok) {
      let msg = res.statusText
      try { const e = await res.json(); msg = e.error || msg } catch (_) {}
      throw new Error(msg)
    }
    return res.json()
  }

  const ApiClient = {
    getBabies:        ()         => request('GET',   '/api/babies'),
    createBaby:       (body)     => request('POST',  '/api/babies', body),
    getActivities:    (params)   => {
      const qs = params ? new URLSearchParams(params).toString() : ''
      return request('GET', `/api/activities${qs ? '?' + qs : ''}`)
    },
    createActivity:   (body)     => request('POST',  '/api/activities', body),
    getSettings:      ()         => request('GET',   '/api/settings'),
    updateSettings:   (body)     => request('PUT',   '/api/settings', body),
    getDevices:       ()         => request('GET',   '/api/devices'),
    registerDevice:   (body)     => request('POST',  '/api/devices', body),
    updateDeviceName: (id, body) => request('PATCH', `/api/devices/${id}`, body),
  }

  if (typeof module !== 'undefined') module.exports = ApiClient
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.ApiClient = ApiClient }
})()
