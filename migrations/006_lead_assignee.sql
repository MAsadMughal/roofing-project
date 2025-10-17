-- Add assigned_user_id to leads
alter table if exists leads
  add column if not exists assigned_user_id bigint references users(id) on delete set null;

create index if not exists leads_assigned_user_id_idx on leads(assigned_user_id);


