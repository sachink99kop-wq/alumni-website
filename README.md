# ShivMaya State College — Alumni Association Website

A professional, fully responsive **College Alumni Organization** website built with
**vanilla HTML5 + Tailwind CSS (CDN) + vanilla JavaScript (ES6 modules)** and a
**Supabase** (PostgreSQL + Auth + Storage) backend.

No build tools are required — it's a static multi-page site you can open directly
or host anywhere.

---

## ✨ Features

| Page | Highlights |
|------|------------|
| `index.html` | Hero, animated stat counters, **live latest events** from Supabase, testimonials, newsletter signup |
| `about.html` | History, Mission & Vision, Executive Committee, 5-milestone timeline (static) |
| `gallery.html` | **Live image grid** (masonry), category filters, pure-JS lightbox, empty-state |
| `events.html` | **Live events**, Upcoming/Past tabs, event registration modal |
| `donate.html` | Donation form, preset amounts, **donor recognition wall**, success + donation ID |
| `registration.html` | **3-step** alumni form, progress bar, per-step validation, duplicate-email check |
| `contact.html` | Contact form, info cards, Google Maps embed, social links, toast notifications |

Design: navy `#1E3A5F` + gold `#F5A623`, Playfair Display headings / Inter body,
mobile-first, Intersection-Observer fade-ins, sticky nav with active-link highlighting,
loading spinners, inline validation, and graceful error handling on every async call.

> **Demo mode:** Until you add your Supabase keys, the site runs in a self-contained
> demo mode using sample data so every page looks complete. Forms confirm success
> without persisting. Once configured, all data is read from / written to Supabase.

---

## 📁 Project Structure

```
alumni-website/
├── index.html  about.html  gallery.html  events.html
├── donate.html  registration.html  contact.html
├── js/
│   ├── supabase-config.js   ← put your URL + anon key here
│   ├── common.js            ← shared header, footer, nav, toasts, spinner
│   ├── home.js  gallery.js  events.js
│   ├── donate.js  registration.js  contact.js
└── assets/                  ← drop your logo / images here
```

---

## 🚀 Setup

### 1. Create a Supabase project
1. Go to <https://supabase.com> → **New project**.
2. Once created, open **Project Settings → API**.
3. Copy the **Project URL** and the **anon / public** key.

### 2. Add your keys
Open `js/supabase-config.js` and replace the placeholders:

```js
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOi...'
```

### 3. Create the database tables
In the Supabase dashboard open **SQL Editor → New query**, paste the SQL below and **Run**.

### 4. Run the site locally
ES modules require an HTTP server (opening files via `file://` will be blocked by CORS).
Use any static server:

```bash
# Python
python -m http.server 5500

# or Node
npx serve .

# or the VS Code "Live Server" extension
```

Then visit <http://localhost:5500>.

---

## 🗄️ Database Schema (copy-paste ready)

```sql
-- 1. Alumni registrations
create table if not exists alumni_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  graduation_year integer,
  degree text,
  department text,
  current_job_title text,
  current_company text,
  city text,
  country text,
  linkedin_url text,
  profile_photo_url text,
  created_at timestamptz default now()
);

-- 2. Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  event_time time,
  location text,
  image_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- 3. Gallery images
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  category text,            -- 'reunion' | 'sports' | 'convocation' | 'cultural'
  uploaded_at timestamptz default now()
);

-- 4. Donations
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  email text not null,
  phone text,
  amount numeric not null,
  payment_method text,      -- 'UPI' | 'Bank Transfer' | 'Card'
  purpose text,             -- 'Scholarship Fund' | 'Infrastructure' | 'General'
  message text,
  transaction_id text,
  created_at timestamptz default now()
);

-- 5. Contact messages
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 6. Event registrations
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  attendee_name text,
  attendee_email text,
  created_at timestamptz default now()
);

-- 7. Newsletter subscribers (used by the home page)
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);
```

---

## 🔒 Row Level Security (RLS) Policies

Enable RLS on every table, then add the policies below
(**SQL Editor → New query → Run**). With the **anon** key, the site can only do
what these policies permit.

```sql
-- Enable RLS
alter table alumni_registrations enable row level security;
alter table events              enable row level security;
alter table gallery_images      enable row level security;
alter table donations           enable row level security;
alter table contact_messages    enable row level security;
alter table event_registrations enable row level security;
alter table newsletter_subscribers enable row level security;

-- alumni_registrations: anyone can INSERT, no public SELECT
create policy "anon insert alumni" on alumni_registrations
  for insert to anon with check (true);

-- events: public SELECT, no public INSERT
create policy "public read events" on events
  for select to anon using (true);

-- gallery_images: public SELECT, no public INSERT
create policy "public read gallery" on gallery_images
  for select to anon using (true);

-- donations: anyone can INSERT, no public SELECT
create policy "anon insert donations" on donations
  for insert to anon with check (true);

-- contact_messages: anyone can INSERT, no public SELECT
create policy "anon insert contact" on contact_messages
  for insert to anon with check (true);

-- event_registrations: anyone can INSERT (SELECT own rows would require auth)
create policy "anon insert event_reg" on event_registrations
  for insert to anon with check (true);

-- newsletter_subscribers: anyone can INSERT
create policy "anon insert newsletter" on newsletter_subscribers
  for insert to anon with check (true);
```

### ⚠️ Note on the Donor Recognition Wall
The spec says `donations` should have **no public SELECT** — but the donate page also
shows a "last 10 donations" wall. These conflict. Choose one:

- **Keep donations private (recommended):** leave the wall in demo mode, or feed it
  from a separate, intentionally public table/view. To expose only safe columns, create a view:

  ```sql
  create view public_donor_wall as
    select donor_name, amount, purpose, created_at from donations
    order by created_at desc limit 10;
  grant select on public_donor_wall to anon;
  ```
  Then point `loadWall()` in `js/donate.js` at `public_donor_wall`.

- **Or** add a permissive `for select` policy on `donations` (exposes all rows — not recommended).

The site degrades gracefully: if the SELECT is denied, the wall falls back to sample
data and the donation confirmation still shows a locally generated reference ID.

---

## 🖼️ Adding real data

- **Events / Gallery:** insert rows in the Supabase Table Editor, or upload images to a
  **Storage** bucket (make it public) and store the public URL in `image_url`.
- **Profile photos:** the `alumni_registrations.profile_photo_url` column is ready for a
  Storage URL if you later add an upload control.

---

## ☁️ Deploy

### Netlify
1. Push this folder to a Git repo (GitHub/GitLab).
2. Netlify → **Add new site → Import project** → pick the repo.
3. Build command: *(leave empty)* · Publish directory: `alumni-website` (or `/`).
4. Deploy. Or drag-and-drop the folder onto <https://app.netlify.com/drop>.

### Vercel
1. Push to Git, then Vercel → **Add New → Project** → import the repo.
2. Framework preset: **Other** · Output dir: root. Deploy.

> Because keys live in client-side JS, only ever use the **anon/public** key here and
> rely on RLS for security. Never put the `service_role` key in the frontend.

---

## 🧰 Tech Notes
- Single shared `common.js` injects the header/footer and handles the mobile menu,
  active nav link, scroll fade-ins (Intersection Observer), toasts and the spinner.
- Every Supabase call uses `async/await` + `try/catch` with user-friendly messages.
- No external JS libraries other than the Supabase client and Tailwind CDN.

---

© ShivMaya State College Alumni Association · Powered by ShivMaya State College
