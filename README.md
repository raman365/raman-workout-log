# Ramz Workout Log

Mobile-first workout tracker (React + Vite + Tailwind, Supabase backend), installable to the iPhone home screen.

**Live:** https://raman365.github.io/raman-workout-log/

## Features

- **Workout days** – preset splits or custom names; the app reopens on the last day you used.
- **Exercises & sets** – weight / reps / paused per set; rename and reorder from the `⋯` menu.
- **Finish Workout** – snapshots the day's sets into history (`session_logs`) under today's local date.
- **History & PRs** – per-exercise chart of estimated 1RM, best e1RM, heaviest set, every past session. Sets that beat your previous best e1RM get a ★ PR badge as you type them.
- **Rest timer** – 1:00 / 1:30 / 2:00 / 3:00, ±15s while running, beep + vibration when done, keeps the screen awake while resting.
- **Calc** – Epley 1RM estimator with % table (tap a row to load it) and a plate calculator (kg/lb, selectable bar).
- **Body weight** – per-person weigh-ins (Raman / Kristin) with trend chart, since-last / since-start deltas and a 4-week kg-per-week rate.

## Setup

1. Run `supabase_schema.sql` in the Supabase SQL editor.
2. Create `.env.local`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. `npm install && npm run dev`

## Deploy

Every push to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`. The two Supabase values above must also be set as repository secrets.

## Note on data access

The tables use a public "allow all" row-level-security policy, and the anon key ships in the page's JavaScript. Anyone who finds the URL can read or change the data. To lock it down, add Supabase Auth and replace the `using (true)` policies with per-user ones.
