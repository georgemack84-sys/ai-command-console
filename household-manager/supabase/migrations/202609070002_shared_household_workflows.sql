-- Shared household workflows: members can collaborate on repeating chores and shopping.
create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  assignee_name text not null default 'Unassigned' check (char_length(assignee_name) between 1 and 120),
  cadence text not null check (cadence in ('Weekly', 'Every 2 weeks', 'Monthly')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  category text not null default 'General' check (char_length(category) between 1 and 120),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chores_household_open_idx on public.chores (household_id, completed_at) where completed_at is null;
create index shopping_items_household_open_idx on public.shopping_items (household_id, purchased_at) where purchased_at is null;

alter table public.chores enable row level security;
alter table public.shopping_items enable row level security;

create policy "members read chores" on public.chores for select using (public.is_household_member(household_id));
create policy "members create chores" on public.chores for insert with check (public.is_household_member(household_id));
create policy "members update chores" on public.chores for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "members delete chores" on public.chores for delete using (public.is_household_member(household_id));
create policy "members read shopping items" on public.shopping_items for select using (public.is_household_member(household_id));
create policy "members create shopping items" on public.shopping_items for insert with check (public.is_household_member(household_id));
create policy "members update shopping items" on public.shopping_items for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "members delete shopping items" on public.shopping_items for delete using (public.is_household_member(household_id));
