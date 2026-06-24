// ============================================================
//  registration.js — 3-step alumni registration form
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

let step = 1
const TOTAL = 3

const form = document.getElementById('regForm')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const submitBtn = document.getElementById('submitBtn')

// Fields required per step
const REQUIRED = {
  1: ['full_name', 'email'],
  2: ['graduation_year', 'degree', 'department'],
  3: [],
}

function showStep(n) {
  document.querySelectorAll('.form-step').forEach((el) => {
    el.classList.toggle('hidden', Number(el.dataset.step) !== n)
  })
  // progress dots
  document.querySelectorAll('.step-indicator').forEach((ind) => {
    const s = Number(ind.dataset.step)
    const dot = ind.querySelector('.dot')
    const label = ind.querySelector('span')
    if (s <= n) {
      dot.className = 'dot h-10 w-10 rounded-full grid place-items-center font-semibold bg-amber-500 text-navy'
      label.className = 'mt-2 text-sm font-medium text-navy'
    } else {
      dot.className = 'dot h-10 w-10 rounded-full grid place-items-center font-semibold bg-gray-300 text-gray-600'
      label.className = 'mt-2 text-sm font-medium text-gray-500'
    }
  })
  prevBtn.classList.toggle('invisible', n === 1)
  nextBtn.classList.toggle('hidden', n === TOTAL)
  submitBtn.classList.toggle('hidden', n !== TOTAL)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function setError(input, message) {
  input.classList.add('field-error')
  const p = input.parentElement.querySelector('.err')
  if (p) {
    p.textContent = message
    p.classList.remove('hidden')
  }
}
function clearError(input) {
  input.classList.remove('field-error')
  const p = input.parentElement.querySelector('.err')
  if (p) p.classList.add('hidden')
}

function validateStep(n) {
  let ok = true
  REQUIRED[n].forEach((name) => {
    const input = form.elements[name]
    clearError(input)
    if (!input.value.trim()) {
      setError(input, 'This field is required.')
      ok = false
    }
  })
  // Email format on step 1
  if (n === 1) {
    const email = form.elements['email']
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      setError(email, 'Enter a valid email address.')
      ok = false
    }
  }
  // Year sanity on step 2
  if (n === 2) {
    const yr = form.elements['graduation_year']
    const val = Number(yr.value)
    if (yr.value && (val < 1950 || val > 2030)) {
      setError(yr, 'Enter a year between 1950 and 2030.')
      ok = false
    }
  }
  // LinkedIn url on step 3 (optional, but if present must look like a url)
  if (n === 3) {
    const li = form.elements['linkedin_url']
    if (li.value.trim() && !/^https?:\/\/.+/.test(li.value.trim())) {
      setError(li, 'Enter a full URL starting with http(s)://')
      ok = false
    }
  }
  return ok
}

nextBtn.addEventListener('click', () => {
  if (validateStep(step) && step < TOTAL) {
    step++
    showStep(step)
  }
})
prevBtn.addEventListener('click', () => {
  if (step > 1) {
    step--
    showStep(step)
  }
})

// Clear error as the user types
form.addEventListener('input', (e) => {
  if (e.target.classList.contains('field-error')) clearError(e.target)
})

function collect() {
  const f = form.elements
  return {
    full_name: f['full_name'].value.trim(),
    email: f['email'].value.trim().toLowerCase(),
    phone: f['phone'].value.trim() || null,
    graduation_year: f['graduation_year'].value ? Number(f['graduation_year'].value) : null,
    degree: f['degree'].value.trim() || null,
    department: f['department'].value.trim() || null,
    current_job_title: f['current_job_title'].value.trim() || null,
    current_company: f['current_company'].value.trim() || null,
    city: f['city'].value.trim() || null,
    country: f['country'].value.trim() || null,
    linkedin_url: f['linkedin_url'].value.trim() || null,
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  // validate all steps before final submit
  for (let s = 1; s <= TOTAL; s++) {
    if (!validateStep(s)) {
      step = s
      showStep(step)
      return
    }
  }

  const payload = collect()
  submitBtn.disabled = true
  const original = submitBtn.innerHTML
  submitBtn.innerHTML = `${window.spinner('h-5 w-5')} <span>Submitting…</span>`

  if (!isConfigured) {
    finish(payload)
    return
  }

  try {
    // Duplicate email check
    const { data: existing, error: checkErr } = await supabase
      .from('alumni_registrations')
      .select('id')
      .eq('email', payload.email)
      .maybeSingle()
    if (checkErr) throw checkErr
    if (existing) {
      step = 1
      showStep(1)
      setError(form.elements['email'], 'This email is already registered.')
      window.showToast('This email is already registered.', 'error')
      return
    }

    const { error } = await supabase.from('alumni_registrations').insert([payload])
    if (error) {
      if (error.code === '23505') {
        step = 1
        showStep(1)
        setError(form.elements['email'], 'This email is already registered.')
        window.showToast('This email is already registered.', 'error')
        return
      }
      throw error
    }
    finish(payload)
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Registration failed. Please try again.', 'error')
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = original
  }
})

function finish(payload) {
  const labels = {
    full_name: 'Name', email: 'Email', phone: 'Phone', graduation_year: 'Graduation Year',
    degree: 'Degree', department: 'Department', current_job_title: 'Job Title',
    current_company: 'Company', city: 'City', country: 'Country', linkedin_url: 'LinkedIn',
  }
  const rows = Object.entries(labels)
    .filter(([k]) => payload[k])
    .map(([k, label]) => `<div class="flex justify-between gap-4 py-1 border-b border-gray-200 last:border-0"><span class="text-gray-500">${label}</span><span class="font-medium text-navy text-right">${window.escapeHtml(String(payload[k]))}</span></div>`)
    .join('')
  document.getElementById('summary').innerHTML = rows
  form.classList.add('hidden')
  document.getElementById('progressBar').classList.add('hidden')
  document.getElementById('successPanel').classList.remove('hidden')
  window.showToast('Registration successful!', 'success')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// minimal escape if home.js not present
window.escapeHtml = window.escapeHtml || ((s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])))

showStep(1)
