;(function () {
  'use strict'

  function createDB(idb) {
    const _idb = idb || (typeof indexedDB !== 'undefined' ? indexedDB : null)
    let _conn = null

    function open() {
      if (_conn) return Promise.resolve(_conn)
      return new Promise((resolve, reject) => {
        const req = _idb.open('tinytrack', 2)
        req.onupgradeneeded = (e) => {
          const db = e.target.result
          if (!db.objectStoreNames.contains('activities')) {
            db.createObjectStore('activities', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta')
          }
          if (!db.objectStoreNames.contains('babies')) {
            db.createObjectStore('babies', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings')
          }
        }
        req.onsuccess = () => {
          _conn = req.result
          _conn.onversionchange = () => { _conn.close(); _conn = null }
          resolve(_conn)
        }
        req.onerror = () => reject(req.error)
      })
    }

    function storePut(storeName, value, key) {
      return open().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
        const req = key !== undefined
          ? tx.objectStore(storeName).put(value, key)
          : tx.objectStore(storeName).put(value)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }))
    }

    function storeGetAll(storeName) {
      return open().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
        const req = tx.objectStore(storeName).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }))
    }

    function storeGet(storeName, key) {
      return open().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
        const req = tx.objectStore(storeName).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }))
    }

    function storeDelete(storeName, key) {
      return open().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
        const req = tx.objectStore(storeName).delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      }))
    }

    async function saveActivity(activity) {
      await storePut('activities', { ...activity, synced: activity.synced !== false })
    }

    async function getActivities(babyId) {
      const all = await storeGetAll('activities')
      return babyId ? all.filter(a => a.baby_id === babyId) : all
    }

    async function getPendingActivities() {
      const all = await storeGetAll('activities')
      return all.filter(a => !a.synced)
    }

    async function markSynced(id) {
      const activity = await storeGet('activities', id)
      if (activity) await storePut('activities', { ...activity, synced: true })
    }

    async function deleteActivity(id) {
      await storeDelete('activities', id)
    }

    async function getLastSyncedAt() {
      return storeGet('meta', 'lastSyncedAt')
    }

    async function setLastSyncedAt(ts) {
      await storePut('meta', ts, 'lastSyncedAt')
    }

    async function saveBaby(baby) {
      await storePut('babies', baby)
    }

    async function getBabies() {
      return storeGetAll('babies')
    }

    async function saveSettings(settings) {
      await storePut('settings', settings, 'current')
    }

    async function getSettings() {
      return storeGet('settings', 'current')
    }

    return {
      saveActivity, getActivities, getPendingActivities, markSynced, deleteActivity,
      getLastSyncedAt, setLastSyncedAt,
      saveBaby, getBabies, saveSettings, getSettings,
    }
  }

  if (typeof module !== 'undefined') module.exports = { createDB }
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.DB = createDB() }
})()
