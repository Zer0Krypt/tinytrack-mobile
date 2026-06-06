;(function () {
  'use strict'

  function getStatus(online, pendingCount, syncing) {
    if (syncing) return 'syncing'
    if (!online) return pendingCount > 0 ? 'pending' : 'offline'
    return 'connected'
  }

  function pendingLabel(count) {
    return count === 0 ? null : `${count} unsynced`
  }

  async function sync(api, db, babyId) {
    const pending = await db.getPendingActivities()
    for (const activity of pending) {
      try {
        await api.createActivity(activity)
        await db.markSynced(activity.id)
      } catch (_) { /* skip this item, retry next time */ }
    }
    const lastSyncedAt = await db.getLastSyncedAt()
    const since = lastSyncedAt || new Date(0).toISOString()
    let newActivities = []
    try {
      newActivities = await api.getActivities({ baby_id: babyId, since })
    } catch (_) { return }
    for (const a of newActivities) {
      await db.saveActivity({ ...a, synced: true })
    }
    await db.setLastSyncedAt(new Date().toISOString())
  }

  const Sync = { getStatus, pendingLabel, sync }

  if (typeof module !== 'undefined') module.exports = Sync
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.Sync = Sync }
})()
