-- Phase 21: bills and a deliberately small insight-event ledger.
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date not null,
  status text not null default 'UNPAID' check (status in ('UNPAID', 'PAID')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.context_insight_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  insight_id text not null,
  event_type text not null check (event_type in ('GENERATED', 'DISMISSED', 'RESOLVED')),
  title text not null,
  message text not null,
  related_entities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (household_id, insight_id, event_type)
);

alter table public.chores add column if not exists due_day text not null default 'Any day';
create index bills_household_due_idx on public.bills (household_id, due_date) where status = 'UNPAID';
create index context_history_household_created_idx on public.context_insight_history (household_id, created_at desc);

alter table public.bills enable row level security;
alter table public.context_insight_history enable row level security;
create policy "members read bills" on public.bills for select using (public.is_household_member(household_id));
create policy "members create bills" on public.bills for insert with check (public.is_household_member(household_id));
create policy "members update bills" on public.bills for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "members delete bills" on public.bills for delete using (public.is_household_member(household_id));
create policy "members read insight history" on public.context_insight_history for select using (public.is_household_member(household_id));
create policy "members create insight history" on public.context_insight_history for insert with check (public.is_household_member(household_id));
