// ============================================================
//  common.js  —  shared header, footer, nav, animations, toasts
//  Loaded on every page as a normal (non-module) script.
//  Exposes a few helpers on window for the page modules to use.
// ============================================================

const COLLEGE_NAME = 'Sainik Military School'

const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'gallery.html', label: 'Gallery' },
  { href: 'events.html', label: 'Events' },
  { href: 'donate.html', label: 'Donate' },
  { href: 'registration.html', label: 'Register' },
  { href: 'contact.html', label: 'Contact' },
]

// Current page file name, e.g. "index.html"
function currentPage() {
  const path = window.location.pathname.split('/').pop()
  return path === '' ? 'index.html' : path
}

// ---------- Header ----------
function buildHeader() {
  const page = currentPage()
  const links = NAV_LINKS.map((l) => {
    const active = l.href === page
    return `<a href="${l.href}"
        class="nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'text-amber-500'
            : 'text-white hover:text-amber-400'
        }">${l.label}</a>`
  }).join('')

  const mobileLinks = NAV_LINKS.map((l) => {
    const active = l.href === page
    return `<a href="${l.href}"
        class="block px-4 py-3 text-base font-medium border-b border-white/10 ${
          active ? 'text-amber-500' : 'text-white hover:text-amber-400'
        }">${l.label}</a>`
  }).join('')

  return `
  <header class="sticky top-0 z-50 bg-navy shadow-lg">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="index.html" class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-500 text-navy font-bold font-display">S</span>
          <span class="font-display text-white text-lg font-bold tracking-wide hidden sm:block">${COLLEGE_NAME} <span class="text-amber-500">Alumni</span></span>
        </a>
        <div class="hidden md:flex items-center gap-1">
          ${links}
          <a href="admin.html" class="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-amber-500 text-amber-500 text-sm font-semibold hover:bg-amber-500 hover:text-navy transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3m-3 5H6a2 2 0 01-2-2v-1a4 4 0 014-4h2m4-9a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Admin Login
          </a>
        </div>
        <button id="mobileMenuBtn" aria-label="Toggle menu"
          class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </nav>
    <div id="mobileMenu" class="md:hidden hidden bg-navy border-t border-white/10">
      <p class="px-4 pt-3 pb-1 text-xs font-display font-semibold uppercase tracking-wider text-amber-500">Quick Links</p>
      ${mobileLinks}
      <a href="admin.html" class="flex items-center gap-2 px-4 py-3 text-base font-semibold text-amber-500 hover:text-amber-400">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3m-3 5H6a2 2 0 01-2-2v-1a4 4 0 014-4h2m4-9a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Admin Login
      </a>
    </div>
  </header>`
}

// ---------- Footer ----------
function buildFooter() {
  const year = new Date().getFullYear()
  const linkItems = (links) =>
    links
      .map(
        (l) =>
          `<li><a href="${l.href}" class="text-gray-300 hover:text-amber-400 transition-colors">${l.label}</a></li>`
      )
      .join('')
  // Split the nav into two Quick Links columns
  const quickCol1 = linkItems(NAV_LINKS.slice(0, 4)) // Home, About, Gallery, Events
  const quickCol2 = linkItems(NAV_LINKS.slice(4)) //    Donate, Register, Contact

  const socials = [
    { label: 'Facebook', d: 'M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9H17l-.4 2.9h-2.1v7A10 10 0 0022 12z' },
    { label: 'Instagram', d: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.4A6.4 6.4 0 1018.4 12 6.4 6.4 0 0012 5.6zm0 10.6A4.2 4.2 0 1116.2 12 4.2 4.2 0 0112 16.2zm6.6-10.9a1.5 1.5 0 11-1.5-1.5 1.5 1.5 0 011.5 1.5z' },
    { label: 'LinkedIn', d: 'M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.3 18.3v-8H5.7v8h2.6zM7 9.1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11.3 9.2v-4.4c0-2.4-1.3-3.5-3-3.5a2.6 2.6 0 00-2.3 1.3v-1.1H10.4c0 .8 0 8 0 8H13v-4.5c0-.2 0-.5.1-.6a1.4 1.4 0 011.3-1c.9 0 1.3.7 1.3 1.7v4.4h2.6z' },
    { label: 'Twitter', d: 'M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1A4.1 4.1 0 0012 9.1c0 .3 0 .6.1.9A11.6 11.6 0 013.2 4.6a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.8-.5v.1a4.1 4.1 0 003.3 4 4.1 4.1 0 01-1.8.1 4.1 4.1 0 003.8 2.9A8.2 8.2 0 012 18.4a11.6 11.6 0 006.3 1.8c7.5 0 11.6-6.2 11.6-11.6v-.5c.8-.6 1.5-1.3 2.1-2.2z' },
  ]
    .map(
      (s) =>
        `<a href="#" aria-label="${s.label}" class="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-amber-500 hover:text-navy text-white transition-colors">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="${s.d}"/></svg></a>`
    )
    .join('')

  return `
  <footer class="bg-navy text-white mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-3">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-500 text-navy font-bold font-display">S</span>
          <span class="font-display text-lg font-bold">${COLLEGE_NAME}</span>
        </div>
        <p class="text-gray-300 text-sm">Forging soldiers, scholars and leaders since 1962. Connecting generations of officers in the Army, Navy and Air Force.</p>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h4 class="font-display font-semibold mb-3 text-amber-500">Quick Links</h4>
          <ul class="space-y-2 text-sm">${quickCol1}</ul>
        </div>
        <div>
          <h4 class="font-display font-semibold mb-3 text-amber-500">Quick Links</h4>
          <ul class="space-y-2 text-sm">${quickCol2}</ul>
        </div>
      </div>
      <div>
        <h4 class="font-display font-semibold mb-3 text-amber-500">Contact</h4>
        <ul class="space-y-2.5 text-sm text-gray-300">
          <li class="flex items-start gap-2.5">
            <svg class="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Sainik Military School, Camp Road, Belgaum, Karnataka 590008, India</span>
          </li>
          <li class="flex items-center gap-2.5">
            <svg class="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <a href="tel:+919876543210" class="hover:text-amber-400 transition-colors">+91 98765 43210</a>
          </li>
          <li class="flex items-center gap-2.5">
            <svg class="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <a href="mailto:alumni@sainikmilitaryschool.edu" class="hover:text-amber-400 transition-colors break-all">alumni@sainikmilitaryschool.edu</a>
          </li>
        </ul>
        <h4 class="font-display font-semibold mb-3 mt-6 text-amber-500">Follow Us</h4>
        <div class="flex gap-3">${socials}</div>
      </div>
    </div>
    <div class="border-t border-white/10 py-4 text-center text-sm text-gray-400">
      &copy; ${year} ${COLLEGE_NAME} Alumni Association. All rights reserved. &middot; Powered by ${COLLEGE_NAME}
    </div>
  </footer>`
}

// ---------- Shared animation / polish stylesheet (injected once) ----------
function injectAnimationStyles() {
  if (document.getElementById('common-anim-css')) return
  const css = `
  /* Respect users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
  }

  /* Richer scroll reveal (overrides the per-page .fade-in timing) */
  .fade-in { opacity: 0; transform: translateY(28px); will-change: opacity, transform;
    transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); }
  .fade-in.visible { opacity: 1; transform: none; }

  /* Animated underline on desktop nav links */
  .nav-link { position: relative; }
  .nav-link::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: 4px;
    height: 2px; background: #F5A623; transform: scaleX(0); transform-origin: left;
    transition: transform .28s ease; border-radius: 2px; }
  .nav-link:hover::after { transform: scaleX(1); }

  /* Header gets a deeper shadow once the page is scrolled */
  #site-header header { transition: box-shadow .3s ease, background-color .3s ease; }
  #site-header header.scrolled { box-shadow: 0 8px 24px -8px rgba(0,0,0,.45); }

  /* Card lift — articles are only ever cards, so this is safe */
  article { transition: transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s ease; }
  article:hover { transform: translateY(-6px); box-shadow: 0 18px 34px -16px rgba(30,58,95,.45); }

  /* Pill buttons: press feedback + primary CTA hover lift */
  a.rounded-full, button.rounded-full { transition: transform .15s ease, box-shadow .25s ease, background-color .2s ease, color .2s ease; }
  a.rounded-full:active, button.rounded-full:active { transform: scale(.96); }
  a.bg-amber-500:hover, button.bg-amber-500:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -8px rgba(245,166,35,.55); }

  /* Banner artwork drifts in gently on load */
  section.overflow-hidden > .bg-cover { animation: bgFloat 14s ease-in-out infinite alternate; }
  @keyframes bgFloat { from { transform: scale(1) translateY(0); } to { transform: scale(1.06) translateY(-8px); } }

  /* Hero headline letters/lines rise slightly staggered */
  .hero-rise { opacity: 0; transform: translateY(20px); animation: heroRise .8s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes heroRise { to { opacity: 1; transform: none; } }

  /* Scroll progress bar */
  #scrollProgress { position: fixed; top: 0; left: 0; height: 3px; width: 0%;
    background: linear-gradient(90deg, #F5A623, #F7B84B); z-index: 60; transition: width .12s ease-out; }

  /* Back-to-top button */
  #toTop { position: fixed; right: 20px; bottom: 20px; z-index: 80; height: 46px; width: 46px;
    display: grid; place-items: center; border-radius: 9999px; background: #F5A623; color: #1E3A5F;
    box-shadow: 0 10px 24px -8px rgba(0,0,0,.4); opacity: 0; transform: translateY(12px) scale(.9);
    pointer-events: none; transition: opacity .3s ease, transform .3s ease, background-color .2s ease; }
  #toTop.show { opacity: 1; transform: none; pointer-events: auto; }
  #toTop:hover { background: #F7B84B; transform: translateY(-3px); }

  /* Soft pulse for the hero CTA the first time it appears */
  @keyframes softPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,.45); } 50% { box-shadow: 0 0 0 12px rgba(245,166,35,0); } }
  `
  const style = document.createElement('style')
  style.id = 'common-anim-css'
  style.textContent = css
  document.head.appendChild(style)
}

// ---------- Scroll fade-in animations (with stagger on grids) ----------
function initScrollAnimations() {
  // Stagger reveal of cards that share a grid container.
  document.querySelectorAll('.grid').forEach((grid) => {
    Array.from(grid.children)
      .filter((c) => c.classList.contains('fade-in'))
      .forEach((c, i) => { c.style.transitionDelay = `${Math.min(i * 90, 540)}ms` })
  })

  const els = document.querySelectorAll('.fade-in')
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach((el) => el.classList.add('visible'))
    return
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          obs.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  els.forEach((el) => obs.observe(el))
}

// ---------- Scroll progress bar + back-to-top + header shadow ----------
function initScrollUI() {
  const bar = document.createElement('div')
  bar.id = 'scrollProgress'
  document.body.appendChild(bar)

  const toTop = document.createElement('button')
  toTop.id = 'toTop'
  toTop.setAttribute('aria-label', 'Back to top')
  toTop.innerHTML = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>'
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
  document.body.appendChild(toTop)

  const onScroll = () => {
    const h = document.documentElement
    const scrolled = h.scrollTop
    const max = h.scrollHeight - h.clientHeight
    bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%'
    toTop.classList.toggle('show', scrolled > 400)
    const header = document.querySelector('#site-header header')
    if (header) header.classList.toggle('scrolled', scrolled > 20)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

// ---------- Animate the hero headline on first paint ----------
function initHeroIntro() {
  const hero = document.querySelector('section.relative.bg-navy, section.bg-navy')
  if (!hero) return
  const targets = hero.querySelectorAll('h1, p, .flex')
  targets.forEach((el, i) => {
    el.classList.add('hero-rise')
    el.style.animationDelay = `${i * 120}ms`
  })
}

// ---------- Toast helper (window.showToast) ----------
window.showToast = function (message, type = 'success') {
  let wrap = document.getElementById('toastWrap')
  if (!wrap) {
    wrap = document.createElement('div')
    wrap.id = 'toastWrap'
    wrap.className = 'fixed top-5 right-5 z-[100] flex flex-col gap-2'
    document.body.appendChild(wrap)
  }
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-navy',
  }
  const toast = document.createElement('div')
  toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs transition-all duration-300 translate-x-4 opacity-0`
  toast.textContent = message
  wrap.appendChild(toast)
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-4', 'opacity-0')
  })
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4')
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}

// ---------- Spinner helper (window.spinner) ----------
window.spinner = function (size = 'h-6 w-6') {
  return `<svg class="animate-spin ${size} text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"></path>
    </svg>`
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  injectAnimationStyles()

  const headerMount = document.getElementById('site-header')
  const footerMount = document.getElementById('site-footer')
  if (headerMount) headerMount.innerHTML = buildHeader()
  if (footerMount) footerMount.innerHTML = buildFooter()

  const btn = document.getElementById('mobileMenuBtn')
  const menu = document.getElementById('mobileMenu')
  if (btn && menu) {
    btn.addEventListener('click', () => menu.classList.toggle('hidden'))
  }

  initHeroIntro()
  initScrollAnimations()
  initScrollUI()
})
