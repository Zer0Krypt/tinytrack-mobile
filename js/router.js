;(function () {
  'use strict'

  const _handlers = {}
  const _navCallbacks = []

  function register(tab, handler) {
    _handlers[tab] = handler
  }

  function navigate(tab) {
    document.querySelectorAll('.nav-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab)
    })
    const contentEl = document.getElementById('tab-content')
    if (_handlers[tab] && contentEl) {
      const html = _handlers[tab]()
      if (html !== undefined) contentEl.innerHTML = html
    }
    _navCallbacks.forEach(cb => cb(tab))
  }

  function onNavigate(cb) {
    _navCallbacks.push(cb)
  }

  const Router = { register, navigate, onNavigate }

  if (typeof module !== 'undefined') module.exports = Router
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.Router = Router }
})()
