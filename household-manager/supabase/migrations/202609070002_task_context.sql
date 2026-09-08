alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH'));
create index if not exists tasks_household_due_date_idx on public.tasks (household_id, due_date) where completed_at is null;
