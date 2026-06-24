// ============================================================
//  gallery.js — fetch images, category filter, lightbox
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

const grid = document.getElementById('galleryGrid')
const loader = document.getElementById('galleryLoader')
const emptyMsg = document.getElementById('galleryEmpty')

let images = []
let filtered = []
let activeCat = 'all'

const SAMPLE = [
  { id: 's1', title: 'Passing-Out Parade', category: 'parade', image_url: 'https://images.unsplash.com/photo-1551892589-865f69869476?auto=format&fit=crop&w=800&q=60' },
  { id: 's2', title: 'Annual Athletics Meet', category: 'sports', image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=60' },
  { id: 's3', title: 'Obstacle Course Training', category: 'training', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=60' },
  { id: 's4', title: 'Cultural Evening', category: 'cultural', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=60' },
  { id: 's5', title: 'Old Cadets Reunion Dinner', category: 'reunion', image_url: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=800&q=60' },
  { id: 's6', title: 'Inter-House Football', category: 'sports', image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=60' },
  { id: 's7', title: 'Drill on the Square', category: 'parade', image_url: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=60' },
  { id: 's8', title: 'Camp & Field Craft', category: 'training', image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=60' },
]

function tile(img, idx) {
  return `
  <button class="gallery-item block w-full group relative overflow-hidden rounded-xl shadow-sm" data-idx="${idx}">
    <img src="${img.image_url}" alt="${esc(img.title || '')}" loading="lazy"
      class="w-full object-cover transition-transform duration-300 group-hover:scale-105" />
    <span class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
      <span class="text-white text-left">
        <span class="block font-semibold">${esc(img.title || 'Untitled')}</span>
        <span class="block text-xs text-amber-300 capitalize">${esc(img.category || '')}</span>
      </span>
    </span>
  </button>`
}

function render() {
  filtered = activeCat === 'all' ? images : images.filter((i) => (i.category || '').toLowerCase() === activeCat)
  if (filtered.length === 0) {
    grid.innerHTML = ''
    emptyMsg.classList.remove('hidden')
    return
  }
  emptyMsg.classList.add('hidden')
  grid.innerHTML = filtered.map((img, i) => tile(img, i)).join('')
  grid.querySelectorAll('.gallery-item').forEach((el) => {
    el.addEventListener('click', () => openLightbox(Number(el.dataset.idx)))
  })
}

async function load() {
  loader.innerHTML = window.spinner('h-10 w-10')
  if (!isConfigured) {
    images = SAMPLE
    loader.innerHTML = ''
    render()
    return
  }
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    images = data || []
    if (images.length === 0) {
      // Real (empty) table -> show the required "No images found" state.
      loader.innerHTML = ''
      grid.innerHTML = ''
      emptyMsg.classList.remove('hidden')
      return
    }
  } catch (err) {
    console.error(err)
    window.showToast('Could not load gallery. Showing samples.', 'error')
    images = SAMPLE
  } finally {
    loader.innerHTML = ''
    if (images.length) render()
  }
}

// ---------- Filters ----------
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    activeCat = btn.dataset.cat
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn))
    render()
  })
})

// ---------- Lightbox ----------
const lb = document.getElementById('lightbox')
const lbImg = document.getElementById('lbImg')
const lbCaption = document.getElementById('lbCaption')
let current = 0

function openLightbox(idx) {
  current = idx
  showCurrent()
  lb.classList.remove('hidden')
}
function showCurrent() {
  const img = filtered[current]
  if (!img) return
  lbImg.src = img.image_url
  lbImg.alt = img.title || ''
  lbCaption.textContent = img.title ? `${img.title}${img.category ? ' · ' + img.category : ''}` : ''
}
function close() { lb.classList.add('hidden') }
function next() { current = (current + 1) % filtered.length; showCurrent() }
function prev() { current = (current - 1 + filtered.length) % filtered.length; showCurrent() }

document.getElementById('lbClose').addEventListener('click', close)
document.getElementById('lbNext').addEventListener('click', next)
document.getElementById('lbPrev').addEventListener('click', prev)
lb.addEventListener('click', (e) => { if (e.target === lb) close() })
document.addEventListener('keydown', (e) => {
  if (lb.classList.contains('hidden')) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
})

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

load()
