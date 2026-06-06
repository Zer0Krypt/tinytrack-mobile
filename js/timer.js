;(function () {
  'use strict'

  let _state = null  // null | { type, babyId, startedAt }

  function start(type, babyId) {
    if (_state) return false
    _state = { type, babyId, startedAt: new Date().toISOString() }
    return true
  }

  function stop() {
    if (!_state) return null
    const result = {
      type: _state.type,
      babyId: _state.babyId,
      started_at: _state.startedAt,
      ended_at: new Date().toISOString(),
    }
    _state = null
    return result
  }

  function isRunning() { return _state !== null }

  function getState() { return _state ? { ..._state } : null }

  function reset() { _state = null }

  function formatElapsed(startedAt) {
    const ms = Date.now() - new Date(startedAt).getTime()
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  function bannerHtml(state, handedness) {
    if (!state) return ''
    const elapsed = formatElapsed(state.startedAt)
    const label = state.type.replace(/_/g, ' ')
    const stopClass = handedness === 'left' ? ' left' : ''
    return `<span class="timer-text">${label} started ${elapsed} ago · Tap to stop</span><button class="timer-stop-btn${stopClass}" data-action="stop-timer">Stop</button>`
  }

  const Timer = { start, stop, isRunning, getState, reset, formatElapsed, bannerHtml }

  if (typeof module !== 'undefined') module.exports = Timer
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.Timer = Timer }
})()
