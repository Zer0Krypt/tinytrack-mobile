;(function () {
  'use strict'

  const DURATION_BASED_TYPES = ['sleep', 'feed', 'pumping', 'weighted_feed', 'playtime', 'tummy_time']

  const ACTIVITY_TYPES = [
    { id: 'sleep',         label: 'Sleep',           icon: '🌙', durationBased: true },
    { id: 'feed',          label: 'Feed',             icon: '🍼', durationBased: true },
    { id: 'pumping',       label: 'Pumping',          icon: '🥛', durationBased: true },
    { id: 'weighted_feed', label: 'Weighted Feed',    icon: '⚖️',  durationBased: true },
    { id: 'playtime',      label: 'Playtime',         icon: '🧸', durationBased: true },
    { id: 'tummy_time',    label: 'Tummy Time',       icon: '🐛', durationBased: true },
    { id: 'diaper',        label: 'Diaper',           icon: '🩲', durationBased: false },
    { id: 'bath',          label: 'Bath',             icon: '🛁', durationBased: false },
    { id: 'measurement',   label: 'Measurement',      icon: '📏', durationBased: false },
    { id: 'doctors_visit', label: "Doctor's Visit",   icon: '🩺', durationBased: false },
    { id: 'temperature',   label: 'Temperature',      icon: '🌡️',  durationBased: false },
    { id: 'medication',    label: 'Medication',       icon: '💊', durationBased: false },
    { id: 'miscellaneous', label: 'Miscellaneous',    icon: '📝', durationBased: false },
  ]

  const ACTIVITY_FIELDS = {
    sleep:         [],
    feed:          [
      { name: 'kind',        label: 'Kind',   type: 'select', options: ['breast','bottle','formula','baby food','snacks'] },
      { name: 'amount',      label: 'Amount', type: 'number', optional: true },
      { name: 'amount_unit', label: 'Unit',   type: 'select', options: ['oz','ml'] },
      { name: 'side',        label: 'Side',   type: 'select', options: ['','left','right'], optional: true },
    ],
    pumping:       [
      { name: 'side',        label: 'Side',   type: 'select', options: ['left','right','both'] },
      { name: 'amount',      label: 'Amount', type: 'number', optional: true },
      { name: 'amount_unit', label: 'Unit',   type: 'select', options: ['oz','ml'] },
    ],
    weighted_feed: [
      { name: 'weight_before', label: 'Weight Before', type: 'number' },
      { name: 'weight_after',  label: 'Weight After',  type: 'number' },
      { name: 'weight_unit',   label: 'Unit',          type: 'select', options: ['oz','g'] },
    ],
    playtime:      [],
    tummy_time:    [],
    diaper:        [
      { name: 'kind', label: 'Kind', type: 'select', options: ['wet','dirty','both'] },
    ],
    bath:          [],
    measurement:   [
      { name: 'weight',            label: 'Weight',            type: 'number', optional: true },
      { name: 'weight_unit',       label: 'Weight Unit',       type: 'select', options: ['lb','kg'] },
      { name: 'height',            label: 'Height',            type: 'number', optional: true },
      { name: 'height_unit',       label: 'Height Unit',       type: 'select', options: ['in','cm'] },
      { name: 'head_circumference',label: 'Head Circumference',type: 'number', optional: true },
      { name: 'head_circ_unit',    label: 'Head Circ Unit',    type: 'select', options: ['in','cm'] },
    ],
    doctors_visit: [
      { name: 'reason',      label: 'Reason',      type: 'text' },
      { name: 'doctor_name', label: 'Doctor Name', type: 'text', optional: true },
    ],
    temperature:   [
      { name: 'value',  label: 'Temperature', type: 'number' },
      { name: 'unit',   label: 'Unit',        type: 'select', options: ['°F','°C'] },
      { name: 'method', label: 'Method',      type: 'select', options: ['oral','rectal','axillary','forehead','ear'] },
    ],
    medication:    [
      { name: 'name',  label: 'Medication Name', type: 'text' },
      { name: 'dose',  label: 'Dose',            type: 'number' },
      { name: 'unit',  label: 'Unit',            type: 'select', options: ['ml','mg','tsp'] },
      { name: 'route', label: 'Route',           type: 'select', options: ['oral','topical','suppository','drops','inhaled','other'] },
    ],
    miscellaneous: [],
  }

  const Constants = { DURATION_BASED_TYPES, ACTIVITY_TYPES, ACTIVITY_FIELDS }

  if (typeof module !== 'undefined') module.exports = Constants
  else { window.TinyTrack = window.TinyTrack || {}; window.TinyTrack.Constants = Constants }
})()
