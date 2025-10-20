-- Create user_watchlists table for per-user lead watchlists
create table if not exists user_watchlists (
    user_id bigint not null references users(id) on delete cascade,
    lead_id bigint not null references leads(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, lead_id)
);

create index if not exists user_watchlists_lead_id_idx on user_watchlists(lead_id);


