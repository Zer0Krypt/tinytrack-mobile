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

  function render(settings, babies, activeBabyId, syncStatus, lastSyncedAt) {
    const serverUrl = localStorage.getItem('tinytrack-server-url') || ''
    const babySwitcher = babies && babies.length > 1
      ? `<div class="settings-section">
           <div class="settings-section-title">Active Baby</div>
           <select class="form-select" id="baby-switcher-settings">
             ${babies.map(b => `<option value="${escapeHTML(b.id)}" ${b.id === activeBabyId ? 'selected' : ''}>${escapeHTML(b.name)}</option>`).join('')}
           </select>
         </div>`
      : ''

    const h = settings.handedness || 'right'
    const lastSyncText = lastSyncedAt
      ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
      : 'Never synced'

    return `
      <div class="settings-view">
        <div class="settings-title">Settings</div>
        ${babySwitcher}
        <div class="settings-section">
          <div class="settings-section-title">Units</div>
          <select class="form-select" id="unit-pref">
            <option value="imperial" ${(settings.unitPreference || 'imperial') === 'imperial' ? 'selected' : ''}>Imperial</option>
            <option value="metric"   ${(settings.unitPreference || 'imperial') === 'metric'   ? 'selected' : ''}>Metric</option>
          </select>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Dominant Hand</div>
          <div class="hand-toggle">
            <button class="hand-btn ${h === 'right' ? 'active' : ''}" data-hand="right">Right ✋</button>
            <button class="hand-btn ${h === 'left'  ? 'active' : ''}" data-hand="left">Left 🤚</button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Device Name</div>
          <input class="form-input" type="text" id="device-name" value="${escapeHTML(settings.deviceName || 'My Phone')}">
          <button class="btn btn-secondary btn-sm" id="save-device-name-btn" style="margin-top:8px">Save Name</button>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Sync Status</div>
          <div class="sync-status-row">
            <span>${escapeHTML(syncStatus || 'offline')}</span>
            <span>${lastSyncText}</span>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Home Server</div>
          <input class="form-input" type="url" id="server-url-input"
            placeholder="https://192.168.x.x:3000"
            value="${escapeHTML(serverUrl)}"
            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
          <button class="btn btn-secondary btn-sm" id="save-server-url-btn" style="margin-top:8px">Save</button>
          <p style="color:var(--text-muted);font-size:12px;margin-top:6px">Your home PC's address — shown in the TinyTrack desktop app tray menu.</p>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Install App</div>
          <button class="btn btn-secondary" id="install-pwa-btn" style="display:none">Add to Home Screen</button>
          <p style="color:var(--text-muted);font-size:13px" id="install-pwa-hint">Open in Safari/Chrome and use "Add to Home Screen" to install.</p>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">Offline Mode</div>
          <div id="offline-diagnostics" style="font-size:13px;color:var(--text-muted)">Checking…</div>
        </div>
      </div>
    `
  }

  const SettingsView = { render }

  if (typeof module !== 'undefined') module.exports = SettingsView
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.SettingsView = SettingsView }
})()
