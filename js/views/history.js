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

  function formatTime(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  function activityLabel(activity) {
    const s = activity.type.replace(/_/g, ' ')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  function render(activities, syncing) {
    const header = `
      <div class="history-header">
        <div class="history-title">History</div>
        <button class="sync-btn${syncing ? ' spinning' : ''}" id="sync-btn" title="Sync now">↻</button>
      </div>
    `
    if (!activities || activities.length === 0) {
      return `<div class="history-view">${header}<div class="empty-state"><p>No activities yet — but hey, you've got a brand new baby. You're doing great. 🌟</p></div></div>`
    }
    const items = activities.map(a => `
      <div class="history-item${a.synced === false ? ' pending-sync' : ''}">
        <div class="history-item-type">${escapeHTML(activityLabel(a))}</div>
        <div class="history-item-time">${formatTime(a.started_at)}</div>
        ${a.notes ? `<div class="history-item-notes">${escapeHTML(a.notes)}</div>` : ''}
        ${a.synced === false ? '<span class="sync-dot" title="Pending sync">●</span>' : ''}
      </div>
    `).join('')
    return `<div class="history-view">${header}<div class="history-list">${items}</div></div>`
  }

  const HistoryView = { render, formatTime, activityLabel }

  if (typeof module !== 'undefined') module.exports = HistoryView
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.HistoryView = HistoryView }
})()
