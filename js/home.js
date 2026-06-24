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
    { title: 'Annual Alumni Reunion', description: 'A grand evening of reconnecting with old friends and faculty.', location: 'Main Campus', event_date: null },
    { title: 'Career Mentorship Meetup', description: 'Alumni guide current students through career pathways.', location: 'Online', event_date: null },
    { title: 'Founders Day Gala', description: 'Celebrating decades of excellence and community.', location: 'Auditorium', event_date: null },
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

document.addEventListener('DOMContentLoaded', () => {
  animateCounters()
  loadLatestEvents()
  initNewsletter()
})
