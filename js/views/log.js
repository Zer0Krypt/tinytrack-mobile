;(function () {
  'use strict'

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function render(babies, activeBaby) {
    const babySection = babies && babies.length > 1
      ? `<select class="baby-switcher" id="baby-switcher">
           ${babies.map(b => `<option value="${escapeHTML(b.id)}" ${b.id === activeBaby?.id ? 'selected' : ''}>${escapeHTML(b.name)}</option>`).join('')}
         </select>`
      : `<div class="active-baby-name">${escapeHTML(activeBaby?.name || '')}</div>`

    return `
      <div class="log-view">
        <div class="log-header">
          <div class="log-title">Log Activity</div>
          ${babySection}
        </div>
        <div id="activity-grid-container"></div>
      </div>
    `
  }

  const LogView = { render }

  if (typeof module !== 'undefined') module.exports = LogView
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.LogView = LogView }
})()
