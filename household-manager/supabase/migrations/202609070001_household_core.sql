-- Household Manager core: Supabase Auth owns auth.users; application records use UUIDs.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER', 'MEMBER')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.household_locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  city text not null,
  state text not null,
  postal_code text,
  country text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  environment text not null default 'EITHER' check (environment in ('INDOOR', 'OUTDOOR', 'EITHER')),
  weather_sensitive boolean not null default false,
  minimum_temperature_f numeric,
  maximum_wind_mph numeric,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_household_open_idx on public.tasks (household_id, completed_at) where completed_at is null;

-- Security-definer helper prevents policy recursion while keeping membership checks in one place.
create or replace function public.is_household_member(target_household_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household_id and user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.household_locations enable row level security;
alter table public.tasks enable row level security;

create policy "members read their households" on public.households for select using (public.is_household_member(id));
create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "members read household membership" on public.household_members for select using (public.is_household_member(household_id));
create policy "members read household location" on public.household_locations for select using (public.is_household_member(household_id));
create policy "owners manage household location" on public.household_locations for all using (
  exists (select 1 from public.household_members where household_id = household_locations.household_id and user_id = auth.uid() and role = 'OWNER')
) with check (
  exists (select 1 from public.household_members where household_id = household_locations.household_id and user_id = auth.uid() and role = 'OWNER')
);
create policy "members read tasks" on public.tasks for select using (public.is_household_member(household_id));
create policy "members create tasks" on public.tasks for insert with check (public.is_household_member(household_id));
create policy "members update tasks" on public.tasks for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "members delete tasks" on public.tasks for delete using (public.is_household_member(household_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_household_id uuid;
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.households (name) values (coalesce(new.raw_user_meta_data ->> 'household_name', 'My Household')) returning id into new_household_id;
  insert into public.household_members (household_id, user_id, role) values (new_household_id, new.id, 'OWNER');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
