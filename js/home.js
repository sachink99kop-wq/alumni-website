// ============================================================
//  home.js — stats counters, latest events, newsletter signup
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

// ---------- Animated stat counters ----------
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]')
  const run = (el) => {
    const target = Number(el.getAttribute('data-counter'))
    const dur = 1500
    const start = performance.now()
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1)
      el.textContent = Math.floor(p * target).toLocaleString()
      if (p < 1) requestAnimationFrame(step)
      else el.textContent = target.toLocaleString() + '+'
    }
    requestAnimationFrame(step)
  }
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          run(e.target)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.4 })
    counters.forEach((c) => obs.observe(c))
  } else {
    counters.forEach(run)
  }
}

// ---------- Latest 3 events ----------
function eventCard(ev) {
  const img = ev.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=60'
  const date = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA'
  return `
    <article class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow fade-in visible">
      <img src="${img}" alt="${escapeHtml(ev.title)}" class="h-48 w-full object-cover" loading="lazy" />
      <div class="p-6">
        <div class="flex items-center gap-2 text-sm text-amber-600 font-semibold mb-2">
          <span>${date}</span>${ev.location ? `<span class="text-gray-400">·</span><span class="text-gray-500">${escapeHtml(ev.location)}</span>` : ''}
        </div>
        <h3 class="font-display text-xl font-bold text-navy mb-2">${escapeHtml(ev.title)}</h3>
        <p class="text-gray-600 text-sm line-clamp-3">${escapeHtml(ev.description || '')}</p>
        <a href="events.html" class="inline-block mt-4 text-navy font-semibold hover:text-amber-600">Details →</a>
      </div>
    </article>`
}

function placeholderEvents() {
  const items = [
    { title: 'Annual Old Cadets Reunion', description: 'A grand evening of nostalgia, mess dinner and reconnecting with course-mates and ustaads.', location: 'Academy Parade Ground', event_date: null },
    { title: 'Officer Mentorship Meet', description: 'Serving officers guide cadets through SSB, NDA and academy life.', location: 'Cadets Mess', event_date: null },
    { title: 'Founders Day & Investiture', description: 'Celebrating six decades of producing officers for the Armed Forces.', location: 'Drill Square', event_date: null },
  ]
  return items.map(eventCard).join('')
}

async function loadLatestEvents() {
  const wrap = document.getElementById('latestEvents')
  const loader = document.getElementById('latestEventsLoader')
  if (loader) loader.innerHTML = window.spinner('h-8 w-8')

  if (!isConfigured) {
    wrap.innerHTML = placeholderEvents()
    return
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(3)
    if (error) throw error
    if (!data || data.length === 0) {
      wrap.innerHTML = placeholderEvents()
      return
    }
    wrap.innerHTML = data.map(eventCard).join('')
  } catch (err) {
    console.error(err)
    wrap.innerHTML = placeholderEvents()
  }
}

// ---------- Newsletter ----------
function initNewsletter() {
  const form = document.getElementById('newsletterForm')
  if (!form) return
  const msg = document.getElementById('newsletterMsg')
  const btn = document.getElementById('newsletterBtn')
  const input = document.getElementById('newsletterEmail')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    msg.textContent = ''
    const email = input.value.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.className = 'text-sm mt-3 text-red-600'
      msg.textContent = 'Please enter a valid email address.'
      return
    }
    btn.disabled = true
    const original = btn.textContent
    btn.textContent = 'Subscribing…'

    if (!isConfigured) {
      msg.className = 'text-sm mt-3 text-green-600'
      msg.textContent = 'Thanks for subscribing! (Demo mode — connect Supabase to persist.)'
      form.reset()
      btn.disabled = false
      btn.textContent = original
      return
    }
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert([{ email }])
      if (error) {
        if (error.code === '23505') throw new Error('You are already subscribed!')
        throw error
      }
      msg.className = 'text-sm mt-3 text-green-600'
      msg.textContent = 'Thanks for subscribing!'
      form.reset()
    } catch (err) {
      msg.className = 'text-sm mt-3 text-red-600'
      msg.textContent = err.message || 'Something went wrong. Please try again.'
    } finally {
      btn.disabled = false
      btn.textContent = original
    }
  })
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
window.escapeHtml = window.escapeHtml || escapeHtml

// ---------- Alumni Spotlight + Hall of Fame ----------
// Default avatar shown when an honouree has no photo uploaded yet.
const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%231E3A5F'/%3E%3Cpath d='M20 86c0-18 14-28 30-28s30 10 30 28z' fill='%231E3A5F'/%3E%3C/svg%3E"

const SAMPLE_HONOUREES = [
  { name: 'Capt R. S. Salaria, PVC (Posthumous)', award: 'Param Vir Chakra', is_spotlight: true, photo_url: '', description: 'Led a daring charge against overwhelming odds, holding the line to the last.' },
  { name: 'Lt Gen A. K. Dayal, PVSM, MVC', award: 'Maha Vir Chakra', is_spotlight: true, photo_url: '', description: 'Distinguished gallantry in command of an assault that turned the battle.' },
  { name: 'Lt Gen V. Swaroop, PVSM, MVC', award: 'Maha Vir Chakra', is_spotlight: true, photo_url: '', description: 'Conspicuous bravery and leadership under heavy fire.' },
  { name: 'Maj Gen S. K. Korla, PVSM, DSO, MC', award: 'Military Cross', is_spotlight: false, photo_url: '', description: '' },
  { name: 'Lt Gen J. S. Gharaya, MVC, KC, VSM', award: 'Maha Vir Chakra', is_spotlight: false, photo_url: '', description: '' },
  { name: 'Brig R. Singh, MVC, VSM', award: 'Maha Vir Chakra', is_spotlight: false, photo_url: '', description: '' },
  { name: 'Maj Gen S. Singh, MVC', award: 'Maha Vir Chakra', is_spotlight: false, photo_url: '', description: '' },
  { name: 'Capt A. Singh, KC', award: 'Kirti Chakra', is_spotlight: false, photo_url: '', description: '' },
]

function spotlightCard(h) {
  return `
  <article class="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center fade-in visible">
    <img src="${h.photo_url || AVATAR_FALLBACK}" alt="${escapeHtml(h.name)}" onerror="this.src='${AVATAR_FALLBACK}'"
      class="h-28 w-28 rounded-full mx-auto object-cover ring-4 ring-amber-500/30" loading="lazy" />
    <h3 class="font-display text-lg font-bold text-navy mt-5">${escapeHtml(h.name)}</h3>
    ${h.award ? `<span class="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold uppercase tracking-wide">${escapeHtml(h.award)}</span>` : ''}
    ${h.description ? `<p class="text-gray-500 text-sm mt-4">${escapeHtml(h.description)}</p>` : ''}
  </article>`
}

function hofCard(h) {
  return `
  <div class="snap-start shrink-0 w-52 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
    <img src="${h.photo_url || AVATAR_FALLBACK}" alt="${escapeHtml(h.name)}" onerror="this.src='${AVATAR_FALLBACK}'"
      class="h-24 w-24 rounded-full mx-auto object-cover ring-4 ring-amber-500/30" loading="lazy" />
    <h3 class="font-semibold text-sm mt-4 leading-snug">${escapeHtml(h.name)}</h3>
    ${h.award ? `<span class="inline-block mt-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-wide">${escapeHtml(h.award)}</span>` : ''}
  </div>`
}

async function loadHonourees() {
  const spotGrid = document.getElementById('spotlightGrid')
  const spotLoader = document.getElementById('spotlightLoader')
  const hofRow = document.getElementById('hofRow')
  const hofLoader = document.getElementById('hofLoader')
  if (spotLoader) spotLoader.innerHTML = window.spinner('h-8 w-8')
  if (hofLoader) hofLoader.innerHTML = window.spinner('h-8 w-8')

  let rows = SAMPLE_HONOUREES
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('honourees')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data && data.length) rows = data
    } catch (err) {
      console.error(err)
    }
  }

  const spotlight = rows.filter((h) => h.is_spotlight).slice(0, 3)
  const everyone = rows
  if (spotLoader) spotLoader.remove()
  if (hofLoader) hofLoader.remove()
  spotGrid.innerHTML = (spotlight.length ? spotlight : rows.slice(0, 3)).map(spotlightCard).join('')
  buildHofMarquee(hofRow, everyone)
}

// Seamless CSS marquee for the Hall of Fame row (scrolls left, pauses on hover).
function buildHofMarquee(row, items) {
  if (!row) return
  const cards = items.map(hofCard).join('')
  row.innerHTML = `<div class="hof-track">${cards}</div>`
  const track = row.firstElementChild

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Animate only when the cards overflow the viewport; otherwise leave them static.
  if (!reduce && track.scrollWidth > row.clientWidth) {
    // Duplicate the set so translateX(-50%) loops with no visible seam.
    track.innerHTML += cards
    track.classList.add('hof-animate')
  } else {
    // Not enough to scroll (or reduced motion) — allow manual swipe instead.
    row.classList.remove('overflow-hidden')
    row.classList.add('overflow-x-auto')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  animateCounters()
  loadLatestEvents()
  loadHonourees()
  initNewsletter()
})
