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

async function loadGallery() {
  const list = document.getElementById('galleryList')
  list.innerHTML = `<div class="col-span-3 flex justify-center py-4">${window.spinner('h-6 w-6')}</div>`
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('id, title, image_url, category')
      .order('uploaded_at', { ascending: false })
      .limit(12)
    if (error) throw error
    if (!data || !data.length) { list.innerHTML = '<p class="col-span-3 text-sm text-gray-400">No photos yet.</p>'; return }
    list.innerHTML = data.map((img) => `
      <div class="relative group rounded-lg overflow-hidden">
        <img src="${img.image_url}" alt="" class="h-20 w-full object-cover" />
        <button data-id="${img.id}" class="del-gallery absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-xs font-semibold">Delete</button>
      </div>`).join('')
    list.querySelectorAll('.del-gallery').forEach((b) =>
      b.addEventListener('click', () => removeRow('gallery_images', b.dataset.id, loadGallery)))
  } catch (err) {
    list.innerHTML = `<p class="col-span-3 text-sm text-red-500">${err.message}</p>`
  }
}

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

async function loadEvents() {
  const list = document.getElementById('eventList')
  list.innerHTML = `<div class="flex justify-center py-4">${window.spinner('h-6 w-6')}</div>`
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date')
      .order('event_date', { ascending: false })
      .limit(15)
    if (error) throw error
    if (!data || !data.length) { list.innerHTML = '<p class="text-sm text-gray-400">No events yet.</p>'; return }
    list.innerHTML = data.map((ev) => `
      <div class="flex items-center justify-between bg-lightgray rounded-lg px-3 py-2 text-sm">
        <span><span class="font-medium text-navy">${esc(ev.title)}</span>${ev.event_date ? ` <span class="text-gray-400">· ${ev.event_date}</span>` : ''}</span>
        <button data-id="${ev.id}" class="del-event text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
      </div>`).join('')
    list.querySelectorAll('.del-event').forEach((b) =>
      b.addEventListener('click', () => removeRow('events', b.dataset.id, loadEvents)))
  } catch (err) {
    list.innerHTML = `<p class="text-sm text-red-500">${err.message}</p>`
  }
}

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

init()
