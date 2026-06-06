;(function () {
  'use strict'

  function parseMeta(activity) {
    if (!activity.metadata) return {}
    if (typeof activity.metadata === 'object') return activity.metadata
    try { return JSON.parse(activity.metadata) } catch (_) { return {} }
  }

  function activitiesForDay(activities, dateStr) {
    return activities.filter(a => a.started_at.startsWith(dateStr))
  }

  function dailySleepData(activities, dateStr) {
    const sleeps = activitiesForDay(activities, dateStr).filter(a => a.type === 'sleep' && a.ended_at)
    const totalMinutes = sleeps.reduce((sum, a) => {
      return sum + (new Date(a.ended_at) - new Date(a.started_at)) / 60000
    }, 0)
    return { totalMinutes, sessions: sleeps.length }
  }

  function feedingData(activities, dateStr) {
    const feeds = activitiesForDay(activities, dateStr).filter(a => a.type === 'feed')
    return { count: feeds.length }
  }

  function diaperData(activities, dateStr) {
    const diapers = activitiesForDay(activities, dateStr).filter(a => a.type === 'diaper')
    return { count: diapers.length }
  }

  function growthData(activities) {
    return activities
      .filter(a => a.type === 'measurement')
      .map(a => ({ date: a.started_at, ...parseMeta(a) }))
      .filter(m => m.weight || m.height)
  }

  function temperatureData(activities) {
    return activities
      .filter(a => a.type === 'temperature')
      .map(a => ({ date: a.started_at, ...parseMeta(a) }))
  }

  function lastNDays(baseDate, n) {
    const days = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  function buildBarDatasets(activities, days) {
    return {
      labels: days,
      sleep:    days.map(d => dailySleepData(activities, d).totalMinutes),
      feedings: days.map(d => feedingData(activities, d).count),
      diapers:  days.map(d => diaperData(activities, d).count),
    }
  }

  const Charts = { dailySleepData, feedingData, diaperData, growthData, temperatureData, lastNDays, buildBarDatasets }

  if (typeof module !== 'undefined') module.exports = Charts
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.Charts = Charts }
})()
