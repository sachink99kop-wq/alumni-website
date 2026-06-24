// ============================================================
//  donate.js — donation form + donor recognition wall
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

const form = document.getElementById('donateForm')
const btn = document.getElementById('donateBtn')
const amountInput = form.elements['amount']

// ---------- Preset amount buttons ----------
document.querySelectorAll('.amt-btn').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.amt-btn').forEach((x) => x.classList.remove('active'))
    b.classList.add('active')
    amountInput.value = b.dataset.amt
    clearErr(amountInput)
  })
})
amountInput.addEventListener('input', () => {
  document.querySelectorAll('.amt-btn').forEach((x) => {
    x.classList.toggle('active', x.dataset.amt === amountInput.value)
  })
})

function setErr(input, msg) {
  input.classList.add('border-red-500')
  const p = input.parentElement.querySelector('.err')
  if (p) { p.textContent = msg; p.classList.remove('hidden') }
}
function clearErr(input) {
  input.classList.remove('border-red-500')
  const p = input.parentElement.querySelector('.err')
  if (p) p.classList.add('hidden')
}
form.addEventListener('input', (e) => {
  if (e.target.classList.contains('border-red-500')) clearErr(e.target)
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const f = form.elements
  ;['donor_name', 'email', 'purpose', 'amount', 'payment_method'].forEach((n) => clearErr(f[n]))
  let ok = true
  if (!f['donor_name'].value.trim()) { setErr(f['donor_name'], 'Required.'); ok = false }
  if (!f['email'].value.trim()) { setErr(f['email'], 'Required.'); ok = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f['email'].value.trim())) { setErr(f['email'], 'Enter a valid email.'); ok = false }
  if (!f['purpose'].value) { setErr(f['purpose'], 'Select a purpose.'); ok = false }
  if (!f['payment_method'].value) { setErr(f['payment_method'], 'Select a method.'); ok = false }
  const amt = Number(f['amount'].value)
  if (!f['amount'].value || isNaN(amt) || amt <= 0) { setErr(f['amount'], 'Enter a valid amount.'); ok = false }
  if (!ok) return

  const payload = {
    donor_name: f['donor_name'].value.trim(),
    email: f['email'].value.trim().toLowerCase(),
    phone: f['phone'].value.trim() || null,
    amount: amt,
    payment_method: f['payment_method'].value,
    purpose: f['purpose'].value,
    transaction_id: f['transaction_id'].value.trim() || null,
    message: f['message'].value.trim() || null,
  }

  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Submitting…</span>`

  if (!isConfigured) {
    succeed('DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase())
    btn.disabled = false; btn.innerHTML = orig
    return
  }
  try {
    // NOTE: if the `donations` table has an INSERT-only RLS policy (no SELECT),
    // the `.select()` below returns no row — that's fine, we fall back to a
    // locally generated reference id so the user still gets a confirmation.
    const { data, error } = await supabase.from('donations').insert([payload]).select('id')
    if (error) throw error
    const id = data && data[0] ? data[0].id : 'HSC-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    succeed(id)
    loadWall()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Could not record donation. Try again.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})

function succeed(id) {
  document.getElementById('donationId').textContent = id
  form.classList.add('hidden')
  document.getElementById('donateSuccess').classList.remove('hidden')
  window.showToast('Donation recorded. Thank you!', 'success')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

document.getElementById('donateAgain').addEventListener('click', () => {
  form.reset()
  document.querySelectorAll('.amt-btn').forEach((x) => x.classList.remove('active'))
  document.getElementById('donateSuccess').classList.add('hidden')
  form.classList.remove('hidden')
})

// ---------- Recognition wall ----------
const wall = document.getElementById('donorWall')

const SAMPLE_DONORS = [
  { donor_name: 'Anonymous', amount: 5000, purpose: 'Scholarship Fund' },
  { donor_name: 'R. Sharma', amount: 2500, purpose: 'Infrastructure' },
  { donor_name: 'Meera Iyer', amount: 1000, purpose: 'General' },
]

function donorRow(d) {
  return `
  <div class="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
    <div>
      <p class="font-semibold">${esc(d.donor_name)}</p>
      <p class="text-xs text-gray-300">${esc(d.purpose || 'General')}</p>
    </div>
    <span class="text-amber-500 font-bold">₹${Number(d.amount).toLocaleString()}</span>
  </div>`
}

async function loadWall() {
  wall.innerHTML = `<div class="flex justify-center py-4">${window.spinner('h-6 w-6')}</div>`
  if (!isConfigured) {
    wall.innerHTML = SAMPLE_DONORS.map(donorRow).join('')
    return
  }
  try {
    // Reads from the `public_donor_wall` view (safe columns only), since the
    // `donations` table itself has no public SELECT policy. See README.md.
    const { data, error } = await supabase
      .from('public_donor_wall')
      .select('donor_name, amount, purpose')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    wall.innerHTML = data && data.length ? data.map(donorRow).join('') : SAMPLE_DONORS.map(donorRow).join('')
  } catch (err) {
    console.error(err)
    wall.innerHTML = SAMPLE_DONORS.map(donorRow).join('')
  }
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

loadWall()
