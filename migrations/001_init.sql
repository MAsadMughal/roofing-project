-- Initial schema for roofing software

-- Customers store homeowner or business contact information
create table if not exists customers (
	id bigserial primary key,
	first_name text not null,
	last_name text not null,
	email text unique,
	phone text,
	address_line1 text,
	address_line2 text,
	city text,
	state text,
	postal_code text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Leads represent potential jobs prior to conversion
create table if not exists leads (
	id bigserial primary key,
	customer_id bigint references customers(id) on delete set null,
	title text not null,
	description text,
	status text not null default 'new', -- new/contacted/qualified/lost/converted
	source text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists leads_customer_id_idx on leads(customer_id);

-- Jobs are scheduled and executed work orders
create table if not exists jobs (
	id bigserial primary key,
	customer_id bigint not null references customers(id) on delete cascade,
	lead_id bigint references leads(id) on delete set null,
	title text not null,
	description text,
	status text not null default 'scheduled', -- scheduled/in_progress/completed/cancelled
	scheduled_date date,
	start_date date,
	end_date date,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists jobs_customer_id_idx on jobs(customer_id);
create index if not exists jobs_lead_id_idx on jobs(lead_id);

-- Estimates provided to customers with line items
create table if not exists estimates (
	id bigserial primary key,
	customer_id bigint not null references customers(id) on delete cascade,
	job_id bigint references jobs(id) on delete set null,
	status text not null default 'draft', -- draft/sent/accepted/rejected/expired
	valid_until date,
	total_amount numeric(12,2) not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists estimates_customer_id_idx on estimates(customer_id);
create index if not exists estimates_job_id_idx on estimates(job_id);

create table if not exists estimate_items (
	id bigserial primary key,
	estimate_id bigint not null references estimates(id) on delete cascade,
	name text not null,
	description text,
	quantity numeric(12,2) not null default 1,
	unit_price numeric(12,2) not null default 0,
	total numeric(12,2) not null default 0
);

create index if not exists estimate_items_estimate_id_idx on estimate_items(estimate_id);

-- Proposals often derive from estimates
create table if not exists proposals (
	id bigserial primary key,
	estimate_id bigint unique references estimates(id) on delete cascade,
	content text,
	status text not null default 'draft', -- draft/sent/signed/declined
	signed_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Invoices and payments
create table if not exists invoices (
	id bigserial primary key,
	customer_id bigint not null references customers(id) on delete cascade,
	job_id bigint references jobs(id) on delete set null,
	estimate_id bigint references estimates(id) on delete set null,
	status text not null default 'draft', -- draft/sent/paid/overdue/void
	due_date date,
	total_amount numeric(12,2) not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists invoices_customer_id_idx on invoices(customer_id);
create index if not exists invoices_job_id_idx on invoices(job_id);

create table if not exists payments (
	id bigserial primary key,
	invoice_id bigint not null references invoices(id) on delete cascade,
	amount numeric(12,2) not null,
	method text,
	paid_at timestamptz not null default now(),
	created_at timestamptz not null default now()
);

create index if not exists payments_invoice_id_idx on payments(invoice_id);


