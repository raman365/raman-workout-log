-- Run this in your Supabase SQL editor

create table if not exists workout_tabs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  position integer not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  tab_id uuid references workout_tabs(id) on delete cascade not null,
  name text not null,
  position integer not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists sets (
  id uuid default gen_random_uuid() primary key,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null default 1,
  weight text default '',
  reps text default '',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (optional, for public access during dev)
alter table workout_tabs enable row level security;
alter table exercises enable row level security;
alter table sets enable row level security;

-- Allow all access (tighten later with auth if needed)
create policy "Public access" on workout_tabs for all using (true) with check (true);
create policy "Public access" on exercises for all using (true) with check (true);
create policy "Public access" on sets for all using (true) with check (true);

-- Session history snapshots (for "Last Time" hint)
create table if not exists session_logs (
  id uuid default gen_random_uuid() primary key,
  exercise_id uuid references exercises(id) on delete cascade not null,
  session_date date not null default current_date,
  set_number integer not null default 1,
  weight text default '',
  reps text default '',
  paused boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_session_logs_exercise_date
  on session_logs(exercise_id, session_date desc);

alter table session_logs enable row level security;
create policy "Public access" on session_logs for all using (true) with check (true);

-- Also add paused to sets if not already present
alter table sets add column if not exists paused boolean default false;