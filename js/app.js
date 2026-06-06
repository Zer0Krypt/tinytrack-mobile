;(function () {
  'use strict'

  let db
  let _installPrompt = null

  const state = {
    babies: [],
    activeBaby: null,
    activities: [],
    settings: { unitPreference: 'imperial', handedness: 'right', deviceName: 'My Phone' },
    syncing: false,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _installPrompt = e
  })

  async function init() {
    db = TinyTrack.DB

    // Persist server URL from first-open QR code link (?server=https://192.168.x.x:3000)
    const urlParams = new URLSearchParams(window.location.search)
    const serverParam = urlParams.get('server')
    if (serverParam) {
      const cleaned = serverParam.replace(/\/$/, '')
      localStorage.setItem('tinytrack-server-url', cleaned)
    }

    // Register service worker (requires HTTPS — works when served from CDN)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null)

      if (window.navigator.standalone === true && !localStorage.getItem('tinytrack-offline-ready')) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_READY') {
            showOfflineReadyToast()
            localStorage.setItem('tinytrack-offline-ready', '1')
          }
        })
      }
    }

    // Load from IndexedDB first — works fully offline
    const [localBabies, localSettings] = await Promise.all([
      db.getBabies().catch(() => []),
      db.getSettings().catch(() => null),
    ])
    if (localBabies.length) state.babies = localBabies
    if (localSettings) state.settings = { ...state.settings, ...localSettings }

    // Update from server when reachable, then persist locally for next offline launch
    if (state.online) {
      try {
        const [settings, babies] = await Promise.all([
          TinyTrack.ApiClient.getSettings(),
          TinyTrack.ApiClient.getBabies(),
        ])
        state.settings = { ...state.settings, ...settings }
        state.babies = babies
        await db.saveSettings(settings)
        await Promise.all(babies.map(b => db.saveBaby(b)))
      } catch (_) {
        state.online = false
      }
    }

    state.activeBaby = state.babies[0] || null

    // Load activities from local DB
    state.activities = state.activeBaby
      ? await db.getActivities(state.activeBaby.id)
      : []

    // Device registration
    let deviceId = localStorage.getItem('tinytrack-device-id')
    if (!deviceId) {
      deviceId = 'mob-' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('tinytrack-device-id', deviceId)
    }
    const deviceName = localStorage.getItem('tinytrack-device-name') || 'My Phone'
    state.settings.deviceId = deviceId
    state.settings.deviceName = deviceName

    if (state.online) {
      try {
        await TinyTrack.ApiClient.registerDevice({ id: deviceId, name: deviceName })
      } catch (_) {}
    }

    // Sync on startup if online
    if (state.online && state.activeBaby) await runSync()

    setupNav()
    setupConnectivity()
    setupBottomNav()

    TinyTrack.Router.navigate('log')
    applyHandedness()
  }

  function showOfflineReadyToast() {
    const toast = document.createElement('div')
    toast.textContent = 'App ready for offline use'
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#323232;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;z-index:9999;pointer-events:none'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3500)
  }

  function applyHandedness() {
    const h = state.settings.handedness || 'right'
    const indicator = document.getElementById('connectivity-indicator')
    if (indicator) {
      if (h === 'left') {
        indicator.style.left = '12px'
        indicator.style.right = 'auto'
      } else {
        indicator.style.left = 'auto'
        indicator.style.right = '12px'
      }
    }
    const nav = document.getElementById('bottom-nav')
    if (nav && h === 'left') {
      const logTab = nav.querySelector('[data-tab="log"]')
      if (logTab && logTab !== nav.firstElementChild) nav.prepend(logTab)
    }
  }

  function setupBottomNav() {
    document.getElementById('bottom-nav').addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab')?.dataset.tab
      if (tab) TinyTrack.Router.navigate(tab)
    })

    document.getElementById('timer-banner').addEventListener('click', (e) => {
      if (e.target.closest('[data-action="stop-timer"]')) stopTimer()
    })
  }

  function setupNav() {
    const { Router, LogView, HistoryView, InsightsView, SettingsView, ActivityGrid, Constants, Sync } = TinyTrack

    Router.register('log', () => LogView.render(state.babies, state.activeBaby))
    Router.register('history', () => HistoryView.render(state.activities, state.syncing))
    Router.register('insights', () => InsightsView.render())
    Router.register('settings', () => SettingsView.render(
      state.settings,
      state.babies,
      state.activeBaby?.id,
      Sync.getStatus(state.online, 0, state.syncing),
      null
    ))

    Router.onNavigate(async (tab) => {
      if (tab === 'log') {
        const gc = document.getElementById('activity-grid-container')
        if (gc) {
          gc.innerHTML = ActivityGrid.render(Constants.ACTIVITY_TYPES, state.settings.handedness || 'right')
          gc.addEventListener('click', (e) => {
            const btn = e.target.closest('.activity-btn')
            if (btn) openSheet(btn.dataset.type)
          })
        }
        const switcher = document.getElementById('baby-switcher')
        if (switcher) {
          switcher.addEventListener('change', async () => {
            state.activeBaby = state.babies.find(b => b.id === switcher.value) || state.activeBaby
            state.activities = await db.getActivities(state.activeBaby.id)
            Router.navigate('log')
          })
        }
      }

      if (tab === 'history') {
        const syncBtn = document.getElementById('sync-btn')
        if (syncBtn) syncBtn.addEventListener('click', runSync)
      }

      if (tab === 'insights') {
        setTimeout(() => {
          if (typeof Chart !== 'undefined' && TinyTrack.Charts) {
            InsightsView.drawCharts(state.activities, 7, TinyTrack.Charts)
          }
        }, 50)
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            if (typeof Chart !== 'undefined' && TinyTrack.Charts) {
              InsightsView.drawCharts(state.activities, parseInt(btn.dataset.days), TinyTrack.Charts)
            }
          })
        })
      }

      if (tab === 'settings') setupSettingsHandlers()
    })
  }

  function openSheet(type) {
    const { Constants, BottomSheet, Timer } = TinyTrack
    const isDuration = Constants.DURATION_BASED_TYPES.includes(type)
    const handedness = state.settings.handedness || 'right'

    // If timer running for this type, stop it
    if (isDuration && Timer.isRunning() && Timer.getState()?.type === type) {
      stopTimer()
      return
    }

    const container = document.getElementById('sheet-container')
    container.innerHTML = BottomSheet.render(type, Constants.ACTIVITY_TYPES, Constants.ACTIVITY_FIELDS, isDuration, handedness)
    container.classList.remove('hidden')
    container.classList.add('sheet-container')

    // Add "Start timer" button for duration-based types when no timer is running
    if (isDuration && !Timer.isRunning()) {
      const body = container.querySelector('.bottom-sheet-body')
      if (body) {
        const timerBtn = document.createElement('button')
        timerBtn.className = 'btn btn-secondary btn-sm'
        timerBtn.style.marginBottom = '12px'
        timerBtn.textContent = 'Start timer instead'
        timerBtn.addEventListener('click', () => {
          closeSheet()
          startTimer(type)
        })
        body.prepend(timerBtn)
      }
    }

    const sheetHandler = async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action
      if (!action) return
      container.removeEventListener('click', sheetHandler)
      if (action === 'close-sheet') { closeSheet(); return }
      if (action === 'save-activity') await saveActivity(type, isDuration)
    }
    container.addEventListener('click', sheetHandler)
  }

  function closeSheet() {
    const container = document.getElementById('sheet-container')
    container.innerHTML = ''
    container.classList.add('hidden')
  }

  function startTimer(type) {
    TinyTrack.Timer.start(type, state.activeBaby?.id)
    const banner = document.getElementById('timer-banner')
    banner.classList.remove('hidden')
    banner.innerHTML = TinyTrack.Timer.bannerHtml(TinyTrack.Timer.getState(), state.settings.handedness || 'right')
    document.getElementById('tab-content').classList.add('has-banner')

    banner._interval = setInterval(() => {
      if (!TinyTrack.Timer.isRunning()) { clearInterval(banner._interval); return }
      banner.innerHTML = TinyTrack.Timer.bannerHtml(TinyTrack.Timer.getState(), state.settings.handedness || 'right')
    }, 10000)
  }

  function stopTimer() {
    const result = TinyTrack.Timer.stop()
    if (!result) return
    const banner = document.getElementById('timer-banner')
    clearInterval(banner._interval)
    banner.innerHTML = ''
    banner.classList.add('hidden')
    document.getElementById('tab-content').classList.remove('has-banner')

    const activity = {
      id: 'mob-' + Math.random().toString(36).slice(2, 10),
      baby_id: state.activeBaby?.id,
      type: result.type,
      started_at: result.started_at,
      ended_at: result.ended_at,
      synced: false,
    }
    saveActivityDirect(activity)
  }

  async function saveActivity(type, isDuration) {
    const { BottomSheet, Constants } = TinyTrack
    const container = document.getElementById('sheet-container')
    const startedAtEl = container.querySelector('#bs-started-at')
    const endedAtEl   = container.querySelector('#bs-ended-at')
    const notesEl     = container.querySelector('[name="notes"]')

    const started_at = startedAtEl?.value ? new Date(startedAtEl.value).toISOString() : new Date().toISOString()
    const ended_at   = isDuration && endedAtEl?.value ? new Date(endedAtEl.value).toISOString() : null
    const notes      = notesEl?.value.trim() || null

    const formData = {}
    container.querySelectorAll('[name]').forEach(el => {
      if (!['started_at', 'ended_at', 'notes'].includes(el.name)) formData[el.name] = el.value
    })
    const metadata = BottomSheet.buildMetadata(type, formData, Constants.ACTIVITY_FIELDS)

    const activity = {
      id: 'mob-' + Math.random().toString(36).slice(2, 10),
      baby_id: state.activeBaby?.id,
      type,
      started_at,
      ended_at,
      notes,
      metadata,
      synced: false,
    }

    closeSheet()
    await saveActivityDirect(activity)
    TinyTrack.Router.navigate('log')
  }

  async function saveActivityDirect(activity) {
    await db.saveActivity({ ...activity, synced: false })
    state.activities = await db.getActivities(state.activeBaby?.id)
    if (state.online) {
      try {
        await TinyTrack.ApiClient.createActivity(activity)
        await db.markSynced(activity.id)
        state.activities = await db.getActivities(state.activeBaby?.id)
      } catch (_) {}
    }
    await updateConnectivityIndicator()
  }

  async function runSync() {
    if (!state.activeBaby || state.syncing) return
    state.syncing = true
    await updateConnectivityIndicator()
    try {
      await TinyTrack.Sync.sync(TinyTrack.ApiClient, db, state.activeBaby.id)
      state.activities = await db.getActivities(state.activeBaby.id)
    } finally {
      state.syncing = false
      await updateConnectivityIndicator()
    }
  }

  async function updateConnectivityIndicator() {
    const pending = await db.getPendingActivities()
    const status = TinyTrack.Sync.getStatus(state.online, pending.length, state.syncing)
    const el = document.getElementById('connectivity-indicator')
    if (el) {
      el.className = `conn-indicator ${status}`
      el.title = TinyTrack.Sync.pendingLabel(pending.length) || status
    }
  }

  function setupConnectivity() {
    window.addEventListener('online', async () => {
      state.online = true
      // Re-fetch babies/settings in case anything changed while offline
      try {
        const [settings, babies] = await Promise.all([
          TinyTrack.ApiClient.getSettings(),
          TinyTrack.ApiClient.getBabies(),
        ])
        state.settings = { ...state.settings, ...settings }
        state.babies = babies
        if (!state.activeBaby && babies.length) state.activeBaby = babies[0]
        await db.saveSettings(settings)
        await Promise.all(babies.map(b => db.saveBaby(b)))
      } catch (_) {
        state.online = false
      }
      if (state.online && state.activeBaby) await runSync()
      else await updateConnectivityIndicator()
    })
    window.addEventListener('offline', () => {
      state.online = false
      updateConnectivityIndicator()
    })
    updateConnectivityIndicator()
  }

  function populateOfflineDiagnostics() {
    const el = document.getElementById('offline-diagnostics')
    if (!el) return

    const isStandalone = window.navigator.standalone === true
    const modeLabel = isStandalone
      ? '✅ Installed as home screen app'
      : '⚠️ Open from your home screen icon for offline access'
    const offlineReady = localStorage.getItem('tinytrack-offline-ready')
      ? '✅ Ready for offline use'
      : '⏳ Open once from home screen while on WiFi to enable offline'

    el.innerHTML = [modeLabel, offlineReady]
      .map(line => `<div style="margin-bottom:6px">${line}</div>`)
      .join('')
  }

  function setupSettingsHandlers() {
    populateOfflineDiagnostics()
    const unitPref = document.getElementById('unit-pref')
    if (unitPref) {
      unitPref.addEventListener('change', async () => {
        state.settings.unitPreference = unitPref.value
        try { await TinyTrack.ApiClient.updateSettings({ unitPreference: unitPref.value }) } catch (_) {}
      })
    }

    document.querySelectorAll('.hand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hand-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        state.settings.handedness = btn.dataset.hand
        applyHandedness()
      })
    })

    const deviceNameInput = document.getElementById('device-name')
    const saveNameBtn = document.getElementById('save-device-name-btn')
    if (saveNameBtn && deviceNameInput) {
      saveNameBtn.addEventListener('click', async () => {
        const name = deviceNameInput.value.trim() || 'My Phone'
        state.settings.deviceName = name
        localStorage.setItem('tinytrack-device-name', name)
        try { await TinyTrack.ApiClient.updateDeviceName(state.settings.deviceId, { name }) } catch (_) {}
      })
    }

    const babySwitcher = document.getElementById('baby-switcher-settings')
    if (babySwitcher) {
      babySwitcher.addEventListener('change', async () => {
        state.activeBaby = state.babies.find(b => b.id === babySwitcher.value) || state.activeBaby
        state.activities = await db.getActivities(state.activeBaby.id)
        TinyTrack.Router.navigate('settings')
      })
    }

    const serverUrlInput = document.getElementById('server-url-input')
    const saveServerUrlBtn = document.getElementById('save-server-url-btn')
    if (saveServerUrlBtn && serverUrlInput) {
      saveServerUrlBtn.addEventListener('click', () => {
        let url = serverUrlInput.value.trim().replace(/\/$/, '')
        if (url && !url.startsWith('http')) url = 'https://' + url
        localStorage.setItem('tinytrack-server-url', url)
        serverUrlInput.value = url
        // Re-check connectivity with the new server URL
        state.online = navigator.onLine
        if (state.online && state.activeBaby) runSync()
        else updateConnectivityIndicator()
      })
    }

    const installBtn = document.getElementById('install-pwa-btn')
    if (installBtn) {
      if (_installPrompt) installBtn.style.display = 'block'
      installBtn.addEventListener('click', () => { if (_installPrompt) _installPrompt.prompt() })
    }
  }

  document.addEventListener('DOMContentLoaded', init)
})()
