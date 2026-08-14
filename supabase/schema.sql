
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  surf_level text,
  board_type text,
  board_size text,
  wave_size text,
  current_comfort text,
  favorite_spot text,
  surf_frequency text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
