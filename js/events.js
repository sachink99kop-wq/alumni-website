// ============================================================
//  events.js — list events, upcoming/past tabs, register modal
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

const grid = document.getElementById('eventsGrid')
const loader = document.getElementById('eventsLoader')
const emptyMsg = document.getElementById('eventsEmpty')

let allEvents = []
let activeTab = 'upcoming'

const PLACEHOLDERS = [
  { id: 'ph1', title: 'Annual Old Cadets Reunion 2026', description: 'An evening of nostalgia, a formal mess dinner and reconnecting with course-mates across decades.', event_date: '2026-12-20', event_time: '18:00:00', location: 'Academy Parade Ground', image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=60' },
  { id: 'ph2', title: 'SSB & NDA Guidance Camp', description: 'Serving officers mentor cadets and aspirants on the Services Selection Board and academy life.', event_date: '2026-09-10', event_time: '09:00:00', location: 'Cadets Auditorium', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=60' },
  { id: 'ph3', title: 'Founders Day & Investiture 2024', description: 'We celebrated 62 years of forging officers for the Army, Navy and Air Force.', event_date: '2024-02-15', event_time: '10:00:00', location: 'Drill Square', image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=60' },
]

function fmtDate(d) {
  if (!d) return 'Date TBA'
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const dt = new Date()
  dt.setHours(Number(h), Number(m))
  return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function card(ev) {
  const img = ev.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=60'
  const isPast = ev.event_date && new Date(ev.event_date) < new Date(new Date().toDateString())
  return `
  <article class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col fade-in visible">
    <div class="relative">
      <img src="${img}" alt="${esc(ev.title)}" class="h-48 w-full object-cover" loading="lazy" />
      ${ev.is_featured ? '<span class="absolute top-3 left-3 bg-amber-500 text-navy text-xs font-bold px-3 py-1 rounded-full">Featured</span>' : ''}
    </div>
    <div class="p-6 flex flex-col flex-1">
      <h3 class="font-display text-xl font-bold text-navy mb-2">${esc(ev.title)}</h3>
      <ul class="text-sm text-gray-600 space-y-1 mb-3">
        <li>📅 ${fmtDate(ev.event_date)}${ev.event_time ? ' · ' + fmtTime(ev.event_time) : ''}</li>
        ${ev.location ? `<li>📍 ${esc(ev.location)}</li>` : ''}
      </ul>
      <p class="text-gray-600 text-sm flex-1">${esc(ev.description || '')}</p>
      ${isPast
        ? '<span class="mt-4 inline-block text-center px-5 py-2.5 rounded-full bg-gray-100 text-gray-500 font-semibold cursor-default">Event Concluded</span>'
        : `<button class="reg-btn mt-4 px-5 py-2.5 rounded-full bg-amber-500 text-navy font-semibold hover:bg-amber-400 transition-colors" data-id="${ev.id}" data-title="${esc(ev.title)}">Register for Event</button>`}
    </div>
  </article>`
}

function render() {
  const now = new Date(new Date().toDateString())
  const list = allEvents.filter((ev) => {
    const d = ev.event_date ? new Date(ev.event_date) : null
    if (activeTab === 'upcoming') return !d || d >= now
    return d && d < now
  })
  if (list.length === 0) {
    grid.innerHTML = ''
    emptyMsg.classList.remove('hidden')
  } else {
    emptyMsg.classList.add('hidden')
    grid.innerHTML = list.map(card).join('')
    bindRegButtons()
  }
}

function bindRegButtons() {
  grid.querySelectorAll('.reg-btn').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.id, btn.dataset.title))
  })
}

async function load() {
  loader.innerHTML = window.spinner('h-10 w-10')
  if (!isConfigured) {
    allEvents = PLACEHOLDERS
    loader.innerHTML = ''
    render()
    return
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) throw error
    allEvents = data && data.length ? data : PLACEHOLDERS
  } catch (err) {
    console.error(err)
    window.showToast('Could not load events. Showing samples.', 'error')
    allEvents = PLACEHOLDERS
  } finally {
    loader.innerHTML = ''
    render()
  }
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab
    document.querySelectorAll('.tab-btn').forEach((b) => {
      const on = b.dataset.tab === activeTab
      b.className = `tab-btn px-6 py-2.5 rounded-full font-semibold ${on ? 'bg-amber-500 text-navy' : 'bg-white text-navy border border-gray-200'}`
    })
    render()
  })
})

// ---------- Modal ----------
const modal = document.getElementById('eventModal')
const modalForm = document.getElementById('eventRegForm')
const modalTitle = document.getElementById('modalEventTitle')

function openModal(id, title) {
  modalForm.reset()
  modalForm.querySelectorAll('.err').forEach((p) => p.classList.add('hidden'))
  modalForm.elements['event_id'].value = id
  modalTitle.textContent = title
  modal.classList.remove('hidden')
}
function closeModal() {
  modal.classList.add('hidden')
}
document.getElementById('modalClose').addEventListener('click', closeModal)
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = modalForm.elements['attendee_name']
  const email = modalForm.elements['attendee_email']
  const eventId = modalForm.elements['event_id'].value
  let ok = true
  ;[name, email].forEach((inp) => {
    const p = inp.parentElement.querySelector('.err')
    p.classList.add('hidden')
    if (!inp.value.trim()) { p.textContent = 'Required.'; p.classList.remove('hidden'); ok = false }
  })
  if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    const p = email.parentElement.querySelector('.err'); p.textContent = 'Enter a valid email.'; p.classList.remove('hidden'); ok = false
  }
  if (!ok) return

  const btn = document.getElementById('eventRegBtn')
  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Registering…</span>`

  if (!isConfigured || String(eventId).startsWith('ph')) {
    window.showToast('You are registered! (Demo mode)', 'success')
    closeModal(); btn.disabled = false; btn.innerHTML = orig
    return
  }
  try {
    const { error } = await supabase.from('event_registrations').insert([{
      event_id: eventId,
      attendee_name: name.value.trim(),
      attendee_email: email.value.trim().toLowerCase(),
    }])
    if (error) throw error
    window.showToast('You are registered for the event!', 'success')
    closeModal()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Registration failed.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

load()
