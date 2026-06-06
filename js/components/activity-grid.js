;(function () {
  'use strict'

  const HIGH_FREQ = ['sleep', 'feed', 'diaper']

  function reorderForLeft(types) {
    const typeMap = Object.fromEntries(types.map(t => [t.id, t]))
    const hf = HIGH_FREQ.map(id => typeMap[id]).filter(Boolean)
    const rest = types.filter(t => !HIGH_FREQ.includes(t.id))
    return [...hf, ...rest]
  }

  function render(activityTypes, handedness) {
    const ordered = handedness === 'left' ? reorderForLeft(activityTypes) : activityTypes
    const buttons = ordered.map(t => `
      <button class="activity-btn" data-type="${t.id}">
        <span class="activity-btn-icon">${t.icon}</span>
        <span class="activity-btn-label">${t.label}</span>
      </button>
    `).join('')
    return `<div class="activity-grid">${buttons}</div>`
  }

  const ActivityGrid = { render, reorderForLeft }

  if (typeof module !== 'undefined') module.exports = ActivityGrid
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.ActivityGrid = ActivityGrid }
})()
