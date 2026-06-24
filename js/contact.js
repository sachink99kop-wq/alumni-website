// ============================================================
//  contact.js — contact form -> contact_messages
// ============================================================
import { supabase, isConfigured } from './supabase-config.js'

const form = document.getElementById('contactForm')
const btn = document.getElementById('contactBtn')

function field(name) { return form.elements[name] }
function setErr(input, msg) {
  input.classList.add('border-red-500')
  const p = input.parentElement.querySelector('.err')
  p.textContent = msg; p.classList.remove('hidden')
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
  const name = field('name'), email = field('email'), message = field('message')
  ;[name, email, message].forEach(clearErr)
  let ok = true
  if (!name.value.trim()) { setErr(name, 'Please enter your name.'); ok = false }
  if (!email.value.trim()) { setErr(email, 'Please enter your email.'); ok = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setErr(email, 'Enter a valid email.'); ok = false }
  if (!message.value.trim()) { setErr(message, 'Please write a message.'); ok = false }
  if (!ok) return

  const payload = {
    name: name.value.trim(),
    email: email.value.trim().toLowerCase(),
    subject: field('subject').value.trim() || null,
    message: message.value.trim(),
  }

  btn.disabled = true
  const orig = btn.innerHTML
  btn.innerHTML = `${window.spinner('h-5 w-5')} <span>Sending…</span>`

  if (!isConfigured) {
    window.showToast('Message sent! (Demo mode — connect Supabase to persist.)', 'success')
    form.reset(); btn.disabled = false; btn.innerHTML = orig
    return
  }
  try {
    const { error } = await supabase.from('contact_messages').insert([payload])
    if (error) throw error
    window.showToast('Thanks! Your message has been sent.', 'success')
    form.reset()
  } catch (err) {
    console.error(err)
    window.showToast(err.message || 'Could not send message. Try again.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = orig
  }
})
