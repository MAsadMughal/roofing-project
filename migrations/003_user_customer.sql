-- Link users to customers (for CUSTOMER portal accounts)

alter table users
    add column if not exists customer_id bigint references customers(id) on delete set null;

create index if not exists users_customer_id_idx on users(customer_id);


