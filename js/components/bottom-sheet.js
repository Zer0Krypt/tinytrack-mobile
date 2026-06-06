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

  function renderFields(type, activityFields) {
    const fields = activityFields[type] || []
    return fields.map(f => {
      if (f.type === 'select') {
        const opts = f.options.map(o => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')
        return `<div class="form-group"><label class="form-label">${escapeHTML(f.label)}</label><select class="form-select" name="${f.name}">${opts}</select></div>`
      }
      if (f.type === 'number') {
        return `<div class="form-group"><label class="form-label">${escapeHTML(f.label)}</label><input class="form-input" type="number" name="${f.name}" step="0.01"></div>`
      }
      return `<div class="form-group"><label class="form-label">${escapeHTML(f.label)}</label><input class="form-input" type="text" name="${f.name}"></div>`
    }).join('')
  }

  function buildMetadata(type, formData, activityFields) {
    const fields = activityFields[type] || []
    if (fields.length === 0) return null
    const meta = {}
    for (const f of fields) {
      const val = formData[f.name]
      if (f.optional && (val === undefined || val === '')) continue
      meta[f.name] = val !== undefined ? val : ''
    }
    return Object.keys(meta).length > 0 ? meta : null
  }

  function render(type, activityTypes, activityFields, isDurationBased, handedness) {
    const typeInfo = activityTypes.find(t => t.id === type) || { icon: '', label: escapeHTML(type) }
    const closeClass = handedness === 'left' ? ' left-hand' : ''
    const saveClass  = handedness === 'left' ? ' left-hand' : ''
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    const now = d.toISOString().slice(0, 16)

    const timeSection = isDurationBased
      ? `<div class="form-group">
           <label class="form-label">Start time</label>
           <input class="form-input" type="datetime-local" name="started_at" id="bs-started-at" value="${now}">
         </div>
         <div class="form-group">
           <label class="form-label">End time (optional)</label>
           <input class="form-input" type="datetime-local" name="ended_at" id="bs-ended-at">
         </div>`
      : `<input type="hidden" name="started_at" id="bs-started-at" value="${now}">`

    return `
      <div class="bottom-sheet-backdrop" data-action="close-sheet"></div>
      <div class="bottom-sheet">
        <div class="bottom-sheet-header">
          <span>${typeInfo.icon} ${escapeHTML(typeInfo.label)}</span>
          <button class="sheet-close-btn${closeClass}" data-action="close-sheet">✕</button>
        </div>
        <div class="bottom-sheet-body">
          ${timeSection}
          ${renderFields(type, activityFields)}
          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-input" name="notes" rows="2"></textarea>
          </div>
        </div>
        <div class="bottom-sheet-footer">
          <button class="btn btn-primary btn-save${saveClass}" data-action="save-activity">Save</button>
        </div>
      </div>
    `
  }

  const BottomSheet = { render, renderFields, buildMetadata }

  if (typeof module !== 'undefined') module.exports = BottomSheet
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.BottomSheet = BottomSheet }
})()
