# 🚀 Deploying to Hostinger

This is a **static site** (HTML + Tailwind CDN + vanilla JS modules) talking to
**Supabase**. There is **no build step** — you just upload the files to `public_html`.

---

## Step 1 — Build the deployment package

From this project folder, **double-click `package.bat`** (or run it in `cmd`).

It creates **`alumni-website-hostinger.zip`** containing exactly what the live site
needs (all `.html` pages, `js/`, `assets/`, and `.htaccess`) — with the files at the
**root of the zip** so they extract straight into `public_html`.

> Prefer not to use the batch file? Just select the pages + `js/` + `assets/` + `.htaccess`
> in File Explorer, right‑click → **Compress to ZIP**.

---

## Step 2 — Upload to Hostinger

1. Log in to **hPanel** → your hosting plan → **File Manager**.
2. Open the **`public_html`** folder.
   - If there's a default `index.html` / `default.php` already there, delete it.
3. Click **Upload** (top right) and select **`alumni-website-hostinger.zip`**.
4. Right‑click the uploaded zip → **Extract** → extract into the **current folder**
   (`public_html`). 
5. Confirm `index.html` now sits directly in `public_html` (not in a sub‑folder).
   Delete the zip afterwards.

Your site is live at your domain (e.g. `https://yourdomain.com`). 🎉

---

## Step 3 — Enable SSL (HTTPS)

hPanel → **SSL** → install the free SSL for your domain (usually one click / automatic).
The included `.htaccess` already **forces HTTPS** once the certificate is active.

---

## Step 4 — Supabase must be configured

The site reads/writes a Supabase backend. Make sure you have done the one‑time setup
(see **README.md**):

- `js/supabase-config.js` has your **Project URL + anon key** (already set).
- All **tables** created (SQL in README).
- All **RLS policies** added (public read on events/gallery/honourees; insert on the
  forms; admin `authenticated` read/write).
- Storage bucket **`images`** created (Public) for admin photo uploads.

> Until the tables/policies exist, pages fall back to sample data and forms will error.

---

## Updating the site later

1. Make your changes locally.
2. Run **`package.bat`** again.
3. In File Manager, upload the new zip to `public_html`, **Extract → overwrite**.

(If your Hostinger plan includes **Git**: hPanel → **Git** → connect
`https://github.com/sachink99kop-wq/alumni-website` and deploy the `main` branch into
`public_html` instead of uploading zips.)

---

## What's in `.htaccess`

- Forces **HTTPS**
- Correct **MIME types** so ES modules (`type="module"`) load
- **Gzip** compression + **browser caching** for assets
- Basic **security headers**, keeps `admin.html` out of search engines
- Blocks web access to dev files (`.md`, `.bat`, dotfiles)

---

### ⚠️ Note on your public repo
`js/supabase-config.js` contains the Supabase **anon** key. That key is safe to expose
(it's protected by RLS) — but never put the **service_role** key in any uploaded file.
