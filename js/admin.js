// ============================================================
//  admin.js — secure admin panel (Supabase Auth + Storage)
//  Lets an authenticated staff user upload gallery photos and
//  publish events. Writes are protected by RLS (authenticated
//  role only) — see README for the required policies.
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

const BUCKET = 'images' // Supabase Storage bucket (must be Public)

const loginScreen = document.getElementById('loginScreen')
const dashboard = document.getElementById('dashboard')
const bootLoader = document.getElementById('bootLoader')

function show(el) { el.classList.remove('hidden') }
function hide(el) { el.classList.add('hidden') }

// ---------- Auth gate ----------
async function init() {
  if (!isConfigured) {
    hide(bootLoader)
    show(loginScreen)
    document.getElementById('loginError').textContent =
      'Supabase is not configured. Add your URL + anon key in js/supabase-config.js.'
    document.getElementById('loginError').classList.remove('hidden')
    return
  }
  const { data } = await supabase.auth.getSession()
  hide(bootLoader)
  if (data.session) enterDashboard(data.session)
  else show(loginScreen)
}

supabase.auth?.onAuthStateChange((_event, session) => {
  if (session) enterDashboard(session)
})

function enterDashboard(session) {
  hide(loginScreen)
  show(dashboard)
  const who = document.getElementById('whoami')
  if (who && session?.user?.email) who.textContent = session.user.email
  loadGallery()
  loadEvents()
  loadHof()
  initReports()
}

// ---------- Login ----------
const loginForm = document.getElementById('loginForm')
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const err = document.getElementById('loginError')
  err.classList.add('hidden')
  const email = loginForm.elements['email'].value.trim()
  const password = loginForm.elements['password'].value
  if (!email || !password) {
    err.textContent = 'Enter your email and password.'
    err.classList.remove('hidden')
    return
  }
  const btn = document.getElementById('loginBtn')
  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Signing in…</span>`
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // onAuthStateChange handles the rest
  } catch (e2) {
    err.textContent = e2.message || 'Sign in failed.'
    err.classList.remove('hidden')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  hide(dashboard)
  show(loginScreen)
})

// ---------- Helpers ----------
async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function fieldError(input, msg) {
  const p = input.parentElement.querySelector('.err')
  if (p) { p.textContent = msg; p.classList.remove('hidden') }
}
function clearFieldError(input) {
  const p = input.parentElement.querySelector('.err')
  if (p) p.classList.add('hidden')
}

// ---------- Gallery upload ----------
const galleryForm = document.getElementById('galleryForm')
galleryForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const fileInput = galleryForm.elements['file']
  clearFieldError(fileInput)
  const file = fileInput.files[0]
  if (!file) { fieldError(fileInput, 'Please choose an image.'); return }

  const btn = document.getElementById('galleryBtn')
  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Uploading…</span>`
  try {
    const url = await uploadImage(file)
    const { error } = await supabase.from('gallery_images').insert([{
      title: galleryForm.elements['title'].value.trim() || null,
      category: galleryForm.elements['category'].value,
      image_url: url,
    }])
    if (error) throw error
    window.showToast('Photo added to gallery!', 'success')
    galleryForm.reset()
    loadGallery()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Upload failed.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

// ============================================================
//  Paginated tables for the "Existing …" lists (5 rows/page)
// ============================================================
const PAGE_SIZE = 5

const TABLE_CFG = {
  gallery_images: {
    mount: 'galleryList', empty: 'No photos yet.',
    select: 'id, title, image_url, category', orderCol: 'uploaded_at',
    columns: [
      { label: 'Photo', render: (r) => `<img src="${r.image_url || ''}" onerror="this.style.visibility='hidden'" class="h-10 w-16 object-cover rounded" alt="" />` },
      { label: 'Title', render: (r) => esc(r.title || '—') },
      { label: 'Category', render: (r) => `<span class="capitalize">${esc(r.category || '')}</span>` },
    ],
  },
  events: {
    mount: 'eventList', empty: 'No events yet.',
    select: 'id, title, event_date, location, is_featured', orderCol: 'event_date',
    columns: [
      { label: 'Title', render: (r) => esc(r.title || '—') },
      { label: 'Date', render: (r) => esc(r.event_date || '—') },
      { label: 'Location', render: (r) => esc(r.location || '—') },
      { label: 'Featured', render: (r) => (r.is_featured ? '<span class="text-amber-500">★</span>' : '') },
    ],
  },
  honourees: {
    mount: 'hofList', empty: 'No entries yet.',
    select: 'id, name, award, photo_url, is_spotlight', orderCol: 'created_at',
    columns: [
      { label: 'Photo', render: (r) => `<img src="${r.photo_url || ''}" onerror="this.style.visibility='hidden'" class="h-10 w-10 rounded-full object-cover bg-gray-100" alt="" />` },
      { label: 'Name', render: (r) => esc(r.name || '') },
      { label: 'Award', render: (r) => esc(r.award || '') },
      { label: 'Spotlight', render: (r) => (r.is_spotlight ? '<span class="text-amber-500">★</span>' : '') },
    ],
  },
}

const tableState = {
  gallery_images: { rows: [], page: 1 },
  events: { rows: [], page: 1 },
  honourees: { rows: [], page: 1 },
}

async function loadTable(key) {
  const cfg = TABLE_CFG[key]
  const mount = document.getElementById(cfg.mount)
  mount.innerHTML = `<div class="flex justify-center py-6">${window.spinner('h-6 w-6')}</div>`
  try {
    const { data, error } = await supabase.from(key).select(cfg.select).order(cfg.orderCol, { ascending: false })
    if (error) throw error
    tableState[key].rows = data || []
    renderTable(key)
  } catch (err) {
    console.error(err)
    mount.innerHTML = `<p class="text-sm text-red-500">${esc(err.message)}</p>`
  }
}

function renderTable(key) {
  const cfg = TABLE_CFG[key]
  const st = tableState[key]
  const mount = document.getElementById(cfg.mount)
  if (!st.rows.length) { mount.innerHTML = `<p class="text-sm text-gray-400">${esc(cfg.empty)}</p>`; return }

  const pages = Math.max(1, Math.ceil(st.rows.length / PAGE_SIZE))
  if (st.page > pages) st.page = pages
  if (st.page < 1) st.page = 1
  const start = (st.page - 1) * PAGE_SIZE
  const pageRows = st.rows.slice(start, start + PAGE_SIZE)

  const head = cfg.columns.map((c) => `<th class="px-3 py-2 text-left font-semibold text-navy whitespace-nowrap">${c.label}</th>`).join('') + '<th class="px-3 py-2"></th>'
  const body = pageRows.map((r) => {
    const tds = cfg.columns.map((c) => `<td class="px-3 py-2 align-middle">${c.render(r)}</td>`).join('')
    return `<tr class="border-t border-gray-100 hover:bg-lightgray/60">${tds}<td class="px-3 py-2 text-right"><button data-id="${r.id}" class="del-row text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button></td></tr>`
  }).join('')

  let pager = ''
  if (pages > 1) {
    const btn = (label, page, disabled, active) =>
      `<button data-page="${page}" ${disabled ? 'disabled' : ''} class="pager-btn px-3 py-1.5 rounded-md text-sm font-medium ${active ? 'bg-amber-500 text-navy' : 'bg-lightgray text-navy hover:bg-gray-200'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}">${label}</button>`
    let nums = ''
    for (let p = 1; p <= pages; p++) nums += btn(p, p, false, p === st.page)
    pager = `<div class="flex items-center justify-between mt-3 flex-wrap gap-2">
      <span class="text-xs text-gray-500">Showing ${start + 1}–${Math.min(start + PAGE_SIZE, st.rows.length)} of ${st.rows.length}</span>
      <div class="flex items-center gap-1 flex-wrap">
        ${btn('‹ Prev', st.page - 1, st.page === 1, false)}${nums}${btn('Next ›', st.page + 1, st.page === pages, false)}
      </div></div>`
  }

  mount.innerHTML = `<div class="overflow-x-auto border border-gray-100 rounded-xl">
      <table class="min-w-full text-sm"><thead class="bg-lightgray"><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </div>${pager}`

  mount.querySelectorAll('.del-row').forEach((b) =>
    b.addEventListener('click', () => removeRow(key, b.dataset.id, () => loadTable(key))))
  mount.querySelectorAll('.pager-btn').forEach((b) =>
    b.addEventListener('click', () => { tableState[key].page = Number(b.dataset.page); renderTable(key) }))
}

// Thin wrappers kept so existing callers (form submits, boot) still work.
function loadGallery() { return loadTable('gallery_images') }
function loadEvents() { return loadTable('events') }
function loadHof() { return loadTable('honourees') }

// ---------- Event publish ----------
const eventForm = document.getElementById('eventForm')
eventForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const titleInput = eventForm.elements['title']
  clearFieldError(titleInput)
  if (!titleInput.value.trim()) { fieldError(titleInput, 'Title is required.'); return }

  const btn = document.getElementById('eventBtn')
  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Publishing…</span>`
  try {
    let imageUrl = null
    const file = eventForm.elements['file'].files[0]
    if (file) imageUrl = await uploadImage(file)

    const { error } = await supabase.from('events').insert([{
      title: titleInput.value.trim(),
      description: eventForm.elements['description'].value.trim() || null,
      event_date: eventForm.elements['event_date'].value || null,
      event_time: eventForm.elements['event_time'].value || null,
      location: eventForm.elements['location'].value.trim() || null,
      image_url: imageUrl,
      is_featured: eventForm.elements['is_featured'].checked,
    }])
    if (error) throw error
    window.showToast('Event published!', 'success')
    eventForm.reset()
    loadEvents()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Could not publish event.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

// ---------- Hall of Fame / Spotlight ----------
const hofForm = document.getElementById('hofForm')
hofForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nameInput = hofForm.elements['name']
  clearFieldError(nameInput)
  if (!nameInput.value.trim()) { fieldError(nameInput, 'Name is required.'); return }

  const btn = document.getElementById('hofBtn')
  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Saving…</span>`
  try {
    let photoUrl = null
    const file = hofForm.elements['file'].files[0]
    if (file) photoUrl = await uploadImage(file)

    const { error } = await supabase.from('honourees').insert([{
      name: nameInput.value.trim(),
      award: hofForm.elements['award'].value.trim() || null,
      description: hofForm.elements['description'].value.trim() || null,
      photo_url: photoUrl,
      is_spotlight: hofForm.elements['is_spotlight'].checked,
    }])
    if (error) throw error
    window.showToast('Added to Hall of Fame!', 'success')
    hofForm.reset()
    loadHof()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Could not save entry.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

// ---------- Delete ----------
async function removeRow(table, id, reload) {
  if (!confirm('Delete this item permanently?')) return
  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    window.showToast('Deleted.', 'success')
    reload()
  } catch (err) {
    window.showToast(err.message || 'Delete failed.', 'error')
  }
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// ============================================================
//  REPORTS — admin-only view of submitted data
// ============================================================
const REPORT = {
  current: 'alumni_registrations',
  label: 'Registrations',
  rows: [],
}

// Hide noisy columns in the on-screen table (still included in CSV export)
const HIDDEN_COLS = ['id', 'is_read']

function initReports() {
  const tabs = document.querySelectorAll('.report-tab')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab
        t.className = `report-tab px-4 py-2 rounded-full text-sm font-semibold ${on ? 'bg-amber-500 text-navy' : 'bg-lightgray text-navy'}`
      })
      REPORT.current = tab.dataset.table
      REPORT.label = tab.dataset.label
      loadReport()
    })
  })
  document.getElementById('reportRefresh').addEventListener('click', loadReport)
  document.getElementById('reportExport').addEventListener('click', exportCsv)
  loadReport()
}

async function loadReport() {
  const box = document.getElementById('reportTable')
  const count = document.getElementById('reportCount')
  box.innerHTML = `<div class="flex justify-center py-10">${window.spinner('h-7 w-7')}</div>`
  count.textContent = ''
  try {
    const { data, error } = await supabase
      .from(REPORT.current)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    REPORT.rows = data || []
    count.textContent = `${REPORT.rows.length} record${REPORT.rows.length === 1 ? '' : 's'}`
    renderReport()
  } catch (err) {
    console.error(err)
    REPORT.rows = []
    box.innerHTML = `<div class="p-6 text-sm text-red-600">
      Could not load <strong>${REPORT.label}</strong>: ${esc(err.message)}<br>
      <span class="text-gray-500">Make sure the admin SELECT policy exists for this table (see README / setup SQL).</span>
    </div>`
  }
}

function renderReport() {
  const box = document.getElementById('reportTable')
  if (!REPORT.rows.length) {
    box.innerHTML = `<div class="p-8 text-center text-gray-400 text-sm">No ${esc(REPORT.label.toLowerCase())} yet.</div>`
    return
  }
  const cols = Object.keys(REPORT.rows[0]).filter((c) => !HIDDEN_COLS.includes(c))
  const head = cols.map((c) => `<th class="px-3 py-2 text-left font-semibold text-navy whitespace-nowrap">${esc(prettify(c))}</th>`).join('')
  const body = REPORT.rows.map((row) => {
    const tds = cols.map((c) => `<td class="px-3 py-2 align-top text-gray-700 max-w-xs truncate" title="${esc(cell(row[c]))}">${esc(cell(row[c]))}</td>`).join('')
    return `<tr class="border-t border-gray-100 hover:bg-lightgray/60">${tds}</tr>`
  }).join('')
  box.innerHTML = `<table class="min-w-full text-sm">
    <thead class="bg-lightgray sticky top-0"><tr>${head}</tr></thead>
    <tbody>${body}</tbody></table>`
}

function prettify(col) {
  return col.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}
function cell(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString()
  return String(v)
}

function exportCsv() {
  if (!REPORT.rows.length) { window.showToast('Nothing to export.', 'info'); return }
  const cols = Object.keys(REPORT.rows[0])
  const escCsv = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.join(',')]
  REPORT.rows.forEach((r) => lines.push(cols.map((c) => escCsv(r[c])).join(',')))
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${REPORT.current}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  window.showToast('CSV downloaded.', 'success')
}

init()
