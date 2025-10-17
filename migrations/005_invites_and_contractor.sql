-- Add contractor_id to users and create invites table

alter table if exists users
  add column if not exists contractor_id bigint;

create index if not exists users_contractor_id_idx on users(contractor_id);

create table if not exists invites (
  token text primary key,
  owner_id bigint not null references users(id) on delete cascade,
  contractor_id bigint not null,
  email text not null,
  name text,
  phone text,
  role text not null default 'REP',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_owner_id_idx on invites(owner_id);
create index if not exists invites_contractor_id_idx on invites(contractor_id);


