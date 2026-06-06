;(function () {
  'use strict'

  function render() {
    return `
      <div class="page-header">
        <div class="page-title">Insights</div>
      </div>
      <div class="tab-group">
        <button class="tab-btn active" data-days="7">Last 7 days</button>
        <button class="tab-btn" data-days="30">Last 30 days</button>
      </div>
      <div class="chart-section">
        <div class="chart-title">Sleep (minutes per day)</div>
        <div class="chart-container"><canvas id="chart-sleep" height="140"></canvas></div>
      </div>
      <div class="chart-section">
        <div class="chart-title">Feedings per day</div>
        <div class="chart-container"><canvas id="chart-feedings" height="140"></canvas></div>
      </div>
      <div class="chart-section">
        <div class="chart-title">Diapers per day</div>
        <div class="chart-container"><canvas id="chart-diapers" height="140"></canvas></div>
      </div>
      <div class="chart-section">
        <div class="chart-title">Growth (weight)</div>
        <div class="chart-container"><canvas id="chart-growth" height="140"></canvas></div>
      </div>
      <div class="chart-section">
        <div class="chart-title">Temperature history</div>
        <div class="chart-container"><canvas id="chart-temp" height="140"></canvas></div>
      </div>
    `
  }

  function drawCharts(activities, days, Charts) {
    if (typeof Chart === 'undefined') return
    const _Charts = Charts || (typeof module === 'undefined' ? window.TinyTrack.Charts : null)
    if (!_Charts) return

    const today = new Date().toISOString().slice(0, 10)
    const labels = _Charts.lastNDays(today, days)
    const ds = _Charts.buildBarDatasets(activities, labels)

    function mkBar(id, label, data, color) {
      const canvas = document.getElementById(id)
      if (!canvas) return
      if (canvas._chartInstance) canvas._chartInstance.destroy()
      canvas._chartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ label, data, backgroundColor: color, borderRadius: 4 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      })
    }

    mkBar('chart-sleep',    'Sleep (min)', ds.sleep,    '#5b8ef0')
    mkBar('chart-feedings', 'Feedings',    ds.feedings, '#48bb78')
    mkBar('chart-diapers',  'Diapers',     ds.diapers,  '#f6ad55')

    const growthCanvas = document.getElementById('chart-growth')
    if (growthCanvas) {
      const gd = _Charts.growthData(activities)
      if (growthCanvas._chartInstance) growthCanvas._chartInstance.destroy()
      growthCanvas._chartInstance = new Chart(growthCanvas, {
        type: 'line',
        data: {
          labels: gd.map(m => m.date.slice(0, 10)),
          datasets: [{ label: 'Weight', data: gd.map(m => parseFloat(m.weight) || null), borderColor: '#5b8ef0', tension: 0.3 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } },
      })
    }

    const tempCanvas = document.getElementById('chart-temp')
    if (tempCanvas) {
      const td = _Charts.temperatureData(activities)
      if (tempCanvas._chartInstance) tempCanvas._chartInstance.destroy()
      tempCanvas._chartInstance = new Chart(tempCanvas, {
        type: 'line',
        data: {
          labels: td.map(t => t.date.slice(0, 10)),
          datasets: [{ label: 'Temp', data: td.map(t => parseFloat(t.value) || null), borderColor: '#fc8181', tension: 0.3 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } },
      })
    }
  }

  const InsightsView = { render, drawCharts }

  if (typeof module !== 'undefined') module.exports = InsightsView
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.InsightsView = InsightsView }
})()
