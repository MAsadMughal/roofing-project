-- Create job_participants table for crew members
create table if not exists job_participants (
	id bigserial primary key,
	job_id bigint not null references jobs(id) on delete cascade,
	user_id bigint not null references users(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique(job_id, user_id)
);

create index if not exists job_participants_job_id_idx on job_participants(job_id);
create index if not exists job_participants_user_id_idx on job_participants(user_id);

