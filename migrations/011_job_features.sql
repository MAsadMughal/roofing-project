-- Add job features: progress, crew_details, assignment_id, and related tables

-- Add columns to jobs table
alter table jobs 
add column if not exists progress integer not null default 0,
add column if not exists crew_details text,
add column if not exists assignment_id bigint references assignments(id) on delete set null;

create index if not exists jobs_assignment_id_idx on jobs(assignment_id);

-- Update invoices table with new fields
alter table invoices
add column if not exists invoice_number text,
add column if not exists created_by_id bigint references users(id) on delete set null,
add column if not exists subtotal numeric(12,2) not null default 0,
add column if not exists tax_rate numeric(5,2) not null default 0,
add column if not exists tax_amount numeric(12,2) not null default 0,
add column if not exists notes text;

create index if not exists invoices_created_by_id_idx on invoices(created_by_id);

-- Create invoice_items table
create table if not exists invoice_items (
	id bigserial primary key,
	invoice_id bigint not null references invoices(id) on delete cascade,
	name text not null,
	description text,
	quantity numeric(12,2) not null default 1,
	unit_price numeric(12,2) not null default 0,
	total numeric(12,2) not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_id_idx on invoice_items(invoice_id);

-- Create job_status_history table
create table if not exists job_status_history (
	id bigserial primary key,
	job_id bigint not null references jobs(id) on delete cascade,
	status text not null,
	description text,
	added_by_id bigint not null references users(id) on delete cascade,
	created_at timestamptz not null default now()
);

create index if not exists job_status_history_job_id_idx on job_status_history(job_id);
create index if not exists job_status_history_added_by_id_idx on job_status_history(added_by_id);

-- Create job_notes table
create table if not exists job_notes (
	id bigserial primary key,
	job_id bigint not null references jobs(id) on delete cascade,
	content text not null,
	created_by_id bigint not null references users(id) on delete cascade,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists job_notes_job_id_idx on job_notes(job_id);
create index if not exists job_notes_created_by_id_idx on job_notes(created_by_id);

-- Create job_feed_items table
create table if not exists job_feed_items (
	id bigserial primary key,
	job_id bigint not null references jobs(id) on delete cascade,
	type text not null, -- message, todo_created, todo_completed, status_update
	content text,
	created_by_id bigint not null references users(id) on delete cascade,
	tagged_user_ids bigint[] not null default '{}',
	metadata jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists job_feed_items_job_id_idx on job_feed_items(job_id);
create index if not exists job_feed_items_created_by_id_idx on job_feed_items(created_by_id);

-- Create job_todos table
create table if not exists job_todos (
	id bigserial primary key,
	job_id bigint not null references jobs(id) on delete cascade,
	title text not null,
	description text,
	assigned_to_ids bigint[] not null default '{}',
	completed boolean not null default false,
	completed_by_id bigint references users(id) on delete set null,
	completed_at timestamptz,
	due_date timestamptz,
	created_by_id bigint not null references users(id) on delete cascade,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists job_todos_job_id_idx on job_todos(job_id);
create index if not exists job_todos_created_by_id_idx on job_todos(created_by_id);
create index if not exists job_todos_completed_by_id_idx on job_todos(completed_by_id);

